export function generateInsights(votes: any[], participants: any[]): string[] {
  if (!votes || votes.length === 0 || !participants || participants.length === 0) {
    return ["Not enough data to generate insights yet. Waiting for participants to vote!"]
  }

  const insights: string[] = []
  
  // 1. Most popular time calculation
  const timeCounts: Record<string, number> = {}
  votes.forEach(v => {
    const timeStr = new Date(v.startTime).getTime().toString()
    timeCounts[timeStr] = (timeCounts[timeStr] || 0) + 1
  })

  const sortedTimes = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])
  const maxVotes = sortedTimes[0][1]
  const topTimes = sortedTimes.filter(t => t[1] === maxVotes)
  const consensusPercentage = Math.round((maxVotes / participants.length) * 100)

  if (topTimes.length === 1) {
    const bestTime = new Date(Number(topTimes[0][0]))
    const dayStr = bestTime.toLocaleDateString([], { weekday: 'long' })
    const timeStr = bestTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    if (consensusPercentage >= 50) {
      insights.push(`${dayStr} at ${timeStr} is the clear winner with ${consensusPercentage}% consensus!`)
    } else {
      insights.push(`The most popular time so far is ${dayStr} at ${timeStr}, but it only has ${consensusPercentage}% consensus.`)
    }
  } else {
    insights.push(`There is a ${topTimes.length}-way tie for the most popular time, each with ${maxVotes} votes (${consensusPercentage}% consensus).`)
  }

  // 2. Day popularity
  const dayCounts: Record<string, number> = {}
  votes.forEach(v => {
    const dayStr = new Date(v.startTime).toLocaleDateString([], { weekday: 'long' })
    dayCounts[dayStr] = (dayCounts[dayStr] || 0) + 1
  })
  const sortedDays = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])
  if (sortedDays.length > 1) {
    const bestDay = sortedDays[0][0]
    const dayPercentage = Math.round((sortedDays[0][1] / votes.length) * 100)
    insights.push(`${bestDay}s are the most popular day overall, receiving ${dayPercentage}% of all votes cast.`)
  }

  // 3. Time of day preference (Morning < 12, Afternoon 12-17, Evening > 17)
  let morning = 0, afternoon = 0, evening = 0
  votes.forEach(v => {
    const hour = new Date(v.startTime).getHours()
    if (hour < 12) morning++
    else if (hour < 17) afternoon++
    else evening++
  })

  const timeOfDayCounts = [
    { name: "morning", count: morning },
    { name: "afternoon", count: afternoon },
    { name: "evening", count: evening }
  ].sort((a, b) => b.count - a.count)

  if (timeOfDayCounts[0].count > votes.length * 0.5) {
    insights.push(`Participants heavily prefer ${timeOfDayCounts[0].name} slots over other times of day.`)
  } else if (timeOfDayCounts[0].count > 0 && timeOfDayCounts[1].count > 0 && timeOfDayCounts[0].count === timeOfDayCounts[1].count) {
    insights.push(`There's an even split in preference between ${timeOfDayCounts[0].name} and ${timeOfDayCounts[1].name} slots.`)
  } else {
    insights.push(`Votes are fairly spread out, but ${timeOfDayCounts[0].name} slots have a slight edge.`)
  }

  // 4. General participation
  insights.push(`${participants.length} people have participated so far, casting a total of ${votes.length} time blocks.`)

  return insights
}
