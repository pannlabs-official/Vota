import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// GET latest poll data (votes and participants)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      poll,
      votes: poll.votes,
      participants: poll.participants
    })
  } catch (error) {
    console.error("Error fetching poll data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH to update deadline
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const { deadline } = await req.json()

    if (!deadline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const poll = await prisma.poll.findUnique({
      where: { id }
    })

    if (!poll || poll.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const updatedPoll = await prisma.poll.update({
      where: { id },
      data: {
        deadline: new Date(deadline)
      }
    })

    return NextResponse.json({ message: "Deadline updated successfully", poll: updatedPoll })
  } catch (error) {
    console.error("Error updating deadline:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
