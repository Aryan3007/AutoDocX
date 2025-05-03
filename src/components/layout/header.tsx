"use client"

import { Button } from "@/components/ui/button"
import { PanelLeft, Share2, MoreVertical, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"

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

  return (
    <header className="flex items-center justify-between h-14 px-8 w-full">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">AutoDocX</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">{getCurrentSection()}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
                <span className="sr-only">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share documentation</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log("Archive clicked")}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Delete clicked")} className="text-red-500">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
    
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
            <span className="text-sm text-muted-foreground">{session?.user?.email ?? "user@example.com"}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log("Profile clicked")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Settings clicked")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log("Logout clicked")} className="text-red-500">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="fixed bottom-4 bg-white text-red-500 right-8" variant="ghost">
            <LogOut/>
            <h1>Exit</h1>
        </Button>
      </div>
    </header>
  )
}
