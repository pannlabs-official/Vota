import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Users, CalendarCheck } from "lucide-react"
import { generateInsights } from "@/lib/generateInsights"
import InsightsCard from "@/components/InsightsCard"
import ReportClientView from "./ReportClientView"

export default async function PublicReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  const poll = await prisma.poll.findUnique({
    where: { slug },
    include: {
      votes: true,
      participants: {
        select: {
          id: true,
          pollId: true,
          hasVoted: true,
          createdAt: true,
          // Explicitly omit email and name to protect privacy in Server Component
        }
      }
    }
  })

  if (!poll) {
    notFound()
  }

  const insights = generateInsights(poll.votes, poll.participants)

  return (
    <div className="container mx-auto max-w-5xl p-4 pt-12 space-y-8 pb-24">
      {/* Header */}
      <div className="glass-card rounded-2xl p-8 border-b-4 border-primary fade-in-up">
        <h1 className="text-4xl font-extrabold tracking-tight">{poll.title}</h1>
        {poll.description && (
          <p className="text-xl text-muted-foreground mt-4">{poll.description}</p>
        )}
        <div className="mt-4 inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
          Public Read-Only Report
        </div>
      </div>

      <div className="space-y-8 fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <InsightsCard insights={insights} />
          </div>
          
          <div className="space-y-6 flex flex-col justify-center">
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                <h3 className="text-2xl font-bold">{poll.participants.length}</h3>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Votes Cast</p>
                <h3 className="text-2xl font-bold">{poll.votes.length} blocks</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Client component for the interactive charts */}
        <ReportClientView votes={poll.votes} />
      </div>
    </div>
  )
}
