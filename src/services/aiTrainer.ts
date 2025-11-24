import {
  AIRecommendation,
  WorkoutProgress,
  Exercise,
  Workout,
} from '../types/workout'
import { storageService } from './storage'
import appContextData from '../data/appContext.json'

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

  private async callGeminiAPI(
    prompt: string,
    useGrounding: boolean = false,
    conversationHistory: Array<{
      role: string
      parts: Array<{ text: string }>
    }> = []
  ): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    try {
      // Build contents array with history + new prompt
      const contents = [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ]

      const requestBody: any = {
        contents: contents,
      }

      // Add Google Search grounding if requested
      if (useGrounding) {
        requestBody.tools = [
          {
            googleSearch: {},
          },
        ]
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      const data = await response.json()

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const candidate = data.candidates[0]

        // Extract text from all parts (sometimes grounding creates multiple parts)
        const textParts = candidate.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('\n')

        return textParts
      } else {
        throw new Error('No valid response from AI')
      }
    } catch (error) {
      console.error('Error in callGeminiAPI:', error)
      throw error
    }
  }

  async getProgressionRecommendations(
    workoutHistory: Workout[],
    currentProgress: WorkoutProgress[],
    focusCategory: string = 'all'
  ): Promise<AIRecommendation[]> {
    const weightUnit = storageService.getWeightUnit()
    const weightUnitName = weightUnit === 'kg' ? 'kilograms' : 'pounds'

    const categoryFocus =
      focusCategory === 'all'
        ? ''
        : `
      CATEGORY FOCUS: Generate recommendations specifically for "${focusCategory}" exercises only.
      - Only analyze and provide recommendations for exercises in the ${focusCategory} category
      - If no ${focusCategory} exercises are found in workout history, suggest new ${focusCategory} exercises to add
      - Focus on progression, variations, and improvements specific to ${focusCategory} training
    `

    const prompt = `
      As an AI personal trainer, analyze the following workout history and current progress data to provide specific recommendations for the next workout session.

      ${categoryFocus}

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
      ${
        focusCategory !== 'all'
          ? `5. Specific improvements for ${focusCategory} training`
          : ''
      }

      Important: Always use ${weightUnitName.toUpperCase()} (${weightUnit}) for weight measurements.
      
      Provide 3-5 specific, actionable recommendations${
        focusCategory !== 'all' ? ` focused on ${focusCategory} exercises` : ''
      }.
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
    const weightUnit = storageService.getWeightUnit()
    const weightUnitName = weightUnit === 'kg' ? 'kilograms' : 'pounds'

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

      Important: Always use ${weightUnitName.toUpperCase()} (${weightUnit}) for weight measurements.
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
    const weightUnit = storageService.getWeightUnit()
    const weightUnitName = weightUnit === 'kg' ? 'kilograms' : 'pounds'

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

      CRITICAL RULES:
      1. Exercise "category" MUST be one of: chest, back, shoulders, arms, legs, core, cardio, full-body, upper-body, lower-body
      
      2. Match workout type "${workoutType}" EXACTLY - THIS IS CRITICAL:
         ${
           workoutType === 'Shoulders'
             ? '- SHOULDERS ONLY: Include ONLY shoulder exercises (overhead press, lateral raises, front raises, rear delt flyes, shoulder press variations, Arnold press, upright rows, face pulls). DO NOT include chest exercises (bench press, push-ups, flyes), back exercises (rows, pull-ups, deadlifts), or arm exercises (curls, tricep extensions).'
             : workoutType === 'Chest'
             ? '- CHEST ONLY: Include ONLY chest exercises (bench press, push-ups, chest flyes, cable crossovers). NO back, shoulders, or arm exercises.'
             : workoutType === 'Back'
             ? '- BACK ONLY: Include ONLY back exercises (rows, pull-ups, deadlifts, lat pulldowns). NO chest, shoulders, or arm exercises.'
             : workoutType === 'Arms'
             ? '- ARMS ONLY: Include ONLY arm exercises (bicep curls, tricep extensions, hammer curls, skull crushers). NO chest, back, or shoulder exercises.'
             : workoutType === 'Legs'
             ? '- LEGS ONLY: Include ONLY leg exercises (squats, lunges, leg press, leg curls, calf raises). NO upper body exercises.'
             : workoutType === 'Core/Abs'
             ? '- CORE/ABS ONLY: Include ONLY core/ab exercises (planks, crunches, Russian twists, leg raises, mountain climbers). NO other muscle groups.'
             : workoutType === 'Cardio'
             ? '- CARDIO ONLY: Include ONLY cardio exercises (running, cycling, rowing, jump rope, burpees, high knees). NO strength training.'
             : workoutType === 'Strength Training'
             ? '- STRENGTH TRAINING: Focus on compound movements with progressive overload (squats, deadlifts, bench press, overhead press, rows).'
             : workoutType === 'Endurance'
             ? '- ENDURANCE: Focus on high-rep, lower-weight exercises and cardio intervals for muscular and cardiovascular endurance.'
             : workoutType === 'Upper Body'
             ? '- UPPER-BODY: ONLY chest/back/shoulders/arms exercises. NO legs/glutes.'
             : workoutType === 'Lower Body'
             ? '- LOWER-BODY: ONLY legs/glutes/hamstrings/calves exercises. NO chest/back/shoulders/arms.'
             : workoutType === 'Full Body'
             ? '- FULL-BODY: Mix of upper AND lower body exercises.'
             : `- ${workoutType.toUpperCase()}: Focus ONLY on ${workoutType} exercises.`
         }
      
      3. Always use ${weightUnitName.toUpperCase()} (${weightUnit}) for weights.

      4. Do not add more weight on the last set of an exercise, it should only be the same or lower than previous sets
      
      5. VERIFY: Before finalizing, check that EVERY exercise category matches "${workoutType}". If workout type is "shoulders", ALL exercises must have category="shoulders".
      
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

      let workout = parsed.workout ? parsed.workout : parsed

      // VALIDATION: Filter out exercises that don't match the requested workout type
      if (workout.exercises && Array.isArray(workout.exercises)) {
        const originalCount = workout.exercises.length

        // Normalize the workout type to lowercase with hyphens (matches form values)
        const normalizedType = workoutType
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/\//g, '-')

        // Define which categories are valid for each workout type
        const validCategories: { [key: string]: string[] } = {
          'full-body': ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'],
          'upper-body': ['chest', 'back', 'shoulders', 'arms'],
          'lower-body': ['legs'],
          chest: ['chest'],
          back: ['back'],
          shoulders: ['shoulders'],
          arms: ['arms'],
          legs: ['legs'],
          core: ['core'],
          'core-abs': ['core'],
          cardio: ['cardio'],
          strength: ['chest', 'back', 'shoulders', 'arms', 'legs'], // compound movements
          'strength-training': ['chest', 'back', 'shoulders', 'arms', 'legs'],
          endurance: ['cardio', 'legs', 'core', 'full-body'], // endurance-focused
        }

        const allowedCategories = validCategories[normalizedType] || [
          normalizedType,
        ]

        // Filter exercises to only include those matching the workout type
        workout.exercises = workout.exercises.filter((ex: Exercise) =>
          allowedCategories.includes(ex.category.toLowerCase())
        )

        // Also filter out sets for removed exercises
        if (workout.sets && Array.isArray(workout.sets)) {
          const validExerciseIds = new Set(
            workout.exercises.map((ex: Exercise) => ex.id)
          )
          workout.sets = workout.sets.filter((set: any) =>
            validExerciseIds.has(set.exerciseId)
          )
        }

        console.log(
          `Workout validation: ${workoutType} workout - kept ${workout.exercises.length}/${originalCount} exercises`
        )
      }

      return this.sanitizeWorkoutData(workout)
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

  async getChatResponse(
    userMessage: string,
    workoutHistory: Workout[],
    progress: WorkoutProgress[],
    chatHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    const weightUnit = storageService.getWeightUnit()
    const weightUnitName = weightUnit === 'kg' ? 'kilograms' : 'pounds'

    // Create comprehensive app knowledge context
    const appKnowledge = `
APP KNOWLEDGE BASE - AI PERSONAL TRAINER APP:

DASHBOARD (/):
${appContextData.features.dashboard.features.map((f) => `• ${f}`).join('\n')}

WORKOUT TRACKER (/workout):
How to use: ${appContextData.features.workoutTracker.workflow.join(' → ')}
Features: ${appContextData.features.workoutTracker.features
      .map((f) => `• ${f}`)
      .join('\n')}

PROGRESS (/progress):
${appContextData.features.progress.features.map((f) => `• ${f}`).join('\n')}

AI RECOMMENDATIONS (/recommendations):
${appContextData.features.aiRecommendations.features
  .map((f) => `• ${f}`)
  .join('\n')}

SETTINGS (/settings):
• Exercises Tab: ${appContextData.features.settings.tabs.exercises.features.join(
      '. '
    )}
• Workouts Tab: ${appContextData.features.settings.tabs.workouts.features.join(
      '. '
    )}
• Preferences Tab: ${appContextData.features.settings.tabs.preferences.features.join(
      '. '
    )}

COMMON QUESTIONS & ANSWERS:
${Object.entries(appContextData.commonQuestions)
  .map(([q, a]) => `Q: ${q}\nA: ${a}`)
  .join('\n\n')}

DATA STORAGE: ${appContextData.dataStorage.description}
IMPORTANT: ${appContextData.dataStorage.important}

TIPS FOR USERS:
${appContextData.tips.map((tip) => `• ${tip}`).join('\n')}
`

    // Build conversation history in Gemini format with system context in EVERY turn
    const geminiHistory: Array<{
      role: string
      parts: Array<{ text: string }>
    }> = []

    // Add initial system message
    if (chatHistory.length === 0) {
      geminiHistory.push({
        role: 'user',
        parts: [
          {
            text: `You are AILA, an AI personal trainer assistant. Here's the app context you must remember:

${appKnowledge}

User's Data:
- Recent Workouts: ${JSON.stringify(workoutHistory.slice(-5))}
- Progress: ${JSON.stringify(progress)}
- Weight Preference: ${weightUnitName.toUpperCase()} (${weightUnit})

Instructions:
- Use the APP KNOWLEDGE BASE above to answer app usage questions accurately
- For fitness research/nutrition/supplements, use web search
- Always reference the exact features and workflows from the knowledge base
- Use emojis to be engaging
- Keep responses under 250 words unless asked for detail
- Use ${weightUnitName.toUpperCase()} for weights`,
          },
        ],
      })
      geminiHistory.push({
        role: 'model',
        parts: [
          {
            text: "Hi! I'm Aila, your AI Personal Trainer. I can help you with workout advice, form tips, nutrition guidance, and answer any fitness questions you have. What would you like to know?",
          },
        ],
      })
    } else {
      // For continuing conversations, add system context then history
      geminiHistory.push({
        role: 'user',
        parts: [
          {
            text: `[SYSTEM CONTEXT - Remember this for all responses]

${appKnowledge}

User's Weight Preference: ${weightUnitName.toUpperCase()} (${weightUnit})

[Instructions: Use this knowledge base to answer app questions accurately. For fitness research, use web search.]`,
          },
        ],
      })
      geminiHistory.push({
        role: 'model',
        parts: [
          {
            text: 'Understood. I have the app knowledge base loaded and ready to help.',
          },
        ],
      })

      // Add conversation history
      chatHistory.forEach((msg) => {
        geminiHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })
      })
    }

    try {
      // Enable Google Search grounding for the chat
      const response = await this.callGeminiAPI(
        userMessage,
        true,
        geminiHistory
      )
      return response.trim()
    } catch (error) {
      console.error('Error getting chat response:', error)
      throw error
    }
  }
}
