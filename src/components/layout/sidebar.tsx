"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LogoutButton } from "../LogoutButton"
import { useEffect, useState } from "react"
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ImportRepoDialog from "../ImportRepoDialog"
import { supabaseAdmin } from "@/lib/supabase-admin"
dayjs.extend(relativeTime);
type SidebarProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isMobile: boolean
}
type Documentation = {
  id: string
  repo_name: string
  description: string
  language: string
  generated: string
  endpoints: number
  created_at: number
  status: string
}

export function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname()
  const [docs, setDocs] = useState<Documentation[]>([])



  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch("/api/documentations")
        const json = await res.json()
  
        if (json.success) {
          setDocs(json.data)
        } else {
          throw new Error(json.error || "Failed to load data")
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.log(err.message)
        } else {
          console.log(err)
        }
      }
    }
  
    fetchDocs()
  
    const channel = supabaseAdmin
      .channel('realtime-documentations')
      .on(
        'postgres_changes',
        {
          event: '*', // can be 'INSERT', 'UPDATE', 'DELETE'
          schema: 'public',
          table: 'Documentations',
        },
        (payload) => {
          console.log('Realtime Payload:', payload)
  
          if (payload.eventType === 'INSERT') {
            setDocs((prev) => [payload.new as Documentation, ...prev])
          }
  
          if (payload.eventType === 'UPDATE') {
            setDocs((prev) =>
              prev.map((doc) =>
                doc.id === payload.new.id ? (payload.new as Documentation) : doc
              )
            )
          }
  
          if (payload.eventType === 'DELETE') {
            setDocs((prev) =>
              prev.filter((doc) => doc.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()
  
    return () => {
      supabaseAdmin.removeChannel(channel)
    }
  }, [])
  

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
          )}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
            className={cn(
              "fixed md:relative inset-y-0 left-0 z-50 w-72 bg-white lg:rounded-2xl lg:m-4 lg:mr-0 overflow-y-auto",
              isMobile ? "shadow-lg" : "",
            )}
          >
            <div className="flex flex-col h-full">
              <div className="">
                <div className="flex items-center justify-end ">

                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close sidebar</span>
                    </Button>
                  )}
                </div>

              </div>

              <div className="flex-1 overflow-auto">
                <div className="px-3 py-2">
                  <nav className="space-y-2">
                   <ImportRepoDialog/>
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
                      <span>My Documentations</span>
                    </Link>
                  </nav>
                </div>

                <div className="mt-4">
                  <h3 className="px-4 mb-1 text-sm font-medium text-muted-foreground">Recent Repositories</h3>
                  <div className="mt-2">
                    <nav className="space-y-1 px-3">
                      {docs.map((repo) => (
                        <Link
                          key={repo.repo_name}
                          href={`/dashboard/documentation/${repo.id}`}
                          className="flex flex-col gap-0 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{repo.repo_name}</span>
                          </div>
                         
                          <p className="text-xs text-nowrap text-muted-foreground">
                            Updated {dayjs(repo.created_at).fromNow()}
                          </p>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>

              <div className="p-4 mt-auto">
                <LogoutButton />
                <p className="text-xs text-muted-foreground mt-1">More access to advanced features</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
