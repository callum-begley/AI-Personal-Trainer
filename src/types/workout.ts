export interface Exercise {
  id: string
  name: string
  category: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio'
  muscleGroups: string[]
  equipment?: string
  instructions?: string
}

export interface WorkoutSet {
  id: string
  exerciseId: string
  reps: number
  weight?: number
  duration?: number // for cardio exercises in seconds
  distance?: number // for cardio exercises in km or miles
  restTime?: number // in seconds
  completed: boolean
  isCardio?: boolean // flag to identify cardio exercises
}

export interface Workout {
  id: string
  date: Date
  name: string
  exercises: Exercise[]
  sets: WorkoutSet[]
  duration?: number // total workout duration in minutes
  notes?: string
  completed: boolean
}

export interface WorkoutProgress {
  exerciseId: string
  exerciseName: string
  previousBest: {
    weight?: number
    reps: number
    distance?: number // for cardio exercises in km
    duration?: number // for cardio exercises in seconds
    date: Date
  }
  currentSession: {
    weight?: number
    reps: number
    distance?: number // for cardio exercises in km
    duration?: number // for cardio exercises in seconds
  }
  improvement?: {
    type: 'weight' | 'reps' | 'both' | 'distance' | 'duration'
    percentage: number
  }
}

export interface AIRecommendation {
  type: 'progression' | 'exercise' | 'rest' | 'technique'
  exerciseId?: string
  exerciseName?: string
  title: string
  description: string
  reasoning: string
  confidence: number // 0-1
  priority: 'low' | 'medium' | 'high'
}

export interface User {
  id: string
  name: string
  email: string
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  preferences: {
    workoutDuration: number // preferred workout duration in minutes
    workoutFrequency: number // times per week
    equipment: string[]
  }
}
