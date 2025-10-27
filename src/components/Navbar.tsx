import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Dumbbell, Home, Activity, TrendingUp, Brain } from 'lucide-react'

const Navbar: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/workout', label: 'Workout', icon: Dumbbell },
    { path: '/progress', label: 'Progress', icon: TrendingUp },
    { path: '/recommendations', label: 'AI Recommendations', icon: Brain },
  ]

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-800">
              AI Personal Trainer
            </span>
          </div>

          <div className="flex space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  location.pathname === path
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
