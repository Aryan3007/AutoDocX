import { type NextRequest, NextResponse } from "next/server"
import { simpleGit } from "simple-git"
import fs from "fs/promises"
import path from "path"
import * as parser from "@babel/parser"
import traverse from "@babel/traverse"

// Add environment variable for Gemini API key
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface RouteInfo {
    method: string
    routePath: string
    handler: string
}

// Clone repository
async function cloneRepo(repoUrl: string): Promise<string> {
    const tmpDir = path.join(process.cwd(), "tmp", Date.now().toString())
    await fs.mkdir(tmpDir, { recursive: true })
    const git = simpleGit()
    await git.clone(repoUrl, tmpDir)
    return tmpDir
}

// Find all JS files in the repository
async function findJSFiles(dir: string): Promise<string[]> {
    const allFiles: string[] = []

    async function traverse(currentDir: string) {
        const files = await fs.readdir(currentDir)

        for (const file of files) {
            const fullPath = path.join(currentDir, file)
            const stat = await fs.stat(fullPath)

            if (stat.isDirectory()) {
                await traverse(fullPath)
            } else if (file.endsWith(".js")) {
                allFiles.push(fullPath)
            }
        }
    }

    await traverse(dir)
    return allFiles
}

// Extract API routes from the codebase
async function extractApiInfo(repoPath: string): Promise<RouteInfo[]> {
    const jsFiles = await findJSFiles(repoPath)
    const routes: RouteInfo[] = []

    for (const file of jsFiles) {
        try {
            const code = await fs.readFile(file, "utf8")
            const ast = parser.parse(code, {
                sourceType: "module",
                plugins: ["jsx"],
            })

            // Dynamically collect router variables
            const routerVars = new Set(["app"]) // always include 'app' just in case

            traverse(ast, {
                VariableDeclarator({ node }) {
                    if (
                        node.init &&
                        node.init.type === "CallExpression" &&
                        node.init.callee.type === "MemberExpression" &&
                        node.init.callee.object.type === "Identifier" &&
                        node.init.callee.object.name === "express" &&
                        node.init.callee.property.type === "Identifier" &&
                        node.init.callee.property.name === "Router" &&
                        node.id.type === "Identifier"
                    ) {
                        routerVars.add(node.id.name)
                    }
                },
            })

            traverse(ast, {
                CallExpression({ node }) {
                    const callee = node.callee

                    if (
                        callee.type === "MemberExpression" &&
                        callee.object.type === "Identifier" &&
                        routerVars.has(callee.object.name) &&
                        callee.property.type === "Identifier" &&
                        ["get", "post", "put", "delete", "patch"].includes(callee.property.name) &&
                        node.arguments.length >= 2 &&
                        node.arguments[0].type === "StringLiteral"
                    ) {
                        const method = callee.property.name.toUpperCase()
                        const routePath = node.arguments[0].value
                        const handlerCode = (node.start != null && node.end != null)
                            ? code.slice(node.start, node.end)
                            : ''

                        routes.push({ method, routePath, handler: handlerCode })
                    }
                },
            })
        } catch (err) {
            console.warn(`⚠️ Skipped file ${file} due to parse error: ${err instanceof Error ? err.message : String(err)}`)
        }
    }

    return routes
}

// Generate documentation using Gemini AI
async function callGemini(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set")
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    })

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No explanation generated."
}

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder()

    try {
        const { repoUrl } = await request.json()

        if (!repoUrl) {
            return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
        }

        // Create a stream to send data back to the client
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const path = await cloneRepo(repoUrl)
                    const routes = await extractApiInfo(path)

                    // Process each route and generate documentation
                    for (const route of routes) {
                        const prompt = `Generate a concise API documentation for this Express route:

Endpoint: ${route.method} ${route.routePath}

Please include:
1. Description: Brief overview of the endpoint's purpose
2. Request:
   - Headers (if any)
   - Query Parameters (if any)
   - Request Body (if any)
3. Response:
   - Success Response (200-299)
   - Error Response (400-599)
4. Example Usage (if applicable provide only curl example)

Source Code:
${route.handler}`

                        try {
                            const explanation = await callGemini(prompt)

                            // Send the route with its explanation
                            const data = JSON.stringify({ ...route, explanation })
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                        } catch (err) {
                            console.error("Error generating explanation:", err)
                            const data = JSON.stringify({
                                ...route,
                                explanation: "Error generating explanation.",
                            })
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                        }
                    }

                    // Clean up the temporary directory
                    try {
                        await fs.rm(path, { recursive: true, force: true })
                    } catch (err) {
                        console.error("Error cleaning up temporary directory:", err)
                    }

                    // End the stream
                    controller.enqueue(encoder.encode(`data: done\n\n`))
                    controller.close()
                } catch (err) {
                    console.error("Stream error:", err)
                    controller.error(err)
                }
            },
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        })
    } catch (err) {
        console.error("Error in API route:", err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "An unknown error occurred" },
            { status: 500 },
        )
    }
}
