import axios from 'axios'
import {
  AIRecommendation,
  WorkoutProgress,
  Exercise,
  Workout,
} from '../types/workout'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

export class AITrainerService {
  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    try {
      const response = await axios.post<GeminiResponse>(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      return (
        response.data.candidates[0]?.content?.parts[0]?.text ||
        'No response generated'
      )
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      throw new Error('Failed to get AI recommendations')
    }
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
            "title": "Increase weight by 5lbs",
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
    goals: string[],
    availableTime: number,
    equipment: string[]
  ): Promise<Workout> {
    const prompt = `
      Create a complete workout plan for today's session.

      User Profile:
      - Fitness Level: ${fitnessLevel}
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

      Create a balanced workout targeting multiple muscle groups with appropriate sets, reps, and rest periods.
    `

    let rawResponse = ''
    try {
      const response = await this.callGeminiAPI(prompt)
      rawResponse = response

      // Clean up the response by removing markdown code blocks and extra text
      let cleanResponse = response.trim()

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

      // Try to extract JSON if there's extra text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanResponse = jsonMatch[0]
      }

      // Additional cleaning for common JSON issues
      cleanResponse = cleanResponse
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Add quotes to unquoted keys
        .trim()

      console.log(
        'Cleaned AI response for parsing:',
        cleanResponse.substring(0, 500) + '...'
      )

      const parsed = JSON.parse(cleanResponse)

      if (parsed.workout) {
        return {
          ...parsed.workout,
          date: new Date(),
        }
      } else {
        // If the response is the workout object directly
        return {
          ...parsed,
          date: new Date(),
        }
      }
    } catch (error) {
      console.error('Error parsing workout plan:', error)
      console.error('Raw AI response:', rawResponse.substring(0, 1000))

      // Return a sample workout if AI fails
      return {
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
      }
    }
  }
}
