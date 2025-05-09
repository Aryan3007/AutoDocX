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

Given the following backend analysis:
- Models: ${JSON.stringify(preprocessData.models, null, 2)}
- Controllers: ${JSON.stringify(preprocessData.controllers, null, 2)}
- Types: ${JSON.stringify(preprocessData.types, null, 2)}

Generate a **React Flow flowchart** that comprehensively describes the entire backend system, including the request lifecycle, routers, middleware, controllers, services, models, database access, schema relationships, and data flow. Return only a JSON object with "nodes" and "edges" arrays compatible with React Flow (https://reactflow.dev/). Do not include explanations or any other text outside the JSON object.

**Requirements for Nodes**:
- Each node must have: "id", "data" (with a "label" field for the display name), "position" (with "x" and "y" coordinates), and "parentId" (for grouping within subgraphs, referencing a group node's ID).
- Use "extent: 'parent'" for nodes within groups to constrain their movement.
- Include group nodes (subgraphs) with "type: 'group'" for visual grouping of related components:
  - "group-requests": For incoming HTTP requests (e.g., GET /users, POST /appointments).
  - "group-routers": For Express routers.
  - "group-middleware": For middleware (e.g., authentication, validation).
  - "group-controllers": For controllers.
  - "group-services": For services.
  - "group-models": For database models.
  - "group-database": For the database itself (e.g., MongoDB, PostgreSQL).
- Add detailed labels in the "data.label" field:
  - For request nodes: Include the HTTP method and path (e.g., "GET /users").
  - For router nodes: Include the router name (e.g., "User Router").
  - For middleware nodes: Include the middleware purpose (e.g., "Auth Middleware", "Validate Request").
  - For controller nodes: Include the controller name and method (e.g., "User Controller: getUser").
  - For service nodes: Include the service name and method (e.g., "User Service: findUser").
  - For model nodes: Include the model name and fields (e.g., "User Model\nFields: id, name, email").
  - For database nodes: Include the database type (e.g., "MongoDB").
- Style all nodes with a professional look:
  - Regular nodes: "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" }
  - Group nodes: "style": { "backgroundColor": "#f5f5f5", "border": "1px dashed #9e9e9e", "borderRadius": "12px", "padding": "20px", "fontSize": "14px", "fontFamily": "Arial, sans-serif", "color": "#424242" }
- Position nodes in a layered, horizontal layout to reflect the request lifecycle:
  - "group-requests" at x: 0
  - "group-routers" at x: 200
  - "group-middleware" at x: 400
  - "group-controllers" at x: 600
  - "group-services" at x: 800
  - "group-models" at x: 1000
  - "group-database" at x: 1200
  - Within each group, space nodes vertically (y increases by 150 per node, starting at y: 0).
- Set group node dimensions:
  - Each group should have "style": { ..., "width": 180, "height": (number of child nodes * 150 + 40) }

**Requirements for Edges**:
- Each edge must have: "id", "source", "target", "type", and "label".
- Use "type": "smoothstep" for smooth, professional-looking connections.
- Style edges: "style": { "stroke": "#0288d1", "strokeWidth": 2 }, "animated": true for a dynamic effect.
- Add "label" to describe the interaction:
  - Between requests and routers: Use the HTTP method and path (e.g., "GET /users").
  - Between routers and middleware: Use "applies" (e.g., "applies").
  - Between middleware and controllers: Use "forwards" (e.g., "forwards").
  - Between controllers and services: Use the method call (e.g., "calls findUser").
  - Between services and models: Use the operation (e.g., "queries", "creates").
  - Between models and database: Use the database operation (e.g., "stores", "retrieves").
  - Between models (for schema relationships): Use the relationship type (e.g., "has many", "belongs to").
- Style edge labels: "labelStyle": { "fontSize": "10px", "fill": "#01579b", "fontFamily": "Arial, sans-serif" }, "labelBgStyle": { "fill": "#e0f7fa", "stroke": "#0288d1", "strokeWidth": 1, "padding": 4 }

**Additional Requirements**:
- Represent the full request lifecycle: Show how an HTTP request flows through the router, middleware, controller, service, model, and database.
- Include middleware nodes for common middleware (e.g., authentication, validation) inferred from controller methods or types.
- Show schema relationships between models (e.g., foreign keys, one-to-many) as edges between model nodes with labels like "has many" or "belongs to".
- If no middleware is explicitly detected, include a placeholder "Default Middleware" node for each router.
- Ensure all controllers, services, and models are connected appropriately based on their names and methods (e.g., UserController should connect to UserService and UserModel).

**Example Output**:
{
  "nodes": [
    { "id": "group-requests", "type": "group", "data": { "label": "HTTP Requests" }, "position": { "x": 0, "y": 0 }, "style": { "backgroundColor": "#f5f5f5", "border": "1px dashed #9e9e9e", "borderRadius": "12px", "padding": "20px", "fontSize": "14px", "fontFamily": "Arial, sans-serif", "color": "#424242", "width": 180, "height": 340 } },
    { "id": "req-1", "data": { "label": "GET /users" }, "position": { "x": 20, "y": 40 }, "parentId": "group-requests", "extent": "parent", "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" } },
    { "id": "req-2", "data": { "label": "POST /users" }, "position": { "x": 20, "y": 190 }, "parentId": "group-requests", "extent": "parent", "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" } },
    { "id": "group-routers", "type": "group", "data": { "label": "Routers" }, "position": { "x": 200, "y": 0 }, "style": { "backgroundColor": "#f5f5f5", "border": "1px dashed #9e9e9e", "borderRadius": "12px", "padding": "20px", "fontSize": "14px", "fontFamily": "Arial, sans-serif", "color": "#424242", "width": 180, "height": 190 } },
    { "id": "router-1", "data": { "label": "User Router" }, "position": { "x": 20, "y": 40 }, "parentId": "group-routers", "extent": "parent", "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" } },
    { "id": "group-middleware", "type": "group", "data": { "label": "Middleware" }, "position": { "x": 400, "y": 0 }, "style": { "backgroundColor": "#f5f5f5", "border": "1px dashed #9e9e9e", "borderRadius": "12px", "padding": "20px", "fontSize": "14px", "fontFamily": "Arial, sans-serif", "color": "#424242", "width": 180, "height": 190 } },
    { "id": "mw-1", "data": { "label": "Auth Middleware" }, "position": { "x": 20, "y": 40 }, "parentId": "group-middleware", "extent": "parent", "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" } },
    { "id": "group-controllers", "type": "group", "data": { "label": "Controllers" }, "position": { "x": 600, "y": 0 }, "style": { "backgroundColor": "#f5f5f5", "border": "1px dashed #9e9e9e", "borderRadius": "12px", "padding": "20px", "fontSize": "14px", "fontFamily": "Arial, sans-serif", "color": "#424242", "width": 180, "height": 190 } },
    { "id": "controller-1", "data": { "label": "User Controller: getUser" }, "position": { "x": 20, "y": 40 }, "parentId": "group-controllers", "extent": "parent", "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" } },
    { "id": "group-services", "type": "group", "data": { "label": "Services" }, "position": { "x": 800, "y": 0 }, "style": { "backgroundColor": "#f5f5f5", "border": "1px dashed #9e9e9e", "borderRadius": "12px", "padding": "20px", "fontSize": "14px", "fontFamily": "Arial, sans-serif", "color": "#424242", "width": 180, "height": 190 } },
    { "id": "service-1", "data": { "label": "User Service: findUser" }, "position": { "x": 20, "y": 40 }, "parentId": "group-services", "extent": "parent", "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" } },
    { "id": "group-models", "type": "group", "data": { "label": "Models" }, "position": { "x": 1000, "y": 0 }, "style": { "backgroundColor": "#f5f5f5", "border": "1px dashed #9e9e9e", "borderRadius": "12px", "padding": "20px", "fontSize": "14px", "fontFamily": "Arial, sans-serif", "color": "#424242", "width": 180, "height": 340 } },
    { "id": "model-1", "data": { "label": "User Model\nFields: id, name, email" }, "position": { "x": 20, "y": 40 }, "parentId": "group-models", "extent": "parent", "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" } },
    { "id": "model-2", "data": { "label": "Post Model\nFields: id, userId, content" }, "position": { "x": 20, "y": 190 }, "parentId": "group-models", "extent": "parent", "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" } },
    { "id": "group-database", "type": "group", "data": { "label": "Database" }, "position": { "x": 1200, "y": 0 }, "style": { "backgroundColor": "#f5f5f5", "border": "1px dashed #9e9e9e", "borderRadius": "12px", "padding": "20px", "fontSize": "14px", "fontFamily": "Arial, sans-serif", "color": "#424242", "width": 180, "height": 190 } },
    { "id": "db-1", "data": { "label": "MongoDB" }, "position": { "x": 20, "y": 40 }, "parentId": "group-database", "extent": "parent", "style": { "backgroundColor": "#e0f7fa", "border": "1px solid #0288d1", "borderRadius": "8px", "padding": "10px", "fontSize": "12px", "fontFamily": "Arial, sans-serif", "color": "#01579b", "whiteSpace": "pre-wrap", "textAlign": "center" } }
  ],
  "edges": [
    { "id": "e1", "source": "req-1", "target": "router-1", "type": "smoothstep", "label": "GET /users", "style": { "stroke": "#0288d1", "strokeWidth": 2 }, "animated": true, "labelStyle": { "fontSize": "10px", "fill": "#01579b", "fontFamily": "Arial, sans-serif" }, "labelBgStyle": { "fill": "#e0f7fa", "stroke": "#0288d1", "strokeWidth": 1, "padding": 4 } },
    { "id": "e2", "source": "router-1", "target": "mw-1", "type": "smoothstep", "label": "applies", "style": { "stroke": "#0288d1", "strokeWidth": 2 }, "animated": true, "labelStyle": { "fontSize": "10px", "fill": "#01579b", "fontFamily": "Arial, sans-serif" }, "labelBgStyle": { "fill": "#e0f7fa", "stroke": "#0288d1", "strokeWidth": 1, "padding": 4 } },
    { "id": "e3", "source": "mw-1", "target": "controller-1", "type": "smoothstep", "label": "forwards", "style": { "stroke": "#0288d1", "strokeWidth": 2 }, "animated": true, "labelStyle": { "fontSize": "10px", "fill": "#01579b", "fontFamily": "Arial, sans-serif" }, "labelBgStyle": { "fill": "#e0f7fa", "stroke": "#0288d1", "strokeWidth": 1, "padding": 4 } },
    { "id": "e4", "source": "controller-1", "target": "service-1", "type": "smoothstep", "label": "calls findUser", "style": { "stroke": "#0288d1", "strokeWidth": 2 }, "animated": true, "labelStyle": { "fontSize": "10px", "fill": "#01579b", "fontFamily": "Arial, sans-serif" }, "labelBgStyle": { "fill": "#e0f7fa", "stroke": "#0288d1", "strokeWidth": 1, "padding": 4 } },
    { "id": "e5", "source": "service-1", "target": "model-1", "type": "smoothstep", "label": "queries", "style": { "stroke": "#0288d1", "strokeWidth": 2 }, "animated": true, "labelStyle": { "fontSize": "10px", "fill": "#01579b", "fontFamily": "Arial, sans-serif" }, "labelBgStyle": { "fill": "#e0f7fa", "stroke": "#0288d1", "strokeWidth": 1, "padding": 4 } },
    { "id": "e6", "source": "model-1", "target": "db-1", "type": "smoothstep", "label": "retrieves", "style": { "stroke": "#0288d1", "strokeWidth": 2 }, "animated": true, "labelStyle": { "fontSize": "10px", "fill": "#01579b", "fontFamily": "Arial, sans-serif" }, "labelBgStyle": { "fill": "#e0f7fa", "stroke": "#0288d1", "strokeWidth": 1, "padding": 4 } },
    { "id": "e7", "source": "model-1", "target": "model-2", "type": "smoothstep", "label": "has many", "style": { "stroke": "#0288d1", "strokeWidth": 2 }, "animated": true, "labelStyle": { "fontSize": "10px", "fill": "#01579b", "fontFamily": "Arial, sans-serif" }, "labelBgStyle": { "fill": "#e0f7fa", "stroke": "#0288d1", "strokeWidth": 1, "padding": 4 } }
  ]
}
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