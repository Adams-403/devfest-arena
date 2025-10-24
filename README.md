# DevFest Arena 🚀

A fun and interactive game platform built for DevFest events, featuring various challenges and activities for participants.

## 🎮 Features

- Multiple game challenges
- Real-time score tracking
- Responsive design for all devices
- Engaging user interface
- Easy to set up and deploy

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

## 📂 Project Structure

```
src/
├── components/       # Reusable components
│   ├── challenges/  # Game challenge components
│   └── ui/          # UI components
├── contexts/        # React contexts
├── hooks/           # Custom React hooks
├── integrations/    # Third-party integrations
└── App.tsx          # Main application component
```

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Developer Groups for organizing DevFest
- All contributors who have helped improve this project
