import React, { createContext, useContext, useState, useEffect } from 'react'

interface DarkModeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(
  undefined
)

export const useDarkMode = () => {
  const context = useContext(DarkModeContext)
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user has a saved preference
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return saved === 'true'
    }
    // If no saved preference, use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString())

    // Force remove and re-add to trigger style recalculation
    document.documentElement.classList.remove('dark')

    if (isDarkMode) {
      // Use requestAnimationFrame to ensure the class is added after removal
      requestAnimationFrame(() => {
        document.documentElement.classList.add('dark')
      })
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => !prev)
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}
