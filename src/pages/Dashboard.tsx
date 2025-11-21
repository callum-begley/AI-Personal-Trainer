import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, TrendingUp, Target, Clock, Dumbbell } from 'lucide-react'
import { storageService } from '../services/storage'
import { Workout } from '../types/workout'
import { useWorkout } from '../contexts/WorkoutContext'
import AIChatModal from '../components/AIChatModal'

const Dashboard: React.FC = () => {
  const { currentWorkout, timer } = useWorkout()
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    totalExercises: 0,
    averageDuration: 0,
  })

  useEffect(() => {
    try {
      const workouts = storageService.getWorkouts()
      const completedWorkouts = workouts.filter((w) => w.completed)

      setRecentWorkouts(completedWorkouts.slice(-5).reverse())

      const now = new Date()
      const weekStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
      )
      const thisWeek = completedWorkouts.filter((w) => w.date >= weekStart)

      const totalDuration = completedWorkouts.reduce(
        (sum, w) => sum + (w.duration || 0),
        0
      )

      setStats({
        totalWorkouts: completedWorkouts.length,
        thisWeekWorkouts: thisWeek.length,
        totalExercises: storageService.getExercises().length,
        averageDuration:
          completedWorkouts.length > 0
            ? Math.round(totalDuration / completedWorkouts.length)
            : 0,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set default values on error
      setRecentWorkouts([])
      setStats({
        totalWorkouts: 0,
        thisWeekWorkouts: 0,
        totalExercises: 0,
        averageDuration: 0,
      })
    }
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 ml-4 sm:ml-0">
          Dashboard
        </h1>
        <Link to="/workout" className="btn-primary">
          Start New Workout
        </Link>
      </div>

      {/* Active Workout Indicator */}
      {currentWorkout && (
        <div className="card bg-primary-50 bg-gradient-to-r from-primary-50 to-gray-300 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-600 border-2 border-primary-200 border-primary-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-600 dark:bg-primary-500 rounded-full p-3">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Workout
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {currentWorkout.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentWorkout.sets.length} exercise
                  {currentWorkout.sets.length !== 1 ? 's' : ''} •{' '}
                  {Math.floor(timer / 60)}:
                  {(timer % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
            <Link
              to="/workout"
              className="btn-primary flex items-center space-x-2"
            >
              <span>Continue</span>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Workouts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalWorkouts}
              </p>
            </div>
            <Target className="h-8 w-8 text-primary-600 dark:text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                This Week
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.thisWeekWorkouts}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600 dark:text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Exercises
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalExercises}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Duration
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.averageDuration}m
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600 dark:text-purple-500" />
          </div>
        </div>
      </div>

      {/* Recent Workouts and AILA Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AILA AI Assistant */}
        <div className="order-1 lg:order-1">
          <div
            onClick={() => setIsChatOpen(true)}
            className="card h-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-64 h-64 rounded-full border-4 border-blue-300 dark:border-blue-600 overflow-hidden flex items-center justify-center">
                <img src="/aila.png" alt="AILA" className="h-64 object-cover" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  AILA - Your AI Personal Trainer
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Get personalized workout recommendations, chat about your
                  fitness goals, or ask any training-related questions
                </p>
                <div className="mt-4 text-blue-600 dark:text-blue-400 font-semibold text-lg">
                  Chat Now →
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="card order-2 lg:order-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Recent Workouts
            </h2>
            <Link
              to="/progress"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              View All →
            </Link>
          </div>

          {recentWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No workouts recorded yet
              </p>
              <Link to="/workout" className="btn-primary">
                Start Your First Workout
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {workout.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(workout.date)} • {workout.exercises.length}{' '}
                      exercises
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {workout.duration
                        ? `${workout.duration}m`
                        : 'No duration'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {workout.sets.filter((s) => s.completed).length} sets
                      completed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              to="/workout"
              className="block w-full text-left p-3 bg-primary-50 dark:bg-blue-900 hover:bg-primary-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
            >
              <div className="font-medium text-primary-700 dark:text-blue-300">
                Start Workout
              </div>
              <div className="text-sm text-primary-600 dark:text-blue-400">
                Begin a new training session
              </div>
            </Link>

            <Link
              to="/recommendations"
              className="block w-full text-left p-3 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
            >
              <div className="font-medium text-green-700 dark:text-green-300">
                View AI Recommendations
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Get personalized training advice
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Progress Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Workout Streak
              </span>
              <span className="font-semibold dark:text-gray-200">0 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Weekly Goal
              </span>
              <span className="font-semibold dark:text-gray-200">
                {stats.thisWeekWorkouts}/3
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (stats.thisWeekWorkouts / 3) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}

export default Dashboard
