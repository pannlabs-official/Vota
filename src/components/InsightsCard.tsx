"use client"

import { Lightbulb, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { generateInsights } from "@/lib/generateInsights"

export default function InsightsCard({ votes, participants }: { votes: any[], participants: any[] }) {
  const [insights, setInsights] = useState<string[]>([])
  
  useEffect(() => {
    if (votes && participants) {
      setInsights(generateInsights(votes, participants))
    }
  }, [votes, participants])

  if (!insights || insights.length === 0) return null

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24 text-primary" />
      </div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Auto Insights</h2>
          <p className="text-xs text-muted-foreground">Automated summary of the voting data</p>
        </div>
      </div>
      
      <ul className="space-y-3 relative z-10">
        {insights.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-foreground bg-background/50 rounded-lg p-3 border border-border/50">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold mt-0.5">
              {idx + 1}
            </span>
            <span className="leading-relaxed">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
