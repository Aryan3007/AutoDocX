"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  className?: string
}

export function LogoutButton({ 
  variant = "ghost", 
  size = "default", 
  showIcon = true,
  className = ""
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      // Force redirect after signOut (Next.js 13+ approach)
      await signOut({ 
        redirect: true,
        callbackUrl: "/login"
      })
      
      // As a fallback, if the redirect option doesn't work
      window.location.href = "/"
    } catch (error) {
      console.error("Logout failed:", error)
      // Even if there's an error, try to redirect
      window.location.href = "/"
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Logging out...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {showIcon && <LogOut className="h-4 w-4" />}
          Sign out
        </span>
      )}
    </Button>
  )
}