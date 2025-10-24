# 🎮 DevFest Arena

An interactive gaming platform designed for DevFest events, offering a collection of engaging challenges that test participants' skills, speed, and knowledge. Compete with others, climb the leaderboard, and have fun while learning!

## 🎯 Game Challenges

### 🧩 Match the Logo
Test your tech brand recognition skills by matching company logos to their names against the clock!

### 📱 Shake Challenge
A fun motion-based game where you need to shake your device to complete challenges. Perfect for mobile users!

### 🧠 Tech Trivia
Challenge your knowledge with tech-related questions across different categories and difficulty levels.

### 💻 Code Snippet Challenge
Identify programming languages and frameworks from code snippets in this fast-paced challenge.

## 🏆 Features

- **Multiple Game Modes**: Different types of challenges to keep things exciting
- **Real-time Leaderboard**: Compete with other participants in real-time
- **Responsive Design**: Play on any device - desktop, tablet, or mobile
- **Engaging UI/UX**: Beautifully designed interface with smooth animations
- **Easy Setup**: Get started quickly with our simple setup process

## 🛠️ Technologies Used

- ⚡ Vite - Next Generation Frontend Tooling
- ⚛️ React - A JavaScript library for building user interfaces
- 📘 TypeScript - Type-safe JavaScript
- 🎨 Tailwind CSS - A utility-first CSS framework
- 🎭 shadcn/ui - Beautifully designed components
- 🔥 Supabase - Backend as a Service
- 🎯 Framer Motion - Animation library for React

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/devfest-arena.git
   cd devfest-arena
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Supabase URL and key:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🎮 Game Components

### Challenges
- `MatchLogoChallenge`: Logo matching game component
- `ShakeChallenge`: Motion-based shaking game
- `TriviaChallenge`: Tech trivia questions
- `CodeSnippetChallenge`: Code recognition game

### Core Features
- **Game Engine**: Handles game state, scoring, and progression
- **Leaderboard**: Real-time score tracking and rankings
- **User Profiles**: Track your progress and achievements
- **Responsive Design**: Optimized for all screen sizes

## 📂 Project Structure

```
src/
├── components/              
│   ├── challenges/         # Game challenge components
│   │   ├── MatchLogoChallenge/  # Logo matching game
│   │   ├── ShakeChallenge/      # Motion-based challenge
│   │   ├── TriviaChallenge/     # Tech quiz game
│   │   └── CodeSnippetChallenge/ # Code recognition game
│   └── ui/                  # Reusable UI components
├── contexts/              # Game state and user context
├── hooks/                 # Custom React hooks
├── integrations/          # Third-party integrations
└── App.tsx                # Main application component
```

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Developer Groups for organizing DevFest
- All contributors who have helped improve this project
