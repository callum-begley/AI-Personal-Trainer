import React, { useState, useEffect, useRef } from 'react'
import { Send, X } from 'lucide-react'
import { storageService } from '../services/storage'
import { AITrainerService } from '../services/aiTrainer'
import { Workout, WorkoutProgress } from '../types/workout'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatModalProps {
  isOpen: boolean
  onClose: () => void
}

// Utility function to convert markdown to HTML
const formatMarkdownToHtml = (text: string): string => {
  let formatted = text

  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Convert *italic* to <em> (but not * bullet points at start of line)
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>')

  // Convert bullet points (lines starting with * or -) to list items
  const lines = formatted.split('\n')
  let inList = false
  const processedLines: string[] = []

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    const isBullet = /^[\*\-]\s+/.test(trimmedLine)

    if (isBullet) {
      if (!inList) {
        processedLines.push('<ul class="list-disc list-inside space-y-1 my-2">')
        inList = true
      }
      const bulletContent = trimmedLine.replace(/^[\*\-]\s+/, '')
      processedLines.push(`<li class="ml-2">${bulletContent}</li>`)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      if (trimmedLine) {
        processedLines.push(line)
      } else if (index > 0 && index < lines.length - 1) {
        // Preserve empty lines between content for spacing
        processedLines.push('<br/>')
      }
    }
  })

  // Close any open list
  if (inList) {
    processedLines.push('</ul>')
  }

  return processedLines.join('\n')
}

const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [progress, setProgress] = useState<WorkoutProgress[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const aiTrainer = new AITrainerService()

  useEffect(() => {
    if (isOpen) {
      // Load workout data
      const allWorkouts = storageService.getWorkouts()
      const completedWorkouts = allWorkouts.filter((w) => {
        const isCompleted =
          Boolean(w.completed) && String(w.completed) !== 'false'
        return isCompleted
      })
      const workoutProgress = storageService.getWorkoutProgress()

      setWorkouts(completedWorkouts)
      setProgress(workoutProgress)

      // Initialize with welcome message if empty
      if (chatMessages.length === 0) {
        setChatMessages([
          {
            role: 'assistant',
            content:
              "Hi! I'm Aila, your AI Personal Trainer. I can help you with workout advice, form tips, nutrition guidance, and answer any fitness questions you have. What would you like to know?",
            timestamp: new Date(),
          },
        ])
      }
    }
  }, [isOpen])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)

    try {
      const historyForContext = chatMessages
        .filter((_msg, index) => index > 0)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      const response = await aiTrainer.getChatResponse(
        chatInput,
        workouts,
        progress,
        historyForContext
      )

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          "I'm sorry, I'm having trouble connecting right now. Please check your connection and try again.",
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 lg:px-40"
      style={{ margin: 0 }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg w-full h-full flex flex-col my-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-2 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <img
              src="/aila-face.png"
              alt="AI Trainer"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AILA
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your AI Personal Trainer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <img
                  src="/aila-face.png"
                  alt="AI"
                  className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                />
              )}
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white dark:bg-primary-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdownToHtml(message.content),
                  }}
                />
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <img
                src="/aila-face.png"
                alt="AI"
                className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
              />
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about fitness..."
              className="flex-1 input-field"
              disabled={chatLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={chatLoading || !chatInput.trim()}
              className="btn-primary px-4"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIChatModal
