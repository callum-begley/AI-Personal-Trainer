import React, { createContext, useContext, useState, useEffect } from 'react'
import { Workout } from '../types/workout'

interface WorkoutContextType {
  currentWorkout: Workout | null
  setCurrentWorkout: (workout: Workout | null) => void
  isWorkoutActive: boolean
  setIsWorkoutActive: (active: boolean) => void
  timer: number
  setTimer: (time: number) => void
  startTime: number | null
  setStartTime: (time: number | null) => void
  pausedTime: number
  setPausedTime: (time: number) => void
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

export const useWorkout = () => {
  const context = useContext(WorkoutContext)
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider')
  }
  return context
}

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Load from localStorage on mount
  const [currentWorkout, setCurrentWorkoutState] = useState<Workout | null>(
    () => {
      const saved = localStorage.getItem('ai-trainer-current-workout')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...parsed,
          date: new Date(parsed.date),
        }
      }
      return null
    }
  )

  const [isWorkoutActive, setIsWorkoutActive] = useState(() => {
    const saved = localStorage.getItem('ai-trainer-workout-active')
    return saved === 'true'
  })

  const [timer, setTimer] = useState(() => {
    const saved = localStorage.getItem('ai-trainer-timer')
    return saved ? parseInt(saved, 10) : 0
  })

  const [startTime, setStartTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('ai-trainer-start-time')
    return saved ? parseInt(saved, 10) : null
  })

  const [pausedTime, setPausedTime] = useState(() => {
    const saved = localStorage.getItem('ai-trainer-paused-time')
    return saved ? parseInt(saved, 10) : 0
  })

  // Wrapper to save to localStorage when currentWorkout changes
  const setCurrentWorkout = (workout: Workout | null) => {
    setCurrentWorkoutState(workout)
    if (workout) {
      localStorage.setItem(
        'ai-trainer-current-workout',
        JSON.stringify(workout)
      )
    } else {
      localStorage.removeItem('ai-trainer-current-workout')
    }
  }

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      'ai-trainer-workout-active',
      isWorkoutActive.toString()
    )
  }, [isWorkoutActive])

  useEffect(() => {
    localStorage.setItem('ai-trainer-timer', timer.toString())
  }, [timer])

  useEffect(() => {
    if (startTime !== null) {
      localStorage.setItem('ai-trainer-start-time', startTime.toString())
    } else {
      localStorage.removeItem('ai-trainer-start-time')
    }
  }, [startTime])

  useEffect(() => {
    localStorage.setItem('ai-trainer-paused-time', pausedTime.toString())
  }, [pausedTime])

  // Update timer when workout is active
  useEffect(() => {
    if (isWorkoutActive && startTime !== null) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000) + pausedTime
        setTimer(elapsed)
      }, 100) // Update every 100ms for accuracy

      return () => clearInterval(interval)
    }
  }, [isWorkoutActive, startTime, pausedTime])

  return (
    <WorkoutContext.Provider
      value={{
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
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}
