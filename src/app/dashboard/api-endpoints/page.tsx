"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Copy, ExternalLink } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
// import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Mock data based on the provided examples
const mockEndpoints = [
  {
    method: "POST",
    routePath: "/register",
    handler: "router.post('/register', registerController)",
    explanation:
      '*   **HTTP Method:** POST\n*   **Route Path:** `/register`\n*   **Purpose:** Handles user registration.\n*   **Expected Payload (Example):**\n    ```json\n    {\n      "username": "newuser",\n      "password": "password123",\n      "email": "user@example.com"\n    }\n    ```\n*   **Expected Response (Example Success):**\n    ```json\n    {\n      "message": "User registered successfully",\n      "userId": "someUniqueId"\n    }\n    ```\n*   **registerController:** Handles the logic for creating a new user (e.g., validating data, saving to database, hashing password). It is not shown in the example.\n',
  },
  {
    method: "POST",
    routePath: "/login",
    handler: "router.post('/login', loginController)",
    explanation:
      '* **HTTP Method:** POST\n* **Route Path:** `/login`\n* **Purpose:** Authenticates a user and returns a JWT token.\n* **Expected Payload (Example):**\n```json\n{\n  "email": "user@example.com",\n  "password": "password123"\n}\n```\n* **Expected Response (Example Success):**\n```json\n{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "user": {\n    "id": "userId",\n    "name": "User Name",\n    "email": "user@example.com"\n  }\n}\n```\n* **loginController:** Handles the authentication logic (e.g., verifying credentials, generating JWT token).',
  },
  {
    method: "GET",
    routePath: "/test",
    handler: "router.get('/test',requireSignIn,isAdmin)",
    explanation:
      "* **HTTP Method:** GET\n* **Route Path:** `/test`\n* **Expected Payload:** None\n* **Expected Response:** Test response for admin users\n* **Middleware:**\n  * `requireSignIn`: Verifies the user is authenticated\n  * `isAdmin`: Verifies the user has admin privileges",
  },
  {
    method: "GET",
    routePath: "/user-auth",
    handler: "router.get('/user-auth',requireSignIn, (req, res)=>{\r\n res.status(200).send({ok:true})\r\n})",
    explanation:
      "* **HTTP Method:** GET\n* **Route Path:** `/user-auth`\n* **Purpose:** Verifies if a user is authenticated\n* **Expected Payload:** None\n* **Expected Response:** `{ok: true}` if authenticated\n* **Middleware:**\n  * `requireSignIn`: Verifies the user is authenticated",
  },
  {
    method: "GET",
    routePath: "/admin-auth",
    handler: "router.get('/admin-auth',requireSignIn,isAdmin, (req, res)=>{\r\n res.status(200).send({ok:true})\r\n})",
    explanation:
      "* **HTTP Method:** GET\n* **Route Path:** `/admin-auth`\n* **Purpose:** Verifies if a user is authenticated and has admin privileges\n* **Expected Payload:** None\n* **Expected Response:** `{ok: true}` if authenticated and admin\n* **Middleware:**\n  * `requireSignIn`: Verifies the user is authenticated\n  * `isAdmin`: Verifies the user has admin privileges",
  },
  {
    method: "PUT",
    routePath: "/profile",
    handler: 'router.put("/profile", requireSignIn, updateProfileController)',
    explanation:
      '* **HTTP Method:** PUT\n* **Route Path:** `/profile`\n* **Purpose:** Updates user profile information\n* **Expected Payload (Example):**\n```json\n{\n  "name": "Updated Name",\n  "email": "updated@example.com",\n  "address": "123 New Street",\n  "phone": "555-123-4567"\n}\n```\n* **Expected Response (Example Success):**\n```json\n{\n  "success": true,\n  "message": "Profile updated successfully",\n  "user": {\n    "id": "userId",\n    "name": "Updated Name",\n    "email": "updated@example.com",\n    "address": "123 New Street",\n    "phone": "555-123-4567"\n  }\n}\n```\n* **Middleware:**\n  * `requireSignIn`: Verifies the user is authenticated\n* **updateProfileController:** Handles the logic for updating user profile information',
  },
]

// Helper function to parse code blocks from markdown
const parseCodeBlocks = (text: string) => {
  const codeBlockRegex = /```(json|javascript|typescript|js|ts)?\n([\s\S]*?)```/g
  const codeBlocks: { language: string; code: string }[] = []

  let match
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
    })
  }

  return codeBlocks
}

// Helper function to parse markdown text
const parseMarkdown = (text: string) => {
  // Replace code blocks with placeholders
  const codeBlocks = parseCodeBlocks(text)
  let processedText = text

  codeBlocks.forEach((_, index) => {
    const placeholder = `__CODE_BLOCK_${index}__`
    processedText = processedText.replace(/```(?:json|javascript|typescript|js|ts)?\n[\s\S]*?```/, placeholder)
  })

  // Process bold text
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

  // Process lists
  processedText = processedText.replace(/^\*\s+(.*?)$/gm, "<li>$1</li>")

  // Replace placeholders with formatted code blocks
  codeBlocks.forEach((block, index) => {
    const placeholder = `__CODE_BLOCK_${index}__`
    const formattedCode = `<pre class="bg-secondary/50 p-3 rounded-md overflow-x-auto my-2"><code>${block.code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`
    processedText = processedText.replace(placeholder, formattedCode)
  })

  return processedText
}

// Method badge colors
const methodColors: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  POST: "bg-green-500/10 text-green-500 border-green-500/20",
  PUT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  PATCH: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

export default function ApiEndpointsPage() {
  const [endpoints] = useState(mockEndpoints)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeMethod, setActiveMethod] = useState<string | null>(null)
//   const { toast } = useToast()

  // Filter endpoints based on search query and active method
  const filteredEndpoints = endpoints.filter((endpoint) => {
    const matchesSearch =
      endpoint.routePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.handler.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.explanation.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesMethod = activeMethod ? endpoint.method === activeMethod : true

    return matchesSearch && matchesMethod
  })

  // Get unique methods for filter tabs
  const methods = Array.from(new Set(endpoints.map((endpoint) => endpoint.method)))

  // Copy handler code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // toast({
    //   title: "Copied to clipboard",
    //   description: "The code has been copied to your clipboard.",
    //   duration: 2000,
    // })
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">API Endpoints</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search endpoints, code, or documentation..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs
          defaultValue="all"
          className="w-full md:w-auto"
          onValueChange={(value) => setActiveMethod(value === "all" ? null : value)}
        >
          <TabsList className="w-full md:w-auto grid grid-cols-3 md:flex md:flex-row">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            {methods.map((method) => (
              <TabsTrigger key={method} value={method} className="flex-1">
                {method}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filteredEndpoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Filter className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No endpoints found</h3>
          <p className="text-muted-foreground mt-1 max-w-md">
            No API endpoints match your current search criteria. Try adjusting your search or filters.
          </p>
          {searchQuery && (
            <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredEndpoints.map((endpoint, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "font-mono text-xs px-2 py-0.5 border",
                          methodColors[endpoint.method] || "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="font-mono text-sm bg-secondary/50 px-2 py-0.5 rounded">
                        {endpoint.routePath}
                      </code>
                    </div>
                    <CardDescription>
                      {endpoint.explanation.split("\n")[2]?.replace("* **Purpose:** ", "") || "API Endpoint"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => copyToClipboard(endpoint.handler)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                      <a
                        href={`/dashboard/api-endpoints/${encodeURIComponent(endpoint.routePath)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-b bg-black/5 p-4">
                  <h4 className="text-sm font-medium mb-2">Handler</h4>
                  <pre className="bg-secondary/50 p-3 rounded-md overflow-x-auto">
                    <code className="text-xs md:text-sm">{endpoint.handler}</code>
                  </pre>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-medium mb-2">Documentation</h4>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(endpoint.explanation) }}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 py-3 px-4 flex justify-between">
                <div className="text-xs text-muted-foreground">Last updated: 2 days ago</div>
                <div className="text-xs">
                  <a href="#" className="text-primary hover:underline">
                    View full documentation
                  </a>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
