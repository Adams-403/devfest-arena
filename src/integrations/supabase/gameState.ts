import { supabase } from './client';
import { adminClient } from './adminClient';

export interface ActiveChallenge {
  id: string;
  challenge_id: string;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const gameStateService = {
  // Get all active challenges
  async getActiveChallenges(): Promise<ActiveChallenge[]> {
    const { data, error } = await supabase
      .from('active_challenges')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error getting active challenges:', error);
      return [];
    }
    return data || [];
  },

  // Start a new challenge
  async startChallenge(challengeId: string): Promise<ActiveChallenge | null> {
    const { data, error } = await adminClient
      .from('active_challenges')
      .upsert(
        {
          challenge_id: challengeId,
          is_active: true,
          start_time: new Date().toISOString(),
          end_time: null
        },
        { onConflict: 'challenge_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error starting challenge:', error);
      return null;
    }
    return data;
  },

  // End a specific challenge
  async endChallenge(challengeId: string): Promise<boolean> {
    const { error } = await adminClient
      .from('active_challenges')
      .update({
        is_active: false,
        end_time: new Date().toISOString()
      })
      .eq('challenge_id', challengeId);

    if (error) {
      console.error('Error ending challenge:', error);
      return false;
    }
    return true;
  },

  // End all active challenges
  async endAllChallenges(): Promise<boolean> {
    const { error } = await adminClient
      .from('active_challenges')
      .update({
        is_active: false,
        end_time: new Date().toISOString()
      })
      .eq('is_active', true);

    if (error) {
      console.error('Error ending all challenges:', error);
      return false;
    }
    return true;
  },

  // Subscribe to active challenges changes
  subscribeToActiveChallenges(callback: (challenges: ActiveChallenge[]) => void) {
    // Initial fetch
    this.getActiveChallenges().then(challenges => {
      console.log('Initial active challenges:', challenges);
      callback(challenges);
    }).catch(error => {
      console.error('Error in initial active challenges fetch:', error);
    });

    // Subscribe to changes
    const subscription = supabase
      .channel('active_challenges_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_challenges',
        },
        (payload) => {
          console.log('Active challenges change detected:', payload);
          // When any change happens, refetch the active challenges
          this.getActiveChallenges()
            .then(challenges => {
              console.log('Updated active challenges:', challenges);
              callback(challenges);
            })
            .catch(error => {
              console.error('Error updating active challenges:', error);
            });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Subscription error:', err);
          return;
        }
        console.log('Active challenges subscription status:', status);
        
        // If the subscription is closed unexpectedly, try to resubscribe
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.log('Subscription closed unexpectedly, attempting to resubscribe...');
          setTimeout(() => {
            this.subscribeToActiveChallenges(callback);
          }, 1000);
        }
      });

    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from active challenges');
      supabase.removeChannel(subscription).then(() => {
        console.log('Successfully unsubscribed from active challenges');
      }).catch(error => {
        console.error('Error unsubscribing from active challenges:', error);
      });
    };
  }
};
