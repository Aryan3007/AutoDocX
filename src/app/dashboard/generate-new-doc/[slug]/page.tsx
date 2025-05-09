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
  User,
  Users,
  Download,
  List,
  Upload,
  Star,
  GitFork,
  GitGraph,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import ReactFlow, { Background, Controls, MiniMap, Node, Edge } from "reactflow"
import "reactflow/dist/style.css"

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
  explanation?: string
}

interface Diagram {
  label: string
  data: {
    nodes: Node[]
    edges: Edge[]
  }
}

type Category = string

export default function ApiDocumentation() {
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [repoUrl, setRepoUrl] = useState("")
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false)
  const [isGeneratingGraphs, setIsGeneratingGraphs] = useState(false)
  const [docs, setDocs] = useState<RouteDoc[]>([])
  const [diagrams, setDiagrams] = useState<Diagram[]>([])
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
  const { data: session } = useSession()

  // Hardcode the diagram for testing
  useEffect(() => {
    setDiagrams([
      {
        label: "flowchart",
        data: {
          nodes: [
            { id: "A", data: { label: "User Router" }, position: { x: 0, y: 0 }, parentId: "group-Express Router", extent: "parent" },
            { id: "B", data: { label: "User Controller" }, position: { x: 200, y: 0 }, parentId: "group-Express Router", extent: "parent" },
            { id: "C", data: { label: "Service Router" }, position: { x: 0, y: 100 }, parentId: "group-Express Router", extent: "parent" },
            { id: "D", data: { label: "Service Controller" }, position: { x: 200, y: 100 }, parentId: "group-Express Router", extent: "parent" },
            { id: "E", data: { label: "Appointment Router" }, position: { x: 0, y: 200 }, parentId: "group-Express Router", extent: "parent" },
            { id: "F", data: { label: "Appointment Controller" }, position: { x: 200, y: 200 }, parentId: "group-Express Router", extent: "parent" },
            { id: "G", data: { label: "Review Router" }, position: { x: 0, y: 300 }, parentId: "group-Express Router", extent: "parent" },
            { id: "H", data: { label: "Review Controller" }, position: { x: 200, y: 300 }, parentId: "group-Express Router", extent: "parent" },
            { id: "I", data: { label: "User Service" }, position: { x: 0, y: 0 }, parentId: "group-Controllers", extent: "parent" },
            { id: "J", data: { label: "Service Service" }, position: { x: 0, y: 100 }, parentId: "group-Controllers", extent: "parent" },
            { id: "K", data: { label: "Appointment Service" }, position: { x: 0, y: 200 }, parentId: "group-Controllers", extent: "parent" },
            { id: "L", data: { label: "Review Service" }, position: { x: 0, y: 300 }, parentId: "group-Controllers", extent: "parent" },
            { id: "M", data: { label: "User Model (MongoDB)" }, position: { x: 0, y: 0 }, parentId: "group-Services", extent: "parent" },
            { id: "N", data: { label: "Service Model (MongoDB)" }, position: { x: 0, y: 100 }, parentId: "group-Services", extent: "parent" },
            { id: "O", data: { label: "Appointment Model (MongoDB)" }, position: { x: 0, y: 200 }, parentId: "group-Services", extent: "parent" },
            { id: "P", data: { label: "Review Model (MongoDB)" }, position: { x: 0, y: 300 }, parentId: "group-Services", extent: "parent" },
            { id: "group-Express Router", data: { label: "Express Router" }, position: { x: 0, y: 0 }, style: { width: 300, height: 400, backgroundColor: "#f0f0f0", border: "1px solid #ccc" }, type: "group" },
            { id: "group-Controllers", data: { label: "Controllers" }, position: { x: 350, y: 0 }, style: { width: 200, height: 400, backgroundColor: "#f0f0f0", border: "1px solid #ccc" }, type: "group" },
            { id: "group-Services", data: { label: "Services" }, position: { x: 600, y: 0 }, style: { width: 200, height: 400, backgroundColor: "#f0f0f0", border: "1px solid #ccc" }, type: "group" }
          ],
          edges: [
            { id: "e1", source: "A", target: "B", type: "default" },
            { id: "e2", source: "C", target: "D", type: "default" },
            { id: "e3", source: "E", target: "F", type: "default" },
            { id: "e4", source: "G", target: "H", type: "default" },
            { id: "e5", source: "B", target: "I", type: "default" },
            { id: "e6", source: "D", target: "J", type: "default" },
            { id: "e7", source: "F", target: "K", type: "default" },
            { id: "e8", source: "H", target: "L", type: "default" },
            { id: "e9", source: "I", target: "M", type: "default" },
            { id: "e10", source: "J", target: "N", type: "default" },
            { id: "e11", source: "K", target: "O", type: "default" },
            { id: "e12", source: "L", target: "P", type: "default" }
          ]
        }
      }
    ])
  }, [])

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
    if (!searchQuery) return categorizedEndpoints[activeCategory]
    return categorizedEndpoints[activeCategory].filter(
      (doc) =>
        doc.routePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.explanation?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    )
  }, [categorizedEndpoints, searchQuery, activeCategory])

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
      setTimeout(() => {
        scrollToEndpoint(endpointId)
      }, 100)
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
    const method = endpoint.method
    const path = endpoint.routePath
    let curl = `curl -X ${method} ${baseUrl}${path}`
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      curl += ` -H "Content-Type: application/json" -d '{"example": "data"}'`
    }
    return curl
  }

  const formatExplanation = (explanation?: string) => {
    if (!explanation) {
      return "<p>No explanation provided.</p>"
    }
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

  const downloadDocumentation = () => {
    try {
      let content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="UTF-8">
          <title>API Documentation - ${selectedRepo?.name}</title>
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
          <h1>API Documentation - ${selectedRepo?.name}</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      `
      const categories = Object.keys(categorizedEndpoints).filter((cat) => cat !== "all").sort()
      for (const category of categories) {
        if (categorizedEndpoints[category].length > 0) {
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
            let explanation = doc.explanation ?? "No explanation provided."
            explanation = explanation.replace(/```(.*?)```/gs, (match, code) => {
              return `<div class="code-block">${code}</div>`
            })
            content += `<div>${explanation}</div></div>`
          }
        }
      }
      content += `</body></html>`
      const blob = new Blob([content], { type: 'application/msword;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${selectedRepo?.name}-api-documentation.doc`
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
        description: "Please select a repository before saving.",
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
          categories: Object.keys(categorizedEndpoints).filter((cat) => cat !== "all"),
        },
        status: "draft",
      }
      const response = await fetch("/api/documentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documentationContent),
      })
      if (!response.ok) {
        throw new Error("Failed to save documentation")
      }
      await response.json()
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


  const handleGenerateGraphs = async () => {
    if (!repoUrl) {
      toast.error("No repository selected", {
        description: "Please select a repository to generate graphs.",
        duration: 3000,
      })
      return
    }
    setIsGeneratingGraphs(true)
    setDiagrams([])
    setError(null)
    try {
      const response = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      })
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }
      setDiagrams([{ label: result.label, data: result.data }])
      toast.success("Graph generated successfully!", {
        description: "The architecture visualization has been generated.",
        duration: 3000,
      })
    } catch (err) {
      console.error("Error generating graphs:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsGeneratingGraphs(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return
    setIsGeneratingDocs(true)
    setDocs([])
    setDiagrams([])
    setError(null)
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setIsGeneratingDocs(false)
    }
  }

  useEffect(() => {
    const repoData = localStorage.getItem("selectedRepo")
    if (repoData) {
      const parsedData = JSON.parse(repoData)
      setSelectedRepo(parsedData)
      setRepoUrl(parsedData.clone_url)
    }
    const endpointParam = searchParams.get("endpoint")
    if (endpointParam) {
      setExpandedEndpoints(new Set([endpointParam]))
      setActiveEndpoint(endpointParam)
      setTimeout(() => {
        scrollToEndpoint(endpointParam)
      }, 500)
    }
  }, [searchParams])

  if (!selectedRepo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:m-4 md:rounded-2xl h-[calc(100vh-5rem)] bg-white overflow-hidden">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 py-3 px-6 sticky top-0 z-10">
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
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
                      <p><span className="font-medium">Full Name:</span> {selectedRepo.full_name}</p>
                      <p><span className="font-medium">Description:</span> {selectedRepo.description || "No description available"}</p>
                      <p><span className="font-medium">Visibility:</span> {selectedRepo.visibility}</p>
                      <p><span className="font-medium">Clone URL:</span> {selectedRepo.clone_url}</p>
                      <p><span className="font-medium">Open Issues:</span> {selectedRepo.open_issues_count}</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex items-center flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">{selectedRepo.language}</Badge>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="flex items-center"><Star className="h-4 w-4 mr-1" />{selectedRepo.stargazers_count}</span>
                  <span className="flex items-center"><GitFork className="h-4 w-4 mr-1" />{selectedRepo.forks_count}</span>
                </div>
                <a href={selectedRepo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center text-sm">
                  View on GitHub <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {docs.length === 0 ? (
                <Button className="flex-1 md:flex-none" onClick={handleSubmit} disabled={isGeneratingDocs}>
                  {isGeneratingDocs ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                  ) : (
                    <><Github className="mr-2 h-4 w-4" />Generate Docs</>
                  )}
                </Button>
              ) : (
                <Button variant="outline" className="flex-1 md:flex-none" onClick={downloadDocumentation}>
                  <Download className="mr-2 h-4 w-4" />Download Docs
                </Button>
              )}
              <Button className="flex-1 md:flex-none" onClick={handleSave} disabled={!session}>
                <Upload className="h-4 w-4 mr-2" />Save
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
            <div>
              <Button variant="outline" onClick={handleGenerateGraphs} disabled={isGeneratingGraphs}>
                {isGeneratingGraphs ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Graphs...</>
                ) : (
                  <><GitGraph className="h-5 w-5 mr-2" />Generate Graphs</>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="ml-2"
                onClick={() => setShowToc(!showToc)}
                title={showToc ? "Hide table of contents" : "Show table of contents"}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="documentation" className="flex-1 overflow-hidden">
        <TabsList className="bg-white mt-2 px-6">
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="graphs">Graphs</TabsTrigger>
        </TabsList>
        <TabsContent value="documentation" className="h-full overflow-hidden">
          <div className="flex flex-1 h-full overflow-hidden">
            <div className={`flex-1 overflow-auto p-6 ${showToc ? "" : ""}`} ref={contentRef}>
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
                  <Button className="px-6 py-3" onClick={handleSubmit} disabled={isGeneratingDocs}>
                    {isGeneratingDocs ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                    ) : (
                      <><Github className="mr-2 h-4 w-4" />Generate Docs</>
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
                      const curl = generateCurl(doc)
                      return (
                        <div
                          key={index}
                          id={endpointId}
                          ref={(el) => { endpointRefs.current[endpointId] = el }}
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
                <div className="space-y-0">
                  {Object.keys(categorizedEndpoints)
                    .filter((category) => category !== "all" && categorizedEndpoints[category].length > 0)
                    .sort()
                    .map((category) => (
                      <div key={category} className="mb-3">
                        <div
                          className={`flex items-center py-1 px-2 rounded-md text-sm text-gray-600 font-medium cursor-pointer ${
                            activeCategory === category ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"
                          }`}
                          onClick={() => scrollToCategory(category)}
                          ref={(el) => { categoryRefs.current[category] = el }}
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
                    ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="graphs" className="h-full overflow-auto p-6 pt-1">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          ) : isGeneratingGraphs ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Graphs</h3>
              <p className="text-gray-500">Analyzing repository and generating visualizations...</p>
            </div>
          ) : diagrams.length === 0 ? (
            <div className="text-center py-12">
              <GitGraph className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No graphs generated yet</h3>
              <p className="text-gray-500 mb-4">
                Click the &quot;Generate Graphs&quot; button to analyze your repository and generate architecture visualizations.
              </p>
              <Button onClick={handleGenerateGraphs} disabled={isGeneratingGraphs}>
                {isGeneratingGraphs ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Graphs...</>
                ) : (
                  <><GitGraph className="mr-2 h-4 w-4" />Generate Graphs</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {diagrams.map((diagram, index) => (
                <div key={index} className="border rounded-md p-6 bg-white shadow-sm">
                  <h2 className="text-xl font-semibold mb-2 capitalize">{diagram.label}</h2>
                  <p className="text-gray-600 mb-4">
                    {diagram.label === "flowchart"
                      ? "High-level flow of the backend system, including routers, middleware, services, and database access."
                      : "Data models, schemas, and class relationships in the backend system."}
                  </p>
                  <div className="bg-gray-50 p-4 rounded-md" style={{ height: "600px", overflow: "auto" }}>
                    <ReactFlow
                      nodes={diagram.data.nodes}
                      edges={diagram.data.edges}
                      fitView
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable={false}
                      style={{ background: "#f9fafb" }}
                    >
                      <Background />
                      <Controls />
                      <MiniMap />
                    </ReactFlow>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-3 px-6">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="font-medium">{docs.length}</span>
            <span>endpoints documented</span>
            <span className="mx-2">•</span>
            <span className="font-medium">{diagrams.length}</span>
            <span>diagrams generated</span>
          </div>
          <div>
            {isGeneratingDocs || isGeneratingGraphs ? (
              <span className="flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                {isGeneratingDocs ? "Analyzing repository..." : "Generating graphs..."}
              </span>
            ) : docs.length > 0 || diagrams.length > 0 ? (
              <span>Content generated successfully</span>
            ) : (
              <span>Ready to generate content</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}