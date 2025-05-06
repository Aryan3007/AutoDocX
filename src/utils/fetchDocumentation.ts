export const fetchDocumentationById = async (id: string) => {
    const res = await fetch(`/api/documentations/${id}`)
  
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || "Failed to fetch documentation")
    }
  
    const { documentation } = await res.json()
    return documentation
  }
  