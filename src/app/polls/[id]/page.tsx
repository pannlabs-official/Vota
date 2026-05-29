import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import PollTabs from "./PollTabs"

export default async function PollViewPage({ params }: { params: { id: string } }) {
  const { id } = await params
  
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      votes: {
        include: {
          participant: true
        }
      },
      participants: true
    }
  })

  if (!poll) {
    notFound()
  }

  const session = await auth()
  const isCreator = session?.user?.id === poll.creatorId

  return (
    <div className="container mx-auto max-w-5xl p-4 pt-12 space-y-8 pb-24">
      <div className="glass-card rounded-2xl p-8 border-b-4 border-primary fade-in-up">
        <h1 className="text-4xl font-extrabold tracking-tight">{poll.title}</h1>
        {poll.description && (
          <p className="text-xl text-muted-foreground mt-4">{poll.description}</p>
        )}
      </div>

      <PollTabs 
        poll={poll} 
        isCreator={isCreator} 
        votes={poll.votes} 
        participants={poll.participants} 
      />
    </div>
  )
}
