"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Search } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const pathname = usePathname()
    const isEndpointPage = pathname.includes("/api-endpoints/") && pathname !== "/dashboard/api-endpoints"

    // Check if mobile on mount and on resize
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.innerWidth < 768) {
                setSidebarOpen(false)
            }
        }

        checkIsMobile()
        window.addEventListener("resize", checkIsMobile)
        return () => window.removeEventListener("resize", checkIsMobile)
    }, [])

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    return (
        <div className="flex flex-col h-screen bg-transparent">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-30  bg-transparent">
                <Header toggleSidebar={toggleSidebar} />
            </header>

            {/* Main content */}
            <div className={`flex flex-1 pt-12 bg-gray-100 ${sidebarOpen ? "overflow-hidden" : ""}`}>
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />

                <main className="flex-1 overflow-auto relative">
                    <Suspense>{children}</Suspense>

                    {/* Desktop fixed bottom editor - only on endpoint detail pages */}
                    {isEndpointPage && (
                        <div className="hidden md:block fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full px-4">
                            <div className="relative mx-auto max-w-3xl">
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl border shadow-lg"></div>
                                <div className="relative p-3 flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="shrink-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                    <input
                                        type="text"
                                        placeholder="Edit documentation..."
                                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="shrink-0">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                        <Separator orientation="vertical" className="h-6" />
                                        <Button size="sm" className="shrink-0">
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mobile floating editor button - only on endpoint detail pages */}
                    {isEndpointPage && (
                        <div className="fixed bottom-6 right-6 md:hidden">
                            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
                                <Plus className="h-6 w-6" />
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
