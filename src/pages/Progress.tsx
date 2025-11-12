import React, { useState, useEffect } from 'react'
import {
  Calendar,
  TrendingUp,
  Award,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { storageService } from '../services/storage'
import { Workout, WorkoutProgress } from '../types/workout'

const Progress: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [progress, setProgress] = useState<WorkoutProgress[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<
    'week' | 'month' | 'all'
  >('month')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [workoutToDelete, setWorkoutToDelete] = useState<{
    id: string
    name: string
  } | null>(null)

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

  const isCardioExercise = (exerciseId: string): boolean => {
    const exercises = storageService.getExercises()
    const exercise = exercises.find((e) => e.id === exerciseId)
    return exercise?.category === 'cardio'
  }

  const getExerciseCategory = (exerciseId: string): string => {
    const exercises = storageService.getExercises()
    const exercise = exercises.find((e) => e.id === exerciseId)
    return exercise?.category || 'unknown'
  }

  const getFilteredProgress = () => {
    if (selectedCategory === 'all') {
      return progress
    }
    return progress.filter(
      (prog) => getExerciseCategory(prog.exerciseId) === selectedCategory
    )
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

  const showDeleteConfirmation = (workoutId: string, workoutName: string) => {
    setWorkoutToDelete({ id: workoutId, name: workoutName })
  }

  const confirmDeleteWorkout = () => {
    if (workoutToDelete) {
      storageService.deleteWorkout(workoutToDelete.id)
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutToDelete.id))
      toast.success(`Workout "${workoutToDelete.name}" deleted successfully`)
      setWorkoutToDelete(null)
    }
  }

  const cancelDeleteWorkout = () => {
    setWorkoutToDelete(null)
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
      <div className="sm:flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 sm:mb-0 mb-4 text-center sm:text-left">
          Progress
        </h1>
        <div className="flex space-x-2 justify-around">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium sm:text-base transition-colors ${
                selectedPeriod === period
                  ? 'bg-primary-600 text-white dark:bg-primary-500'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {period === 'all' ? 'All Time' : `Last ${period}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Workouts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalWorkouts}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-primary-600 dark:text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Sets
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalSets}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Duration
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalDuration}m
              </p>
            </div>
            <Award className="h-8 w-8 text-blue-600 dark:text-blue-500" />
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
            <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exercise Progress */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Exercise Progress
            </h2>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field text-sm py-1.5 px-3 max-w-36"
            >
              <option value="all">All Categories</option>
              <option value="chest">Chest</option>
              <option value="back">Back</option>
              <option value="shoulders">Shoulders</option>
              <option value="arms">Arms</option>
              <option value="legs">Legs</option>
              <option value="core">Core/Abs</option>
              <option value="cardio">Cardio</option>
              <option value="full-body">Full Body</option>
              <option value="upper-body">Upper Body</option>
              <option value="lower-body">Lower Body</option>
            </select>
          </div>
          {progress.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Complete some workouts to see your progress here
            </p>
          ) : getFilteredProgress().length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No exercises found in this category
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {getFilteredProgress().map((prog) => {
                const isCardio = isCardioExercise(prog.exerciseId)
                return (
                  <div
                    key={prog.exerciseId}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
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
                        <p className="text-gray-600 dark:text-gray-400">
                          Personal Best
                        </p>
                        {isCardio ? (
                          <div>
                            <p className="font-semibold dark:text-gray-200">
                              {prog.previousBest.distance
                                ? `${prog.previousBest.distance} km`
                                : ''}
                              {prog.previousBest.distance &&
                              prog.previousBest.duration &&
                              prog.previousBest.duration > 0
                                ? ' • '
                                : ''}
                              {prog.previousBest.duration &&
                              prog.previousBest.duration > 0
                                ? `${Math.floor(
                                    prog.previousBest.duration / 60
                                  )} min ${prog.previousBest.duration % 60} sec`
                                : ''}
                              {!prog.previousBest.distance &&
                              (!prog.previousBest.duration ||
                                prog.previousBest.duration === 0)
                                ? 'No data'
                                : ''}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(prog.previousBest.date)}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold dark:text-gray-200">
                              {prog.previousBest.reps} reps
                              {prog.previousBest.weight !== undefined &&
                              prog.previousBest.weight !== null
                                ? Number(prog.previousBest.weight) === 0
                                  ? ' @ bodyweight'
                                  : ` @ ${prog.previousBest.weight} kgs`
                                : ''}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(prog.previousBest.date)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Current Session
                        </p>
                        {isCardio ? (
                          <p className="font-semibold dark:text-gray-200">
                            {prog.currentSession.distance
                              ? `${prog.currentSession.distance} km`
                              : ''}
                            {prog.currentSession.distance &&
                            prog.currentSession.duration &&
                            prog.currentSession.duration > 0
                              ? ' • '
                              : ''}
                            {prog.currentSession.duration &&
                            prog.currentSession.duration > 0
                              ? `${Math.floor(
                                  prog.currentSession.duration / 60
                                )} min ${prog.currentSession.duration % 60} sec`
                              : ''}
                            {!prog.currentSession.distance &&
                            (!prog.currentSession.duration ||
                              prog.currentSession.duration === 0)
                              ? 'No data'
                              : ''}
                          </p>
                        ) : (
                          <p className="font-semibold dark:text-gray-200">
                            {prog.currentSession.reps} reps
                            {prog.currentSession.weight !== undefined &&
                            prog.currentSession.weight !== null
                              ? Number(prog.currentSession.weight) === 0
                                ? ' @ bodyweight'
                                : ` @ ${prog.currentSession.weight} kgs`
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Workout History */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
            Workout History
          </h2>
          {filteredWorkouts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No workouts found for the selected period
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredWorkouts
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((workout) => (
                  <div
                    key={workout.id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {workout.name}
                          </h3>
                          <button
                            onClick={() =>
                              showDeleteConfirmation(workout.id, workout.name)
                            }
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                            title="Delete workout"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {formatDate(workout.date)}
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Exercises
                            </p>
                            <p className="font-semibold dark:text-gray-200">
                              {workout.exercises.length}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Sets
                            </p>
                            <p className="font-semibold dark:text-gray-200">
                              {workout.sets.filter((s) => s.completed).length}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Duration
                            </p>
                            <p className="font-semibold dark:text-gray-200">
                              {workout.duration
                                ? `${workout.duration}m`
                                : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Exercise Details */}
                        <div className="space-y-1 border-t dark:border-gray-600 pt-2">
                          {workout.exercises.map((exercise) => {
                            const exerciseSets = workout.sets.filter(
                              (s) => s.exerciseId === exercise.id && s.completed
                            )
                            if (exerciseSets.length === 0) return null

                            const isCardio = isCardioExercise(exercise.id)

                            return (
                              <div
                                key={exercise.id}
                                className="text-xs text-gray-600 dark:text-gray-400 flex justify-between"
                              >
                                <span className="font-medium">
                                  {exercise.name}:
                                </span>
                                <span>
                                  {isCardio ? (
                                    <>
                                      {exerciseSets[0].distance
                                        ? `${exerciseSets[0].distance} km`
                                        : ''}
                                      {exerciseSets[0].distance &&
                                      exerciseSets[0].duration
                                        ? ' • '
                                        : ''}
                                      {exerciseSets[0].duration
                                        ? `${Math.floor(
                                            exerciseSets[0].duration / 60
                                          )} min ${
                                            exerciseSets[0].duration % 60
                                          } sec`
                                        : ''}
                                    </>
                                  ) : (
                                    `${exerciseSets.length} sets`
                                  )}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {workoutToDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50"
          style={{ margin: '-2rem -1rem' }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md m-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Delete Workout
                </h3>
              </div>
              <button
                onClick={cancelDeleteWorkout}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete the workout "
                {workoutToDelete.name}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteWorkout}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWorkout}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-md transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Progress
