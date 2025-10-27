# AI Personal Trainer

A modern web application that helps users track their workouts and receive AI-powered training recommendations using Google's Gemini AI.

## Features

- **Workout Tracking**: Log exercises, sets, reps, and weights with an intuitive interface
- **Real-time Timer**: Track workout duration with start/pause/finish functionality
- **Progress Analytics**: Visualize your fitness journey with comprehensive progress tracking
- **AI Recommendations**: Get personalized training advice based on your workout history
- **Exercise Library**: Pre-loaded with common exercises, with the ability to add custom ones
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technologies Used

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS for modern, responsive design
- **Icons**: Lucide React for beautiful icons
- **Forms**: React Hook Form for efficient form handling
- **Notifications**: React Hot Toast for user feedback
- **AI Integration**: Google Gemini API for intelligent recommendations
- **Build Tool**: Vite for fast development and building
- **Data Storage**: Local Storage for client-side data persistence

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Google AI Studio API key (for AI recommendations)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/callum-begley/AI-Personal-Trainer.git
cd AI-Personal-Trainer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your Gemini API key to the `.env` file:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

### Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## Usage

1. **Start a Workout**: Click "Start Workout" to begin tracking your session
2. **Add Exercises**: Select exercises from the dropdown and specify sets, reps, and weight
3. **Track Progress**: Mark sets as completed and monitor your workout time
4. **View Progress**: Check your workout history and exercise progress over time
5. **Get AI Recommendations**: Receive personalized training advice based on your data

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navbar.tsx      # Navigation component
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Overview and stats
│   ├── WorkoutTracker.tsx  # Workout logging
│   ├── Progress.tsx    # Progress analytics
│   └── AIRecommendations.tsx  # AI-powered advice
├── services/           # Business logic and API calls
│   ├── aiTrainer.ts   # Gemini AI integration
│   └── storage.ts     # Local storage management
├── types/             # TypeScript type definitions
│   └── workout.ts     # Workout-related types
└── styles/           # CSS and styling
    └── index.css     # Global styles and Tailwind setup
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Gemini AI for intelligent workout recommendations
- Tailwind CSS for the beautiful, responsive design
- Lucide React for the comprehensive icon library
