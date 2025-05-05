"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Search, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import ImportRepoDialog from "@/components/ImportRepoDialog"

// Mock data for documentation
const allDocs = [
  {
    id: 1,
    projectName: "api-service",
    description: "REST API service for user management",
    language: "Node.js",
    generated: "2 days ago",
    endpoints: 12,
    models: 5,
    status: "Complete",
  },
  {
    id: 2,
    projectName: "payment-gateway",
    description: "Payment processing service",
    language: "Python",
    generated: "1 week ago",
    endpoints: 8,
    models: 3,
    status: "Complete",
  },
  {
    id: 3,
    projectName: "auth-service",
    description: "Authentication and authorization service",
    language: "Java",
    generated: "3 days ago",
    endpoints: 15,
    models: 7,
    status: "Complete",
  },
  {
    id: 4,
    projectName: "notification-service",
    description: "Email and push notification service",
    language: "Go",
    generated: "5 days ago",
    endpoints: 6,
    models: 2,
    status: "In Progress",
  },
  {
    id: 5,
    projectName: "analytics-api",
    description: "Analytics data collection and reporting API",
    language: "Ruby",
    generated: "2 weeks ago",
    endpoints: 10,
    models: 4,
    status: "Complete",
  },
]

type SortField = "projectName" | "language" | "generated" | "endpoints" | "models" | "status"
type SortDirection = "asc" | "desc"

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField] = useState<SortField>("projectName")
  const [sortDirection] = useState<SortDirection>("asc")
  const [languageFilter, setLanguageFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  // Get unique languages and statuses for filters
  const languages = Array.from(new Set(allDocs.map((doc) => doc.language)))
  const statuses = Array.from(new Set(allDocs.map((doc) => doc.status)))

  // Filter docs based on search query and filters
  const filteredDocs = allDocs.filter((doc) => {
    const matchesSearch =
      doc.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLanguage = languageFilter.length === 0 || languageFilter.includes(doc.language)
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(doc.status)

    return matchesSearch && matchesLanguage && matchesStatus
  })

  // Sort docs
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    let comparison = 0

    if (sortField === "projectName") {
      comparison = a.projectName.localeCompare(b.projectName)
    } else if (sortField === "language") {
      comparison = a.language.localeCompare(b.language)
    } else if (sortField === "generated") {
      // Simple string comparison for demo purposes
      comparison = a.generated.localeCompare(b.generated)
    } else if (sortField === "endpoints") {
      comparison = a.endpoints - b.endpoints
    } else if (sortField === "models") {
      comparison = a.models - b.models
    } else if (sortField === "status") {
      comparison = a.status.localeCompare(b.status)
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  // Paginate docs
  const totalPages = Math.ceil(sortedDocs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDocs = sortedDocs.slice(startIndex, startIndex + itemsPerPage)



  // Handle language filter toggle
  const toggleLanguageFilter = (language: string) => {
    setLanguageFilter((prev) => (prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]))
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Handle status filter toggle
  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Clear all filters
  const clearFilters = () => {
    setLanguageFilter([])
    setStatusFilter([])
    setSearchQuery("")
    setCurrentPage(1)
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Complete":
        return "default"
      case "In Progress":
        return "secondary"
      case "Outdated":
        return "outline"
      default:
        return "default"
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
      

        <h2 className="md:text-3xl text-xl font-bold tracking-tight">My Documentations</h2>
        <ImportRepoDialog/>
    
        
      </div>

      <div className="flex flex-col md:flex-row items-center gap-2 justify-between mb-4">
        <div className="relative w-full md:w-auto md:flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documentation..."
            className="w-full bg-white pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to first page when search changes
            }}
          />
          
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {(languageFilter.length > 0 || statusFilter.length > 0) && (
                  <Badge variant="secondary" className="ml-2 rounded-full px-1 text-xs">
                    {languageFilter.length + statusFilter.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] p-6">
              <SheetHeader className="mb-5">
              <SheetTitle className="text-2xl">Filters</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Refine your documentation results using the filters below.
              </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
              {/* Language Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Programming Language</h3>
                <span className="text-sm text-muted-foreground">
                  {languageFilter.length} selected
                </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                {languages.map((language) => (
                  <div
                  key={language}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent"
                  >
                  <Checkbox
                    id={`language-${language}`}
                    checked={languageFilter.includes(language)}
                    onCheckedChange={() => toggleLanguageFilter(language)}
                  />
                  <Label
                    htmlFor={`language-${language}`}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {language}
                  </Label>
                  </div>
                ))}
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between"></div>
                <h3 className="text-base font-semibold">Documentation Status</h3>
                <span className="text-sm text-muted-foreground">
                  {statusFilter.length} selected
                </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                {statuses.map((status) => (
                  <div
                  key={status}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent"
                  >
                  <Checkbox
                    id={`status-${status}`}
                    checked={statusFilter.includes(status)}
                    onCheckedChange={() => toggleStatusFilter(status)}
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {status}
                  </Label>
                  </div>
                ))}
                </div>
              </div>
              

              <SheetFooter className="mt-8 flex-row gap-3">
              <SheetClose asChild>
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                Reset
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button className="flex-1">Apply Filters</Button>
              </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        <div className="bg-white">

          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value))
              setCurrentPage(1) // Reset to first page when items per page changes
            }}
            >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="15">15 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
            </SelectContent>
          </Select>
            </div>
        </div>
      </div>

      {(languageFilter.length > 0 || statusFilter.length > 0) && (
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {languageFilter.map((language) => (
            <Badge key={language} variant="secondary" className="flex items-center gap-1">
              {language}
              <button
                onClick={() => toggleLanguageFilter(language)}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20 h-4 w-4 inline-flex items-center justify-center"
              >
                ×
              </button>
            </Badge>
          ))}
          {statusFilter.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              {status}
              <button
                onClick={() => toggleStatusFilter(status)}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20 h-4 w-4 inline-flex items-center justify-center"
              >
                ×
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
            Clear all
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedDocs.length > 0 ? (
          paginatedDocs.map((doc) => (
        <div key={doc.id} className="rounded-md p-4 bg-white border shadow-sm">
          <div className="mb-2">
            <h3 className="text-lg font-bold capitalize">{doc.projectName}</h3>
            <p className="text-sm text-muted-foreground">{doc.description}</p>
          </div>
          <div className="mb-2">
            <Badge variant="outline">{doc.language}</Badge>
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            <p>Generated: {doc.generated}</p>
            <p>Endpoints: {doc.endpoints}</p>
            <p>Models: {doc.models}</p>
          </div>
          <div className="mb-2">
            <Badge variant={getStatusBadgeVariant(doc.status)}>{doc.status}</Badge>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/api-endpoints/register`}>
            <FileText className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">View</span>
          </Link>
            </Button>
            <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:ml-2">Download</span>
            </Button>
          </div>
        </div>
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground">
        No documentation found.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {paginatedDocs.length > 0 ? startIndex + 1 : 0} to{" "}
          {Math.min(startIndex + itemsPerPage, filteredDocs.length)} of {filteredDocs.length} results
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) setCurrentPage(currentPage - 1)
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNumber: number

              // Logic to show pages around current page
              if (totalPages <= 5) {
                pageNumber = i + 1
              } else if (currentPage <= 3) {
                pageNumber = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i
              } else {
                pageNumber = currentPage - 2 + i
              }

              // Only render if pageNumber is valid
              if (pageNumber > 0 && pageNumber <= totalPages) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(pageNumber)
                      }}
                      isActive={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              }
              return null
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
