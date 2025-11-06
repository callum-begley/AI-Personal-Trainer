import { Workout, Exercise, WorkoutProgress, User } from '../types/workout'

class StorageService {
  private getStorageKey(key: string): string {
    return `ai-trainer-${key}`
  }

  // Workouts
  getWorkouts(): Workout[] {
    const workouts = localStorage.getItem(this.getStorageKey('workouts'))
    if (!workouts) return []

    return JSON.parse(workouts).map((workout: any) => ({
      ...workout,
      date: new Date(workout.date),
    }))
  }

  saveWorkout(workout: Workout): void {
    const workouts = this.getWorkouts()
    const existingIndex = workouts.findIndex((w) => w.id === workout.id)

    if (existingIndex >= 0) {
      workouts[existingIndex] = workout
    } else {
      workouts.push(workout)
    }

    localStorage.setItem(
      this.getStorageKey('workouts'),
      JSON.stringify(workouts)
    )
  }

  deleteWorkout(workoutId: string): void {
    const workouts = this.getWorkouts().filter((w) => w.id !== workoutId)
    localStorage.setItem(
      this.getStorageKey('workouts'),
      JSON.stringify(workouts)
    )
  }

  // Exercises
  getExercises(): Exercise[] {
    const exercises = localStorage.getItem(this.getStorageKey('exercises'))
    if (exercises) {
      const parsed = JSON.parse(exercises)
      // Check if we need to add new default exercises
      const defaults = this.getDefaultExercises(false) // Don't save to localStorage
      const existingIds = new Set(parsed.map((e: Exercise) => e.id))
      const newExercises = defaults.filter((d) => !existingIds.has(d.id))

      if (newExercises.length > 0) {
        const updated = [...parsed, ...newExercises]
        localStorage.setItem(
          this.getStorageKey('exercises'),
          JSON.stringify(updated)
        )
        return updated
      }
      return parsed
    }
    // First time - save defaults to localStorage
    const defaults = this.getDefaultExercises(true)
    return defaults
  }

  saveExercise(exercise: Exercise): void {
    const exercises = this.getExercises()
    const existingIndex = exercises.findIndex((e) => e.id === exercise.id)

    if (existingIndex >= 0) {
      exercises[existingIndex] = exercise
    } else {
      exercises.push(exercise)
    }

    localStorage.setItem(
      this.getStorageKey('exercises'),
      JSON.stringify(exercises)
    )
  }

  // User Profile
  getUser(): User | null {
    const user = localStorage.getItem(this.getStorageKey('user'))
    return user ? JSON.parse(user) : null
  }

  saveUser(user: User): void {
    localStorage.setItem(this.getStorageKey('user'), JSON.stringify(user))
  }

  // Progress calculations
  getWorkoutProgress(): WorkoutProgress[] {
    const workouts = this.getWorkouts().filter((w) => w.completed)
    const exercises = this.getExercises()
    const progressMap = new Map<string, WorkoutProgress>()

    workouts.forEach((workout) => {
      workout.sets.forEach((set) => {
        if (!set.completed) return

        const exercise = exercises.find((e) => e.id === set.exerciseId)
        if (!exercise) return

        const key = set.exerciseId
        const existing = progressMap.get(key)
        const isCardio = exercise.category === 'cardio'

        if (!existing) {
          progressMap.set(key, {
            exerciseId: set.exerciseId,
            exerciseName: exercise.name,
            previousBest: {
              weight: set.weight,
              reps: set.reps,
              distance: set.distance,
              duration: set.duration,
              date: workout.date,
            },
            currentSession: {
              weight: set.weight,
              reps: set.reps,
              distance: set.distance,
              duration: set.duration,
            },
          })
        } else {
          // Update current session if this workout is more recent
          if (workout.date >= existing.previousBest.date) {
            existing.currentSession = {
              weight: set.weight,
              reps: set.reps,
              distance: set.distance,
              duration: set.duration,
            }
          }

          // Update if this is a better performance
          let isBetter = false

          if (isCardio) {
            // For cardio, better = longer distance or faster time
            if (set.distance && existing.previousBest.distance) {
              isBetter = set.distance > existing.previousBest.distance
            } else if (set.duration && existing.previousBest.duration) {
              isBetter = set.duration > existing.previousBest.duration
            }
          } else {
            // For strength exercises
            isBetter =
              (set.weight || 0) > (existing.previousBest.weight || 0) ||
              ((set.weight || 0) === (existing.previousBest.weight || 0) &&
                set.reps > existing.previousBest.reps)
          }

          if (isBetter && workout.date > existing.previousBest.date) {
            existing.previousBest = {
              weight: set.weight,
              reps: set.reps,
              distance: set.distance,
              duration: set.duration,
              date: workout.date,
            }
          }
        }
      })
    })

    return Array.from(progressMap.values())
  }

  private getDefaultExercises(saveToStorage: boolean = false): Exercise[] {
    const defaultExercises: Exercise[] = [
      {
        id: 'bench-press',
        name: 'Bench Press',
        category: 'chest',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        equipment: 'barbell',
        instructions:
          'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up.',
      },
      {
        id: 'squat',
        name: 'Back Squat',
        category: 'legs',
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
        equipment: 'barbell',
        instructions:
          'Stand with feet shoulder-width apart, lower hips back and down, drive through heels to stand.',
      },
      {
        id: 'deadlift',
        name: 'Deadlift',
        category: 'back',
        muscleGroups: ['hamstrings', 'glutes', 'lower back', 'traps'],
        equipment: 'barbell',
        instructions:
          'Stand with feet hip-width, grip bar, lift by extending hips and knees simultaneously.',
      },
      {
        id: 'pull-up',
        name: 'Pull-up',
        category: 'back',
        muscleGroups: ['latissimus dorsi', 'biceps', 'rear delts'],
        equipment: 'pull-up bar',
        instructions:
          'Hang from bar with overhand grip, pull body up until chin clears bar.',
      },
      {
        id: 'overhead-press',
        name: 'Overhead Press',
        category: 'shoulders',
        muscleGroups: ['shoulders', 'triceps', 'core'],
        equipment: 'barbell',
        instructions:
          'Stand with feet hip-width, press bar from shoulders straight overhead.',
      },
      {
        id: 'push-up',
        name: 'Push-up',
        category: 'chest',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        equipment: 'bodyweight',
        instructions:
          'Start in plank position, lower chest to ground, push back up.',
      },
      {
        id: 'running',
        name: 'Running',
        category: 'cardio',
        muscleGroups: ['legs', 'cardiovascular'],
        equipment: 'none',
        instructions: 'Run at a steady pace. Track your distance and time.',
      },
      {
        id: 'cycling',
        name: 'Cycling',
        category: 'cardio',
        muscleGroups: ['legs', 'cardiovascular'],
        equipment: 'bike',
        instructions:
          'Cycle at a comfortable pace. Track your distance and time.',
      },
      {
        id: 'swimming',
        name: 'Swimming',
        category: 'cardio',
        muscleGroups: ['full body', 'cardiovascular'],
        equipment: 'pool',
        instructions:
          'Swim laps at a comfortable pace. Track your distance and time.',
      },
    ]

    // Only save to localStorage when explicitly requested (first load)
    if (saveToStorage) {
      localStorage.setItem(
        this.getStorageKey('exercises'),
        JSON.stringify(defaultExercises)
      )
    }

    return defaultExercises
  }

  // Clear all data
  clearAllData(): void {
    const keys = ['workouts', 'exercises', 'user']
    keys.forEach((key) => {
      localStorage.removeItem(this.getStorageKey(key))
    })
  }
}

export const storageService = new StorageService()
