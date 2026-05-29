"use client"

import { useMemo, useState } from "react"
import { Calendar, User } from "lucide-react"

type BasicResultsListProps = {
  poll: any
  votes: any[]
  participants: any[]
  onSelectFinalTime: (time: any) => void
  selectedFinalTime: any
}

export default function BasicResultsList({ poll, votes, participants, onSelectFinalTime, selectedFinalTime }: BasicResultsListProps) {
  
  const participantMap = useMemo(() => {
    const map: Record<string, any> = {}
    participants.forEach(p => { map[p.id] = p })
    return map
  }, [participants])

  // Group votes by Date String (e.g. "2026-10-01")
  const groupedVotes = useMemo(() => {
    const map: Record<string, any[]> = {}
    
    votes.forEach(vote => {
      const date = new Date(vote.startTime)
      const dateStr = date.toDateString()
      if (!map[dateStr]) map[dateStr] = []
      map[dateStr].push(vote)
    })
    
    // Sort votes within each day by start time
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    })
    
    return map
  }, [votes])
  
  const sortedDates = Object.keys(groupedVotes).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  if (votes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
        No votes have been submitted yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map(dateStr => (
        <div key={dateStr} className="bg-background/50 border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">
              {new Date(dateStr).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <span className="ml-auto text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {groupedVotes[dateStr].length} blocks
            </span>
          </div>
          
          <div className="divide-y divide-border">
            {groupedVotes[dateStr].map((vote, idx) => {
              const p = participantMap[vote.participantId]
              const isSelected = selectedFinalTime?.id === vote.id
              
              return (
                <div 
                  key={vote.id} 
                  onClick={() => onSelectFinalTime({ id: vote.id, startTime: vote.startTime, endTime: vote.endTime })}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors
                    ${isSelected ? 'bg-primary/5 ring-inset ring-2 ring-primary' : 'hover:bg-muted/20'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p?.email || 'Unknown Voter'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Submitted a preferred time block</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <div className="bg-background border border-border rounded-md px-3 py-1.5 text-sm font-medium shadow-sm">
                      {new Date(vote.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className="text-muted-foreground text-sm">to</span>
                    <div className="bg-background border border-border rounded-md px-3 py-1.5 text-sm font-medium shadow-sm">
                      {new Date(vote.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
