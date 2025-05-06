import { type NextRequest, NextResponse } from "next/server"
import { simpleGit } from "simple-git"
import fs from "fs/promises"
import path from "path"
import * as parser from "@babel/parser"
import traverse from "@babel/traverse"

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface RouteInfo {
    method: string
    routePath: string
    handler: string
}

async function cloneRepo(repoUrl: string): Promise<string> {
    const tmpDir = path.join(process.cwd(), "tmp", Date.now().toString())
    await fs.mkdir(tmpDir, { recursive: true })
    const git = simpleGit()
    await git.clone(repoUrl, tmpDir)
    return tmpDir
}

async function findJSFiles(dir: string): Promise<string[]> {
    const allFiles: string[] = []

    async function traverseDir(currentDir: string) {
        const files = await fs.readdir(currentDir)

        for (const file of files) {
            const fullPath = path.join(currentDir, file)
            const stat = await fs.stat(fullPath)

            if (stat.isDirectory()) {
                await traverseDir(fullPath)
            } else if (file.endsWith(".js")) {
                allFiles.push(fullPath)
            }
        }
    }

    await traverseDir(dir)
    return allFiles
}

function trimHandlerCode(handler: string): string {
    // Remove long error logs and console statements
    return handler
        .replace(/console\.log\([^)]*\);?/g, '')
        .replace(/res\.status\(500\).*?\};?/gs, '/* Internal error handling omitted */')
        .replace(/\/\*.*?\*\//gs, '')
        .split("\n")
        .slice(0, 40) // keep only the first 40 lines
        .join("\n")
}

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

            const routerVars = new Set(["app"])

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
                        const method = callee.property.type === 'Identifier' ? callee.property.name.toUpperCase() : ''
                        const routePath = node.arguments[0].value
                        const handlerCode = (node.start != null && node.end != null)
                            ? trimHandlerCode(code.slice(node.start, node.end))
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

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const repoPath = await cloneRepo(repoUrl)
                    const routes = await extractApiInfo(repoPath)

                    for (const route of routes) {
                        const prompt = `You are an API documentation generator.

                        Generate concise, developer-friendly documentation for the following API route:
                        Method: ${route.method}
                        Path: ${route.routePath}
                        
                        Here is the route handler implementation:
                        ${route.handler}
                        
                        Your task is to:
                        1. Provide a **brief description** (20–30 words max) of what this endpoint does.
                        2. Include a **request JSON sample** (relevant body parameters only), formatted with syntax highlighting.
                        3. Include a **response JSON sample** (typical success response), formatted with syntax highlighting.
                        4. Mention common **status codes** with short explanations.
                        
                        Format the entire output using **clean and semantic HTML** with **inline CSS styles** for readability and structure. Use the following guidelines:
                        - Use <h3> for section headings (e.g., "Description", "Request Body", "Response Success", "Status Codes") with style="font-size: 1.25rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; color: #1a202c;".
                        - Use <p> for the description with style="margin-bottom: 1rem; color: #4a5568;".
                        - For JSON samples in "Request Body" and "Response Success":
                          - Wrap each JSON in a <pre> with style="background-color: #f7fafc; padding: 1rem; border-radius: 0.375rem; overflow-x: auto; margin-bottom: 1rem; border: 1px solid #e2e8f0; font-family: monospace; font-size: 0.875rem; position: relative;".
                          - Inside <pre>, use a <code> tag to hold the JSON content.
                          - Apply syntax highlighting within the <code> tag by wrapping JSON keys in <span> with style="color: #2b6cb0;" (blue), strings in <span> with style="color: #e53e3e;" (red), numbers in <span> with style="color: #d69e2e;" (yellow), and booleans/null in <span> with style="color: #2f855a;" (green). Preserve JSON structure (indentation, brackets, etc.).
                        - Use <ul> for status codes with style="list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem;".
                        - Use <li> for each status code with style="color: #4a5568; margin-bottom: 0.25rem;".`;

                        try {
                            const explanation = await callGemini(prompt)
                            const data = JSON.stringify({ ...route, explanation })
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                        } catch (err) {
                            console.error("Error generating explanation:", err)
                            const data = JSON.stringify({ ...route, explanation: "Error generating explanation." })
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                        }
                    }

                    try {
                        await fs.rm(repoPath, { recursive: true, force: true })
                    } catch (err) {
                        console.error("Error cleaning up temporary directory:", err)
                    }

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
            { status: 500 }
        )
    }
}
