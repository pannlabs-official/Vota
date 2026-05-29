"use client"

import { useState, useMemo } from "react"
import { Check, Plus, Trash2 } from "lucide-react"

type Poll = {
  id: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date
  dailyStartTime: string
  dailyEndTime: string
  allowedDays: string
}

type TimeSlotEntry = {
  id: string
  date: string // e.g. "2026-10-01"
  startTime: string // "09:00"
  endTime: string // "10:00"
}

export default function BasicVotingForm({ poll }: { poll: Poll }) {
  const [entries, setEntries] = useState<TimeSlotEntry[]>([])
  
  const [participantName, setParticipantName] = useState("")
  const [participantEmail, setParticipantEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [error, setError] = useState("")

  const allowedDates = useMemo(() => {
    const allowedDaysArray = poll.allowedDays.split(",").map(Number)
    const start = new Date(poll.startDate)
    const end = new Date(poll.endDate)
    const dates = []
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (allowedDaysArray.includes(d.getDay())) {
        dates.push(new Date(d))
      }
    }
    return dates
  }, [poll])

  const addEntry = () => {
    if (allowedDates.length === 0) return
    const firstDate = allowedDates[0].toISOString().split('T')[0]
    setEntries([
      ...entries, 
      { 
        id: Math.random().toString(36).substring(7), 
        date: firstDate, 
        startTime: poll.dailyStartTime, 
        endTime: poll.dailyEndTime 
      }
    ])
  }

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id))
  }

  const updateEntry = (id: string, field: keyof TimeSlotEntry, value: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (entries.length === 0) {
      setError("Please add at least one available time slot.")
      return
    }

    setIsSubmitting(true)
    
    const formattedSlots = entries.map(entry => {
      // Create local dates
      const startDateTime = new Date(`${entry.date}T${entry.startTime}:00`)
      const endDateTime = new Date(`${entry.date}T${entry.endTime}:00`)
      
      return {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      }
    })

    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: participantName,
          email: participantEmail,
          selectedSlots: formattedSlots
        })
      })

      if (!res.ok) throw new Error("Failed to submit vote")
      
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError("Failed to submit vote. Please try again.")
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
        <p className="text-muted-foreground">Thank you for letting us know when you're free.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in-up">
      <div className="glass-card rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold">Your Availability</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add the specific days and times you are free to meet.
              Poll limits: {poll.dailyStartTime} to {poll.dailyEndTime}
            </p>
          </div>
          <button
            type="button"
            onClick={addEntry}
            className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow hover:bg-secondary/80"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Time
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
            <p className="text-muted-foreground mb-4">You haven't added any available times yet.</p>
            <button
              type="button"
              onClick={addEntry}
              className="text-sm font-medium text-primary hover:underline"
            >
              Click here to add your first available time
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={entry.id} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center p-4 rounded-lg border bg-background/50">
                <div className="flex-1 w-full">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                  <select
                    value={entry.date}
                    onChange={(e) => updateEntry(entry.id, "date", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {allowedDates.map(date => {
                      const dateStr = date.toISOString().split('T')[0]
                      return (
                        <option key={dateStr} value={dateStr}>
                          {date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </option>
                      )
                    })}
                  </select>
                </div>
                
                <div className="w-full sm:w-32">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
                  <input
                    type="time"
                    value={entry.startTime}
                    min={poll.dailyStartTime}
                    max={poll.dailyEndTime}
                    onChange={(e) => updateEntry(entry.id, "startTime", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                
                <span className="hidden sm:block text-muted-foreground px-2 pt-5">to</span>
                
                <div className="w-full sm:w-32">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                  <input
                    type="time"
                    value={entry.endTime}
                    min={poll.dailyStartTime}
                    max={poll.dailyEndTime}
                    onChange={(e) => updateEntry(entry.id, "endTime", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors mt-4 sm:mt-5"
                  title="Remove time"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 shadow-md border border-primary/10">
        <h3 className="text-lg font-semibold mb-6">Confirm Your Availability</h3>
        
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="text-sm font-medium leading-none" htmlFor="name">Your Name</label>
            <input
              id="name"
              required
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground mt-2"
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
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground mt-2"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || entries.length === 0}
          className="w-full inline-flex items-center justify-center rounded-lg bg-primary h-12 px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? "Submitting..." : `Submit Availability`}
        </button>
      </form>
    </div>
  )
}
