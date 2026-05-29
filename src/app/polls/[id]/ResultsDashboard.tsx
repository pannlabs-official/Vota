"use client"

import { useState } from "react"
import { Users, CalendarCheck, ArrowRight, Award } from "lucide-react"
import AdvancedHeatmap from "./AdvancedHeatmap"
import ShareButton from "@/components/ShareButton"

type ResultsDashboardProps = {
  poll: any
  votes: any[]
  participants: any[]
}

export default function ResultsDashboard({ poll, votes, participants }: ResultsDashboardProps) {
  const [selectedFinalTime, setSelectedFinalTime] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      {/* Main Results View */}
      <div className="glass-card rounded-2xl p-6 shadow-sm border border-border">
        <div className="mb-6 pb-4 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Availability Heatmap</h2>
            <div className="text-sm text-muted-foreground mt-1">
              Hover over blocks to see who voted.
            </div>
          </div>
          <ShareButton pollId={poll.id} />
        </div>

        <AdvancedHeatmap 
          poll={poll} 
          votes={votes} 
          participants={participants} 
          onSelectFinalTime={setSelectedFinalTime}
          selectedFinalTime={selectedFinalTime}
        />
      </div>

      {/* Decision Maker */}
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
    </div>
  )
}
