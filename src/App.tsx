import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import WorkoutTracker from './pages/WorkoutTracker'
import Progress from './pages/Progress'
import AIRecommendations from './pages/AIRecommendations'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workout" element={<WorkoutTracker />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/recommendations" element={<AIRecommendations />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
