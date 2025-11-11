import React, { useState, useEffect } from 'react'
import {
  Brain,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { storageService } from '../services/storage'
import { AITrainerService } from '../services/aiTrainer'
import { AIRecommendation, Workout, WorkoutProgress } from '../types/workout'

const AIRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [progress, setProgress] = useState<WorkoutProgress[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const aiTrainer = new AITrainerService()

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'arms', label: 'Arms' },
    { value: 'legs', label: 'Legs' },
    { value: 'core', label: 'Core' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'full-body', label: 'Full Body' },
    { value: 'upper-body', label: 'Upper Body' },
    { value: 'lower-body', label: 'Lower Body' },
  ]

  useEffect(() => {
    const allWorkouts = storageService.getWorkouts()
    const completedWorkouts = allWorkouts.filter((w) => {
      // Handle both boolean and string values for completed
      const isCompleted =
        Boolean(w.completed) && String(w.completed) !== 'false'
      return isCompleted
    })
    const workoutProgress = storageService.getWorkoutProgress()

    setWorkouts(completedWorkouts)
    setProgress(workoutProgress)

    // Load saved recommendations from localStorage
    const savedRecommendations = storageService.getAIRecommendations()
    if (savedRecommendations) {
      setRecommendations(savedRecommendations)
      // Get timestamp from localStorage
      const stored = localStorage.getItem('ai-trainer-ai-recommendations')
      if (stored) {
        const parsed = JSON.parse(stored)
        setLastUpdated(parsed.timestamp)
      }
    }
  }, [])

  const loadRecommendations = async (
    workoutData?: Workout[],
    progressData?: WorkoutProgress[]
  ) => {
    const workoutsToUse = workoutData || workouts
    const progressToUse = progressData || progress

    if (workoutsToUse.length === 0) {
      toast.error('Complete some workouts first to get AI recommendations')
      return
    }

    setLoading(true)
    try {
      const recs = await aiTrainer.getProgressionRecommendations(
        workoutsToUse,
        progressToUse,
        selectedCategory
      )
      setRecommendations(recs)
      storageService.saveAIRecommendations(recs)
      setLastUpdated(new Date().toISOString())
      toast.success('AI recommendations loaded!')
    } catch (error) {
      console.error('Error loading recommendations:', error)
      toast.error(
        'Failed to load AI recommendations. Please check your API configuration.'
      )

      // Provide category-specific mock recommendations for demo purposes
      const getMockRecommendations = (): AIRecommendation[] => {
        const baseRecs: { [key: string]: AIRecommendation[] } = {
          all: [
            {
              type: 'progression',
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              title: 'Increase Weight',
              description:
                "You've been consistent with your current weight. Time to increase by 2-5 kgs.",
              reasoning:
                "You've completed all sets with proper form for the last 3 sessions.",
              confidence: 0.85,
              priority: 'high',
            },
            {
              type: 'rest',
              title: 'Recovery Day Needed',
              description:
                "You've trained intensely this week. Consider taking a rest day or doing light cardio.",
              reasoning:
                'Consistent training without adequate rest can lead to overtraining.',
              confidence: 0.9,
              priority: 'high',
            },
          ],
          chest: [
            {
              type: 'progression',
              exerciseId: 'bench-press',
              exerciseName: 'Bench Press',
              title: 'Increase Bench Press Weight',
              description:
                'Your chest strength has improved. Increase weight by 2.5-5 kgs.',
              reasoning:
                'Consistent performance over last 3 chest sessions shows readiness for progression.',
              confidence: 0.88,
              priority: 'high',
            },
            {
              type: 'exercise',
              exerciseId: 'incline-press',
              exerciseName: 'Incline Chest Press',
              title: 'Add Incline Variations',
              description:
                'Include incline presses to target upper chest development.',
              reasoning:
                'Upper chest activation improves overall chest aesthetics and strength.',
              confidence: 0.75,
              priority: 'medium',
            },
          ],
          legs: [
            {
              type: 'progression',
              exerciseId: 'squat',
              exerciseName: 'Squat',
              title: 'Increase Squat Depth',
              description:
                'Focus on achieving full depth squats for better leg development.',
              reasoning:
                'Full range of motion maximizes quadriceps and glute activation.',
              confidence: 0.82,
              priority: 'high',
            },
            {
              type: 'exercise',
              exerciseId: 'lunge',
              exerciseName: 'Walking Lunges',
              title: 'Add Unilateral Training',
              description:
                'Include single-leg exercises to improve balance and strength imbalances.',
              reasoning:
                'Unilateral training addresses muscle imbalances common in bilateral exercises.',
              confidence: 0.78,
              priority: 'medium',
            },
          ],
        }

        return (
          baseRecs[selectedCategory as keyof typeof baseRecs] || baseRecs.all
        )
      }

      const mockRecommendations = getMockRecommendations()
      setRecommendations(mockRecommendations)
      storageService.saveAIRecommendations(mockRecommendations)
      setLastUpdated(new Date().toISOString())
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'progression':
        return <TrendingUp className="h-5 w-5" />
      case 'exercise':
        return <Lightbulb className="h-5 w-5" />
      case 'rest':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Brain className="h-5 w-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'progression':
        return 'Progression'
      case 'exercise':
        return 'Exercise Variation'
      case 'rest':
        return 'Recovery'
      case 'technique':
        return 'Technique'
      default:
        return 'General'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-col">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center sm:text-left">
            AI Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get personalized training advice based on your workout history and
            progress
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-primary-500 mt-1">
              Last updated:{' '}
              {new Date(lastUpdated).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
              {' - '}
              {new Date(lastUpdated).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <div className="flex items-center space-x-2 ring-2 px-3 rounded-lg">
            <label
              htmlFor="category-select"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Focus on:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field text-sm min-w-[150px]"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => loadRecommendations()}
            disabled={loading || workouts.length === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Loading...' : 'Get AI Recommendations'}</span>
          </button>
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="card text-center py-12">
          <Brain className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            No Workout Data Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete some workouts first to get personalized AI recommendations
            based on your performance and progress.
          </p>
          <a href="/workout" className="btn-primary">
            Start Your First Workout
          </a>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 grid-rows-2">
            <button className="select-none z-40 opacity-30 hover:opacity-100 row-span-3">
              <img
                src="public/aila.webp"
                alt="AI Personal Trainer Avatar"
                className="w-72 h-72 object-cover"
              />
            </button>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Workouts
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {workouts.length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary-600 dark:text-primary-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Exercises Tracked
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {progress.length}
                  </p>
                </div>
                <Lightbulb className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Recommendations
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {recommendations.length}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Your Personalized Recommendations
              </h2>

              <div className="grid gap-6">
                {recommendations
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 }
                    return (
                      priorityOrder[b.priority as keyof typeof priorityOrder] -
                      priorityOrder[a.priority as keyof typeof priorityOrder]
                    )
                  })
                  .map((rec, index) => (
                    <div
                      key={index}
                      className="card hover:shadow-lg transition-shadow"
                    >
                      {rec.exerciseName && (
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 border-b">
                          {rec.exerciseName}
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            {getTypeIcon(rec.type)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-primary-500">
                                {rec.title}
                              </h3>
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {getTypeLabel(rec.type)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-col sm:flex-row">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(
                              rec.priority
                            )}`}
                          >
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(rec.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {rec.description}
                      </p>

                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">AI Reasoning:</span>{' '}
                          {rec.reasoning}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="card text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  No Recommendations Yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Click "Get AI Recommendations" to get AI-powered training
                  advice based on your workout history.
                </p>
                <button
                  onClick={() => loadRecommendations()}
                  className="btn-primary"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`inline self-center mr-2 h-4 w-4 ${
                      loading ? 'animate-spin' : ''
                    }`}
                  />
                  Get AI Recommendations
                </button>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

export default AIRecommendations
