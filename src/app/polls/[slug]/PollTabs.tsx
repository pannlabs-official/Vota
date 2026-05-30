"use client"

import { useState, useEffect } from "react"
import { BarChart3, CheckSquare } from "lucide-react"
import VotingGrid from "./VotingGrid"
import ResultsDashboard from "./ResultsDashboard"

import { useSearchParams } from "next/navigation"

type PollTabsProps = {
  poll: any
  isCreator: boolean
  votes: any[]
  participants: any[]
}

export default function PollTabs({ poll, isCreator, votes: initialVotes, participants: initialParticipants }: PollTabsProps) {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "RESULTS" ? "RESULTS" : "VOTE"
  const [activeTab, setActiveTab] = useState<"VOTE" | "RESULTS">(initialTab)
  const [votes, setVotes] = useState(initialVotes)
  const [participants, setParticipants] = useState(initialParticipants)

  useEffect(() => {
    // Silent background sync every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/polls/${poll.id}`)
        if (res.ok) {
          const data = await res.json()
          setVotes(data.votes)
          setParticipants(data.participants)
        }
      } catch (err) {
        console.error("Failed to sync votes in background")
      }
    }, 10000)
    
    return () => clearInterval(interval)
  }, [poll.id])

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-8 fade-in-up">
        <div className="bg-secondary/50 p-1 rounded-xl inline-flex shadow-sm border border-border">
          <button
            onClick={() => setActiveTab("VOTE")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "VOTE"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            Vote
          </button>
          <button
            onClick={() => setActiveTab("RESULTS")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "RESULTS"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Results
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "VOTE" ? (
          <VotingGrid poll={poll} />
        ) : (
          <ResultsDashboard poll={poll} votes={votes} participants={participants} isCreator={isCreator} />
        )}
      </div>
    </div>
  )
}
