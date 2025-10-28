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

  const aiTrainer = new AITrainerService()

  useEffect(() => {
    const allWorkouts = storageService.getWorkouts()
    const completedWorkouts = allWorkouts.filter((w) => {
      // Handle both boolean and string values for completed
      const isCompleted =
        Boolean(w.completed) && String(w.completed) !== 'false'
      return isCompleted
    })
    const workoutProgress = storageService.getWorkoutProgress()

    console.log('All workouts:', allWorkouts.length)
    console.log('Completed workouts:', completedWorkouts.length)
    console.log(
      'Workout completion states:',
      allWorkouts.map((w) => ({
        name: w.name,
        completed: w.completed,
        type: typeof w.completed,
      }))
    )

    setWorkouts(completedWorkouts)
    setProgress(workoutProgress)

    // Auto-load recommendations if we have data
    if (completedWorkouts.length > 0) {
      loadRecommendations(completedWorkouts, workoutProgress)
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
        progressToUse
      )
      setRecommendations(recs)
      toast.success('AI recommendations loaded!')
    } catch (error) {
      console.error('Error loading recommendations:', error)
      toast.error(
        'Failed to load AI recommendations. Please check your API configuration.'
      )

      // Provide some mock recommendations for demo purposes
      setRecommendations([
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
          type: 'exercise',
          title: 'Add Incline Variations',
          description:
            'Consider adding incline bench press to target your upper chest more effectively.',
          reasoning:
            'Your chest development could benefit from hitting different angles.',
          confidence: 0.75,
          priority: 'medium',
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
      ])
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
          <h1 className="text-3xl font-bold text-gray-800">
            AI Recommendations
          </h1>
          <p className="text-gray-600 mt-2">
            Get personalized training advice based on your workout history and
            progress
          </p>
        </div>
        <button
          onClick={() => loadRecommendations()}
          disabled={loading || workouts.length === 0}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Loading...' : 'Refresh Recommendations'}</span>
        </button>
      </div>

      {workouts.length === 0 ? (
        <div className="card text-center py-12">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            No Workout Data Available
          </h2>
          <p className="text-gray-600 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Workouts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {workouts.length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Exercises Tracked
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {progress.length}
                  </p>
                </div>
                <Lightbulb className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Recommendations
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recommendations.length}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">
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
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                            {getTypeIcon(rec.type)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {rec.title}
                              </h3>
                              {rec.exerciseName && (
                                <span className="text-sm text-gray-500">
                                  • {rec.exerciseName}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                              {getTypeLabel(rec.type)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(
                              rec.priority
                            )}`}
                          >
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(rec.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3">{rec.description}</p>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">
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
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  No Recommendations Yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Click "Refresh Recommendations" to get AI-powered training
                  advice based on your workout history.
                </p>
                <button
                  onClick={() => loadRecommendations()}
                  className="btn-primary"
                  disabled={loading}
                >
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
