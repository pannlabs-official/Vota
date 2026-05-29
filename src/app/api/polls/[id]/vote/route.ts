import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params
    const { name, email, selectedSlots } = await req.json()

    // selectedSlots is now an array of { startTime, endTime }
    if (!name || !email || !selectedSlots || !Array.isArray(selectedSlots)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    // Try to get authenticated user (optional)
    const session = await auth()
    const userId = session?.user?.id

    // Find or create participant for this poll
    let participant = await prisma.participant.findUnique({
      where: {
        pollId_email: {
          pollId,
          email
        }
      }
    })

    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          pollId,
          email,
          name,
          hasVoted: true
        }
      })
    } else {
      await prisma.vote.deleteMany({
        where: {
          pollId,
          participantId: participant.id
        }
      })
      
      await prisma.participant.update({
        where: { id: participant.id },
        data: { hasVoted: true, name }
      })
    }

    // Create the new votes
    if (selectedSlots.length > 0) {
      const votesToCreate = selectedSlots.map((slot: { startTime: string, endTime: string }) => ({
        pollId,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
        participantId: participant.id,
        ...(userId && { userId })
      }))

      await prisma.vote.createMany({
        data: votesToCreate
      })
    }

    return NextResponse.json(
      { message: "Votes submitted successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error submitting votes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
