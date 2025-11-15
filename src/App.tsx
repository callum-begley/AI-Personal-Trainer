import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { DarkModeProvider } from './contexts/DarkModeContext'
import { WorkoutProvider } from './contexts/WorkoutContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import WorkoutTracker from './pages/WorkoutTracker'
import Progress from './pages/Progress'
import AIRecommendations from './pages/AIRecommendations'
import Settings from './pages/Settings'

function App() {
  return (
    <DarkModeProvider>
      <WorkoutProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <main className="container mx-auto sm:px-4 py-8 px-1 pb-24 sm:pb-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/workout" element={<WorkoutTracker />} />
                <Route path="/progress" element={<Progress />} />
                <Route
                  path="/recommendations"
                  element={<AIRecommendations />}
                />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'dark:!bg-gray-800 dark:!text-gray-100',
                style: {
                  border: '1px solid',
                  borderColor: 'rgb(229 231 235)',
                },
              }}
            />
          </div>
        </Router>
      </WorkoutProvider>
    </DarkModeProvider>
  )
}

export default App
