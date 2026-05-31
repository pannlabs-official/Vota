"use client"

import { useState } from "react"

export default function ReportClientView({ votes }: { votes: any[] }) {
  const [sortOrder, setSortOrder] = useState<"top" | "bottom">("top")
  const [limit, setLimit] = useState<number>(5)

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
    
  return (
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
  )
}
