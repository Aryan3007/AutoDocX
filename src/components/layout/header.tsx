"use client"

import { Button } from "@/components/ui/button"
import { PanelLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useState } from "react"

type HeaderProps = {
  toggleSidebar: () => void
}

export function Header({ toggleSidebar }: HeaderProps) {
  const pathname = usePathname()
    const { data: session } = useSession(); // Use useSession to get session data
console.log(session);
  // Determine current section based on pathname
  const getCurrentSection = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname === "/dashboard/documentation") return "Documentation"
    if (pathname.includes("/dashboard/api-endpoints")) return "API Endpoints"
    return "Dashboard"
  }
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
    <header className="flex items-center border-b bg-white justify-between h-14 px-2 lg:px-8 w-full">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg"><span className="text-red-600">/</span>AutoDocX</span>
          <span className="text-muted-foreground hidden md:inline">|</span>
          <span className="text-muted-foreground hidden md:inline">{getCurrentSection()}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
       
    
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 bg-white w-8 cursor-pointer">
              <AvatarImage src={session?.user?.image ?? ""} alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white p-2" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
            <span className="font-semibold">{session?.user?.name ?? "User"}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          
          
            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg aria-hidden="true" className="mr-2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100Z" fill="currentColor"/>
                    <path d="M93.9676 27.4359C88.8395 16.6464 80.5132 8.5 70.9999 4.5V14.5C78.6666 17.5 84.9999 23.3333 88.9999 31L93.9676 27.4359Z" fill="currentFill"/>
                    <path d="M50 15C39.6739 15 30.8268 19.6131 24.9999 27.5L34.9999 34.5C39.9999 29.5 45.3332 25.5 50 25.5V15Z" fill="currentFill"/>
                  </svg>
                  Logging out...
                  </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="text-red-500">Sign out</span>
                    </span>
                  )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
      </div>
    </header>
  )
}
