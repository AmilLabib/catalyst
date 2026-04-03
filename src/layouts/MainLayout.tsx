import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      <Navbar onMobileMenu={() => setMobileOpen(true)} />

  <div className="max-w-[90rem] mx-auto px-4 py-6 flex gap-6">
        {/* Desktop sidebar */}
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
