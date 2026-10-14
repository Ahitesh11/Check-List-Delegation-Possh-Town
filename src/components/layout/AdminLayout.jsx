"use client"

import { useState, useEffect, useMemo } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CheckSquare, ClipboardList, Home, LogOut, Menu, Database, ChevronDown, ChevronRight, Video, KeyRound, BarChart3, ListTodo } from 'lucide-react'

export default function AdminLayout({ children, darkMode, toggleDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username')
    const storedRole = sessionStorage.getItem('role')
    
    if (!storedUsername) {
      // Redirect to login if not authenticated
      navigate("/login")
      return
    }
  
    setUsername(storedUsername)
    setUserRole(storedRole || "user")
  }, [navigate])

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('department')
    navigate("/login")
  }

  const dataCategories = []

  // Determine which departments to show in the submenu
  // const getAccessibleDepartments = () => {
  //   if (userRole === "admin") {
  //     // Admin sees all departments
  //     return dataCategories
  //   } else {
  //     // Regular users see only their own department plus admin (if needed)
  //     return dataCategories.filter(cat => 
  //       cat.id === username || 
  //       cat.id.toLowerCase() === username.toLowerCase()
  //     )
  //   }
  // }

  // Update the routes array based on user role
  const routes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: Database,
      active: location.pathname === "/dashboard/admin",
      showFor: ["admin", "user"] // Show for both roles
    },
    {
      href: "/dashboard/assign-task",
      label: "Assign Task",
      icon: CheckSquare,
      active: location.pathname === "/dashboard/assign-task",
      showFor: ["admin"]
    },
    {
      href: "/dashboard/pc-dashboard",
      label: "PC Dashboard",
      icon: BarChart3,
      active: location.pathname === "/dashboard/pc-dashboard",
      showFor: ["admin"]
    },
    {
      href: "/dashboard/companies",
      label: "Check List",
      icon: CheckSquare,
      active: location.pathname === "/dashboard/companies",
      showFor: ["admin", "user"]
    },
    {
      href: "/dashboard/delegation",
     label: "Delegation",
     icon: ClipboardList,
     active: location.pathname === "/dashboard/delegation",
     showFor: ["admin", "user"] // Only show for admin
   },
   {
      href: "/dashboard/re-verification",
     label: "Verification",
     icon: ClipboardList,
     active: location.pathname === "/dashboard/re-verification",
     showFor: ["admin"]
   },


  ]

  // Memoized accessible departments and routes to optimize performance
  const accessibleDepartments = useMemo(() => {
    return dataCategories.filter(cat => 
      !cat.showFor || cat.showFor.includes(userRole)
    )
  }, [userRole])

  const accessibleRoutes = useMemo(() => {
    let baseRoutes = routes.filter(route => 
      route.showFor.includes(userRole)
    )
    
    const departmentRoutes = accessibleDepartments.map(dept => ({
      href: dept.link || `/dashboard/data/${dept.id}`,
      label: dept.name,
      icon: Database,
      active: location.pathname === (dept.link || `/dashboard/data/${dept.id}`),
      showFor: ["admin", "user"]
    }))

    const finalRoutes = []
    baseRoutes.forEach(route => {
      if (route.label === "Data") {
        finalRoutes.push(...departmentRoutes)
      } else {
        finalRoutes.push(route)
      }
    })

    return finalRoutes
  }, [userRole, accessibleDepartments, location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f3fa] font-sans">
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-[#e8ecf4] bg-white md:flex md:flex-col shadow-sm text-slate-700">
        {/* Brand Header */}
        <div className="flex h-18 items-center px-6 pt-2">
          <Link to="/dashboard/admin" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center text-white shadow-md shadow-blue-500/25 font-black text-xl tracking-wider">
              P
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#1e293b]">
                <span className="text-[#3b82f6]">POSSH</span> <span className="font-serif italic font-bold text-[#ec4899]">Town</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <ul className="space-y-1">
            {accessibleRoutes.map((route) => (
              <li key={route.label}>
                <Link
                  to={route.href}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-150 ${
                    route.active
                      ? "bg-[#fff1eb] text-[#ea580c] shadow-xs"
                      : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <route.icon className={`h-4.5 w-4.5 ${route.active ? "text-[#ea580c]" : "text-[#94a3b8]"}`} />
                    <span>{route.label}</span>
                  </div>
                  {route.active && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#f97316] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                      1
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Card + Logout */}
        <div className="p-4 border-t border-[#f1f5f9] space-y-2">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]/60">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-extrabold text-[#1e293b] truncate uppercase">
                {username || "User"}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3b82f6]">
                {userRole === "admin" ? "Admin" : "Member"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#64748b] hover:text-[#dc2626] hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed left-4 top-3.5 z-50 text-slate-800 p-2 rounded-xl bg-white shadow-md border border-slate-200 hover:bg-slate-50 cursor-pointer"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl z-50">
            <div className="flex h-16 items-center justify-between border-b border-[#e8ecf4] px-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-[#3b82f6] flex items-center justify-center text-white font-black">
                  P
                </div>
                <span className="text-base font-black text-[#1e293b]">POSSH Town</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="space-y-1">
                {accessibleRoutes.map((route) => (
                  <li key={route.label}>
                    <Link
                      to={route.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold transition-all ${
                        route.active
                          ? "bg-[#fff1eb] text-[#ea580c]"
                          : "text-[#64748b] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon className="h-4.5 w-4.5" />
                        <span>{route.label}</span>
                      </div>
                      {route.active && (
                        <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#f97316] text-white text-[10px] font-bold flex items-center justify-center">
                          1
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-[#f1f5f9] p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#3b82f6] flex items-center justify-center text-white font-bold text-xs">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 uppercase">{username}</p>
                  <p className="text-[10px] text-[#3b82f6] uppercase font-bold">{userRole}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-xs font-bold text-rose-600 hover:bg-rose-50 p-2 rounded-xl"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 bg-transparent z-10">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8"></div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0f172a] tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs text-[#94a3b8] font-medium hidden sm:block">
                Welcome back, <span className="uppercase font-bold text-[#64748b]">{username || "User"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Pill like the reference image */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#dbeafe] text-[#2563eb] text-xs font-bold shadow-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
          {children}
        </main>
      </div>
    </div>
  )
}