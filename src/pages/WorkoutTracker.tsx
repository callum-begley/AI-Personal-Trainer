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
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { storageService } from '../services/storage'
import { AITrainerService } from '../services/aiTrainer'
import { Workout, Exercise, WorkoutSet } from '../types/workout'
import { useWorkout } from '../contexts/WorkoutContext'

interface WorkoutForm {
  name: string
  exerciseId: string
  sets: number
  reps: number
  weight: number
  distance: number
  duration: number
  durationSeconds: number
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
  // Use workout context for shared state
  const {
    currentWorkout,
    setCurrentWorkout,
    isWorkoutActive,
    setIsWorkoutActive,
    timer,
    setTimer,
    startTime,
    setStartTime,
    pausedTime,
    setPausedTime,
    isNotesMinimized,
    setIsNotesMinimized,
    minimizedExercises,
    setMinimizedExercises,
  } = useWorkout()

  // Local state
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([])
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<{
    reps: number
    weight?: number
    duration?: number
    distance?: number
  }>({ reps: 0 })
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [showInstructions, setShowInstructions] = useState<string | null>(null)
  const [isCardioExercise, setIsCardioExercise] = useState(false)
  const [showCustomExerciseForm, setShowCustomExerciseForm] = useState(false)
  const [customExerciseType, setCustomExerciseType] = useState<
    'cardio' | 'strength'
  >('strength')
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)

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

    // Load saved workouts
    const loadedWorkouts = storageService.getWorkouts()
    setSavedWorkouts(loadedWorkouts)
  }, [])

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
    setStartTime(null)
    setPausedTime(0)
  }

  const loadSavedWorkout = (workoutId: string) => {
    if (!workoutId) return

    const savedWorkout = savedWorkouts.find((w) => w.id === workoutId)
    if (!savedWorkout) return

    // Create a new workout based on the saved one (template)
    const newWorkout: Workout = {
      id: Date.now().toString(),
      date: new Date(),
      name: savedWorkout.name,
      exercises: savedWorkout.exercises,
      sets: savedWorkout.sets.map((set, index) => ({
        ...set,
        id: `${Date.now()}-${index}`,
        completed: false, // Reset completion status
      })),
      notes: savedWorkout.notes, // Preserve notes from saved workout
      completed: false,
    }

    setCurrentWorkout(newWorkout)
    setIsWorkoutActive(false)
    setTimer(0)
    setStartTime(null)
    setPausedTime(0)
    toast.success(`Loaded workout: ${savedWorkout.name}`)
  }

  const stopWorkout = () => {
    setIsWorkoutActive(false)
    // Save the current elapsed time
    if (startTime !== null) {
      setPausedTime(Math.floor((Date.now() - startTime) / 1000) + pausedTime)
      setStartTime(null)
    }
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

    // Update cardio exercises that don't have a manually entered duration
    // to use the final workout timer value
    const updatedSets = currentWorkout.sets.map((set) => {
      if (
        set.isCardio &&
        set.completed &&
        (!set.duration || set.duration === 0)
      ) {
        // If cardio exercise has no duration or duration is 0, use the workout timer
        return {
          ...set,
          duration: timer,
        }
      }
      return set
    })

    // Calculate workout duration
    // If timer was used (timer > 0), use that. Otherwise, sum up cardio durations
    let workoutDuration = Math.floor(timer / 60)

    if (timer === 0) {
      // No timer was used, calculate from cardio exercises
      const totalCardioSeconds = updatedSets
        .filter((set) => set.isCardio && set.completed && set.duration)
        .reduce((sum, set) => sum + (set.duration || 0), 0)
      workoutDuration = Math.floor(totalCardioSeconds / 60)
    }

    // Only include sets that were actually completed to avoid polluting AI recommendations
    const completedSetsOnly = updatedSets.filter((set) => set.completed)

    const completedWorkout: Workout = {
      ...currentWorkout,
      sets: completedSetsOnly,
      duration: workoutDuration,
      completed: true,
    }

    storageService.saveWorkout(completedWorkout)

    setCurrentWorkout(null)
    setIsWorkoutActive(false)
    setTimer(0)
    setStartTime(null)
    setPausedTime(0)

    toast.success('Workout completed and saved!')
  }

  const confirmClearWorkout = () => {
    setCurrentWorkout(null)
    setIsWorkoutActive(false)
    setTimer(0)
    setStartTime(null)
    setPausedTime(0)
    setShowClearConfirmation(false)
    toast.success('Workout cleared')
  }

  const cancelClearWorkout = () => {
    setShowClearConfirmation(false)
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
      // Calculate total duration in seconds (minutes * 60 + seconds)
      const minutes = Number(data.duration) || 0
      const seconds = Number(data.durationSeconds) || 0
      const totalDuration =
        minutes > 0 || seconds > 0 ? minutes * 60 + seconds : undefined

      newSets.push({
        id: `${Date.now()}`,
        exerciseId: exercise.id,
        reps: 0, // Not used for cardio
        duration: totalDuration, // Use calculated duration or undefined when no time provided
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
          weight:
            data.weight !== undefined &&
            data.weight !== null &&
            data.weight !== ''
              ? Number(data.weight)
              : 0,
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

  const addSet = (exerciseId: string) => {
    if (!currentWorkout) return

    const exercise = exercises.find((e) => e.id === exerciseId)
    if (!exercise) return

    // Find an existing set for this exercise to copy values from
    const existingSet = currentWorkout.sets.find(
      (set) => set.exerciseId === exerciseId
    )

    const newSet: WorkoutSet = {
      id: `${Date.now()}`,
      exerciseId: exerciseId,
      reps: existingSet?.reps || 0,
      weight: existingSet?.weight,
      duration: existingSet?.duration,
      distance: existingSet?.distance,
      completed: false,
      isCardio: exercise.category === 'cardio',
    }

    setCurrentWorkout({
      ...currentWorkout,
      sets: [...currentWorkout.sets, newSet],
    })
    toast.success('Set added')
  }

  const toggleExerciseMinimized = (exerciseId: string) => {
    const newSet = new Set(minimizedExercises)
    if (newSet.has(exerciseId)) {
      newSet.delete(exerciseId)
    } else {
      newSet.add(exerciseId)
    }
    setMinimizedExercises(newSet)
  }

  const startEditingSet = (setId: string) => {
    if (!currentWorkout) return

    const set = currentWorkout.sets.find((s) => s.id === setId)
    if (set) {
      setEditingSetId(setId)
      if (set.isCardio) {
        setEditingValues({
          reps: 0,
          duration: set.duration,
          distance: set.distance,
        })
      } else {
        setEditingValues({
          reps: set.reps,
          weight: set.weight,
        })
      }
    }
  }

  const cancelEditingSet = () => {
    setEditingSetId(null)
    setEditingValues({ reps: 0 })
  }

  const saveEditingSet = () => {
    if (!currentWorkout || !editingSetId) return

    const updatedSets = currentWorkout.sets.map((set) => {
      if (set.id === editingSetId) {
        if (set.isCardio) {
          return {
            ...set,
            duration: editingValues.duration,
            distance: editingValues.distance,
          }
        } else {
          return {
            ...set,
            reps: editingValues.reps,
            weight: editingValues.weight,
          }
        }
      }
      return set
    })

    setCurrentWorkout({
      ...currentWorkout,
      sets: updatedSets,
    })

    setEditingSetId(null)
    setEditingValues({ reps: 0 })
    toast.success('Exercise updated!')
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 sm:mb-0 mb-4">
          Workout Tracker
        </h1>
        <div className="flex items-center space-x-4">
          {currentWorkout && (
            <div className="flex items-center space-x-2 bg-primary-50 dark:bg-blue-900 px-4 py-2 rounded-lg md:flex-row flex-col">
              <span className="text-primary-700 dark:text-blue-300 font-medium">
                Time:
              </span>
              <span className="text-primary-900 dark:text-blue-50 font-bold text-lg">
                {formatTime(timer)}
              </span>
            </div>
          )}
          {!currentWorkout ? (
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={startWorkout}
                className="btn-primary flex items-center justify-center space-x-2 w-full md:w-auto"
              >
                <Play className="h-4 w-4" />
                <span>Start Workout</span>
              </button>
              <button
                onClick={() => setShowPlanForm(true)}
                className="btn-secondary flex items-center justify-center space-x-2 w-full md:w-auto"
              >
                <Brain className="h-4 w-4" />
                <span>AI Plan</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              {isWorkoutActive ? (
                <button
                  onClick={stopWorkout}
                  className="btn-secondary flex items-center justify-center space-x-2 w-full md:w-auto"
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
                    setStartTime(Date.now())
                    toast.success(
                      timer === 0 ? 'Workout started!' : 'Timer resumed!'
                    )
                  }}
                  className="btn-secondary flex items-center justify-center space-x-2 w-full md:w-auto"
                >
                  <Play className="h-4 w-4" />
                  <span>{timer === 0 ? 'Start' : 'Resume'}</span>
                </button>
              )}
              <button
                onClick={finishWorkout}
                className="btn-primary flex items-center justify-center space-x-2 w-full md:w-auto"
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
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                Add Exercise
              </h2>

              <form
                onSubmit={handleSubmit(addExerciseToWorkout)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Exercise *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      {...register('exerciseId', {
                        required: 'Please select an exercise',
                        onChange: (e) => handleExerciseChange(e.target.value),
                      })}
                      className="input-field flex-1 capitalize"
                    >
                      <option value="">Select an exercise</option>
                      {exercises
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((exercise) => (
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
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {errors.exerciseId.message}
                    </p>
                  )}
                </div>

                {isCardioExercise ? (
                  // Cardio Exercise Fields
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Duration
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input
                              {...register('duration', { min: 0 })}
                              type="number"
                              className="input-field"
                              placeholder="Minutes"
                              min="0"
                              step="1"
                            />
                          </div>
                          <div>
                            <input
                              {...register('durationSeconds', {
                                min: 0,
                                max: 59,
                              })}
                              type="number"
                              className="input-field"
                              placeholder="Seconds"
                              min="0"
                              max="59"
                              step="1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {errors.sets.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {errors.reps.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          <div className="card sm:p-6 p-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Current Workout
              </h2>
              <div className="flex items-center space-x-2">
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
            </div>

            {/* Workout Title and Notes */}
            {(currentWorkout.name || currentWorkout.notes) && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-start">
                  {currentWorkout.notes && (
                    <button
                      onClick={() => setIsNotesMinimized(!isNotesMinimized)}
                      className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
                      title={
                        isNotesMinimized ? 'Expand notes' : 'Minimize notes'
                      }
                    >
                      {isNotesMinimized ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </button>
                  )}
                  <div className="flex-1">
                    {currentWorkout.name && (
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {currentWorkout.name}
                      </h3>
                    )}
                    {!isNotesMinimized && currentWorkout.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Notes:</span>{' '}
                        {currentWorkout.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentWorkout.sets.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No exercises added yet
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupSetsByExercise()).map(
                  ([exerciseId, sets]) => {
                    const exercise = exercises.find((e) => e.id === exerciseId)
                    if (!exercise) return null

                    return (
                      <div
                        key={exerciseId}
                        className="border dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                toggleExerciseMinimized(exerciseId)
                              }
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
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
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {exercise.name}
                            </h3>
                            {minimizedExercises.has(exerciseId) && (
                              <span
                                className={`text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded
                              ${
                                sets.filter((set) => set.completed).length ===
                                sets.length
                                  ? 'bg-green-200 dark:bg-green-700'
                                  : ''
                              }`}
                              >
                                {sets.filter((set) => set.completed).length}/
                                {sets.length} completed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {!minimizedExercises.has(exerciseId) && (
                              <>
                                <button
                                  onClick={() => addSet(exerciseId)}
                                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                  title="Add set"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setShowInstructions(
                                      showInstructions === exerciseId
                                        ? null
                                        : exerciseId
                                    )
                                  }
                                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  title="Show exercise instructions"
                                >
                                  <HelpCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {!minimizedExercises.has(exerciseId) && (
                          <>
                            {showInstructions === exerciseId &&
                              exercise.instructions && (
                                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                  <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Instructions:</strong>{' '}
                                    {exercise.instructions}
                                  </p>
                                </div>
                              )}

                            <div className="space-y-2">
                              {sets.map((set, index) => (
                                <div
                                  key={set.id}
                                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded"
                                >
                                  {editingSetId === set.id ? (
                                    // Editing mode
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
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                          {set.isCardio
                                            ? 'Cardio Exercise'
                                            : `Set ${index + 1}`}
                                          :
                                        </span>
                                      </div>

                                      {set.isCardio ? (
                                        // Cardio editing fields
                                        <div className="space-y-3">
                                          <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Distance (km):
                                              </label>
                                              <input
                                                type="number"
                                                value={
                                                  editingValues.distance || ''
                                                }
                                                onChange={(e) =>
                                                  setEditingValues({
                                                    ...editingValues,
                                                    distance: e.target.value
                                                      ? parseFloat(
                                                          e.target.value
                                                        )
                                                      : undefined,
                                                  })
                                                }
                                                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                min="0"
                                                step="0.1"
                                                placeholder="0.0"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Duration:
                                              </label>
                                              <input
                                                type="number"
                                                value={Math.floor(
                                                  (editingValues.duration ||
                                                    0) / 60
                                                )}
                                                onChange={(e) => {
                                                  const minutes =
                                                    parseInt(e.target.value) ||
                                                    0
                                                  const seconds =
                                                    (editingValues.duration ||
                                                      0) % 60
                                                  setEditingValues({
                                                    ...editingValues,
                                                    duration:
                                                      minutes > 0 || seconds > 0
                                                        ? minutes * 60 + seconds
                                                        : undefined,
                                                  })
                                                }}
                                                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                min="0"
                                                placeholder="Min"
                                              />
                                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                                min
                                              </span>
                                              <input
                                                type="number"
                                                value={
                                                  (editingValues.duration ||
                                                    0) % 60
                                                }
                                                onChange={(e) => {
                                                  const seconds =
                                                    parseInt(e.target.value) ||
                                                    0
                                                  const minutes = Math.floor(
                                                    (editingValues.duration ||
                                                      0) / 60
                                                  )
                                                  setEditingValues({
                                                    ...editingValues,
                                                    duration:
                                                      minutes > 0 || seconds > 0
                                                        ? minutes * 60 + seconds
                                                        : undefined,
                                                  })
                                                }}
                                                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                min="0"
                                                max="59"
                                                placeholder="Sec"
                                              />
                                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                                sec
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        // Strength exercise editing fields
                                        <div className="flex items-center space-x-4">
                                          <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                              Reps:
                                            </label>
                                            <input
                                              type="number"
                                              value={editingValues.reps}
                                              onChange={(e) =>
                                                setEditingValues({
                                                  ...editingValues,
                                                  reps:
                                                    parseInt(e.target.value) ||
                                                    0,
                                                })
                                              }
                                              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                              min="1"
                                            />
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                              Weight (kgs):
                                            </label>
                                            <input
                                              type="number"
                                              value={editingValues.weight || ''}
                                              onChange={(e) =>
                                                setEditingValues({
                                                  ...editingValues,
                                                  weight:
                                                    e.target.value !== ''
                                                      ? parseFloat(
                                                          e.target.value
                                                        ) || 0
                                                      : 0,
                                                })
                                              }
                                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                              min="0"
                                              step="0.5"
                                            />
                                          </div>
                                        </div>
                                      )}
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
                                  ) : set.isCardio ? (
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
                                                ? 'line-through text-gray-500 dark:text-gray-400'
                                                : 'text-gray-900 dark:text-gray-100'
                                            }`}
                                          >
                                            Cardio Exercise
                                          </span>
                                          <div
                                            className={`text-sm ${
                                              set.completed
                                                ? 'text-gray-500 dark:text-gray-400'
                                                : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                          >
                                            {set.distance &&
                                              set.distance > 0 && (
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
                                            {(!set.distance ||
                                              set.distance === 0) &&
                                              !set.duration && (
                                                <span className="text-gray-500 dark:text-gray-400 italic">
                                                  No time/distance recorded
                                                </span>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() =>
                                            startEditingSet(set.id)
                                          }
                                          className="text-blue-600 hover:text-blue-800"
                                          title="Edit cardio exercise"
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => removeSet(set.id)}
                                          className="text-red-600 hover:text-red-800"
                                          title="Remove exercise"
                                        >
                                          <Trash2 className="h-4 w-4" />
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
                                              ? 'line-through text-gray-500 dark:text-gray-400'
                                              : 'text-gray-900 dark:text-gray-100'
                                          }`}
                                        >
                                          Set {index + 1}:
                                        </span>
                                        <span
                                          className={
                                            set.completed
                                              ? 'text-gray-500 dark:text-gray-400'
                                              : 'text-gray-700 dark:text-gray-300'
                                          }
                                        >
                                          {set.reps} reps{' '}
                                          {set.weight !== undefined &&
                                          set.weight !== null
                                            ? set.weight === 0
                                              ? '@ bodyweight'
                                              : `@ ${set.weight} kgs`
                                            : ''}
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

            {/* Clear Workout Button */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowClearConfirmation(true)}
                className="btn-secondary flex items-center justify-center space-x-2 w-full text-sm"
              >
                <X className="h-4 w-4" />
                <span>Clear Workout</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Ready to start your workout?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start tracking your exercises manually or let AI generate a
            personalized workout plan for you.
          </p>

          <div className="flex gap-2 justify-center flex-col sm:flex-row">
            <button
              onClick={startWorkout}
              className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Play className="h-4 w-4" />
              <span>Start Workout</span>
            </button>
            <button
              onClick={() => setShowPlanForm(true)}
              className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Brain className="h-4 w-4" />
              <span>Generate AI Plan</span>
            </button>
          </div>

          {/* Load Saved Workout Section */}
          {savedWorkouts.length > 0 && (
            <div className="mt-8 max-w-md mx-auto">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                  Or load a previous workout
                </label>
                <select
                  onChange={(e) => loadSavedWorkout(e.target.value)}
                  className="input-field"
                  defaultValue=""
                >
                  <option value="">Select a saved workout...</option>
                  {savedWorkouts
                    .filter((w) => w.completed)
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((workout) => (
                      <option key={workout.id} value={workout.id}>
                        {workout.name} -{' '}
                        {new Date(workout.date).toLocaleDateString('en-GB')}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-left">
                  Load exercises from a previous workout
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Workout Plan Form Modal */}
      {showPlanForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50"
          style={{ margin: '-2rem -1rem' }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center space-x-2">
                <Wand2 className="h-5 w-5 text-primary-600 dark:text-primary-500" />
                <span>Generate AI Workout Plan</span>
              </h2>
              <button
                onClick={() => setShowPlanForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitPlan(generateWorkoutPlan)}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {planErrors.fitnessLevel.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {planErrors.workoutType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {planErrors.goals.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Separate multiple goals with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {planErrors.availableTime.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available Equipment
                </label>
                <input
                  {...registerPlan('equipment')}
                  className="input-field"
                  placeholder="e.g., barbell, dumbbells, resistance bands, bodyweight"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Create Custom Exercise
              </h2>
              <button
                onClick={() => setShowCustomExerciseForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Strength/Weights
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Cardio
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Track distance and time
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Category Selection - Show only for strength exercises */}
              {customExerciseType === 'strength' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <option value="upper-body">Upper Body</option>
                    <option value="lower-body">Lower Body</option>
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

      {/* Clear Workout Confirmation Modal */}
      {showClearConfirmation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50"
          style={{ margin: '-2rem -1rem' }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md m-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Clear Workout
                </h3>
              </div>
              <button
                onClick={cancelClearWorkout}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to clear this workout? All unsaved
                progress will be lost.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelClearWorkout}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearWorkout}
                className="px-4 py-2 text-white bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 rounded-md transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutTracker
