"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X, Plus, Home, FileText, Github } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

type SidebarProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isMobile: boolean
}

export function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname()

  // Recent repositories (mock data)
  const recentRepos = [
    { name: "api-service", description: "REST API service for user management", updated: "2 days ago" },
    { name: "payment-gateway", description: "Payment processing service", updated: "1 week ago" },
    { name: "auth-service", description: "Authentication and authorization service", updated: "3 days ago" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
          )}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
            className={cn(
              "fixed md:relative inset-y-0 left-0 z-50 w-72 bg-white rounded-2xl m-4 overflow-y-auto",
              isMobile ? "shadow-lg" : "",
            )}
          >
            <div className="flex flex-col h-full">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl gradient-text">AutoDocX</span>
                  </div>
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close sidebar</span>
                    </Button>
                  )}
                </div>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Import Repository</span>
                </Button>
              </div>

              <div className="flex-1 overflow-auto">
                <div className="px-3 py-2">
                  <nav className="space-y-1">
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        pathname === "/dashboard"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground",
                      )}
                    >
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/dashboard/documentation"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        pathname === "/dashboard/documentation"
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground",
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Documentation</span>
                    </Link>
                  </nav>
                </div>

                <div className="mt-4">
                  <h3 className="px-4 mb-1 text-sm font-medium text-muted-foreground">Recent Repositories</h3>
                  <div className="mt-2">
                    <nav className="space-y-1 px-3">
                      {recentRepos.map((repo) => (
                        <Link
                          key={repo.name}
                          href={`/dashboard/documentation`}
                          className="flex flex-col gap-1 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            <span className="font-medium">{repo.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-6">{repo.description}</p>
                          <p className="text-xs text-muted-foreground pl-6">Updated {repo.updated}</p>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>

              <div className="p-4 mt-auto">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <span className="text-primary">Upgrade plan</span>
                </Button>
                <p className="text-xs text-muted-foreground mt-1">More access to advanced features</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
