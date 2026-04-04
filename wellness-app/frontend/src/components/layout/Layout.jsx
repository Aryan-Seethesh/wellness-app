import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/fitness': 'Fitness Tracker',
  '/nutrition': 'Nutrition Tracker',
  '/mental-health': 'Mental Health',
  '/insights': 'Insights & Analytics',
  '/profile': 'Profile',
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const title = pageTitles[location.pathname] || 'Vitalis'

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              <span /><span /><span />
            </button>
            <h1 className="page-title" style={{ fontSize: '20px' }}>{title}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'none' }}
              className="greeting">
              Welcome back, {user?.name?.split(' ')[0]}
            </span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
