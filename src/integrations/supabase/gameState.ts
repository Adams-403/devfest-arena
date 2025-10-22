import { supabase } from './client';
import { adminClient } from './adminClient';

export const gameStateService = {
  // Get the current game state
  async getGameState() {
    const { data, error } = await supabase
      .from('game_state')
      .select('*')
      .single();

    if (error) {
      console.error('Error getting game state:', error);
      throw error;
    }

    return data;
  },

  // Update the game state (admin only)
  async updateGameState(updates: {
    current_challenge_id?: string | null;
    is_active?: boolean;
    start_time?: Date | null;
    end_time?: Date | null;
  }) {
    // Use adminClient for write operations that require elevated permissions
    const { data, error } = await adminClient
      .from('game_state')
      .update({
        current_challenge_id: updates.current_challenge_id,
        is_active: updates.is_active,
        start_time: updates.start_time?.toISOString(),
        end_time: updates.end_time?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select()
      .single();

    if (error) {
      console.error('Error updating game state:', error);
      throw error;
    }

    return data;
  },

  // Subscribe to game state changes
  subscribeToGameState(callback: (payload: any) => void) {
    // First, fetch the current state to ensure we have the latest data
    this.getGameState().then(state => {
      callback({ new: state });
    }).catch(console.error);

    // Then set up the subscription for future changes
    const subscription = supabase
      .channel('game_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
        },
        (payload) => {
          console.log('Game state change received:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Return cleanup function
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  },
};
