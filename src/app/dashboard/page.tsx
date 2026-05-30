import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Calendar, Clock, Users } from "lucide-react"
import prisma from "@/lib/prisma"
import ShareButton from "@/components/ShareButton"
import DeadlineEditor from "./DeadlineEditor"

export default async function DashboardPage() {
  const session = await auth()

  if (!session || !session.user?.id) {
    redirect("/login")
  }

  // Fetch polls from database
  const polls = await prisma.poll.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { participants: true, votes: true }
      }
    }
  })

  return (
    <div className="container mx-auto max-w-6xl p-4 pt-12 space-y-8 fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        
        <Link 
          href="/polls/new" 
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Poll
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center justify-center min-h-[200px] border-dashed">
            <p className="text-muted-foreground mb-4">You haven't created any polls yet.</p>
            <Link 
              href="/polls/new" 
              className="text-sm font-medium text-primary hover:underline"
            >
              Create your first poll
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <div key={poll.id} className="glass-card rounded-xl p-6 flex flex-col space-y-4 hover:border-primary/50 transition-colors group">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <Link href={`/polls/${poll.slug}`} className="font-bold text-lg hover:text-primary transition-colors line-clamp-1 block">
                    {poll.title}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {poll.description || "No description provided."}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    poll.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                    poll.status === "FINALIZED" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {poll.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 pt-4 border-t border-border/50">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <DeadlineEditor pollId={poll.id} currentDeadline={poll.deadline} />
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{poll._count.votes} Votes</span>
                  </div>
                </div>
                
                <ShareButton pollId={poll.slug} className="h-8 text-xs px-3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
