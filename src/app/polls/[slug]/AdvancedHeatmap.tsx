"use client"

import { useMemo, useState } from "react"
import { Check } from "lucide-react"

type AdvancedHeatmapProps = {
  poll: any
  votes: any[]
  participants: any[]
  onSelectFinalTime: (time: any) => void
  selectedFinalTime: any
}

export default function AdvancedHeatmap({ poll, votes, participants, onSelectFinalTime, selectedFinalTime }: AdvancedHeatmapProps) {
  
  const participantMap = useMemo(() => {
    const map: Record<string, any> = {}
    participants.forEach(p => { map[p.id] = p })
    return map
  }, [participants])

  // Generate the 30-min blocks based on scheduleConstraints
  const { sortedDates, groupedSlots } = useMemo(() => {
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

    const blocksByDate: Record<string, any[]> = {}

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
          // Calculate overlaps
          const overlappingVotes = votes.filter(v => {
            const vStart = new Date(v.startTime).getTime()
            const vEnd = new Date(v.endTime).getTime()
            const bStart = slotStart.getTime()
            const bEnd = slotEnd.getTime()
            return vStart <= bStart && vEnd >= bEnd
          })

          blocksByDate[dateKey].push({
            id: dayStr + "-" + formatTime(slotStart),
            startTime: slotStart,
            endTime: slotEnd,
            overlappingVotes
          })
        }
      }
    }

    return {
      sortedDates: Object.keys(blocksByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
      groupedSlots: blocksByDate
    }
  }, [poll, votes])

  const maxVotes = useMemo(() => {
    let max = 0
    Object.values(groupedSlots).forEach(slots => {
      slots.forEach(slot => {
        if (slot.overlappingVotes.length > max) max = slot.overlappingVotes.length
      })
    })
    return max || 1 // Avoid divide by zero
  }, [groupedSlots])

  function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getOpacity = (count: number) => {
    if (count === 0) return 0
    const ratio = count / maxVotes
    return Math.max(0.2, ratio)
  }

  const [hoveredSlot, setHoveredSlot] = useState<any | null>(null)

  return (
    <div className="relative">
      <div className="overflow-x-auto select-none">
        <div className="p-4 flex gap-2 min-w-max items-end">
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
                  const count = slot.overlappingVotes.length
                  const isSelected = selectedFinalTime?.id === slot.id
                  const opacity = getOpacity(count)
                  
                  return (
                    <div
                      key={slot.id}
                      onClick={() => onSelectFinalTime(slot)}
                      onMouseEnter={() => setHoveredSlot(slot)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      className={`relative w-full py-2 px-1 text-center text-[11px] font-medium transition-all cursor-pointer rounded-sm border
                        ${isSelected ? 'ring-2 ring-primary border-primary z-10' : 'border-transparent'}
                        ${count === 0 ? 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50' : 'text-green-950 dark:text-green-50'}
                      `}
                      style={{
                        backgroundColor: count > 0 ? `rgba(34, 197, 94, ${opacity})` : undefined
                      }}
                    >
                      <div className="flex justify-between items-center px-1">
                        <span>{formatTime(slot.startTime)}</span>
                        {count > 0 && <span className="font-bold opacity-75">{count}</span>}
                      </div>

                      {/* Tooltip */}
                      {hoveredSlot?.id === slot.id && count > 0 && (
                        <div className="absolute left-full ml-2 top-0 z-50 w-48 bg-popover text-popover-foreground border border-border shadow-xl rounded-lg p-3 text-left">
                          <p className="text-xs font-bold mb-2 border-b border-border pb-1">
                            Available ({count}):
                          </p>
                          <ul className="space-y-1 max-h-32 overflow-y-auto">
                            {slot.overlappingVotes.map((v: any, i: number) => {
                              const p = participantMap[v.participantId]
                              return (
                                <li key={i} className="text-xs flex items-center gap-1.5 truncate">
                                  <Check className="h-3 w-3 text-green-500 shrink-0" />
                                  <span className="truncate">{p?.email || 'Unknown'}</span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
