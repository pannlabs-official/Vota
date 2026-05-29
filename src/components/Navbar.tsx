import Link from "next-link" // Next.js 16 requires next/link, wait let's use standard import
import LinkComponent from "next/link"
import { auth } from "@/auth"
import { LogOut } from "lucide-react"

export default async function Navbar() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <LinkComponent href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-gradient">VoteSchedule</span>
        </LinkComponent>
        
        <nav className="flex items-center gap-4 text-sm font-medium">
          {session ? (
            <>
              <LinkComponent href="/dashboard" className="transition-colors hover:text-primary">
                Dashboard
              </LinkComponent>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-secondary-foreground transition-all hover:bg-secondary/80">
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <LinkComponent href="/login" className="transition-colors hover:text-primary">
                Log in
              </LinkComponent>
              <LinkComponent href="/register" className="rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow">
                Sign up
              </LinkComponent>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
