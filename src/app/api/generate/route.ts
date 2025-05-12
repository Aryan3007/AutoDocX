import { type NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import * as parser from "@babel/parser"
import traverse from "@babel/traverse"
import os from "os"
import { v4 as uuidv4 } from "uuid";
import * as git from "isomorphic-git"
import http from "isomorphic-git/http/node"

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface RouteInfo {
  method: string
  routePath: string
  handler: string
  explanation?: string
}

// Map of languages to their file extensions
const LANGUAGE_EXTENSIONS: { [key: string]: string[] } = {
  javascript: [".js", ".ts"],
  python: [".py"],
  java: [".java"],
  ruby: [".rb"],
}

// Map of frameworks to their configuration files or markers
const FRAMEWORK_MARKERS: { [key: string]: { language: string; markers: string[] } } = {
  express: { language: "javascript", markers: ["package.json"] },
  flask: { language: "python", markers: ["requirements.txt", "app.py"] },
  django: { language: "python", markers: ["manage.py", "settings.py"] },
  spring: { language: "java", markers: ["pom.xml", "build.gradle"] },
  rails: { language: "ruby", markers: ["Gemfile", "config/routes.rb"] },
}

async function cloneRepo(repoUrl: string): Promise<string> {
  try {
    console.log("cloneRepo: Starting with repoUrl:", repoUrl)
    if (!repoUrl || !repoUrl.startsWith("https://")) {
      throw new Error("Invalid repository URL")
    }

    // Use os.tmpdir() for cross-platform compatibility, maps to /tmp on Vercel
    const tmpBaseDir = os.tmpdir()
    const tmpDirName = `repo-${uuidv4()}`
    const tmpDir = path.join(tmpBaseDir, tmpDirName)
    console.log("cloneRepo: Creating tmpDir:", tmpDir)

    // Check if directory exists and remove it if necessary
    try {
      await fs.access(tmpDir)
      console.log("cloneRepo: Directory already exists, removing:", tmpDir)
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch (err: unknown) {
        if (err instanceof Error) {
          if ('code' in err && err.code !== "ENOENT") {
            throw new Error(`Failed to check/remove existing directory: ${err.message}`)
          }
        }
      }

    console.log("cloneRepo: Creating directory:", tmpDir)
    await fs.mkdir(tmpDir, { recursive: true })

    console.log("cloneRepo: Cloning repo:", repoUrl)
    await git.clone({
      fs,
      http,
      dir: tmpDir,
      url: repoUrl,
      singleBranch: true,
      depth: 1, // Shallow clone for performance
    })
    console.log("cloneRepo: Repo cloned to:", tmpDir)
    return tmpDir
  } catch (err) {
    console.error("cloneRepo error:", err)
    throw new Error(`Failed to clone repository: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function detectLanguageAndFramework(dir: string): Promise<{ language: string; framework: string }> {
  try {
    console.log("detectLanguageAndFramework: Scanning directory:", dir)
    const files = await fs.readdir(dir)

    for (const framework in FRAMEWORK_MARKERS) {
      const { language, markers } = FRAMEWORK_MARKERS[framework]
      for (const marker of markers) {
        if (files.includes(marker) || (await exists(path.join(dir, marker)))) {
          console.log(`detectLanguageAndFramework: Detected framework: ${framework} (${language})`)
          return { language, framework }
        }
      }
    }

    // Fallback: detect by file extensions
    const extensionCounts: { [key: string]: number } = {}
    async function countExtensions(currentDir: string) {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name)
          if (entry.isDirectory()) {
            await countExtensions(fullPath)
          } else {
            const ext = path.extname(entry.name).toLowerCase()
            for (const [lang, exts] of Object.entries(LANGUAGE_EXTENSIONS)) {
              if (exts.includes(ext)) {
                extensionCounts[lang] = (extensionCounts[lang] || 0) + 1
              }
            }
          }
        }
      } catch (err) {
        console.warn(`countExtensions: Error in directory ${currentDir}:`, err)
      }
    }

    await countExtensions(dir)
    const detectedLanguage = Object.entries(extensionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown"
    console.log(`detectLanguageAndFramework: Fallback detection: language=${detectedLanguage}, framework=unknown`)
    return { language: detectedLanguage, framework: "unknown" }
  } catch (err) {
    console.error("detectLanguageAndFramework error:", err)
    throw new Error(`Failed to detect language/framework: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function findSourceFiles(dir: string, extensions: string[]): Promise<string[]> {
  const allFiles: string[] = []
  console.log("findSourceFiles: Searching in:", dir, "with extensions:", extensions)

  async function traverseDir(currentDir: string) {
    try {
      const files = await fs.readdir(currentDir)
      for (const file of files) {
        const fullPath = path.join(currentDir, file)
        const stat = await fs.stat(fullPath)
        if (stat.isDirectory()) {
          await traverseDir(fullPath)
        } else if (extensions.some(ext => file.toLowerCase().endsWith(ext))) {
          allFiles.push(fullPath)
        }
      }
    } catch (err) {
      console.warn(`findSourceFiles: Failed to traverse directory ${currentDir}:`, err)
    }
  }

  await traverseDir(dir)
  console.log("findSourceFiles: Found files:", allFiles.length)
  return allFiles
}

function trimHandlerCode(handler: string, language: string): string {
  try {
    console.log("trimHandlerCode: Trimming handler code for language:", language)
    if (language === "javascript") {
      return handler
        .replace(/console\.log\([^)]*\);?/g, '')
        .replace(/res\.status\(500\).*?\};?/gs, '/* Internal error handling omitted */')
        .replace(/\/\*.*?\*\//gs, '')
        .split("\n")
        .slice(0, 40)
        .join("\n")
    } else if (language === "python") {
      return handler
        .replace(/print\([^)]*\)/g, '')
        .replace(/logger\..*?\([^)]*\)/g, '')
        .split("\n")
        .slice(0, 40)
        .join("\n")
    } else if (language === "java") {
      return handler
        .replace(/System\.out\.println\([^)]*\);?/g, '')
        .split("\n")
        .slice(0, 40)
        .join("\n")
    } else if (language === "ruby") {
      return handler
        .replace(/puts\s+.*$/gm, '')
        .split("\n")
        .slice(0, 40)
        .join("\n")
    }
    return handler.split("\n").slice(0, 40).join("\n")
  } catch (err) {
    console.error("trimHandlerCode error:", err)
    return handler
  }
}

// Parsers for different frameworks
const parsers: {
  [key: string]: (repoPath: string, extensions: string[]) => Promise<RouteInfo[]>
} = {
  express: async (repoPath: string, extensions: string[]) => {
    console.log("express parser: Parsing files in:", repoPath)
    const jsFiles = await findSourceFiles(repoPath, extensions)
    const routes: RouteInfo[] = []

    for (const file of jsFiles) {
      try {
        console.log("express parser: Parsing file:", file)
        const code = await fs.readFile(file, "utf8")
        const ast = parser.parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
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
              const method = callee.property.name.toUpperCase()
              const routePath = node.arguments[0].value
              const handlerCode = node.start != null && node.end != null ? trimHandlerCode(code.slice(node.start, node.end), "javascript") : ""
              routes.push({ method, routePath, handler: handlerCode })
              console.log("express parser: Found route:", method, routePath)
            }
          },
        })
      } catch (err) {
        console.warn(`express parser: Skipped file ${file} due to parse error:`, err)
      }
    }
    console.log("express parser: Total routes extracted:", routes.length)
    return routes
  },
  flask: async (repoPath: string, extensions: string[]) => {
    console.log("flask parser: Parsing files in:", repoPath)
    const pyFiles = await findSourceFiles(repoPath, extensions)
    const routes: RouteInfo[] = []

    for (const file of pyFiles) {
      try {
        console.log("flask parser: Parsing file:", file)
        const code = await fs.readFile(file, "utf8")
        const lines = code.split("\n")

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line.startsWith("@app.route(") || line.startsWith("@blueprint.route(")) {
            const match = line.match(/@.*?\.route\(['"]([^'"]+)['"](?:,\s*methods=\[(['"]\w+['"](?:,\s*['"]\w+['"])*)\])?\)/)
            if (match) {
              const routePath = match[1]
              const methods = match[2] ? match[2].replace(/['"]/g, "").split(",").map(m => m.trim().toUpperCase()) : ["GET"]
              const handlerLines: string[] = []
              let j = i + 1
              while (j < lines.length && !lines[j].startsWith("@") && !lines[j].startsWith("def ")) {
                handlerLines.push(lines[j])
                j++
              }
              if (j < lines.length && lines[j].startsWith("def ")) {
                handlerLines.push(lines[j])
                const indent = lines[j].match(/^\s*/)?.[0].length || 0
                j++
                while (j < lines.length && (lines[j].startsWith(" ".repeat(indent + 1)) || lines[j].trim() === "")) {
                  handlerLines.push(lines[j])
                  j++
                }
              }
              for (const method of methods) {
                routes.push({
                  method,
                  routePath,
                  handler: trimHandlerCode(handlerLines.join("\n"), "python"),
                })
                console.log("flask parser: Found route:", method, routePath)
              }
            }
          }
        }
      } catch (err) {
        console.warn(`flask parser: Skipped file ${file} due to parse error:`, err)
      }
    }
    console.log("flask parser: Total routes extracted:", routes.length)
    return routes
  },
  django: async (repoPath: string, extensions: string[]) => {
    console.log("django parser: Parsing files in:", repoPath)
    const pyFiles = await findSourceFiles(repoPath, extensions)
    const routes: RouteInfo[] = []

    for (const file of pyFiles) {
      try {
        console.log("django parser: Parsing file:", file)
        const code = await fs.readFile(file, "utf8")
        if (file.endsWith("urls.py")) {
          const lines = code.split("\n")
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (line.includes("path(") || line.includes("re_path(")) {
              const match = line.match(/(?:path|re_path)\(['"]([^'"]+)['"],\s*([^,)]+)/)
              if (match) {
                const routePath = match[1]
                const handler = match[2].trim()
                routes.push({
                  method: "GET", // Django URLs don't specify method; assume GET for simplicity
                  routePath,
                  handler: trimHandlerCode(`# View: ${handler}`, "python"),
                })
                console.log("django parser: Found route: GET", routePath)
              }
            }
          }
        }
      } catch (err) {
        console.warn(`django parser: Skipped file ${file} due to parse error:`, err)
      }
    }
    console.log("django parser: Total routes extracted:", routes.length)
    return routes
  },
  spring: async (repoPath: string, extensions: string[]) => {
    console.log("spring parser: Parsing files in:", repoPath)
    const javaFiles = await findSourceFiles(repoPath, extensions)
    const routes: RouteInfo[] = []

    for (const file of javaFiles) {
      try {
        console.log("spring parser: Parsing file:", file)
        const code = await fs.readFile(file, "utf8")
        const lines = code.split("\n")

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (
            line.startsWith("@RequestMapping") ||
            line.startsWith("@GetMapping") ||
            line.startsWith("@PostMapping") ||
            line.startsWith("@PutMapping") ||
            line.startsWith("@DeleteMapping") ||
            line.startsWith("@PatchMapping")
          ) {
            let method = "GET"
            if (line.startsWith("@PostMapping")) method = "POST"
            else if (line.startsWith("@PutMapping")) method = "PUT"
            else if (line.startsWith("@DeleteMapping")) method = "DELETE"
            else if (line.startsWith("@PatchMapping")) method = "PATCH"

            const pathMatch = line.match(/value\s*=\s*\{?"([^"}]+)"\}?/)
            const routePath = pathMatch ? pathMatch[1] : "/"

            const handlerLines: string[] = [line]
            let j = i + 1
            while (j < lines.length && !lines[j].trim().startsWith("@") && !lines[j].trim().startsWith("public class ")) {
              handlerLines.push(lines[j])
              j++
            }
            routes.push({
              method,
              routePath,
              handler: trimHandlerCode(handlerLines.join("\n"), "java"),
            })
            console.log("spring parser: Found route:", method, routePath)
          }
        }
      } catch (err) {
        console.warn(`spring parser: Skipped file ${file} due to parse error:`, err)
      }
    }
    console.log("spring parser: Total routes extracted:", routes.length)
    return routes
  },
  rails: async (repoPath: string, extensions: string[]) => {
    console.log("rails parser: Parsing files in:", repoPath)
    const rbFiles = await findSourceFiles(repoPath, extensions)
    const routes: RouteInfo[] = []

    for (const file of rbFiles) {
      try {
        console.log("rails parser: Parsing file:", file)
        const code = await fs.readFile(file, "utf8")
        if (file.endsWith("routes.rb")) {
          const lines = code.split("\n")
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (line.match(/^(get|post|put|patch|delete)\s+['"]([^'"]+)['"]/)) {
              const match = line.match(/^(get|post|put|patch|delete)\s+['"]([^'"]+)['"](?:,\s*to:\s*['"]([^'"]+)['"])?/)
              if (match) {
                const method = match[1].toUpperCase()
                const routePath = match[2]
                const handler = match[3] || "unknown#action"
                routes.push({
                  method,
                  routePath,
                  handler: trimHandlerCode(`# Controller: ${handler}`, "ruby"),
                })
                console.log("rails parser: Found route:", method, routePath)
              }
            }
          }
        }
      } catch (err) {
        console.warn(`rails parser: Skipped file ${file} due to parse error:`, err)
      }
    }
    console.log("rails parser: Total routes extracted:", routes.length)
    return routes
  },
}

async function extractApiInfo(repoPath: string): Promise<RouteInfo[]> {
  try {
    console.log("extractApiInfo: Starting extraction in:", repoPath)
    const { language, framework } = await detectLanguageAndFramework(repoPath)
    const extensions = LANGUAGE_EXTENSIONS[language] || [".js", ".py", ".java", ".rb"]
    const parser = parsers[framework] || parsers.express // Fallback to Express parser
    console.log(`extractApiInfo: Using parser for framework: ${framework} with extensions:`, extensions)
    const routes = await parser(repoPath, extensions)
    console.log("extractApiInfo: Total routes extracted:", routes.length)
    return routes
  } catch (err) {
    console.error("extractApiInfo error:", err)
    throw new Error(`Failed to extract API info: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function callGemini(prompt: string): Promise<string> {
  try {
    console.log("callGemini: Starting API call")
    if (!GEMINI_API_KEY) {
      console.error("callGemini: GEMINI_API_KEY is not set")
      throw new Error("GEMINI_API_KEY environment variable is not set")
    }
    console.log("callGemini: Using GEMINI_API_KEY:", GEMINI_API_KEY.slice(0, 5) + "...")

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
      console.error("callGemini: Gemini API response not OK:", response.status, response.statusText)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "No explanation generated."
    console.log("callGemini: Gemini API response received")
    return result
  } catch (err) {
    console.error("callGemini error:", err)
    throw new Error(`Failed to call Gemini API: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  console.log("POST /api/generate: Received request")

  try {
    const { repoUrl } = await request.json()
    console.log("POST /api/generate: Request body:", { repoUrl })

    if (!repoUrl) {
      console.log("POST /api/generate: Missing repoUrl")
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    let repoPath: string | null = null
    const stream = new ReadableStream({
      async start(controller) {
        try {
          repoPath = await cloneRepo(repoUrl)
          const routes = await extractApiInfo(repoPath)

          for (const route of routes) {
            console.log(`POST /api/generate: Generating docs for ${route.method} ${route.routePath}`)
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
- Use <li> for each status code with style="color: #4a5568; margin-bottom: 0.25rem;".`

            try {
              const explanation = await callGemini(prompt)
              const data = JSON.stringify({ ...route, explanation })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            } catch (err) {
              console.error(`POST /api/generate: Error generating explanation for ${route.method} ${route.routePath}:`, err)
              const data = JSON.stringify({
                ...route,
                explanation: `Error generating explanation: ${err instanceof Error ? err.message : String(err)}`,
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          controller.enqueue(encoder.encode(`data: done\n\n`))
          controller.close()
        } catch (err) {
          console.error("POST /api/generate: Stream error:", err)
          controller.error(new Error(`Stream error: ${err instanceof Error ? err.message : String(err)}`))
        } finally {
          if (repoPath) {
            try {
              console.log("POST /api/generate: Cleaning up:", repoPath)
              await fs.rm(repoPath, { recursive: true, force: true })
              console.log("POST /api/generate: Cleanup complete")
            } catch (err) {
              console.error("POST /api/generate: Error cleaning up:", err)
            }
          }
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
    console.error("POST /api/generate: Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "An unknown error occurred" },
      { status: 500 }
    )
  }
}