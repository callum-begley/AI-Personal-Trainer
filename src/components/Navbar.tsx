import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Dumbbell,
  Home,
  Activity,
  TrendingUp,
  Brain,
  Menu,
  X,
  DumbbellIcon,
  Moon,
  Sun,
} from 'lucide-react'
import { useDarkMode } from '../contexts/DarkModeContext'

const Navbar: React.FC = () => {
  const location = useLocation()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop'
  )

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home, shortLabel: 'Home' },
    {
      path: '/workout',
      label: 'Workout',
      icon: Dumbbell,
      shortLabel: 'Workout',
    },
    {
      path: '/progress',
      label: 'Progress',
      icon: TrendingUp,
      shortLabel: 'Progress',
    },
    {
      path: '/recommendations',
      label: 'AI Recommendations',
      icon: Brain,
      shortLabel: 'AI',
    },
  ]

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }

      // Close mobile menu when screen gets larger
      if (width >= 640) {
        setIsMobileMenuOpen(false)
      }
    }

    handleResize() // Check initial size
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop & Tablet Navigation */}
      <nav className="bg-white shadow-lg dark:bg-gray-800 dark:shadow-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <DumbbellIcon className="h-8 w-8 text-primary-600 dark:text-primary-500" />
              <span
                className={`font-bold text-gray-700 dark:text-gray-200 ${
                  screenSize === 'mobile' ? 'text-xl' : 'text-4xl'
                }`}
              >
                TR
                <span className="text-primary-600 dark:text-primary-500 font-extrabold">
                  AI
                </span>
                NER
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    location.pathname === path
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="ml-2 p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Tablet Navigation (Icons + Short Labels) */}
            <div className="hidden sm:flex lg:hidden items-center space-x-1">
              {navItems.map(({ path, shortLabel, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                    location.pathname === path
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-xs font-medium">{shortLabel}</span>
                </Link>
              ))}
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-black bg-opacity-50 dark:bg-opacity-70"
          onClick={closeMobileMenu}
        >
          <div
            className="bg-white dark:bg-gray-800 w-64 h-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-6 w-6 text-primary-600 dark:text-primary-500" />
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    AI Trainer
                  </span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-1 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <nav className="space-y-2">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      location.pathname === path
                        ? 'bg-primary-600 text-white dark:bg-primary-500'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
                {/* Dark Mode Toggle in Mobile Menu */}
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="h-5 w-5" />
                      <span className="font-medium">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-5 w-5" />
                      <span className="font-medium">Dark Mode</span>
                    </>
                  )}
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
