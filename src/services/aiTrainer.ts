import {
  AIRecommendation,
  WorkoutProgress,
  Exercise,
  Workout,
} from '../types/workout'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export class AITrainerService {
  private sanitizeWorkoutData(workout: any): Workout {
    const toBool = (value: any): boolean => {
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') return value.toLowerCase() === 'true'
      if (typeof value === 'number') return value !== 0
      return false // Default to false for all other cases
    }

    return {
      ...workout,
      completed: toBool(workout.completed),
      sets:
        workout.sets?.map((set: any) => ({
          ...set,
          completed: toBool(set.completed),
        })) || [],
      date:
        workout.date instanceof Date
          ? workout.date
          : new Date(workout.date || Date.now()),
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      )

      const data = await response.json()

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text
      } else {
        throw new Error('No valid response from AI')
      }
    } catch (error) {
      console.error('Error in callGeminiAPI:', error)
      throw error
    }

    throw new Error('No valid response received from AI')
  }

  async getProgressionRecommendations(
    workoutHistory: Workout[],
    currentProgress: WorkoutProgress[]
  ): Promise<AIRecommendation[]> {
    const prompt = `
      As an AI personal trainer, analyze the following workout history and current progress data to provide specific recommendations for the next workout session.

      Workout History (last 5 sessions):
      ${JSON.stringify(workoutHistory.slice(-5), null, 2)}

      Current Progress:
      ${JSON.stringify(currentProgress, null, 2)}

      Please provide recommendations in the following JSON format:
      {
        "recommendations": [
          {
            "type": "progression",
            "exerciseId": "exercise_id",
            "exerciseName": "Exercise Name",
            "title": "Increase weight by 2-3 kgs",
            "description": "Based on your consistent performance, you're ready to increase the weight.",
            "reasoning": "You've completed all sets with proper form for the last 2 sessions.",
            "confidence": 0.85,
            "priority": "high"
          }
        ]
      }

      Focus on:
      1. Weight/rep progressions based on performance trends
      2. Exercise variations to prevent plateaus
      3. Recovery recommendations if overtraining is detected
      4. Form corrections if inconsistent performance is observed

      Important: Always use KILOGRAMS (kgs) for weight measurements, never pounds (lbs).
      
      Provide 3-5 specific, actionable recommendations.
    `

    try {
      const response = await this.callGeminiAPI(prompt)

      // Clean up the response by removing markdown code blocks
      let cleanResponse = response.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse
          .replace(/^```json\n/, '')
          .replace(/\n```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse
          .replace(/^```\n/, '')
          .replace(/\n```$/, '')
      }

      const parsed = JSON.parse(cleanResponse)
      return parsed.recommendations || []
    } catch (error) {
      console.error('Error parsing AI recommendations:', error)
      return []
    }
  }

  async getExerciseRecommendations(
    currentExercises: Exercise[],
    userGoals: string[],
    fitnessLevel: string
  ): Promise<Exercise[]> {
    const prompt = `
      As an AI personal trainer, suggest new exercises to add variety to the current workout routine.

      Current Exercises:
      ${JSON.stringify(currentExercises, null, 2)}

      User Goals: ${userGoals.join(', ')}
      Fitness Level: ${fitnessLevel}

      Please suggest 5-8 new exercises in the following JSON format:
      {
        "exercises": [
          {
            "id": "unique_id",
            "name": "Exercise Name",
            "category": "chest|back|shoulders|arms|legs|core|cardio",
            "muscleGroups": ["muscle1", "muscle2"],
            "equipment": "equipment_needed",
            "instructions": "Brief instructions for proper form"
          }
        ]
      }

      Focus on:
      1. Complementing existing exercises
      2. Targeting underworked muscle groups
      3. Progressive difficulty appropriate for fitness level
      4. Variety in movement patterns

      Important: Always use KILOGRAMS (kgs) for weight measurements, never pounds (lbs).
    `

    try {
      const response = await this.callGeminiAPI(prompt)

      // Clean up the response by removing markdown code blocks
      let cleanResponse = response.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse
          .replace(/^```json\n/, '')
          .replace(/\n```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse
          .replace(/^```\n/, '')
          .replace(/\n```$/, '')
      }

      const parsed = JSON.parse(cleanResponse)
      return parsed.exercises || []
    } catch (error) {
      console.error('Error parsing exercise recommendations:', error)
      return []
    }
  }

  async getWorkoutPlan(
    fitnessLevel: string,
    workoutType: string,
    goals: string[],
    availableTime: number,
    equipment: string[]
  ): Promise<Workout> {
    const prompt = `
      Create a complete workout plan for today's session.

      User Profile:
      - Fitness Level: ${fitnessLevel}
      - Workout Type/Focus: ${workoutType}
      - Goals: ${goals.join(', ')}
      - Available Time: ${availableTime} minutes
      - Available Equipment: ${equipment.join(', ')}

      Please provide a workout plan in the following JSON format:
      {
        "workout": {
          "id": "workout_id",
          "name": "Workout Name",
          "exercises": [
            {
              "id": "exercise_id",
              "name": "Exercise Name",
              "category": "muscle_group",
              "muscleGroups": ["muscle1", "muscle2"],
              "equipment": "equipment_needed",
              "instructions": "Form instructions"
            }
          ],
          "sets": [
            {
              "id": "set_id",
              "exerciseId": "exercise_id",
              "reps": 12,
              "weight": 50,
              "restTime": 60,
              "completed": false
            }
          ],
          "duration": ${availableTime},
          "notes": "Any additional notes",
          "completed": false
        }
      }

      IMPORTANT: The "category" field for each exercise MUST be one of these exact values ONLY:
      - "chest"
      - "back"
      - "shoulders"
      - "arms"
      - "legs"
      - "core"
      - "cardio"
      - "full-body"
      - "upper-body"
      - "lower-body"
      
      Do NOT use any other category names. Match the workout type to the appropriate category from the list above.

      Create a workout specifically focused on "${workoutType}". 
      
      Workout Type Guidelines:
      - full-body: Include exercises for all major muscle groups
      - upper-body: Focus on chest, back, shoulders, and arms
      - lower-body: Focus on legs, glutes, and calves
      - chest: Primarily chest exercises with supporting muscles
      - back: Primarily back exercises with supporting muscles
      - shoulders: Focus on all three deltoid heads
      - arms: Focus on biceps, triceps, and forearms
      - legs: Focus on quadriceps, hamstrings, glutes, and calves
      - core: Focus on abs, obliques, and lower back
      - cardio: Include high-intensity cardio exercises
      - strength: Focus on compound movements with heavier weights/lower reps
      - endurance: Focus on higher reps and circuit-style training
      
      Important: Always use KILOGRAMS (kgs) for weight measurements, never pounds (lbs).
      
      Ensure appropriate sets, reps, and rest periods for the chosen workout type and fitness level.
    `

    let rawResponse = ''
    let cleanResponse = ''
    try {
      const response = await this.callGeminiAPI(prompt)
      rawResponse = response

      // Clean up the response by removing markdown code blocks and extra text
      cleanResponse = response.trim()

      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse
          .replace(/^```json\n/, '')
          .replace(/\n```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse
          .replace(/^```\n/, '')
          .replace(/\n```$/, '')
      }

      // Try to extract JSON if there's extra text - look for the outermost braces
      let jsonStart = cleanResponse.indexOf('{')
      let jsonEnd = cleanResponse.lastIndexOf('}')

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1)
      }

      // Additional cleaning for common JSON issues
      cleanResponse = cleanResponse
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3') // Add quotes to unquoted keys
        .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ': "$1"$2') // Add quotes to unquoted string values
        .trim()

      const parsed = JSON.parse(cleanResponse)

      if (parsed.workout) {
        return this.sanitizeWorkoutData(parsed.workout)
      } else {
        // If the response is the workout object directly
        return this.sanitizeWorkoutData(parsed)
      }
    } catch (error) {
      console.error('Error parsing workout plan:', error)
      console.error(
        'Raw AI response (first 1000 chars):',
        rawResponse.substring(0, 1000)
      )
      console.error('Full raw AI response:', rawResponse)
      console.error('Cleaned response that failed to parse:', cleanResponse)

      // Return a sample workout if AI fails
      return this.sanitizeWorkoutData({
        id: Date.now().toString(),
        date: new Date(),
        name: 'Sample AI Workout',
        exercises: [
          {
            id: 'push-up-sample',
            name: 'Push-ups',
            category: 'chest',
            muscleGroups: ['chest', 'shoulders', 'triceps'],
            equipment: 'bodyweight',
            instructions:
              'Start in plank position, lower chest to ground, push back up.',
          },
          {
            id: 'squat-sample',
            name: 'Bodyweight Squats',
            category: 'legs',
            muscleGroups: ['quadriceps', 'glutes'],
            equipment: 'bodyweight',
            instructions:
              'Stand with feet shoulder-width apart, lower hips back and down.',
          },
        ],
        sets: [
          {
            id: 'set-1',
            exerciseId: 'push-up-sample',
            reps: 12,
            completed: false,
          },
          {
            id: 'set-2',
            exerciseId: 'push-up-sample',
            reps: 12,
            completed: false,
          },
          {
            id: 'set-3',
            exerciseId: 'squat-sample',
            reps: 15,
            completed: false,
          },
          {
            id: 'set-4',
            exerciseId: 'squat-sample',
            reps: 15,
            completed: false,
          },
        ],
        duration: availableTime,
        completed: false,
      })
    }
  }
}
