// utils/saveDocumentation.ts
interface DocumentationMetadata {
  [key: string]: string | number | boolean | null;
}

export async function saveDocumentation({
    repo_name,
    content,
    metadata,
    status = "draft",
  }: {
    repo_name: string;
    content: string;
    metadata?: DocumentationMetadata;
    status?: "draft" | "saved" | "published";
  }) {
    const res = await fetch("/api/documentations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repo_name, content, metadata, status }),
    });
  
    const data = await res.json();
  
    if (!res.ok) throw new Error(data.error || "Failed to save documentation");
  
    return data;
  }
  