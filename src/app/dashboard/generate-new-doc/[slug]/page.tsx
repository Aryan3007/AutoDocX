"use client"

import type React from "react"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Search,
  Copy,
  Terminal,
  ChevronDown,
  ChevronRight,
  Loader2,
  Github,
  FileText,
  Lock,
  Calendar,
  CreditCard,
  X,
  ExternalLink,
  Info,
  User,
  Users,
  Download,
  List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

interface Repository {
  name: string
  full_name: string
  description: string | null
  language: string
  visibility: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  html_url: string
  clone_url: string
}

interface RouteDoc {
  method: string
  routePath: string
  handler: string
  explanation: string
}

// Dynamic categories based on repository content
type Category = string

export default function ApiDocumentation() {
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [repoUrl, setRepoUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [docs, setDocs] = useState<RouteDoc[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all")
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null)
  const [showToc, setShowToc] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentRef = useRef<HTMLDivElement>(null)
  const endpointRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Dynamically categorize endpoints based on their path
  const categorizeEndpoint = (endpoint: RouteDoc): Category => {
    const path = endpoint.routePath.toLowerCase()

    // Extract potential category from path
    // Remove leading slash and get first segment
    const segments = path.split("/").filter(Boolean)
    if (segments.length > 0) {
      // Use the first meaningful segment as category
      return segments[0]
    }

    // Fallback categorization based on common patterns
    if (
      path.includes("login") ||
      path.includes("register") ||
      path.includes("password") ||
      path.includes("forgetpass") ||
      path.includes("auth")
    ) {
      return "auth"
    } else if (path.includes("user") || path.includes("profile")) {
      return "users"
    } else if (path.includes("post") || path.includes("article") || path.includes("blog")) {
      return "content"
    } else if (path.includes("payment") || path.includes("checkout") || path.includes("order")) {
      return "payments"
    } else if (path.includes("community") || path.includes("forum") || path.includes("comment")) {
      return "community"
    } else {
      return "other"
    }
  }

  // Group endpoints by category dynamically
  const categorizedEndpoints = useMemo(() => {
    const result: Record<string, RouteDoc[]> = {
      all: [],
    }

    // First pass: identify all unique categories
    const categories = new Set<string>()
    docs.forEach((doc) => {
      const category = categorizeEndpoint(doc)
      categories.add(category)
    })

    // Initialize categories
    categories.forEach((category) => {
      result[category] = []
    })

    // Second pass: populate categories
    docs.forEach((doc) => {
      const category = categorizeEndpoint(doc)
      result[category].push(doc)
      result.all.push(doc)
    })

    return result
  }, [docs])

  // Filter endpoints based on search query
  const filteredEndpoints = useMemo(() => {
    if (!searchQuery) return categorizedEndpoints[activeCategory]

    return categorizedEndpoints[activeCategory].filter(
      (doc) =>
        doc.routePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.explanation.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [categorizedEndpoints, searchQuery, activeCategory])

  // Get method color
  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 border-green-300"
      case "POST":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "PUT":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "PATCH":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "DELETE":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  // Get category icon based on category name
  const getCategoryIcon = (category: Category) => {
    switch (category.toLowerCase()) {
      case "auth":
        return <Lock className="h-4 w-4 mr-2" />
      case "users":
      case "user":
      case "profile":
        return <User className="h-4 w-4 mr-2" />
      case "appointments":
      case "appointment":
      case "schedule":
        return <Calendar className="h-4 w-4 mr-2" />
      case "checkout":
      case "payment":
      case "payments":
      case "order":
      case "orders":
        return <CreditCard className="h-4 w-4 mr-2" />
      case "community":
      case "forum":
      case "comments":
        return <Users className="h-4 w-4 mr-2" />
      case "content":
      case "post":
      case "posts":
      case "article":
      case "blog":
        return <FileText className="h-4 w-4 mr-2" />
      case "all":
      case "other":
      default:
        return <FileText className="h-4 w-4 mr-2" />
    }
  }

  // Toggle endpoint expansion
  const toggleEndpoint = (endpointId: string) => {
    setExpandedEndpoints((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(endpointId)) {
        newSet.delete(endpointId)
      } else {
        newSet.add(endpointId)
      }
      return newSet
    })
    setActiveEndpoint(endpointId)

    // Update URL with the active endpoint for sharing
    const params = new URLSearchParams(searchParams.toString())
    params.set("endpoint", endpointId)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Scroll to endpoint
  const scrollToEndpoint = (endpointId: string) => {
    const element = endpointRefs.current[endpointId]
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // Scroll to category
  const scrollToCategory = (category: string) => {
    setActiveCategory(category)
    
    // If there are endpoints in this category, scroll to the first one
    if (categorizedEndpoints[category]?.length > 0) {
      const firstEndpoint = categorizedEndpoints[category][0]
      const endpointId = `${firstEndpoint.method}-${firstEndpoint.routePath}`
      
      // First set the category as active to ensure it's visible
      setTimeout(() => {
        scrollToEndpoint(endpointId)
      }, 100)
    }
  }

  // Copy to clipboard function
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard", {
      description: `${type} has been copied to your clipboard.`,
      duration: 2000,
    })
  }

  // Generate curl command for an endpoint
  const generateCurl = (endpoint: RouteDoc) => {
    const baseUrl = "https://api.example.com" // Replace with actual base URL
    const method = endpoint.method
    const path = endpoint.routePath

    let curl = `curl -X ${method} ${baseUrl}${path}`

    if (method === "POST" || method === "PUT" || method === "PATCH") {
      curl += ` -H "Content-Type: application/json" -d '{"example": "data"}'`
    }

    return curl
  }

  // Extract code blocks from markdown explanation
  const extractCodeBlocks = (explanation: string) => {
    const codeBlockRegex = /```(?:json|javascript|js)?\n([\s\S]*?)```/g
    const matches = [...explanation.matchAll(codeBlockRegex)]

    return matches.map((match) => match[1].trim())
  }

  // Format explanation to HTML (basic markdown parsing)
  const formatExplanation = (explanation: string) => {
    // Replace code blocks with placeholders to avoid processing their content
    const codeBlocks: string[] = []
    const withoutCodeBlocks = explanation.replace(/```(?:json|javascript|js)?\n([\s\S]*?)```/g, (match, code) => {
      codeBlocks.push(code.trim())
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })

    // Process markdown
    let formatted = withoutCodeBlocks
      // Headers
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Lists
      .replace(/^\s*\*\s(.*$)/gm, '<li class="ml-4">$1</li>')
      // Line breaks
      .replace(/\n\n/g, "<br/>")

    // Replace code block placeholders with actual HTML
    codeBlocks.forEach((code, index) => {
      formatted = formatted.replace(
        `__CODE_BLOCK_${index}__`,
        `<pre class="bg-gray-100 p-3 rounded-md overflow-x-auto my-2 text-sm"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`,
      )
    })

    return formatted
  }

  // Generate and download documentation as a DOC file
  const downloadDocumentation = () => {
    // Create a blob with HTML content
    const generateDocContent = () => {
      let content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>API Documentation - ${selectedRepo?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            h2 { color: #444; margin-top: 30px; }
            .method { 
              display: inline-block; 
              padding: 3px 8px; 
              border-radius: 4px; 
              font-weight: bold; 
              font-size: 12px; 
              margin-right: 10px;
            }
            .get { background-color: #e7f5ea; color: #0a7227; }
            .post { background-color: #e3f2fd; color: #0d47a1; }
            .put { background-color: #fff8e1; color: #ff8f00; }
            .delete { background-color: #ffebee; color: #c62828; }
            .endpoint { font-family: monospace; margin-bottom: 5px; }
            .handler { color: #666; font-size: 12px; margin-bottom: 20px; }
            pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
            .category { color: #666; font-size: 12px; margin-left: 10px; }
          </style>
        </head>
        <body>
          <h1>API Documentation - ${selectedRepo?.name}</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      `

      // Group endpoints by category
      const categories = Object.keys(categorizedEndpoints)
        .filter((cat) => cat !== "all")
        .sort()

      for (const category of categories) {
        if (categorizedEndpoints[category].length > 0) {
          content += `<h2>${category.charAt(0).toUpperCase() + category.slice(1)} Endpoints</h2>`

          for (const doc of categorizedEndpoints[category]) {
            const methodClass = doc.method.toLowerCase()
            content += `
              <div class="endpoint-container">
                <div class="endpoint">
                  <span class="method ${methodClass}">${doc.method}</span>
                  <span>${doc.routePath}</span>
                </div>
                <div class="handler">Handler: ${doc.handler}</div>
                <div>${doc.explanation.replace(/```/g, "<pre>").replace(/```/g, "</pre>")}</div>
              </div>
            `
          }
        }
      }

      content += `
        </body>
        </html>
      `

      return content
    }

    const htmlContent = generateDocContent()
    const blob = new Blob([htmlContent], { type: "application/msword" })
    const url = URL.createObjectURL(blob)

    // Create a download link and trigger it
    const link = document.createElement("a")
    link.href = url
    link.download = `${selectedRepo?.name}-api-documentation.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)

    toast.success("Documentation downloaded", {
      description: "The API documentation has been downloaded as a DOC file.",
      duration: 3000,
    })
  }

  useEffect(() => {
    // Get repository data from localStorage
    const repoData = localStorage.getItem("selectedRepo")
    if (repoData) {
      const parsedData = JSON.parse(repoData)
      setSelectedRepo(parsedData)
      setRepoUrl(parsedData.clone_url)
    }

    // Check if there's an endpoint in the URL to expand
    const endpointParam = searchParams.get("endpoint")
    if (endpointParam) {
      setExpandedEndpoints(new Set([endpointParam]))
      setActiveEndpoint(endpointParam)

      // Scroll to the endpoint after a short delay to ensure it's rendered
      setTimeout(() => {
        scrollToEndpoint(endpointParam)
      }, 500)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return

    setIsGenerating(true)
    setDocs([])
    setError(null)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get stream reader")
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n\n")

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue

          const data = line.replace("data: ", "")

          if (data === "done") {
            break
          }

          try {
            const routeDoc = JSON.parse(data)
            setDocs((prev) => {
              const newDocs = [...prev, routeDoc]
              // Auto-scroll to the latest endpoint
              setTimeout(() => {
                const endpointId = `${routeDoc.method}-${routeDoc.routePath}`
                setExpandedEndpoints((prev) => new Set([...prev, endpointId]))
                scrollToEndpoint(endpointId)
              }, 100)
              return newDocs
            })
          } catch (e) {
            console.error("Error parsing JSON:", e)
          }
        }
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  if (!selectedRepo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col max-w-7xl mx-auto m-2 lg:m-4 rounded-2xl h-[calc(100vh-5rem)] bg-white overflow-hidden">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 py-3 px-6 sticky top-0 z-10">
        <div className="flex flex-col space-y-3">
          {/* Repository info and generate button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">{selectedRepo.name}</h1>
              <Badge variant="outline" className="text-xs">
                {selectedRepo.language}
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                  </svg>
                  {selectedRepo.stargazers_count}
                </span>
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                  {selectedRepo.forks_count}
                </span>
              </div>
              <a
                href={selectedRepo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center text-sm"
              >
                View on GitHub <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Info className="h-4 w-4 mr-2" />
                    Repository Info
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h3 className="font-medium">Repository Details</h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Full Name:</span> {selectedRepo.full_name}
                      </p>
                      <p>
                        <span className="font-medium">Description:</span>{" "}
                        {selectedRepo.description || "No description available"}
                      </p>
                      <p>
                        <span className="font-medium">Visibility:</span> {selectedRepo.visibility}
                      </p>
                      <p>
                        <span className="font-medium">Clone URL:</span> {selectedRepo.clone_url}
                      </p>
                      <p>
                        <span className="font-medium">Open Issues:</span> {selectedRepo.open_issues_count}
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button onClick={handleSubmit} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Generate Docs
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={downloadDocumentation} disabled={docs.length === 0} className="ml-2">
                <Download className="mr-2 h-4 w-4" />
                Download Docs
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2" 
                onClick={() => setShowToc(!showToc)}
                title={showToc ? "Hide table of contents" : "Show table of contents"}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search and categories */}
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search endpoints, methods, or descriptions..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="absolute right-2.5 top-2.5" onClick={() => setSearchQuery("")}>
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content + Sidebar Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Documentation content */}
        <div 
          className={`flex-1 overflow-auto p-6 ${showToc ? "" : ""}`} 
          ref={contentRef}
        >
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documentation generated yet</h3>
              <p className="text-gray-500 mb-4">
                Click the &quot;Generate Docs&quot; button to analyze your repository and generate API documentation.
              </p>
              <Button className="px-6 py-3" onClick={handleSubmit} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Generate Docs
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
                <p className="text-gray-600">
                  This documentation is automatically generated from your repository code. It provides details about each
                  endpoint, including request parameters, response formats, and example usage.
                </p>
              </div>

              {filteredEndpoints.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                filteredEndpoints.map((doc, index) => {
                  const endpointId = `${doc.method}-${doc.routePath}`
                  const isExpanded = expandedEndpoints.has(endpointId)
                  const codeBlocks = extractCodeBlocks(doc.explanation)
                  const curl = generateCurl(doc)

                  return (
                    <div
                      key={index}
                      id={endpointId}
                      ref={(el) => {
                        endpointRefs.current[endpointId] = el
                      }}
                      className={`border rounded-md overflow-hidden mb-4 ${
                        activeEndpoint === endpointId ? "border-blue-300 shadow-sm" : "border-gray-200"
                      }`}
                    >
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleEndpoint(endpointId)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`px-2 py-1 rounded-md text-xs font-bold ${getMethodColor(doc.method)}`}>
                            {doc.method}
                          </div>
                          <div className="font-mono text-sm">{doc.routePath}</div>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryIcon(categorizeEndpoint(doc))}
                            {categorizeEndpoint(doc)}
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4">
                          <Tabs defaultValue="docs">
                            <TabsList className="mb-4">
                              <TabsTrigger value="docs">Documentation</TabsTrigger>
                              <TabsTrigger value="examples">Examples</TabsTrigger>
                              <TabsTrigger value="curl">cURL</TabsTrigger>
                            </TabsList>

                            <TabsContent value="docs">
                              <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: formatExplanation(doc.explanation) }}
                              />
                            </TabsContent>

                            <TabsContent value="examples">
                              {codeBlocks.length > 0 ? (
                                <div className="space-y-4">
                                  {codeBlocks.map((code, i) => (
                                    <div key={i} className="relative">
                                      <div className="absolute right-2 top-2 z-10">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full bg-white/80 hover:bg-white"
                                                onClick={() => copyToClipboard(code, "Example code")}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Copy code</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                      <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                                        <code>{code}</code>
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">No code examples available</div>
                              )}
                            </TabsContent>

                            <TabsContent value="curl">
                              <div className="relative">
                                <div className="absolute right-2 top-2 z-10">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 rounded-full bg-white/80 hover:bg-white"
                                          onClick={() => copyToClipboard(curl, "cURL command")}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Copy cURL</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                                  <code>{curl}</code>
                                </pre>
                              </div>
                              <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                                <h4 className="text-sm font-medium mb-2 flex items-center">
                                  <Terminal className="h-4 w-4 mr-2" />
                                  How to use this command
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Run this command in your terminal to test the API endpoint. You may need to modify the
                                  request parameters or add authentication headers based on your API requirements.
                                </p>
                              </div>
                            </TabsContent>
                          </Tabs>

                          <div className="mt-4 text-xs text-gray-500">
                            <span className="font-medium">Handler:</span> {doc.handler}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Table of Contents Sidebar */}
        {showToc && docs.length > 0 && (
          <div className="w-64 bg-transparent p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm uppercase text-gray-500">Table of Contents</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowToc(false)} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {Object.keys(categorizedEndpoints)
                .filter((category) => category !== "all" && categorizedEndpoints[category].length > 0)
                .sort()
                .map((category) => {
                  return (
                    <div key={category} className="mb-3">
                      <div
                        className={`flex items-center py-1 px-2 rounded-md text-sm text-gray-600 font-medium cursor-pointer ${
                          activeCategory === category ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"
                        }`}
                        onClick={() => scrollToCategory(category)}
                        ref={(el) => {
                          categoryRefs.current[category] = el
                        }}
                      >
                        {getCategoryIcon(category)}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {categorizedEndpoints[category].length}
                        </Badge>
                      </div>
                      {activeCategory === category && (
                        <div className="ml-6 mt-1 space-y-1">
                          {categorizedEndpoints[category].map((doc, index) => {
                            const endpointId = `${doc.method}-${doc.routePath}`
                            return (
                              <div
                                key={index}
                                className={`flex items-center py-1 px-2 rounded-md text-xs cursor-pointer ${
                                  activeEndpoint === endpointId ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"
                                }`}
                                onClick={() => {
                                  setExpandedEndpoints((prev) => new Set([...prev, endpointId]))
                                  setActiveEndpoint(endpointId)
                                  scrollToEndpoint(endpointId)
                                }}
                              >
                                <div className={`px-1 mr-2 rounded text-xs ${getMethodColor(doc.method)}`}>
                                  {doc.method}
                                </div>
                                <div className="truncate">{doc.routePath}</div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-3 px-6">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="font-medium">{docs.length}</span>
            <span>endpoints documented</span>
          </div>
          <div>
            {isGenerating ? (
              <span className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Analyzing repository...
              </span>
            ) : docs.length > 0 ? (
              <span>Documentation generated successfully</span>
            ) : (
              <span>Ready to generate documentation</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}