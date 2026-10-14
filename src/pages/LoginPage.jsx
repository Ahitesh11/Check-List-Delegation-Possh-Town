"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const LoginPage = () => {
  const navigate = useNavigate()
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [masterData, setMasterData] = useState({
    userCredentials: {}, // Object where keys are usernames and values are passwords
    userRoles: {} // Object where keys are usernames and values are roles
  })
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  // Function to check if a role is any variation of "inactive"
  const isInactiveRole = (role) => {
    if (!role) return false;

    // Convert to lowercase
    const normalizedRole = String(role).toLowerCase().trim();

    // Check for different variations of "inactive" status
    return normalizedRole === "inactive" ||
      normalizedRole === "in active" ||
      normalizedRole === "inactiv" ||
      normalizedRole === "in activ";
  }

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwWynmbAyTuDAKeHlkZc6I8lnSKNL4AtqCS3FPUoq0fkbikywdlIxxW-0JsROeN6588/exec"

      try {
        setIsDataLoading(true)

        // Get the spreadsheet ID from your Apps Script
        const SPREADSHEET_ID = "1oDYiEQ043anmknvvioawJCiZ3i5BNaWh7_lIyJghlms"

        // Construct the URL to read the sheet data directly
        // Reading from "Main" sheet: A=Firm, B=Given By, C=Doer's Name(username), D=password, E=Role
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=Main`

        const response = await fetch(sheetUrl)
        const text = await response.text()

        // Robust GViz wrapper removal (find first { and last })
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}')
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error("Invalid GViz response — sheet may be private or tab name wrong")
        }
        const data = JSON.parse(text.substring(jsonStart, jsonEnd + 1))

        // Create userCredentials, userRoles, userMeta objects from the sheet data
        const userCredentials = {}
        const userRoles = {}
        const userMeta = {} // stores firm, givenBy, displayName per user

        // Main sheet: A=Firm(0), B=Given By(1), C=Doer's Name(2), D=password(3), E=Role(4)
        // GViz returns parsedNumHeaders:0 so rows[0] = header row, data starts at rows[1]
        if (data.table && data.table.rows) {
          console.log("Raw Main sheet data:", data.table.rows);

          // Detect header row: if rows[0] col C = "Doer's Name" (or similar text), skip it
          const startIdx = 1; // always skip row 0 (header)

          for (let i = startIdx; i < data.table.rows.length; i++) {
            const row = data.table.rows[i]
            if (!row || !row.c) continue;

            // Col C (index 2) = Doer's Name = username
            // Col D (index 3) = password
            // Col E (index 4) = Role
            const firm     = row.c[0] && row.c[0].v != null ? String(row.c[0].v).trim() : '';
            const givenBy  = row.c[1] && row.c[1].v != null ? String(row.c[1].v).trim() : '';
            const rawName  = row.c[2] && row.c[2].v != null ? String(row.c[2].v).trim() : '';
            const username = rawName.toLowerCase();
            const password = row.c[3] && row.c[3].v != null ? String(row.c[3].v).trim() : '';
            const role     = row.c[4] && row.c[4].v != null ? String(row.c[4].v).trim() : 'user';

            console.log(`Processing row ${i}: username="${username}", role="${role}"`);

            // Only process if we have both username and password
            if (username && password) {
              // Skip inactive users
              if (isInactiveRole(role)) {
                console.log(`Skipping inactive user: ${username}`);
                continue;
              }

              const normalizedRole = role.toLowerCase();
              userCredentials[username] = password;
              userRoles[username] = normalizedRole;
              userMeta[username] = { firm, givenBy, displayName: rawName };

              console.log(`✅ Added: username="${username}", role="${normalizedRole}"`);
            }
          }
        }

        setMasterData({ userCredentials, userRoles, userMeta })
        console.log("Loaded credentials from Main sheet:", Object.keys(userCredentials).length)
        console.log("Credentials map:", userCredentials)
        console.log("Roles map:", userRoles)

        // Debug - check admin roles specifically
        const adminUsers = Object.entries(userRoles)
          .filter(([, role]) => role === 'admin')
          .map(([username]) => username);
        console.log("Admin users found:", adminUsers);

      } catch (error) {
        console.error("Error Fetching Master Data:", error)

        // Fallback: Try the alternative method using your Apps Script
        try {
          console.log("Trying alternative method...");
          const fallbackResponse = await fetch(SCRIPT_URL, {
            method: 'GET'
          })

          if (fallbackResponse.ok) {
            console.log("Apps Script is accessible, but getMasterData action needs to be implemented");
            showToast("Unable to load user data. Please contact administrator.", "error")
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }

        showToast(`Network error: ${error.message}. Please try again later.`, "error")
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchMasterData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoginLoading(true)

    try {
      const trimmedUsername = formData.username.trim().toLowerCase()
      const trimmedPassword = formData.password.trim()

      console.log("Login Attempt Details:")
      console.log("Entered Username:", trimmedUsername)
      console.log("Entered Password:", trimmedPassword) // For debugging (remove in production)
      console.log("Available Credentials Count:", Object.keys(masterData.userCredentials).length)
      console.log("Current userCredentials:", masterData.userCredentials)
      console.log("Current userRoles:", masterData.userRoles)

      // Check if the username exists in our credentials map
      if (trimmedUsername in masterData.userCredentials) {
        const correctPassword = masterData.userCredentials[trimmedUsername]
        const userRole = masterData.userRoles[trimmedUsername]

        console.log("Found user in credentials map")
        console.log("Expected Password:", correctPassword)
        console.log("Password Match:", correctPassword === trimmedPassword)
        console.log("User Role:", userRole)

        // Check if password matches
        if (correctPassword === trimmedPassword) {
          // Get meta info from Main sheet (firm, givenBy, displayName)
          const meta = masterData.userMeta?.[trimmedUsername] || {}
          const displayName = meta.displayName || trimmedUsername
          const firm = meta.firm || ''
          const givenBy = meta.givenBy || ''

          // Store user info in sessionStorage
          sessionStorage.setItem('username', trimmedUsername)
          sessionStorage.setItem('displayName', displayName)
          sessionStorage.setItem('firm', firm)
          sessionStorage.setItem('givenBy', givenBy)

          // Check if user is admin - explicitly compare with the string "admin"
          const isAdmin = userRole === "admin";
          console.log(`User ${trimmedUsername} is admin: ${isAdmin}`);

          // Set role based on the fetched role
          sessionStorage.setItem('role', isAdmin ? 'admin' : 'user')

          // For admin users, we don't want to restrict by department
          if (isAdmin) {
            sessionStorage.setItem('department', 'all') // Admin sees all departments
            sessionStorage.setItem('isAdmin', 'true') // Additional flag to ensure admin permissions
            console.log("ADMIN LOGIN - Setting full access permissions");
          } else {
            sessionStorage.setItem('department', trimmedUsername)
            sessionStorage.setItem('isAdmin', 'false')
            console.log("USER LOGIN - Setting restricted access");
          }

          // Navigate to dashboard
          navigate("/dashboard/admin")

          showToast(`Login successful. Welcome, ${displayName}!`, "success")
          return
        } else {
          showToast("Username or password is incorrect. Please try again.", "error")
        }
      } else {
        showToast("Username or password is incorrect. Please try again.", "error")
      }

      // If we got here, login failed
      console.error("Login Failed", {
        usernameExists: trimmedUsername in masterData.userCredentials,
        passwordMatch: (trimmedUsername in masterData.userCredentials) ?
          "Password did not match" : 'Username not found',
        userRole: masterData.userRoles[trimmedUsername] || 'No role'
      })
    } catch (error) {
      console.error("Login Error:", error)
      showToast(`Login failed: ${error.message}. Please try again.`, "error")
    } finally {
      setIsLoginLoading(false)
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 5000) // Toast duration
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 p-4 font-sans">
      <div className="w-full max-w-md shadow-xl shadow-slate-200/60 border border-slate-200/80 rounded-2xl bg-white overflow-hidden transition-all duration-300">
        <div className="p-8 text-center border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-4">
            <i className="fas fa-clipboard-list text-2xl"></i>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Possh Town</h2>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Checklist & Delegation</p>
          <p className="text-xs text-slate-500 mt-2">Sign in to manage your delegations and checklists</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i className="fas fa-user text-sm"></i>
              </span>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="e.g. mayank agarwal"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i className="fas fa-lock text-sm"></i>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              disabled={isLoginLoading || isDataLoading}
            >
              {isLoginLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : isDataLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Loading system...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-xl shadow-xl transition-all duration-300 font-medium text-sm flex items-center gap-2.5 z-50 ${toast.type === "success"
          ? "bg-emerald-600 text-white shadow-emerald-500/20"
          : "bg-rose-600 text-white shadow-rose-500/20"
          }`}>
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default LoginPage