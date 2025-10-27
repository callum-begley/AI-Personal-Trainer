# AI Personal Trainer

A modern web application that helps users track their workouts and receive AI-powered training recommendations using Google's Gemini AI.

## Learning Objectives
- **AI/LLM Integration**: Learn how to integrate Google's Gemini AI API for generating personalized workout recommendations and training advice
- **React Development**: Master modern React patterns including hooks, context, routing, and responsive design with TypeScript
- **Data Visualization**: Develop skills in presenting fitness progress data in meaningful and actionable ways
- **User Experience Design**: Create intuitive interfaces for fitness tracking that work seamlessly across mobile and desktop devices

## Project Scope
**Included Features:**
- Real-time workout tracking with timer functionality
- Exercise library with pre-loaded common exercises
- Progress analytics and workout history visualization
- AI-powered personalized training recommendations
- Responsive design for mobile, tablet, and desktop
- Local data storage for offline functionality

**Excluded to Keep Scope Manageable:**
- User authentication and cloud sync
- Social features and workout sharing
- Video exercise demonstrations
- Nutrition tracking integration
- Wearable device synchronization

## Technologies
- **Frontend**: React 18 with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS for responsive, utility-first styling
- **AI Integration**: Google Gemini 2.0 Flash API for intelligent recommendations
- **Form Handling**: React Hook Form for efficient form management
- **Routing**: React Router DOM for single-page application navigation
- **Icons**: Lucide React for consistent, beautiful iconography
- **Build Tool**: Vite for fast development and optimized production builds
- **Data Storage**: Browser localStorage for client-side data persistence

## Timeline
- **Week 1**: Project setup, basic React structure, and workout tracking functionality
- **Week 2**: Progress analytics, data visualization, and responsive design implementation
- **Week 3**: AI integration with Gemini API and recommendation system
- **Week 4**: Mobile optimization, testing, and final polish
- **Ongoing**: Bug fixes, performance optimization, and feature enhancements

## Success Criteria
- **Functional Workout Tracking**: Users can successfully log exercises, sets, reps, and weights
- **Working AI Recommendations**: Gemini AI provides relevant, personalized training advice based on user data
- **Responsive Design**: Application works flawlessly on mobile phones, tablets, and desktop computers
- **Data Persistence**: User workout data is saved locally and persists between sessions
- **Intuitive User Experience**: New users can navigate and use the app without instructions
- **Performance**: Fast loading times and smooth interactions across all features

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Gemini AI for intelligent workout recommendations
- Tailwind CSS for the beautiful, responsive design
- Lucide React for the comprehensive icon library
