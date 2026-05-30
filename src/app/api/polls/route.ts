import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { title, description, deadline, scheduleConstraints, isAnonymous = false } = body

    if (!title || !deadline || !scheduleConstraints) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate a unique slug from title
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    let slug = baseSlug
    let counter = 1
    
    while (await prisma.poll.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Generate a secure 6-character PIN for results access
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let resultsPassword = ''
    for (let i = 0; i < 6; i++) {
      resultsPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Create poll
    const poll = await prisma.poll.create({
      data: {
        title,
        description,
        creatorId: session.user.id,
        deadline: new Date(deadline),
        scheduleConstraints: JSON.stringify(scheduleConstraints),
        isAnonymous,
        slug,
        resultsPassword
      }
    })

    return NextResponse.json(
      { message: "Poll created successfully", pollId: poll.slug },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating poll:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET all polls for the authenticated user
export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const polls = await prisma.poll.findMany({
      where: {
        creatorId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { participants: true, votes: true }
        }
      }
    })

    return NextResponse.json({ polls })
  } catch (error) {
    console.error("Error fetching polls:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
