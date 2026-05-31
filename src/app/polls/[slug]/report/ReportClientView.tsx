"use client"

import { useState } from "react"

export default function ReportClientView({ votes }: { votes: any[] }) {
  // Calculate top class times
  const timeCounts: Record<string, number> = votes.reduce((acc: Record<string, number>, vote) => {
    const timeStr = new Date(vote.startTime).getTime().toString()
    acc[timeStr] = (acc[timeStr] || 0) + 1
    return acc
  }, {})

  const sortedTimes = Object.entries(timeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([timeStr, count]) => ({
      time: new Date(Number(timeStr)),
      count: count
    }))
    
  if (sortedTimes.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-sm border border-border text-center py-12 text-muted-foreground">
        No votes cast yet.
      </div>
    )
  }

  const top3 = sortedTimes.slice(0, 3)
  const bottom3 = [...sortedTimes].reverse().slice(0, 3)
  const absoluteMaxCount = sortedTimes[0].count

  const renderChart = (displayTimes: any[], isTop: boolean) => (
    <div className="mt-6 flex items-end justify-between h-48 gap-2 overflow-x-auto pb-2">
      {displayTimes.map((item, index) => {
        const percentage = Math.max(8, Math.round((item.count / absoluteMaxCount) * 100))
        const isWinner = isTop && index === 0
        
        return (
          <div key={item.time.getTime()} className="group relative flex flex-col items-center flex-1 min-w-[80px] justify-end h-full">
            <span className={`text-sm font-bold mb-2 transition-colors ${isWinner ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
              {item.count} {item.count === 1 ? 'vote' : 'votes'}
            </span>
            <div className="w-full max-w-[80px] bg-secondary rounded-t-lg overflow-hidden relative" style={{ height: `${percentage}%` }}>
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
      })}
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card rounded-2xl p-6 shadow-sm border border-border bg-gradient-to-br from-background to-secondary/10">
        <div className="mb-4 pb-4 border-b border-border">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
            Top 3 Times
          </h2>
          <div className="text-sm text-muted-foreground mt-1">
            Most popular choices
          </div>
        </div>
        {renderChart(top3, true)}
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm border border-border bg-gradient-to-br from-background to-secondary/10">
        <div className="mb-4 pb-4 border-b border-border">
          <h2 className="text-xl font-bold text-muted-foreground">
            Bottom 3 Times
          </h2>
          <div className="text-sm text-muted-foreground mt-1">
            Least popular choices
          </div>
        </div>
        {renderChart(bottom3, false)}
      </div>
    </div>
  )
}
