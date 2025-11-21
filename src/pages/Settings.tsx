import React, { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Edit,
  Trash2,
  Plus,
  X,
  Save,
  AlertTriangle,
  Dumbbell,
  Calendar,
  Scale,
  Sun,
  Moon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { storageService } from '../services/storage'
import { Exercise, Workout } from '../types/workout'
import { useDarkMode } from '../contexts/DarkModeContext'

type TabType = 'exercises' | 'workouts' | 'preferences'

const Settings: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [activeTab, setActiveTab] = useState<TabType>('exercises')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'exercise' | 'workout'
    id: string
    name: string
  } | null>(null)

  const [exerciseForm, setExerciseForm] = useState<Exercise>({
    id: '',
    name: '',
    category: 'chest',
    muscleGroups: [],
    equipment: '',
    instructions: '',
  })

  useEffect(() => {
    loadData()
    setWeightUnit(storageService.getWeightUnit())
  }, [])

  const loadData = () => {
    setExercises(storageService.getExercises())
    setWorkouts(storageService.getWorkouts())
  }

  const handleWeightUnitChange = (unit: 'kg' | 'lb') => {
    setWeightUnit(unit)
    storageService.saveWeightUnit(unit)
    toast.success(`Weight unit changed to ${unit.toUpperCase()}`)
  }

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setExerciseForm({ ...exercise })
    setIsAddingExercise(false)
  }

  const handleAddExercise = () => {
    setIsAddingExercise(true)
    setEditingExercise(null)
    setExerciseForm({
      id: `custom-${Date.now()}`,
      name: '',
      category: 'chest',
      muscleGroups: [],
      equipment: '',
      instructions: '',
    })
  }

  const handleSaveExercise = () => {
    if (!exerciseForm.name.trim()) {
      toast.error('Exercise name is required')
      return
    }

    if (exerciseForm.muscleGroups.length === 0) {
      toast.error('At least one muscle group is required')
      return
    }

    storageService.saveExercise(exerciseForm)
    toast.success(
      isAddingExercise
        ? 'Exercise added successfully'
        : 'Exercise updated successfully'
    )
    setEditingExercise(null)
    setIsAddingExercise(false)
    loadData()
  }

  const handleCancelEdit = () => {
    setEditingExercise(null)
    setIsAddingExercise(false)
  }

  const handleDeleteExercise = (id: string) => {
    const exercise = exercises.find((e) => e.id === id)
    if (exercise) {
      setDeleteConfirmation({ type: 'exercise', id, name: exercise.name })
    }
  }

  const handleDeleteWorkout = (id: string) => {
    const workout = workouts.find((w) => w.id === id)
    if (workout) {
      setDeleteConfirmation({ type: 'workout', id, name: workout.name })
    }
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return

    if (deleteConfirmation.type === 'exercise') {
      const updatedExercises = exercises.filter(
        (e) => e.id !== deleteConfirmation.id
      )
      localStorage.setItem(
        'ai-trainer-exercises',
        JSON.stringify(updatedExercises)
      )
      setExercises(updatedExercises)
      toast.success('Exercise deleted successfully')
    } else {
      storageService.deleteWorkout(deleteConfirmation.id)
      loadData()
      toast.success('Workout deleted successfully')
    }

    setDeleteConfirmation(null)
  }

  const handleMuscleGroupChange = (muscleGroup: string) => {
    const currentGroups = exerciseForm.muscleGroups
    if (currentGroups.includes(muscleGroup)) {
      setExerciseForm({
        ...exerciseForm,
        muscleGroups: currentGroups.filter((m) => m !== muscleGroup),
      })
    } else {
      setExerciseForm({
        ...exerciseForm,
        muscleGroups: [...currentGroups, muscleGroup],
      })
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const muscleGroupOptions = [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'quadriceps',
    'hamstrings',
    'glutes',
    'calves',
    'core',
    'abs',
    'obliques',
    'forearms',
    'traps',
    'lats',
    'lower back',
    'cardiovascular',
    'full body',
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="h-8 w-8 text-primary-600 dark:text-primary-500" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Settings
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('exercises')}
          className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'exercises'
              ? 'border-b-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Exercises</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('workouts')}
          className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'workouts'
              ? 'border-b-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Workouts</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-3 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'border-b-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Preferences</span>
          </div>
        </button>
      </div>

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400">
              Manage your exercise library. Add custom exercises or edit
              existing ones.
            </p>
            <button
              onClick={handleAddExercise}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Exercise</span>
            </button>
          </div>

          {/* Exercise Form (Add Only) */}
          {isAddingExercise && (
            <div className="card border-2 border-primary-500 dark:border-primary-600">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Add New Exercise
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exercise Name *
                  </label>
                  <input
                    type="text"
                    value={exerciseForm.name}
                    onChange={(e) =>
                      setExerciseForm({ ...exerciseForm, name: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., Barbell Curl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={exerciseForm.category}
                    onChange={(e) =>
                      setExerciseForm({
                        ...exerciseForm,
                        category: e.target.value as Exercise['category'],
                      })
                    }
                    className="input-field"
                  >
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Muscle Groups * (select at least one)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {muscleGroupOptions.map((muscle) => (
                      <label
                        key={muscle}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={exerciseForm.muscleGroups.includes(muscle)}
                          onChange={() => handleMuscleGroupChange(muscle)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {muscle}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Equipment
                  </label>
                  <input
                    type="text"
                    value={exerciseForm.equipment || ''}
                    onChange={(e) =>
                      setExerciseForm({
                        ...exerciseForm,
                        equipment: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="e.g., Barbell, Dumbbells, Bodyweight"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={exerciseForm.instructions || ''}
                    onChange={(e) =>
                      setExerciseForm({
                        ...exerciseForm,
                        instructions: e.target.value,
                      })
                    }
                    className="input-field min-h-24"
                    placeholder="Brief instructions on how to perform this exercise"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                  <button onClick={handleCancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveExercise}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="h-5 w-5" />
                    <span>Save Exercise</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exercise List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((exercise) => (
                <div
                  key={exercise.id}
                  className={`card transition-shadow ${
                    editingExercise?.id === exercise.id
                      ? 'border-2 border-primary-500 dark:border-primary-600'
                      : 'hover:shadow-lg'
                  }`}
                >
                  {editingExercise?.id === exercise.id ? (
                    // Edit form inline
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          Edit Exercise
                        </h3>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Exercise Name *
                        </label>
                        <input
                          type="text"
                          value={exerciseForm.name}
                          onChange={(e) =>
                            setExerciseForm({
                              ...exerciseForm,
                              name: e.target.value,
                            })
                          }
                          className="input-field"
                          placeholder="e.g., Barbell Curl"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category *
                        </label>
                        <select
                          value={exerciseForm.category}
                          onChange={(e) =>
                            setExerciseForm({
                              ...exerciseForm,
                              category: e.target.value as Exercise['category'],
                            })
                          }
                          className="input-field"
                        >
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Muscle Groups * (select at least one)
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {muscleGroupOptions.map((muscle) => (
                            <label
                              key={muscle}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={exerciseForm.muscleGroups.includes(
                                  muscle
                                )}
                                onChange={() => handleMuscleGroupChange(muscle)}
                                className="rounded text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                {muscle}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Equipment
                        </label>
                        <input
                          type="text"
                          value={exerciseForm.equipment || ''}
                          onChange={(e) =>
                            setExerciseForm({
                              ...exerciseForm,
                              equipment: e.target.value,
                            })
                          }
                          className="input-field"
                          placeholder="e.g., Barbell, Dumbbells, Bodyweight"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Instructions
                        </label>
                        <textarea
                          value={exerciseForm.instructions || ''}
                          onChange={(e) =>
                            setExerciseForm({
                              ...exerciseForm,
                              instructions: e.target.value,
                            })
                          }
                          className="input-field min-h-20"
                          placeholder="Brief instructions on how to perform this exercise"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                        <button
                          onClick={handleCancelEdit}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveExercise}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Save className="h-5 w-5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {exercise.name}
                        </h3>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditExercise(exercise)}
                          className="text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 p-1"
                          title="Edit exercise"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                          title="Delete exercise"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Workouts Tab */}
      {activeTab === 'workouts' && (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your saved workouts. Delete workouts you no longer
            need.
          </p>

          {workouts.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No workouts saved yet. Start a workout to see it here!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((workout) => (
                  <div
                    key={workout.id}
                    className="card hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            {workout.name}
                          </h3>
                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                            title="Delete workout"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {formatDate(workout.date)}
                          {workout.completed && (
                            <span className="ml-2 text-green-600 dark:text-green-500">
                              • Completed
                            </span>
                          )}
                        </p>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Exercises
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {workout.exercises.length}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Sets
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {workout.sets.filter((s) => s.completed).length}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Duration
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {workout.duration
                                ? `${workout.duration}m`
                                : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {workout.exercises.length > 0 && (
                          <div className="border-t dark:border-gray-700 pt-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Exercises:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {workout.exercises.map((exercise) => (
                                <span
                                  key={exercise.id}
                                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                                >
                                  {exercise.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {workout.notes && (
                          <div className="mt-3 border-t dark:border-gray-700 pt-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Notes:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {workout.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Customize your workout preferences and units.
          </p>

          {/* Appearance Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
              Appearance
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your preferred theme for the app.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => isDarkMode && toggleDarkMode()}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    !isDarkMode
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Sun className="h-6 w-6" />
                    <span className="text-lg">Light</span>
                  </div>
                </button>

                <button
                  onClick={() => !isDarkMode && toggleDarkMode()}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Moon className="h-6 w-6" />
                    <span className="text-lg">Dark</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Weight Units */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
              Weight Units
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your preferred unit for weight measurements throughout
                the app and AI recommendations.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => handleWeightUnitChange('kg')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    weightUnit === 'kg'
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg">KG</span>
                    <span className="text-xs opacity-75">Kilograms</span>
                  </div>
                </button>

                <button
                  onClick={() => handleWeightUnitChange('lb')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    weightUnit === 'lb'
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg">LB</span>
                    <span className="text-xs opacity-75">Pounds</span>
                  </div>
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> This setting affects how weights are
                  displayed and what units the AI uses in recommendations and
                  workout plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50"
          style={{ margin: '-2rem -1rem' }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md m-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Delete{' '}
                  {deleteConfirmation.type === 'exercise'
                    ? 'Exercise'
                    : 'Workout'}
                </h3>
              </div>
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete "{deleteConfirmation.name}"?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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

export default Settings
