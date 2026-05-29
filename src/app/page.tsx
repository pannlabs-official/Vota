import Link from "next/link";
import { ArrowRight, Calendar, Users, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-8 fade-in-up">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          VoteSchedule is now live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Find the perfect time, <br className="hidden md:block" />
          <span className="text-gradient">without the hassle.</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create collaborative polls, vote on available time slots, and schedule meetings effortlessly. Premium scheduling for modern teams.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 w-full sm:w-auto">
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-border bg-background px-8 py-4 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-secondary w-full sm:w-auto">
            Sign In
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-32 w-full">
        <FeatureCard 
          icon={<Calendar className="h-8 w-8 text-primary" />}
          title="Easy Poll Creation"
          description="Set up your available times in seconds with our intuitive calendar interface."
        />
        <FeatureCard 
          icon={<Users className="h-8 w-8 text-accent" />}
          title="Collaborative Voting"
          description="Participants vote on what works best for them without creating an account."
        />
        <FeatureCard 
          icon={<BarChart3 className="h-8 w-8 text-primary" />}
          title="Smart Analytics"
          description="View interactive heatmaps to instantly spot the most popular time slots."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center space-y-4 hover:border-primary/50 transition-colors">
      <div className="p-4 rounded-full bg-primary/10">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
