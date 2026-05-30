"use client"

import { useState } from "react"
import { Clock, Edit2, Check, X } from "lucide-react"

type DeadlineEditorProps = {
  pollId: string
  currentDeadline: Date
}

export default function DeadlineEditor({ pollId, currentDeadline }: DeadlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [deadline, setDeadline] = useState(new Date(currentDeadline).toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!deadline) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline })
      })
      if (res.ok) {
        setIsEditing(false)
        window.location.reload()
      } else {
        throw new Error("Failed to update deadline")
      }
    } catch (error) {
      console.error(error)
      alert("Failed to update deadline")
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 bg-background/80 p-1 rounded-md border border-border">
        <input 
          type="date" 
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="text-xs bg-transparent outline-none p-1"
          disabled={isLoading}
        />
        <button onClick={handleSave} disabled={isLoading} className="text-green-500 hover:bg-green-500/10 p-1 rounded">
          <Check className="h-3 w-3" />
        </button>
        <button onClick={() => setIsEditing(false)} disabled={isLoading} className="text-red-500 hover:bg-red-500/10 p-1 rounded">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setIsEditing(true)}>
      <Clock className="h-4 w-4" />
      <span>Due {new Date(currentDeadline).toLocaleDateString()}</span>
      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary ml-1" />
    </div>
  )
}
