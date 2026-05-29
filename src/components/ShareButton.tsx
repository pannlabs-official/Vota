"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"

type ShareButtonProps = {
  pollId: string
  className?: string
}

export default function ShareButton({ pollId, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/polls/${pollId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL", err)
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${className}`}
    >
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="mr-2 h-4 w-4" />
          Share Poll
        </>
      )}
    </button>
  )
}
