"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar as CalendarIcon, Clock, ArrowRight } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

const DAYS_OF_WEEK = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
]

type DayConstraint = {
  enabled: boolean
  start: Date
  end: Date
}

export default function CreatePollPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 7)))
  
  // Per-Day Constraints
  const [constraints, setConstraints] = useState<Record<string, DayConstraint>>(() => {
    const initial: Record<string, DayConstraint> = {}
    DAYS_OF_WEEK.forEach(day => {
      const start = new Date()
      start.setHours(9, 0, 0, 0)
      const end = new Date()
      end.setHours(17, 0, 0, 0)
      
      initial[day.value] = {
        enabled: ["1", "2", "3", "4", "5"].includes(day.value),
        start,
        end
      }
    })
    return initial
  })

  const toggleDayEnabled = (dayValue: string) => {
    setConstraints(prev => ({
      ...prev,
      [dayValue]: { ...prev[dayValue], enabled: !prev[dayValue].enabled }
    }))
  }

  const updateDayTime = (dayValue: string, field: "start" | "end", date: Date | null) => {
    if (!date) return
    setConstraints(prev => ({
      ...prev,
      [dayValue]: { ...prev[dayValue], [field]: date }
    }))
  }

  const formatTimeString = (d: Date) => {
    return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if at least one day is enabled
    const hasEnabledDay = Object.values(constraints).some(c => c.enabled)
    if (!hasEnabledDay) {
      setError("Please enable at least one day of the week.")
      return
    }
    
    setLoading(true)
    setError("")

    // Format the constraints into the final JSON structure
    const scheduleConstraints: Record<string, { start: string, end: string }> = {}
    Object.keys(constraints).forEach(key => {
      if (constraints[key].enabled) {
        scheduleConstraints[key] = {
          start: formatTimeString(constraints[key].start),
          end: formatTimeString(constraints[key].end)
        }
      }
    })

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          deadline: deadline ? deadline.toISOString() : null,
          scheduleConstraints: JSON.stringify(scheduleConstraints)
        })
      })

      if (!res.ok) {
        throw new Error("Failed to create poll")
      }

      const data = await res.json()
      router.push(`/polls/${data.pollId}`) 
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 pt-12 space-y-8 fade-in-up pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create a Scheduling Poll</h1>
        <p className="text-muted-foreground mt-1">
          Merge cohorts easily. Set exact time windows for specific days of the week to find overlapping availability.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/20">
            {error}
          </div>
        )}

        {/* Section 1: Basic Info */}
        <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="font-bold">1</span>
            </div>
            <h2 className="text-xl font-semibold">Event Details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium leading-none" htmlFor="title">Event Name</label>
              <input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 mt-2 transition-shadow"
                placeholder="e.g. Q3 Planning Offsite"
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none" htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 mt-2 transition-shadow"
                placeholder="Provide some context for the meeting..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Per-Day Schedules */}
        <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold">Custom Daily Schedules</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Enable the days you want to allow voting on, and specify the exact time window for each day. This is perfect for irregular schedules.
          </p>

          <div className="space-y-4">
            {DAYS_OF_WEEK.map(day => {
              const constraint = constraints[day.value]
              return (
                <div key={day.value} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-colors ${constraint.enabled ? 'border-primary/50 bg-primary/5' : 'border-border bg-background/50 opacity-60 hover:opacity-100'}`}>
                  
                  <div className="flex items-center gap-3 sm:w-1/3">
                    <input 
                      type="checkbox"
                      id={`day-${day.value}`}
                      checked={constraint.enabled}
                      onChange={() => toggleDayEnabled(day.value)}
                      className="h-5 w-5 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor={`day-${day.value}`} className="font-semibold cursor-pointer">
                      {day.label}
                    </label>
                  </div>

                  <div className={`flex flex-1 items-center gap-3 transition-opacity ${constraint.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="flex-1">
                      <DatePicker
                        selected={constraint.start}
                        onChange={(date) => updateDayTime(day.value, "start", date)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={30}
                        timeCaption="From"
                        dateFormat="h:mm aa"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <span className="text-muted-foreground text-sm font-medium">to</span>
                    <div className="flex-1">
                      <DatePicker
                        selected={constraint.end}
                        onChange={(date) => updateDayTime(day.value, "end", date)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={30}
                        timeCaption="To"
                        dateFormat="h:mm aa"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  
                </div>
              )
            })}
          </div>
          
          <div className="pt-6 border-t border-border mt-8">
            <label className="text-sm font-medium leading-none mb-2 block">Voting Deadline</label>
            <DatePicker
              selected={deadline}
              onChange={(date) => setDeadline(date)}
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="MM/dd/yyyy h:mm aa"
              className="flex h-12 w-full sm:w-1/2 rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background"
            />
            <p className="text-xs text-muted-foreground mt-2">When do you need all votes submitted by?</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Creating..." : (
              <>
                Create Poll <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
