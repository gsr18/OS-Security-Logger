import { Shield, Activity, AlertTriangle, BarChart3, Lock, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-16">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Real-Time OS Security Event Logger
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Monitor, analyze, and respond to security events across Linux, Windows, and macOS in real-time.
            Stay ahead of threats with intelligent rule-based detection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link href="/dashboard">
                <Activity className="mr-2 h-5 w-5" />
                View Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/events">
                <Eye className="mr-2 h-5 w-5" />
                Browse Events
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Monitoring</h3>
              <p className="text-muted-foreground">
                Track security events as they happen across your systems with near-instant detection and logging.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Alerts</h3>
              <p className="text-muted-foreground">
                Intelligent rule-based detection identifies suspicious activity like brute-force attacks and privilege escalation.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-muted-foreground">
                Visualize trends, identify patterns, and gain actionable insights from your security event data.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cross-Platform</h3>
              <p className="text-muted-foreground">
                Works seamlessly on Linux, Windows, and macOS with OS-specific event source integrations.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Event Filtering</h3>
              <p className="text-muted-foreground">
                Advanced search and filtering capabilities help you find exactly what you're looking for quickly.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">SQLite Storage</h3>
              <p className="text-muted-foreground">
                Lightweight, fast, and reliable local storage for all your security events and alerts.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center max-w-3xl mx-auto p-12 rounded-lg border border-border bg-muted/50">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Systems?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Start monitoring your security events today with our intuitive dashboard.
          </p>
          <Button asChild size="lg" className="text-base">
            <Link href="/dashboard">
              Get Started
            </Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 SecLogger. Real-Time OS Security Event Logger.</p>
        </div>
      </footer>
    </div>
  );
}