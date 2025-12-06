import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import Hero from "@/components/Hero"
import Features from "@/components/Features"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <Hero />
      <Features />
      <Footer />
    </div>
  )
}