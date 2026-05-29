import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { finalTime } = body

    if (!finalTime) {
      return NextResponse.json(
        { error: "Missing final time" },
        { status: 400 }
      )
    }

    // Verify ownership
    const poll = await prisma.poll.findUnique({
      where: { id }
    })

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })
    }

    if (poll.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the creator can finalize this poll" },
        { status: 403 }
      )
    }

    // Update the poll
    const updatedPoll = await prisma.poll.update({
      where: { id },
      data: {
        status: "FINALIZED",
        finalTime: JSON.stringify(finalTime)
      }
    })

    return NextResponse.json({ success: true, poll: updatedPoll })
  } catch (error) {
    console.error("Error finalizing poll:", error)
    return NextResponse.json(
      { error: "Failed to finalize poll" },
      { status: 500 }
    )
  }
}
