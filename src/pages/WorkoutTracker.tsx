import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Plus,
  Trash2,
  Play,
  Square,
  Save,
  Edit2,
  Check,
  X,
  Brain,
  Wand2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { storageService } from '../services/storage'
import { AITrainerService } from '../services/aiTrainer'
import { Workout, Exercise, WorkoutSet } from '../types/workout'

interface WorkoutForm {
  name: string
  exerciseId: string
  sets: number
  reps: number
  weight: number
  distance: number
  duration: number
}

interface WorkoutPlanForm {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  workoutType:
    | 'full-body'
    | 'upper-body'
    | 'lower-body'
    | 'chest'
    | 'back'
    | 'shoulders'
    | 'arms'
    | 'legs'
    | 'core'
    | 'cardio'
    | 'strength'
    | 'endurance'
  goals: string
  availableTime: number
  equipment: string
}

const WorkoutTracker: React.FC = () => {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerInterval, setTimerInterval] = useState<number | null>(null)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<{
    reps: number
    weight?: number
  }>({ reps: 0 })
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [showInstructions, setShowInstructions] = useState<string | null>(null)
  const [minimizedExercises, setMinimizedExercises] = useState<Set<string>>(
    new Set()
  )
  const [isCardioExercise, setIsCardioExercise] = useState(false)
  const [showCustomExerciseForm, setShowCustomExerciseForm] = useState(false)
  const [customExerciseType, setCustomExerciseType] = useState<
    'cardio' | 'strength'
  >('strength')

  const aiTrainer = new AITrainerService()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkoutForm>()

  const {
    register: registerPlan,
    handleSubmit: handleSubmitPlan,
    reset: resetPlan,
    formState: { errors: planErrors },
  } = useForm<WorkoutPlanForm>()

  useEffect(() => {
    // Load exercises from localStorage on mount
    const loadedExercises = storageService.getExercises()
    setExercises(loadedExercises)
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
    setIsWorkoutActive(false) // Don't start timing automatically
    setTimer(0)
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

    // Check if there are any exercises in the workout
    if (currentWorkout.sets.length === 0) {
      toast.error('Please add exercises to your workout before finishing!')
      return
    }

    // Check if at least one set is completed
    const hasCompletedSets = currentWorkout.sets.some((set) => set.completed)
    if (!hasCompletedSets) {
      toast.error('Please complete at least one exercise before finishing!')
      return
    }

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

    // Check if it's a cardio exercise
    const isCardio = exercise.category === 'cardio'

    // Create sets for this exercise
    const newSets: WorkoutSet[] = []

    if (isCardio) {
      // For cardio: create a single entry with duration and/or distance
      newSets.push({
        id: `${Date.now()}`,
        exerciseId: exercise.id,
        reps: 0, // Not used for cardio
        duration:
          data.duration != null && data.duration > 0
            ? data.duration * 60
            : timer, // Convert minutes to seconds if manually entered, otherwise use workout timer
        distance: data.distance || undefined,
        completed: false,
        isCardio: true,
      })
    } else {
      // For strength exercises: create sets with reps and weight
      for (let i = 0; i < data.sets; i++) {
        newSets.push({
          id: `${Date.now()}-${i}`,
          exerciseId: exercise.id,
          reps: data.reps,
          weight: data.weight || undefined,
          completed: false,
          isCardio: false,
        })
      }
    }

    const updatedWorkout: Workout = {
      ...currentWorkout,
      name: data.name || currentWorkout.name,
      exercises: updatedExercises,
      sets: [...currentWorkout.sets, ...newSets],
    }

    setCurrentWorkout(updatedWorkout)
    reset()

    if (isCardio) {
      toast.success(`Added ${exercise.name} to workout`)
    } else {
      toast.success(`Added ${data.sets} sets of ${exercise.name}`)
    }
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

  const completeAllSets = () => {
    if (!currentWorkout) return

    const updatedSets = currentWorkout.sets.map((set) => ({
      ...set,
      completed: true,
    }))

    setCurrentWorkout({
      ...currentWorkout,
      sets: updatedSets,
    })

    toast.success('All exercises marked as complete!')
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

  const toggleExerciseMinimized = (exerciseId: string) => {
    setMinimizedExercises((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId)
      } else {
        newSet.add(exerciseId)
      }
      return newSet
    })
  }

  const startEditingSet = (setId: string) => {
    if (!currentWorkout) return

    const set = currentWorkout.sets.find((s) => s.id === setId)
    if (set) {
      setEditingSetId(setId)
      setEditingValues({ reps: set.reps, weight: set.weight })
    }
  }

  const cancelEditingSet = () => {
    setEditingSetId(null)
    setEditingValues({ reps: 0 })
  }

  const saveEditingSet = () => {
    if (!currentWorkout || !editingSetId) return

    const updatedSets = currentWorkout.sets.map((set) =>
      set.id === editingSetId
        ? { ...set, reps: editingValues.reps, weight: editingValues.weight }
        : set
    )

    setCurrentWorkout({
      ...currentWorkout,
      sets: updatedSets,
    })

    setEditingSetId(null)
    setEditingValues({ reps: 0 })
    toast.success('Set updated!')
  }

  const handleExerciseChange = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId)
    if (exercise) {
      setIsCardioExercise(exercise.category === 'cardio')
    } else {
      setIsCardioExercise(false)
    }
  }

  const createCustomExercise = (data: {
    name: string
    type: 'cardio' | 'strength'
    category: string
  }) => {
    const newExercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: data.name,
      category: data.category as Exercise['category'],
      muscleGroups: [],
      equipment: 'custom',
      instructions: 'Custom exercise',
    }

    // Save to localStorage
    storageService.saveExercise(newExercise)

    // Reload exercises from localStorage to ensure sync
    const updatedExercises = storageService.getExercises()
    setExercises(updatedExercises)

    setShowCustomExerciseForm(false)
    toast.success(`Custom exercise "${data.name}" created!`)

    // Auto-select the new exercise
    return newExercise.id
  }

  const generateWorkoutPlan = async (data: WorkoutPlanForm) => {
    setIsGeneratingPlan(true)
    try {
      const goals = data.goals
        .split(',')
        .map((goal) => goal.trim())
        .filter((goal) => goal.length > 0)
      const equipment = data.equipment
        .split(',')
        .map((eq) => eq.trim())
        .filter((eq) => eq.length > 0)

      const aiWorkout = await aiTrainer.getWorkoutPlan(
        data.fitnessLevel,
        data.workoutType,
        goals,
        data.availableTime,
        equipment
      )

      // Add AI-generated exercises to our exercises list if they don't exist
      const currentExercises = storageService.getExercises()
      const newExercises = [...currentExercises]

      aiWorkout.exercises.forEach((aiExercise) => {
        const existingExercise = currentExercises.find(
          (ex) => ex.id === aiExercise.id
        )
        if (!existingExercise) {
          newExercises.push(aiExercise)
          storageService.saveExercise(aiExercise)
        }
      })

      setExercises(newExercises)

      // Ensure the workout structure is complete
      const completeWorkout: Workout = {
        ...aiWorkout,
        id: Date.now().toString(),
        date: new Date(),
        completed: false,
        exercises: aiWorkout.exercises || [],
        sets: aiWorkout.sets || [],
      }

      // Set as current workout but not started yet
      setCurrentWorkout(completeWorkout)
      setShowPlanForm(false)
      resetPlan()
      toast.success(
        `AI workout plan generated with ${completeWorkout.exercises.length} exercises!`
      )
    } catch (error) {
      console.error('Error generating workout plan:', error)
      toast.error('Failed to generate workout plan. Please try again.')
    } finally {
      setIsGeneratingPlan(false)
    }
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
            <div className="flex space-x-2 flex-col md:flex-row">
              <button
                onClick={startWorkout}
                className="btn-primary flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Start Workout</span>
              </button>
              <button
                onClick={() => setShowPlanForm(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Brain className="h-4 w-4" />
                <span>AI Plan</span>
              </button>
            </div>
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
                    // Validate that there are exercises before starting
                    if (!currentWorkout || currentWorkout.sets.length === 0) {
                      toast.error(
                        'Please add exercises to your workout before starting!'
                      )
                      return
                    }

                    setIsWorkoutActive(true)
                    const interval = setInterval(
                      () => setTimer((prev) => prev + 1),
                      1000
                    )
                    setTimerInterval(interval)
                    toast.success(
                      timer === 0 ? 'Workout started!' : 'Timer resumed!'
                    )
                  }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>{timer === 0 ? 'Start' : 'Resume'}</span>
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
        <div
          className={`grid gap-8 ${
            !isWorkoutActive ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {/* Add Exercise Form - Hidden when workout is active */}
          {!isWorkoutActive && (
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
                  <div className="flex space-x-2">
                    <select
                      {...register('exerciseId', {
                        required: 'Please select an exercise',
                        onChange: (e) => handleExerciseChange(e.target.value),
                      })}
                      className="input-field flex-1"
                    >
                      <option value="">Select an exercise</option>
                      {exercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.name} ({exercise.category})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCustomExerciseForm(true)}
                      className="btn-secondary px-4 py-2 whitespace-nowrap"
                      title="Create custom exercise"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.exerciseId && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.exerciseId.message}
                    </p>
                  )}
                </div>

                {isCardioExercise ? (
                  // Cardio Exercise Fields
                  <>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Distance (km)
                          </label>
                          <input
                            {...register('distance', { min: 0 })}
                            type="number"
                            className="input-field"
                            placeholder="5.0"
                            min="0"
                            step="0.1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (min)
                          </label>
                          <input
                            {...register('duration', { min: 0 })}
                            type="number"
                            className="input-field"
                            placeholder="30"
                            min="0"
                            step="1"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>💡 Tip:</strong> Leave duration blank to use
                          the workout timer automatically when you add the
                          exercise.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  // Strength Exercise Fields
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sets *
                      </label>
                      <input
                        {...register('sets', {
                          required: 'Sets required',
                          min: 1,
                        })}
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
                        {...register('reps', {
                          required: 'Reps required',
                          min: 1,
                        })}
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
                        Weight (kgs)
                      </label>
                      <input
                        {...register('weight', { min: 0 })}
                        type="number"
                        className="input-field"
                        placeholder="60"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Workout</span>
                </button>
              </form>
            </div>
          )}

          {/* Current Workout */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Current Workout
              </h2>
              {currentWorkout.sets.length > 0 && (
                <button
                  onClick={completeAllSets}
                  className="btn-secondary flex items-center space-x-2 text-sm"
                >
                  <Check className="h-4 w-4" />
                  <span>Complete All</span>
                </button>
              )}
            </div>

            {/* Workout Title and Notes */}
            {(currentWorkout.name || currentWorkout.notes) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {currentWorkout.name && (
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {currentWorkout.name}
                  </h3>
                )}
                {currentWorkout.notes && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span>{' '}
                    {currentWorkout.notes}
                  </p>
                )}
              </div>
            )}

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
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-900">
                              {exercise.name}
                            </h3>
                            {minimizedExercises.has(exerciseId) && (
                              <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                {sets.filter((set) => set.completed).length}/
                                {sets.length} completed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() =>
                                toggleExerciseMinimized(exerciseId)
                              }
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title={
                                minimizedExercises.has(exerciseId)
                                  ? 'Maximize exercise'
                                  : 'Minimize exercise'
                              }
                            >
                              {minimizedExercises.has(exerciseId) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              )}
                            </button>
                            {!minimizedExercises.has(exerciseId) && (
                              <button
                                onClick={() =>
                                  setShowInstructions(
                                    showInstructions === exerciseId
                                      ? null
                                      : exerciseId
                                  )
                                }
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Show exercise instructions"
                              >
                                <HelpCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {!minimizedExercises.has(exerciseId) && (
                          <>
                            {showInstructions === exerciseId &&
                              exercise.instructions && (
                                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                  <p className="text-sm text-blue-800">
                                    <strong>Instructions:</strong>{' '}
                                    {exercise.instructions}
                                  </p>
                                </div>
                              )}

                            <div className="space-y-2">
                              {sets.map((set, index) => (
                                <div
                                  key={set.id}
                                  className="bg-gray-50 p-3 rounded"
                                >
                                  {set.isCardio ? (
                                    // Cardio Exercise Display
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(set.completed)}
                                          onChange={() =>
                                            toggleSetCompletion(set.id)
                                          }
                                          className="h-4 w-4 text-primary-600 rounded"
                                        />
                                        <div>
                                          <span
                                            className={`font-medium ${
                                              set.completed
                                                ? 'line-through text-gray-500'
                                                : 'text-gray-900'
                                            }`}
                                          >
                                            Cardio Exercise
                                          </span>
                                          <div
                                            className={`text-sm ${
                                              set.completed
                                                ? 'text-gray-500'
                                                : 'text-gray-700'
                                            }`}
                                          >
                                            {set.distance && (
                                              <span className="mr-3">
                                                Distance: {set.distance} km
                                              </span>
                                            )}
                                            {set.duration && (
                                              <span>
                                                Time:{' '}
                                                {Math.floor(set.duration / 60)}{' '}
                                                min {set.duration % 60} sec
                                              </span>
                                            )}
                                            {!set.distance && !set.duration && (
                                              <span className="text-gray-500 italic">
                                                No time/distance recorded
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => removeSet(set.id)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Remove exercise"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : editingSetId === set.id ? (
                                    // Editing mode for strength exercises
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-4">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(set.completed)}
                                          onChange={() =>
                                            toggleSetCompletion(set.id)
                                          }
                                          className="h-4 w-4 text-primary-600 rounded"
                                        />
                                        <span className="font-medium text-gray-900">
                                          Set {index + 1}:
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                          <label className="text-sm font-medium text-gray-700">
                                            Reps:
                                          </label>
                                          <input
                                            type="number"
                                            value={editingValues.reps}
                                            onChange={(e) =>
                                              setEditingValues({
                                                ...editingValues,
                                                reps:
                                                  parseInt(e.target.value) || 0,
                                              })
                                            }
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                            min="1"
                                          />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <label className="text-sm font-medium text-gray-700">
                                            Weight (kgs):
                                          </label>
                                          <input
                                            type="number"
                                            value={editingValues.weight || ''}
                                            onChange={(e) =>
                                              setEditingValues({
                                                ...editingValues,
                                                weight: e.target.value
                                                  ? parseFloat(e.target.value)
                                                  : undefined,
                                              })
                                            }
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                            min="0"
                                            step="0.5"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={saveEditingSet}
                                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                        >
                                          <Check className="h-3 w-3" />
                                          <span>Save</span>
                                        </button>
                                        <button
                                          onClick={cancelEditingSet}
                                          className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                        >
                                          <X className="h-3 w-3" />
                                          <span>Cancel</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    // Display mode for strength exercises
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(set.completed)}
                                          onChange={() =>
                                            toggleSetCompletion(set.id)
                                          }
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
                                          {set.weight && `@ ${set.weight} kgs`}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() =>
                                            startEditingSet(set.id)
                                          }
                                          className="text-blue-600 hover:text-blue-800"
                                          title="Edit set"
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => removeSet(set.id)}
                                          className="text-red-600 hover:text-red-800"
                                          title="Remove set"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
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
            Start tracking your exercises manually or let AI generate a
            personalized workout plan for you.
          </p>
          <div className="flex space-x-4 justify-center flex-col sm:flex-row">
            <button
              onClick={startWorkout}
              className="btn-primary flex items-center space-x-2 mx-auto sm:mx-0"
            >
              <Play className="h-4 w-4" />
              <span>Start Workout</span>
            </button>
            <button
              onClick={() => setShowPlanForm(true)}
              className="btn-secondary flex items-center space-x-2 mx-auto sm:mx-0"
            >
              <Brain className="h-4 w-4" />
              <span>Generate AI Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Workout Plan Form Modal */}
      {showPlanForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ margin: '-2rem -1rem' }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <Wand2 className="h-5 w-5 text-primary-600" />
                <span>Generate AI Workout Plan</span>
              </h2>
              <button
                onClick={() => setShowPlanForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitPlan(generateWorkoutPlan)}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fitness Level *
                </label>
                <select
                  {...registerPlan('fitnessLevel', {
                    required: 'Please select your fitness level',
                  })}
                  className="input-field"
                >
                  <option value="">Select your level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                {planErrors.fitnessLevel && (
                  <p className="text-red-600 text-sm mt-1">
                    {planErrors.fitnessLevel.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workout Type/Focus *
                </label>
                <select
                  {...registerPlan('workoutType', {
                    required: 'Please select a workout type',
                  })}
                  className="input-field"
                >
                  <option value="">Select workout focus</option>
                  <option value="full-body">Full Body</option>
                  <option value="upper-body">Upper Body</option>
                  <option value="lower-body">Lower Body</option>
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="arms">Arms</option>
                  <option value="legs">Legs</option>
                  <option value="core">Core/Abs</option>
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength Training</option>
                  <option value="endurance">Endurance</option>
                </select>
                {planErrors.workoutType && (
                  <p className="text-red-600 text-sm mt-1">
                    {planErrors.workoutType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fitness Goals *
                </label>
                <input
                  {...registerPlan('goals', {
                    required: 'Please enter your goals',
                  })}
                  className="input-field"
                  placeholder="e.g., build muscle, lose weight, improve endurance"
                />
                {planErrors.goals && (
                  <p className="text-red-600 text-sm mt-1">
                    {planErrors.goals.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple goals with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Time (minutes) *
                </label>
                <input
                  {...registerPlan('availableTime', {
                    required: 'Please enter available time',
                    min: { value: 15, message: 'Minimum 15 minutes required' },
                    max: { value: 180, message: 'Maximum 180 minutes allowed' },
                  })}
                  type="number"
                  className="input-field"
                  placeholder="45"
                  min="15"
                  max="180"
                />
                {planErrors.availableTime && (
                  <p className="text-red-600 text-sm mt-1">
                    {planErrors.availableTime.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Equipment
                </label>
                <input
                  {...registerPlan('equipment')}
                  className="input-field"
                  placeholder="e.g., barbell, dumbbells, resistance bands, bodyweight"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple equipment with commas. Leave empty for
                  bodyweight exercises.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isGeneratingPlan}
                  className="btn-primary flex items-center space-x-2 flex-1 justify-center disabled:opacity-50"
                >
                  <Wand2
                    className={`h-4 w-4 ${
                      isGeneratingPlan ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlanForm(false)}
                  className="btn-secondary px-4"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Exercise Form Modal */}
      {showCustomExerciseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Create Custom Exercise
              </h2>
              <button
                onClick={() => setShowCustomExerciseForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const name = formData.get('customName') as string
                const type = formData.get('customType') as 'cardio' | 'strength'
                const selectedCategory = formData.get(
                  'customCategory'
                ) as string

                if (!name.trim()) {
                  toast.error('Please enter an exercise name')
                  return
                }

                // Use selected category for strength, 'cardio' for cardio
                const category =
                  type === 'cardio' ? 'cardio' : selectedCategory || 'strength'
                const exerciseId = createCustomExercise({
                  name,
                  type,
                  category,
                })

                // Set the form to use this new exercise
                const selectElement = document.querySelector(
                  'select[name="exerciseId"]'
                ) as HTMLSelectElement
                if (selectElement) {
                  selectElement.value = exerciseId
                  handleExerciseChange(exerciseId)
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise Name *
                </label>
                <input
                  name="customName"
                  type="text"
                  className="input-field"
                  placeholder="e.g., Bulgarian Split Squat"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise Type *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="customType"
                      value="strength"
                      defaultChecked
                      onChange={() => setCustomExerciseType('strength')}
                      className="h-4 w-4 text-primary-600"
                    />
                    <div>
                      <span className="font-medium text-gray-900">
                        Strength/Weights
                      </span>
                      <p className="text-xs text-gray-500">
                        Track sets, reps, and weight
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="customType"
                      value="cardio"
                      onChange={() => setCustomExerciseType('cardio')}
                      className="h-4 w-4 text-primary-600"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Cardio</span>
                      <p className="text-xs text-gray-500">
                        Track distance and time
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Category Selection - Show only for strength exercises */}
              {customExerciseType === 'strength' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Muscle Group *
                  </label>
                  <select
                    name="customCategory"
                    className="input-field"
                    defaultValue="chest"
                    required
                  >
                    <option value="chest">Chest</option>
                    <option value="back">Back</option>
                    <option value="shoulders">Shoulders</option>
                    <option value="arms">Arms</option>
                    <option value="legs">Legs</option>
                    <option value="core">Core/Abs</option>
                    <option value="full-body">Full Body</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Exercise</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomExerciseForm(false)}
                  className="btn-secondary px-4"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutTracker
