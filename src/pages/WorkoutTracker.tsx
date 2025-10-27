import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Play, Square, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { storageService } from '../services/storage'
import { Workout, Exercise, WorkoutSet } from '../types/workout'

interface WorkoutForm {
  name: string
  exerciseId: string
  sets: number
  reps: number
  weight: number
}

const WorkoutTracker: React.FC = () => {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerInterval, setTimerInterval] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkoutForm>()

  useEffect(() => {
    setExercises(storageService.getExercises())
  }, [])

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  const startWorkout = () => {
    const newWorkout: Workout = {
      id: Date.now().toString(),
      date: new Date(),
      name: 'New Workout',
      exercises: [],
      sets: [],
      completed: false,
    }

    setCurrentWorkout(newWorkout)
    setIsWorkoutActive(true)
    setTimer(0)

    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)

    setTimerInterval(interval)
    toast.success('Workout started!')
  }

  const stopWorkout = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    setIsWorkoutActive(false)
    toast.success('Workout paused')
  }

  const finishWorkout = () => {
    if (!currentWorkout) return

    const completedWorkout: Workout = {
      ...currentWorkout,
      duration: Math.floor(timer / 60),
      completed: true,
    }

    storageService.saveWorkout(completedWorkout)

    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    setCurrentWorkout(null)
    setIsWorkoutActive(false)
    setTimer(0)

    toast.success('Workout completed and saved!')
  }

  const addExerciseToWorkout = (data: WorkoutForm) => {
    if (!currentWorkout) return

    const exercise = exercises.find((e) => e.id === data.exerciseId)
    if (!exercise) return

    // Add exercise to workout if not already present
    const updatedExercises = currentWorkout.exercises.find(
      (e) => e.id === exercise.id
    )
      ? currentWorkout.exercises
      : [...currentWorkout.exercises, exercise]

    // Create sets for this exercise
    const newSets: WorkoutSet[] = []
    for (let i = 0; i < data.sets; i++) {
      newSets.push({
        id: `${Date.now()}-${i}`,
        exerciseId: exercise.id,
        reps: data.reps,
        weight: data.weight || undefined,
        completed: false,
      })
    }

    const updatedWorkout: Workout = {
      ...currentWorkout,
      name: data.name || currentWorkout.name,
      exercises: updatedExercises,
      sets: [...currentWorkout.sets, ...newSets],
    }

    setCurrentWorkout(updatedWorkout)
    reset()
    toast.success(`Added ${data.sets} sets of ${exercise.name}`)
  }

  const toggleSetCompletion = (setId: string) => {
    if (!currentWorkout) return

    const updatedSets = currentWorkout.sets.map((set) =>
      set.id === setId ? { ...set, completed: !set.completed } : set
    )

    setCurrentWorkout({
      ...currentWorkout,
      sets: updatedSets,
    })
  }

  const removeSet = (setId: string) => {
    if (!currentWorkout) return

    const updatedSets = currentWorkout.sets.filter((set) => set.id !== setId)
    setCurrentWorkout({
      ...currentWorkout,
      sets: updatedSets,
    })
    toast.success('Set removed')
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const groupSetsByExercise = () => {
    if (!currentWorkout) return {}

    return currentWorkout.sets.reduce((groups, set) => {
      const exerciseId = set.exerciseId
      if (!groups[exerciseId]) {
        groups[exerciseId] = []
      }
      groups[exerciseId].push(set)
      return groups
    }, {} as Record<string, WorkoutSet[]>)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center md:flex-row flex-col">
        <h1 className="text-3xl font-bold text-gray-800">Workout Tracker</h1>
        <div className="flex items-center space-x-4">
          {currentWorkout && (
            <div className="flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-lg md:flex-row flex-col">
              <span className="text-primary-700 font-medium">Time:</span>
              <span className="text-primary-900 font-bold text-lg">
                {formatTime(timer)}
              </span>
            </div>
          )}
          {!currentWorkout ? (
            <button
              onClick={startWorkout}
              className="btn-primary flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Workout</span>
            </button>
          ) : (
            <div className="flex md:space-x-2 md:flex-row flex-col">
              {isWorkoutActive ? (
                <button
                  onClick={stopWorkout}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsWorkoutActive(true)
                    const interval = setInterval(
                      () => setTimer((prev) => prev + 1),
                      1000
                    )
                    setTimerInterval(interval)
                  }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Resume</span>
                </button>
              )}
              <button
                onClick={finishWorkout}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Finish</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {currentWorkout ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Exercise Form */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Add Exercise
            </h2>
            <form
              onSubmit={handleSubmit(addExerciseToWorkout)}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workout Name
                </label>
                <input
                  {...register('name')}
                  className="input-field"
                  placeholder="Enter workout name"
                  defaultValue={currentWorkout.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise *
                </label>
                <select
                  {...register('exerciseId', {
                    required: 'Please select an exercise',
                  })}
                  className="input-field"
                >
                  <option value="">Select an exercise</option>
                  {exercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name} ({exercise.category})
                    </option>
                  ))}
                </select>
                {errors.exerciseId && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.exerciseId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sets *
                  </label>
                  <input
                    {...register('sets', { required: 'Sets required', min: 1 })}
                    type="number"
                    className="input-field"
                    placeholder="3"
                    min="1"
                  />
                  {errors.sets && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.sets.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reps *
                  </label>
                  <input
                    {...register('reps', { required: 'Reps required', min: 1 })}
                    type="number"
                    className="input-field"
                    placeholder="12"
                    min="1"
                  />
                  {errors.reps && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.reps.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (lbs)
                  </label>
                  <input
                    {...register('weight', { min: 0 })}
                    type="number"
                    className="input-field"
                    placeholder="135"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add to Workout</span>
              </button>
            </form>
          </div>

          {/* Current Workout */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Current Workout
            </h2>
            {currentWorkout.sets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No exercises added yet
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupSetsByExercise()).map(
                  ([exerciseId, sets]) => {
                    const exercise = exercises.find((e) => e.id === exerciseId)
                    if (!exercise) return null

                    return (
                      <div key={exerciseId} className="border rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">
                          {exercise.name}
                        </h3>
                        <div className="space-y-2">
                          {sets.map((set, index) => (
                            <div
                              key={set.id}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded"
                            >
                              <div className="flex items-center space-x-4">
                                <input
                                  type="checkbox"
                                  checked={set.completed}
                                  onChange={() => toggleSetCompletion(set.id)}
                                  className="h-4 w-4 text-primary-600 rounded"
                                />
                                <span
                                  className={`font-medium ${
                                    set.completed
                                      ? 'line-through text-gray-500'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  Set {index + 1}:
                                </span>
                                <span
                                  className={
                                    set.completed
                                      ? 'text-gray-500'
                                      : 'text-gray-700'
                                  }
                                >
                                  {set.reps} reps{' '}
                                  {set.weight && `@ ${set.weight} lbs`}
                                </span>
                              </div>
                              <button
                                onClick={() => removeSet(set.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Ready to start your workout?
          </h2>
          <p className="text-gray-600 mb-6">
            Click the "Start Workout" button to begin tracking your exercises.
          </p>
          <button
            onClick={startWorkout}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Play className="h-4 w-4" />
            <span>Start Workout</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default WorkoutTracker
