"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export default function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/" })} 
      className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-secondary-foreground transition-all hover:bg-secondary/80 cursor-pointer"
    >
      <LogOut className="h-4 w-4" />
      <span>Log out</span>
    </button>
  )
}
