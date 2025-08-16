import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">VibeThisApp</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">Ideas</a>
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">Archive</a>
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">Pricing</a>
              <Button variant="outline" size="sm">Sign In</Button>
              <Button size="sm">Get Started</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            One AI App Idea.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              Every Day.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get daily, actionable app ideas designed for vibecoders. 
            No fluff, just buildable projects you can ship with modern tools like Claude, Replit, and Bolt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Today&apos;s Idea Free
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Browse Archive
            </Button>
          </div>
        </div>

        {/* Today's Idea Preview */}
        <div className="mb-16">
          <Card className="max-w-4xl mx-auto shadow-lg border-orange-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                    Today&apos;s Idea
                  </span>
                  <span className="text-gray-500 text-sm">Aug 16, 2025</span>
                </div>
                <div className="flex space-x-2">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Easy Build</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Revenue Ready</span>
                </div>
              </div>
              <CardTitle className="text-2xl mt-4">
                💡 Recipe Optimizer for Dietary Restrictions
              </CardTitle>
              <CardDescription className="text-lg">
                Transform any recipe to match specific dietary needs automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🚀 What It Is</h4>
                  <p className="text-gray-600">
                    Upload a recipe photo or paste ingredients, and instantly get adaptations for keto, vegan, 
                    gluten-free, or any dietary restriction. Perfect for the 54% of people managing special diets.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🧰 Tools You&apos;d Use</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">Claude API</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">Replit</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">Supabase</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">Stripe</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <span>🧱 Build Difficulty: 3/5</span>
                    <span>💸 Revenue Potential: High</span>
                  </div>
                  <Button>Read Full Idea</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">🎯</span>
                <span>Hyper-Specific</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Every idea comes with exact tools, APIs, and step-by-step guidance. 
                No vague concepts—just concrete, buildable projects.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">⚡</span>
                <span>Ship-Ready</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Designed for vibecoders using Claude, Replit, Bolt, and no-code tools. 
                Build and launch in days, not months.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">💰</span>
                <span>Revenue-First</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Every idea includes clear monetization strategies and target market analysis. 
                Build with profit in mind.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
