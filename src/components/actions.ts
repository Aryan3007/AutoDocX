"use server"

// This is a simplified server action that just calls our API route
export async function generateDocs(repoUrl: string): Promise<ReadableStream<Uint8Array> | null> {
  if (!repoUrl) {
    throw new Error("Repository URL is required")
  }

  try {
    // Call our API route instead of doing file operations directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repoUrl }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    // Return the stream from the API route
    return response.body
  } catch (err) {
    console.error("Error generating documentation:", err)
    return null
  }
}
