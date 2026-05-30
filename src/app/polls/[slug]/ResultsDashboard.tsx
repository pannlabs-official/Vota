"use client"

import { useState } from "react"
import { Users, CalendarCheck, ArrowRight, Award } from "lucide-react"
import AdvancedHeatmap from "./AdvancedHeatmap"
import ShareButton from "@/components/ShareButton"

type ResultsDashboardProps = {
  poll: any
  votes: any[]
  participants: any[]
  isCreator: boolean
}

export default function ResultsDashboard({ poll, votes, participants, isCreator }: ResultsDashboardProps) {
  const [selectedFinalTime, setSelectedFinalTime] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortOrder, setSortOrder] = useState<"top" | "bottom">("top")
  const [limit, setLimit] = useState<number>(3)

  const handleFinalize = async () => {
    if (!selectedFinalTime) return
    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/polls/${poll.id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalTime: selectedFinalTime })
      })
      
      if (!res.ok) throw new Error("Failed to finalize")
      
      alert(`Meeting finalized for ${new Date(selectedFinalTime.startTime).toLocaleString()}!`)
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert("An error occurred while finalizing the poll.")
      setIsSubmitting(false)
    }
  }

  // Calculate top class times
  const timeCounts: Record<string, number> = votes.reduce((acc: Record<string, number>, vote) => {
    const timeStr = new Date(vote.startTime).getTime().toString()
    acc[timeStr] = (acc[timeStr] || 0) + 1
    return acc
  }, {})

  const sortedTimes = Object.entries(timeCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([timeStr, count]) => ({
      time: new Date(Number(timeStr)),
      count: count as number
    }))
    
  const maxCount = sortedTimes.length > 0 ? (sortedTimes[0].count as number) : 0
  const topTimes = sortedTimes.slice(0, 5)

  return (
    <div className="space-y-8 fade-in-up">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
            <h3 className="text-2xl font-bold">{participants.length}</h3>
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Votes Cast</p>
            <h3 className="text-2xl font-bold">{votes.length} blocks</h3>
          </div>
        </div>
      </div>

      {/* Top/Bottom Column Chart */}
      <div className="glass-card rounded-2xl p-6 shadow-sm border border-border bg-gradient-to-br from-background to-secondary/10">
        <div className="mb-6 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              Vote Leaderboard
            </h2>
            <div className="text-sm text-muted-foreground mt-1">
              Class time popularity ranking.
            </div>
          </div>
          
          {/* Slicer Controls */}
          {sortedTimes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-background/50 p-1.5 rounded-lg border border-border/50 shadow-sm">
              <div className="flex rounded-md overflow-hidden border border-border/50">
                <button 
                  onClick={() => setSortOrder("top")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortOrder === 'top' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                >
                  Top
                </button>
                <button 
                  onClick={() => setSortOrder("bottom")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${sortOrder === 'bottom' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                >
                  Bottom
                </button>
              </div>
              
              <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>
              
              <div className="flex rounded-md overflow-hidden border border-border/50">
                {[3, 5, -1].map((n) => (
                  <button 
                    key={n}
                    onClick={() => setLimit(n)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors border-l first:border-l-0 border-border/50 ${limit === n ? 'bg-secondary text-foreground' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                  >
                    {n === -1 ? 'All' : n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {sortedTimes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No votes cast yet.
          </div>
        ) : (
          <div className="mt-8 flex items-end justify-between h-48 gap-2 overflow-x-auto pb-2">
            {(() => {
              let displayTimes = [...sortedTimes]
              if (sortOrder === 'bottom') displayTimes.reverse()
              if (limit !== -1) displayTimes = displayTimes.slice(0, limit)
              
              const absoluteMaxCount = sortedTimes[0].count
              
              return displayTimes.map((item, index) => {
                const percentage = Math.max(8, Math.round((item.count / absoluteMaxCount) * 100))
                const isWinner = sortOrder === 'top' && index === 0
                
                return (
                  <div key={item.time.getTime()} className="group relative flex flex-col items-center flex-1 min-w-[60px] justify-end h-full">
                    <span className={`text-sm font-bold mb-2 transition-colors ${isWinner ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {item.count} {item.count === 1 ? 'vote' : 'votes'}
                    </span>
                    <div className="w-full max-w-[60px] bg-secondary rounded-t-lg overflow-hidden relative" style={{ height: `${percentage}%` }}>
                      <div 
                        className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-1000 ease-out h-full ${isWinner ? 'bg-gradient-to-t from-primary to-blue-500' : 'bg-primary/40 group-hover:bg-primary/60'}`} 
                      />
                    </div>
                    <div className="mt-3 text-xs text-center text-muted-foreground leading-tight h-8 whitespace-nowrap">
                      <span className="font-medium text-foreground">{item.time.toLocaleDateString([], { weekday: 'short' })}</span>
                      <br/>
                      {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>

      {/* Main Results View */}
      <div className="glass-card rounded-2xl p-6 shadow-sm border border-border">
        <div className="mb-6 pb-4 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Availability Heatmap</h2>
            <div className="text-sm text-muted-foreground mt-1">
              Hover over blocks to see who voted.
            </div>
          </div>
          <ShareButton pollId={poll.slug} urlSuffix="?tab=RESULTS" label="Share Results" />
        </div>

        <AdvancedHeatmap 
          poll={poll} 
          votes={votes} 
          participants={participants} 
          onSelectFinalTime={setSelectedFinalTime}
          selectedFinalTime={selectedFinalTime}
        />
      </div>

      {/* Voter Details */}
      <div className="glass-card rounded-2xl p-6 shadow-sm border border-border">
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-bold">Voter Details</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Breakdown of selected class times for each participant.
          </div>
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No one has voted yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map((p) => {
              const participantVotes = votes.filter(v => v.participantId === p.id)
              participantVotes.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              
              return (
                <div key={p.id} className="group bg-background/40 hover:bg-background/80 rounded-xl p-4 border border-border flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
                  <div className="flex items-center gap-3 border-b border-border/50 pb-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center text-primary font-bold shrink-0 transition-transform group-hover:scale-110">
                      {p.name ? p.name.charAt(0).toUpperCase() : p.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold truncate group-hover:text-primary transition-colors">{p.name || p.email.split('@')[0]}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Selected Times ({participantVotes.length})
                    </p>
                    {participantVotes.length > 0 ? (
                      participantVotes.map(v => (
                        <div key={v.id} className="text-sm bg-muted/50 rounded px-2 py-1.5 flex flex-col group-hover:bg-primary/5 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{new Date(v.startTime).toLocaleDateString([], { weekday: 'short' })}</span>
                            <span className="font-semibold">{new Date(v.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 border-t border-border/50 pt-1">
                            Voted: {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No times selected</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Decision Maker */}
      {isCreator && (
        <div className={`glass-card rounded-2xl p-6 md:p-8 border-2 ${poll.status === 'FINALIZED' ? 'border-green-500/20 bg-green-500/5' : 'border-primary/20 bg-primary/5'}`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${poll.status === 'FINALIZED' ? 'bg-green-500' : 'bg-primary'}`}>
              <Award className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                {poll.status === 'FINALIZED' ? 'Meeting Time Finalized' : 'Finalize Meeting Time'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {poll.status === 'FINALIZED' 
                  ? 'The official meeting time has been locked in.' 
                  : 'Select a time block from the results above to lock in the official meeting time.'}
              </p>
              
              {(poll.status === 'FINALIZED' && poll.finalTime) ? (
                <div className="bg-background rounded-xl p-4 border border-green-200 shadow-sm mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-600 font-medium mb-1">Official Time:</p>
                    <p className="font-semibold text-lg">
                      {new Date(JSON.parse(poll.finalTime).startTime).toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                      {" - "}
                      {new Date(JSON.parse(poll.finalTime).endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ) : selectedFinalTime ? (
                <div className="bg-background rounded-xl p-4 border border-border shadow-sm mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Selected Time:</p>
                    <p className="font-semibold text-lg">
                      {new Date(selectedFinalTime.startTime).toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                      {" - "}
                      {new Date(selectedFinalTime.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-background/50 rounded-xl p-4 border border-dashed border-border mb-6 text-center text-muted-foreground">
                  Click on a time block above to select it.
                </div>
              )}

              {poll.status !== 'FINALIZED' && (
                <button
                  onClick={handleFinalize}
                  disabled={!selectedFinalTime || isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary h-12 px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? "Finalizing..." : (
                    <>Lock in this time <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
