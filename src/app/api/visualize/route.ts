import { type NextRequest, NextResponse } from "next/server"
import { simpleGit } from "simple-git"
import fs from "fs/promises"
import path from "path"
import * as parser from "@babel/parser"
import traverse from "@babel/traverse"

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface ModelInfo {
    name: string
    type: string // e.g., Mongoose, Sequelize, Prisma
    fields: string[]
}

interface ControllerInfo {
    name: string
    methods: string[]
}

interface TypeInfo {
    name: string
    properties: string[]
}

interface PreprocessResult {
    models: ModelInfo[]
    controllers: ControllerInfo[]
    types: TypeInfo[]
}

interface Node {
    id: string;
    label: string;
}

interface Edge {
    source: string;
    target: string;
}

interface ReactFlowData {
    nodes: Node[]
    edges: Edge[]
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
            } else if (file.endsWith(".js") || file.endsWith(".ts")) {
                allFiles.push(fullPath)
            }
        }
    }

    await traverseDir(dir)
    return allFiles
}

async function preprocessRepo(repoPath: string): Promise<PreprocessResult> {
    const jsFiles = await findJSFiles(repoPath)
    const models: ModelInfo[] = []
    const controllers: ControllerInfo[] = []
    const types: TypeInfo[] = []

    for (const file of jsFiles) {
        try {
            const code = await fs.readFile(file, "utf8")
            const ast = parser.parse(code, {
                sourceType: "module",
                plugins: ["jsx", "typescript"],
            })

            traverse(ast, {
                // Extract Mongoose/Sequelize/Prisma models
                CallExpression({ node }) {
                    if (
                        node.callee.type === "MemberExpression" &&
                        node.callee.object.type === "Identifier" &&
                        ["mongoose", "sequelize", "prisma"].includes(node.callee.object.name)
                    ) {
                        const modelName = node.arguments[0]?.type === "StringLiteral" ? node.arguments[0].value : "Unknown"
                        const fields: string[] = []
                        if (node.arguments[1]?.type === "ObjectExpression") {
                            node.arguments[1].properties.forEach(prop => {
                                if (prop.type === "ObjectProperty" && prop.key.type === "Identifier") {
                                    fields.push(prop.key.name)
                                }
                            })
                        }
                        models.push({
                            name: modelName,
                            type: node.callee.object.name,
                            fields,
                        })
                    }
                },

                // Extract controller/service classes
                ClassDeclaration({ node }) {
                    if (node.id && node.id.type === "Identifier" && node.id.name.toLowerCase().includes("controller")) {
                        const methods: string[] = []
                        node.body.body.forEach(member => {
                            if (member.type === "ClassMethod" && member.key.type === "Identifier") {
                                methods.push(member.key.name)
                            }
                        })
                        controllers.push({
                            name: node.id.name,
                            methods,
                        })
                    }
                },

                // Extract TypeScript types/interfaces
                TSInterfaceDeclaration({ node }) {
                    if (node.id.type === "Identifier") {
                        const properties: string[] = []
                        node.body.body.forEach(prop => {
                            if (prop.type === "TSPropertySignature" && prop.key.type === "Identifier") {
                                properties.push(prop.key.name)
                            }
                        })
                        types.push({
                            name: node.id.name,
                            properties,
                        })
                    }
                },
                TSTypeAliasDeclaration({ node }) {
                    if (node.id.type === "Identifier") {
                        const properties: string[] = []
                        if (node.typeAnnotation.type === "TSTypeLiteral") {
                            node.typeAnnotation.members.forEach(member => {
                                if (member.type === "TSPropertySignature" && member.key.type === "Identifier") {
                                    properties.push(member.key.name)
                                }
                            })
                        }
                        types.push({
                            name: node.id.name,
                            properties,
                        })
                    }
                },
            })
        } catch (err) {
            console.warn(`⚠️ Skipped file ${file} due to parse error: ${err instanceof Error ? err.message : String(err)}`)
        }
    }

    return { models, controllers, types }
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
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"

    // Clean the response: remove Markdown code block markers and extra whitespace
    // Example: ```json\n{...}\n``` -> {...}
    rawText = rawText.trim()
    const codeBlockRegex = /^```(?:json)?\n([\s\S]*?)\n```$/m
    const match = rawText.match(codeBlockRegex)
    if (match) {
        rawText = match[1].trim()
    }

    return rawText
}

async function cleanupRepo(repoPath: string) {
    try {
        await fs.rm(repoPath, { recursive: true, force: true })
    } catch (err) {
        console.error("Error cleaning up temporary directory:", err)
    }
}

export async function POST(request: NextRequest) {
    let repoPath: string | null = null

    try {
        const { repoUrl } = await request.json()

        if (!repoUrl) {
            return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
        }

        // Clone and preprocess the repository
        repoPath = await cloneRepo(repoUrl)
        const preprocessData = await preprocessRepo(repoPath)

        // Define the prompt for React Flow flowchart
        const prompt = `You are a software architecture assistant.

Given this backend analysis:
- Models: ${JSON.stringify(preprocessData.models, null, 2)}
- Controllers: ${JSON.stringify(preprocessData.controllers, null, 2)}
- Types: ${JSON.stringify(preprocessData.types, null, 2)}

Generate a **React Flow** JSON object with "nodes" and "edges" arrays. Do **not** include any explanation or extra text.

**Structure**:
- Use group nodes with ids:
  - "group-requests", "group-routers", "group-middleware", "group-controllers", "group-services", "group-models", "group-database"
- Regular nodes must include:
  - id, data.label, position (x, y), parentId, extent: "parent", style
- Group node style: dashed border, bg: #f5f5f5, padding 20, width 200, height = children × 200 + 40
- Regular node style: bg: #e0f7fa, border: 1px solid #0288d1, padding 10, fontSize 12, whiteSpace: pre-wrap

**Layout**:
- Group X positions:
  - requests: 0, routers: 250, middleware: 500, controllers: 750, services: 1000, models: 1250, database: 1500
- Inside each group: stack nodes vertically, Y = index × 200

**Node labels**:
- Requests: "GET /users"
- Routers: "User Router"
- Middleware: "Auth Middleware"
- Controllers: "UserController: getUser"
- Services: "UserService: findUser"
- Models: "User Model\\nFields: id, name, email"
- DB: "MongoDB"

**Edges**:
- Fields: id, source, target, type: "smoothstep", label, animated: true
- Edge labels:
  - Request → Router: "GET /users"
  - Router → Middleware: "applies"
  - Middleware → Controller: "forwards"
  - Controller → Service: "calls findUser"
  - Service → Model: "uses"
  - Model → DB: "queries"
- Edge style: stroke: #0288d1, strokeWidth: 2

Return only the JSON object.

`

        // Call Gemini API to generate the flowchart
        let diagramData: ReactFlowData = { nodes: [], edges: [] }
        try {
            const diagram = await callGemini(prompt)
            console.log(`Raw Gemini response for flowchart:`, diagram)
            diagramData = JSON.parse(diagram)
        } catch (err) {
            console.error(`Error processing flowchart:`, err)
        }

        return NextResponse.json({ type: "diagram", label: "flowchart", data: diagramData }, { status: 200 })
    } catch (err) {
        console.error("Error in API route:", err)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "An unknown error occurred" },
            { status: 500 }
        )
    } finally {
        if (repoPath) {
            await cleanupRepo(repoPath)
        }
    }
}