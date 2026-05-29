"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Check, Info } from "lucide-react"

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
    // ... rest of the grid generation logic is identical ...
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
            id: dayStr + "-" + formatTime(slotStart), // Use a generic ID instead of ISO date
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

  const [isDragging, setIsDragging] = useState(false)
  const [isSelecting, setIsSelecting] = useState(true)

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false)
    window.addEventListener("mouseup", handleMouseUp)
    return () => window.removeEventListener("mouseup", handleMouseUp)
  }, [])

  const handleMouseDown = (id: string) => {
    setIsDragging(true)
    const currentlySelected = selectedSlots.has(id)
    setIsSelecting(!currentlySelected) 
    updateSelection(id, !currentlySelected)
  }

  const handleMouseEnter = (id: string) => {
    if (isDragging) {
      updateSelection(id, isSelecting)
    }
  }

  const updateSelection = useCallback((id: string, select: boolean) => {
    setSelectedSlots(prev => {
      const next = new Set(prev)
      if (select) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // We now just send the raw IDs or generic block times, but let's reconstruct the Date objects for the backend format
    const selectedBlocks = Array.from(selectedSlots).map(id => {
      // Find the actual block from groupedSlots
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
      <div className="glass-card rounded-2xl overflow-hidden shadow-lg border border-primary/10">
        <div className="p-4 bg-muted/30 border-b border-border flex items-start gap-2">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong>Click and drag</strong> across the grid to mark exactly when you are available. The grid matches the specific windows defined for each day.
          </p>
        </div>
        
        <div className="overflow-x-auto select-none touch-none">
          <div className="p-6 flex gap-2 min-w-max items-end">
            {sortedDates.length === 0 && (
               <div className="p-4 text-center w-full text-muted-foreground">No valid dates found in the range.</div>
            )}
            
            {sortedDates.map((date) => (
              <div key={date} className="flex-1 min-w-[120px] space-y-1">
                <div className="text-center pb-4 mb-2 border-b border-border">
                  <div className="font-semibold text-lg">{new Date(date).toLocaleDateString([], { weekday: 'long' })}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Weekly</div>
                </div>
                
                <div className="space-y-[2px]">
                  {groupedSlots[date].map((slot) => {
                    const isSelected = selectedSlots.has(slot.id)
                    return (
                      <div
                        key={slot.id}
                        onMouseDown={() => handleMouseDown(slot.id)}
                        onMouseEnter={() => handleMouseEnter(slot.id)}
                        onTouchStart={() => handleMouseDown(slot.id)}
                        className={`w-full py-2 px-1 text-center text-[11px] font-medium transition-colors cursor-crosshair
                          ${isSelected 
                            ? "bg-green-500 hover:bg-green-600 text-white shadow-sm ring-1 ring-green-600" 
                            : "bg-secondary/50 hover:bg-secondary/80 text-muted-foreground"
                          }
                        `}
                      >
                        {formatTime(slot.startTime)}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 shadow-md border border-primary/10">
        <h3 className="text-lg font-semibold mb-6">Confirm Your Availability</h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="text-sm font-medium leading-none" htmlFor="name">Your Name</label>
            <input
              id="name"
              required
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 mt-2"
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
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 mt-2"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || selectedSlots.size === 0}
          className="w-full inline-flex items-center justify-center rounded-lg bg-primary h-12 px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? "Submitting..." : `Submit Votes (${selectedSlots.size} blocks selected)`}
        </button>
      </form>
    </div>
  )
}
