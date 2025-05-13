"use client"

import type React from "react"
import { useEffect, useState, useMemo, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  Search,
  Copy,
  Terminal,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileText,
  Lock,
  Calendar,
  CreditCard,
  X,
  ExternalLink,
  User,
  Users,
  Download,
  List,
  Upload,
  RefreshCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

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
  requestBody?: string
  responseSuccess?: string
}

type Category = string

export default function ApiDocumentation() {
  const params = useParams()
  const path = params.path as string | undefined
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [docs, setDocs] = useState<RouteDoc[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all")
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null)
  const [showToc, setShowToc] = useState(true)

  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentRef = useRef<HTMLDivElement>(null)
  const endpointRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const { data: session } = useSession()

  // Fetch initial documentation
  useEffect(() => {
    if (!path) {
      setError("No documentation ID provided in the URL")
      return
    }

    const fetchDocs = async () => {
      setIsFetching(true)
      setError(null)
      try {
        const response = await fetch(`/api/documentations/${path}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch documentation: ${response.statusText}`)
        }
        const data = await response.json()

        if (!data.documentation || !data.documentation.content) {
          throw new Error("No valid documentation content found")
        }

        let parsedDocs: RouteDoc[]
        try {
          parsedDocs = JSON.parse(data.documentation.content) as RouteDoc[]
        } catch (parseError) {
          console.error("Error parsing content:", parseError)
          throw new Error("Invalid documentation content format")
        }

        if (!Array.isArray(parsedDocs) || parsedDocs.length === 0) {
          throw new Error("No valid endpoints found in documentation content")
        }

        setDocs(parsedDocs)

        if (data.documentation.metadata) {
          setSelectedRepo({
            name: data.documentation.repo_name || "Unknown Repository",
            full_name: data.documentation.repo_name || "Unknown Repository",
            description: data.documentation.metadata.repo_description || null,
            language: data.documentation.metadata.language || "Unknown",
            visibility: "public",
            stargazers_count: 0,
            forks_count: 0,
            open_issues_count: 0,
            html_url: data.documentation.metadata.repo_url || "",
            clone_url: data.documentation.metadata.repo_url || "",
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        console.error("Fetch error:", err)
      } finally {
        setIsFetching(false)
      }
    }

    fetchDocs()
  }, [path])

  // Update category order when docs change
  useEffect(() => {
    const categories = new Set<string>()
    docs.forEach((doc) => {
      const category = categorizeEndpoint(doc)
      categories.add(category)
    })
    setCategoryOrder(Array.from(categories).sort())
  }, [docs])

  // Scroll to endpoint specified in URL
  useEffect(() => {
    const endpointParam = searchParams.get("endpoint")
    if (endpointParam) {
      setExpandedEndpoints(new Set([endpointParam]))
      setActiveEndpoint(endpointParam)
      setTimeout(() => scrollToEndpoint(endpointParam), 500)
    }
  }, [searchParams])

  // Handle unsaved changes alert on page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = "You have unsaved changes in your API documentation. Are you sure you want to leave without saving?"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  // Categorize endpoints
  const categorizeEndpoint = (endpoint: RouteDoc): Category => {
    const path = endpoint.routePath.toLowerCase()
    const segments = path.split("/").filter(Boolean)
    if (segments.length > 0) {
      return segments[0]
    }
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

  const categorizedEndpoints = useMemo(() => {
    const result: Record<string, RouteDoc[]> = { all: [] }
    const categories = new Set<string>()
    docs.forEach((doc) => {
      const category = categorizeEndpoint(doc)
      categories.add(category)
    })
    categories.forEach((category) => {
      result[category] = []
    })
    docs.forEach((doc) => {
      const category = categorizeEndpoint(doc)
      result[category].push(doc)
      result.all.push(doc)
    })
    return result
  }, [docs])

  const filteredEndpoints = useMemo(() => {
    if (!searchQuery) return categorizedEndpoints[activeCategory] || []
    return (categorizedEndpoints[activeCategory] || []).filter(
      (doc) =>
        doc.routePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.explanation.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categorizedEndpoints, searchQuery, activeCategory])

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
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
    const params = new URLSearchParams(searchParams.toString())
    params.set("endpoint", endpointId)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const scrollToEndpoint = (endpointId: string) => {
    const element = endpointRefs.current[endpointId]
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const scrollToCategory = (category: string) => {
    setActiveCategory(category)
    if (categorizedEndpoints[category]?.length > 0) {
      const firstEndpoint = categorizedEndpoints[category][0]
      const endpointId = `${firstEndpoint.method}-${firstEndpoint.routePath}`
      setTimeout(() => scrollToEndpoint(endpointId), 100)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard", {
      description: `${type} has been copied to your clipboard.`,
      duration: 2000,
    })
  }

  const generateCurl = (endpoint: RouteDoc) => {
    const baseUrl = "https://api.example.com"
    const method = endpoint.method.toUpperCase()
    const path = endpoint.routePath
    let curl = `curl -X ${method} ${baseUrl}${path}`
    if (["POST", "PUT", "PATCH"].includes(method)) {
      curl += ` -H "Content-Type: application/json" -d '${endpoint.requestBody || '{"example": "data"}'}'`
    }
    return curl
  }

  const formatExplanation = (explanation: string) => {
    const codeBlocks: string[] = []
    const withoutCodeBlocks = explanation.replace(/```(?:json|javascript|js)?\n([\s\S]*?)```/g, (match, code) => {
      codeBlocks.push(code.trim())
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })
    let formatted = withoutCodeBlocks
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^\s*\*\s(.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, "<br/>")
    codeBlocks.forEach((code, index) => {
      formatted = formatted.replace(
        `__CODE_BLOCK_${index}__`,
        `<pre class="bg-gray-100 p-3 rounded-md overflow-x-auto my-2 text-sm"><code>${code.replace(/</g, "<").replace(/>/g, ">")}</code></pre>`
      )
    })
    return formatted
  }

  const formatJson = (jsonString: string | undefined) => {
    if (!jsonString) return "{}"
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonString
    }
  }

  const handleRegenerate = async () => {
    if (!selectedRepo?.html_url) {
      toast.error("No repository URL", {
        description: "Cannot regenerate documentation without a repository URL.",
        duration: 3000,
      })
      return
    }

    const repoUrl = selectedRepo.html_url.endsWith(".git")
      ? selectedRepo.html_url
      : `${selectedRepo.html_url}.git`

    setIsGenerating(true)
    setDocs([])
    setError(null)
    setHasUnsavedChanges(true)

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
      const newDocs: RouteDoc[] = []

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
            newDocs.push(routeDoc)
            setDocs([...newDocs])
            setTimeout(() => {
              const endpointId = `${routeDoc.method}-${routeDoc.routePath}`
              setExpandedEndpoints((prev) => new Set([...prev, endpointId]))
              scrollToEndpoint(endpointId)
            }, 100)
          } catch (e) {
            console.error("Error parsing JSON:", e)
          }
        }
      }

      toast.success("Documentation regenerated", {
        description: "The API documentation has been successfully regenerated.",
        duration: 3000,
      })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast.error("Regeneration failed", {
        description: "Failed to regenerate the documentation. Please try again.",
        duration: 3000,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const newOrder = [...categoryOrder]
    const [reorderedItem] = newOrder.splice(result.source.index, 1)
    newOrder.splice(result.destination.index, 0, reorderedItem)
    setCategoryOrder(newOrder)
    setHasUnsavedChanges(true)
  }

  const downloadDocumentation = () => {
    try {
      const generateDocContent = () => {
        let content = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset="UTF-8">
            <title>API Documentation - ${selectedRepo?.name || "Documentation"}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; }
              h1 { color: #333; font-size: 24pt; margin-bottom: 10pt; }
              h2 { color: #444; font-size: 18pt; margin-top: 20pt; margin-bottom: 10pt; }
              .endpoint-container { margin-bottom: 20pt; page-break-inside: avoid; }
              .method-get { background-color: #e7f5ea; color: #0a7227; padding: 2pt 5pt; font-weight: bold; }
              .method-post { background-color: #e3f2fd; color: #0d47a1; padding: 2pt 5pt; font-weight: bold; }
              .method-put { background-color: #fff8e1; color: #ff8f00; padding: 2pt 5pt; font-weight: bold; }
              .method-delete { background-color: #ffebee; color: #c62828; padding: 2pt 5pt; font-weight: bold; }
              .endpoint { font-family: Consolas, monospace; font-weight: bold; margin-bottom: 5pt; }
              .handler { color: #666; margin-bottom: 10pt; }
              .code-block { 
                background-color: #f5f5f5; 
                padding: 10pt; 
                font-family: Consolas, monospace; 
                margin: 10pt 0; 
                white-space: pre-wrap;
                border: 1pt solid #ddd;
              }
              table { border-collapse: collapse; width: 100%; }
              td, th { border: 1px solid #ddd; padding: 8px; }
            </style>
            <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
          </head>
          <body>
            <h1>API Documentation - ${selectedRepo?.name || "Documentation"}</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        `
        for (const category of categoryOrder) {
          if (categorizedEndpoints[category]?.length > 0) {
            content += `<h2>${category.charAt(0).toUpperCase() + category.slice(1)} Endpoints</h2>`
            for (const doc of categorizedEndpoints[category]) {
              const methodClass = `method-${doc.method.toLowerCase()}`
              content += `
                <div class="endpoint-container">
                  <div class="endpoint">
                    <span class="${methodClass}">${doc.method}</span>
                    ${doc.routePath}
                  </div>
                  <div class="handler">Handler: ${doc.handler}</div>
              `
              let explanation = doc.explanation
              explanation = explanation.replace(/```(.*?)```/gs, (match, code) => {
                return `<div class="code-block">${code}</div>`
              })
              content += `<div>${explanation}</div>`
              if (doc.requestBody) {
                content += `<div><strong>Request Body:</strong><div class="code-block">${formatJson(doc.requestBody)}</div></div>`
              }
              if (doc.responseSuccess) {
                content += `<div><strong>Response Success:</strong><div class="code-block">${formatJson(doc.responseSuccess)}</div></div>`
              }
              content += `</div>`
            }
          }
        }
        content += `</body></html>`
        return content
      }
      const htmlContent = generateDocContent()
      const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${selectedRepo?.name || "api"}-documentation.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success("Documentation downloaded", {
        description: "The API documentation has been downloaded as a DOC file.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error generating documentation:", error)
      toast.error("Failed to download documentation", {
        description: "There was an error generating the documentation file.",
        duration: 3000,
      })
    }
  }

  const handleSave = async () => {
    if (!session) {
      toast.error("Authentication required", {
        description: "You must be logged in to save documentation.",
        duration: 3000,
      })
      return
    }
    if (!selectedRepo) {
      toast.error("No repository selected", {
        description: "Please load a valid documentation.",
        duration: 3000,
      })
      return
    }
    try {
      const documentationContent = {
        repo_name: selectedRepo.name,
        content: JSON.stringify(docs),
        metadata: {
          repo_url: selectedRepo.html_url,
          repo_description: selectedRepo.description,
          language: selectedRepo.language,
          generated_at: new Date().toISOString(),
          endpoints_count: docs.length,
          categories: categoryOrder,
        },
        status: "draft",
      }
      const response = await fetch("/api/documentations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(documentationContent),
      })
      if (!response.ok) {
        throw new Error("Failed to save documentation")
      }
      await response.json()
      setHasUnsavedChanges(false)
      toast.success("Documentation saved", {
        description: "Your API documentation has been saved successfully.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Save failed", {
        description: "Failed to save the documentation. Please try again.",
        duration: 3000,
      })
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className=" max-w-7xl mx-auto">

   
    <div className="flex flex-col  lg:m-4 md:rounded-2xl h-[calc(100vh-5rem)] bg-white overflow-hidden">
      <div className="bg-white  border-b border-gray-200 py-3 px-2 lg:px-6 sticky top-0 z-10">
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
              {selectedRepo ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="h-8 text-lg text-left cursor-pointer font-medium truncate">
                      {selectedRepo.name}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h3 className="font-medium">Repository Details</h3>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Full Name:</span> {selectedRepo.full_name}
                        </p>
                        <p>
                          <span className="font-medium">Language:</span> {selectedRepo.language}
                        </p>
                        <p>
                          <span className="font-medium">Repo URL:</span>{" "}
                          <a href={selectedRepo.html_url} target="_blank" rel="noopener noreferrer">
                            {selectedRepo.html_url}
                          </a>
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <h2 className="text-lg font-medium">API Documentation</h2>
              )}
              {selectedRepo && (
                <div className="flex items-center flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedRepo.language}
                  </Badge>
                  <a
                    href={selectedRepo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center text-sm"
                  >
                    View on GitHub <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {docs.length > 0 && (
                <>
                  <Button variant="outline" onClick={downloadDocumentation}>
                    <Download className=" h-4 w-4" />
                    Download Docs
                  </Button>
                  <Button onClick={handleSave} disabled={!session || docs.length === 0}>
                    <Upload className=" h-4 w-4" />
                    Save
                  </Button>
                  
                  <Button variant="outline" onClick={handleRegenerate} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className=" h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4 " />
                        Regenerate
                      </>
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                className=""
                onClick={() => setShowToc(!showToc)}
                title={showToc ? "Hide table of contents" : "Show table of contents"}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
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


      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 overflow-auto p-6 ${showToc ? "" : ""}`} ref={contentRef}>
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          ) :  docs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isGenerating ? "Regenerating documentation" : "No documentation available"}
              </h3>
              <p className="text-gray-500 mb-4">
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analyzing repository and generating documentation from latest commit...
            </span>
          ) : (
            "The documentation could not be loaded. Please check the documentation ID or try again."
          )}
              </p>
            </div>
          ): (
            <div className="space-y-1">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
                <p className="text-gray-600">
                  This documentation provides details about each endpoint, including request parameters, response formats,
                  and example usage.
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
                              <TabsTrigger className="w-44" value="curl">cURL</TabsTrigger>
                            
                            </TabsList>
                            <TabsContent value="docs">
                              <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: formatExplanation(doc.explanation) }}
                              />
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
                                          className="h-8 bg-white/80 hover:bg-white"
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
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
        {showToc && docs.length > 0 && (
          <div className="w-64 bg-transparent p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm uppercase text-gray-500">Table of Contents</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowToc(false)} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p
              className={`cursor-pointer flex items-center py-1 my-2 px-2 rounded-md text-sm ${
                activeCategory === "all" ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveCategory("all")}
            >
              All API Endpoints
            </p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-0">
                    {categoryOrder
                      .filter((category) => category !== "all" && categorizedEndpoints[category]?.length > 0)
                      .map((category, index) => (
                        <Draggable key={category} draggableId={category} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-3"
                            >
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
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </div>
      <div className="bg-white border-t border-gray-200 py-3 px-6">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="font-medium">{docs.length}</span>
            <span>endpoints documented</span>
          </div>
          <div>
            {isFetching ? (
              <span className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Loading documentation...
              </span>
            ) : isGenerating ? (
              <span className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Generating endpoints from latest commit...
              </span>
            ) : docs.length > 0 ? (
              <span className="text-green-600">
              Documentation loaded successfully 
              </span>
            ) : (
              <span>Failed to load documentation</span>
            )}
          </div>
        </div>
      </div>
    </div> </div>
  )
}