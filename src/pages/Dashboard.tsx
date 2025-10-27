import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, TrendingUp, Target, Clock } from 'lucide-react'
import { storageService } from '../services/storage'
import { Workout } from '../types/workout'

const Dashboard: React.FC = () => {
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    totalExercises: 0,
    averageDuration: 0,
  })

  useEffect(() => {
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
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <Link to="/workout" className="btn-primary">
          Start New Workout
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Workouts
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalWorkouts}
              </p>
            </div>
            <Target className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.thisWeekWorkouts}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Exercises</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalExercises}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageDuration}m
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Recent Workouts
          </h2>
          <Link
            to="/progress"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No workouts recorded yet</p>
            <Link to="/workout" className="btn-primary">
              Start Your First Workout
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{workout.name}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(workout.date)} • {workout.exercises.length}{' '}
                    exercises
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {workout.duration ? `${workout.duration}m` : 'No duration'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {workout.sets.filter((s) => s.completed).length} sets
                    completed
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              to="/workout"
              className="block w-full text-left p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-primary-700">Start Workout</div>
              <div className="text-sm text-primary-600">
                Begin a new training session
              </div>
            </Link>

            <Link
              to="/recommendations"
              className="block w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-green-700">
                View AI Recommendations
              </div>
              <div className="text-sm text-green-600">
                Get personalized training advice
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Progress Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Workout Streak</span>
              <span className="font-semibold">0 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Weekly Goal</span>
              <span className="font-semibold">{stats.thisWeekWorkouts}/3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
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
    </div>
  )
}

export default Dashboard
