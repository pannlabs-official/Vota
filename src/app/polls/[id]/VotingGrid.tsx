"use client"

import { useState, useMemo } from "react"
import { Check, Info, ChevronDown, ChevronUp, Trash2, Calendar } from "lucide-react"

type Poll = {
  id: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date
  scheduleConstraints: string
}

type TimeBlock = {
  id: string 
  startTime: Date
  endTime: Date
}

export default function VotingGrid({ poll }: { poll: Poll }) {
  // Generate the 30-min blocks on the client based on JSON constraints
  const groupedSlots = useMemo(() => {
    const constraints: Record<string, { start: string, end: string }> = JSON.parse(poll.scheduleConstraints || "{}")
    
    // Use an arbitrary fixed week (Jan 1, 2024 is a Monday) to generate generic day blocks
    const start = new Date("2024-01-01T00:00:00")
    const end = new Date("2024-01-07T00:00:00")
    const dates = []
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStr = d.getDay().toString()
      if (constraints[dayStr]) {
        dates.push(new Date(d))
      }
    }

    const blocksByDate: Record<string, TimeBlock[]> = {}
    for (const date of dates) {
      const dateKey = date.toDateString()
      blocksByDate[dateKey] = []
      
      const dayStr = date.getDay().toString()
      const constraint = constraints[dayStr]
      
      if (!constraint) continue

      const [startHour, startMin] = constraint.start.split(":").map(Number)
      const [endHour, endMin] = constraint.end.split(":").map(Number)

      const currentSlotTime = new Date(date)
      currentSlotTime.setHours(startHour, startMin, 0, 0)
      
      const dayEndTime = new Date(date)
      dayEndTime.setHours(endHour, endMin, 0, 0)
      
      while (currentSlotTime < dayEndTime) {
        const slotStart = new Date(currentSlotTime)
        currentSlotTime.setMinutes(currentSlotTime.getMinutes() + 30)
        const slotEnd = new Date(currentSlotTime)
        
        if (slotEnd <= dayEndTime) {
          blocksByDate[dateKey].push({
            id: dayStr + "-" + formatTime(slotStart), // Use a generic ID
            startTime: slotStart,
            endTime: slotEnd
          })
        }
      }
    }

    return blocksByDate
  }, [poll])

  const sortedDates = Object.keys(groupedSlots).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [participantName, setParticipantName] = useState("")
  const [participantEmail, setParticipantEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // By default, expand the first day if available
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(sortedDates.length > 0 ? [sortedDates[0]] : [])
  )

  const toggleDay = (dateStr: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }

  const handleToggleSlot = (id: string) => {
    setSelectedSlots(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelections = () => {
    setSelectedSlots(new Set())
  }

  function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const selectedBlocks = Array.from(selectedSlots).map(id => {
      let foundBlock: TimeBlock | null = null
      Object.values(groupedSlots).forEach(slots => {
        const slot = slots.find(s => s.id === id)
        if (slot) foundBlock = slot
      })
      
      return {
        startTime: foundBlock!.startTime.toISOString(),
        endTime: foundBlock!.endTime.toISOString()
      }
    })

    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: participantName,
          email: participantEmail,
          selectedSlots: selectedBlocks
        })
      })

      if (!res.ok) throw new Error("Failed to submit vote")
      
      setSuccess(true)
    } catch (err) {
      console.error(err)
      alert("Failed to submit vote. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center fade-in-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-6">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Availability Submitted!</h2>
        <p className="text-muted-foreground">Your schedule has been recorded successfully.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in-up">
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="p-4 bg-muted/30 border-b border-border flex items-start gap-2 justify-between flex-col sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong>Tap</strong> the time slots that work for you.
            </p>
          </div>
          
          {selectedSlots.size > 0 && (
            <button 
              onClick={clearSelections}
              className="mt-3 sm:mt-0 inline-flex items-center text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear Selections
            </button>
          )}
        </div>
        
        <div className="p-4 md:p-6 space-y-4">
          {sortedDates.length === 0 && (
             <div className="p-4 text-center w-full text-muted-foreground">No valid dates found in the range.</div>
          )}
          
          {sortedDates.map((date) => {
            const isExpanded = expandedDays.has(date)
            const daySlots = groupedSlots[date]
            const selectedInDay = daySlots.filter(s => selectedSlots.has(s.id)).length
            
            return (
              <div key={date} className="border border-border rounded-xl overflow-hidden bg-background/50 transition-all">
                <button
                  type="button"
                  onClick={() => toggleDay(date)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-semibold">{new Date(date).toLocaleDateString([], { weekday: 'long' })}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Weekly</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {selectedInDay > 0 && (
                      <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        {selectedInDay} selected
                      </span>
                    )}
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-4 border-t border-border bg-background/30 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {daySlots.map((slot) => {
                      const isSelected = selectedSlots.has(slot.id)
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleToggleSlot(slot.id)}
                          className={`
                            py-3 px-2 rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center
                            ${isSelected 
                              ? "bg-green-500 hover:bg-green-600 text-white shadow-md ring-2 ring-green-500 ring-offset-1 ring-offset-background scale-[1.02]" 
                              : "bg-secondary/60 hover:bg-secondary border border-border/50 text-foreground hover:scale-[1.02]"
                            }
                          `}
                        >
                          <span>{formatTime(slot.startTime)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
        <h3 className="text-lg font-semibold mb-6">Confirm Your Availability</h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="text-sm font-medium leading-none" htmlFor="name">Your Name</label>
            <input
              id="name"
              required
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="flex h-12 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 mt-2"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-sm font-medium leading-none" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              className="flex h-12 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 mt-2"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || selectedSlots.size === 0}
          className="w-full inline-flex items-center justify-center rounded-xl bg-primary h-14 px-8 text-lg font-medium text-primary-foreground shadow-lg transition-transform hover:scale-[1.01] hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
        >
          {isSubmitting ? "Submitting..." : `Submit Votes (${selectedSlots.size} blocks selected)`}
        </button>
      </form>
    </div>
  )
}
