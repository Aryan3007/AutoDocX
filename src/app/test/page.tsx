"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Github, FileText } from "lucide-react"

interface RouteDoc {
  method: string
  routePath: string
  handler: string
  explanation: string
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [docs, setDocs] = useState<RouteDoc[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return

    setIsGenerating(true)
    setDocs([])
    setError(null)

    try {
      // Call the API directly from the client instead of using the server action
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
            setDocs((prev) => [...prev, routeDoc])
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

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">AutoDocX</h1>
        <p className="text-center text-muted-foreground mb-8">Generate API documentation from your GitHub repository</p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Documentation</CardTitle>
            <CardDescription>Enter a GitHub repository URL to generate API documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="https://github.com/username/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">{error}</div>}

        {docs.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">API Documentation</h2>
            {docs.map((doc, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-bold rounded mr-2 ${
                          doc.method === "GET"
                            ? "bg-green-100 text-green-800"
                            : doc.method === "POST"
                              ? "bg-blue-100 text-blue-800"
                              : doc.method === "PUT"
                                ? "bg-yellow-100 text-yellow-800"
                                : doc.method === "DELETE"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {doc.method}
                      </span>
                      {doc.routePath}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium flex items-center mb-2">
                        <FileText className="h-4 w-4 mr-1" />
                        Documentation
                      </h3>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">{doc.explanation}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
