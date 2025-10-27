import React, { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Award, Trash2 } from 'lucide-react'
import { storageService } from '../services/storage'
import { Workout, WorkoutProgress } from '../types/workout'

const Progress: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [progress, setProgress] = useState<WorkoutProgress[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<
    'week' | 'month' | 'all'
  >('month')

  useEffect(() => {
    const allWorkouts = storageService.getWorkouts()
    const workoutProgress = storageService.getWorkoutProgress()

    setWorkouts(allWorkouts.filter((w) => w.completed))
    setProgress(workoutProgress)
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const getFilteredWorkouts = () => {
    const now = new Date()
    let startDate: Date

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7
        )
        break
      case 'month':
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        )
        break
      default:
        return workouts
    }

    return workouts.filter((workout) => workout.date >= startDate)
  }

  const deleteWorkout = (workoutId: string) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      storageService.deleteWorkout(workoutId)
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
    }
  }

  const getStats = () => {
    const filteredWorkouts = getFilteredWorkouts()
    const totalSets = filteredWorkouts.reduce(
      (sum, w) => sum + w.sets.filter((s) => s.completed).length,
      0
    )
    const totalDuration = filteredWorkouts.reduce(
      (sum, w) => sum + (w.duration || 0),
      0
    )
    const averageDuration =
      filteredWorkouts.length > 0
        ? Math.round(totalDuration / filteredWorkouts.length)
        : 0

    return {
      totalWorkouts: filteredWorkouts.length,
      totalSets,
      totalDuration,
      averageDuration,
    }
  }

  const stats = getStats()
  const filteredWorkouts = getFilteredWorkouts()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Progress</h1>
        <div className="flex space-x-2">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period === 'all' ? 'All Time' : `Last ${period}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Workouts</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalWorkouts}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sets</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSets}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Duration
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalDuration}m
              </p>
            </div>
            <Award className="h-8 w-8 text-blue-600" />
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
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exercise Progress */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Exercise Progress
          </h2>
          {progress.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Complete some workouts to see your progress here
            </p>
          ) : (
            <div className="space-y-4">
              {progress.map((prog) => (
                <div
                  key={prog.exerciseId}
                  className="bg-gray-50 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">
                      {prog.exerciseName}
                    </h3>
                    {prog.improvement && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                        +{prog.improvement.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Personal Best</p>
                      <p className="font-semibold">
                        {prog.previousBest.reps} reps
                        {prog.previousBest.weight &&
                          ` @ ${prog.previousBest.weight} lbs`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(prog.previousBest.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Session</p>
                      <p className="font-semibold">
                        {prog.currentSession.reps} reps
                        {prog.currentSession.weight &&
                          ` @ ${prog.currentSession.weight} lbs`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workout History */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Workout History
          </h2>
          {filteredWorkouts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No workouts found for the selected period
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredWorkouts
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((workout) => (
                  <div key={workout.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-900">
                            {workout.name}
                          </h3>
                          <button
                            onClick={() => deleteWorkout(workout.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete workout"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatDate(workout.date)}
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Exercises</p>
                            <p className="font-semibold">
                              {workout.exercises.length}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Sets</p>
                            <p className="font-semibold">
                              {workout.sets.filter((s) => s.completed).length}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duration</p>
                            <p className="font-semibold">
                              {workout.duration
                                ? `${workout.duration}m`
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {workout.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            "{workout.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Progress
