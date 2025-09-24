import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Star, Rocket, BookOpen, Brain, Zap, Users } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-space relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8 animate-float">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 animate-glow">
              <Rocket className="w-12 h-12 text-primary" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-aurora bg-clip-text text-transparent animate-slide-up">
            DUKL
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-slide-up" style={{animationDelay: "0.2s"}}>
            Journey Through Knowledge Like Never Before
          </p>
          
          <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: "0.4s"}}>
            Transform any content into interactive study materials with AI-powered summaries, 
            flashcards, and quizzes. Your personal study companion for the digital age.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{animationDelay: "0.6s"}}>
            <Button 
              asChild 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg animate-glow"
            >
              <Link to="/auth">
                <Rocket className="w-5 h-5 mr-2" />
                Launch Your Journey
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-primary/30 hover:bg-primary/10 px-8 py-4 text-lg"
            >
              <Link to="/auth">
                <Brain className="w-5 h-5 mr-2" />
                Explore Features
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Powered by Cosmic Intelligence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Harness the power of advanced AI to transform any learning material into 
              an interactive, personalized study experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card/40 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors animate-float" style={{animationDelay: "0s"}}>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">AI-Powered Summaries</h3>
                <p className="text-muted-foreground">
                  Convert any text, document, or video into comprehensive, easy-to-digest study notes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors animate-float" style={{animationDelay: "0.2s"}}>
              <CardContent className="p-8 text-center">
                <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">Smart Flashcards</h3>
                <p className="text-muted-foreground">
                  Automatically generated flashcards that adapt to your learning style and progress.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors animate-float" style={{animationDelay: "0.4s"}}>
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">Interactive Quizzes</h3>
                <p className="text-muted-foreground">
                  Test your knowledge with intelligently crafted multiple-choice questions.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors animate-float" style={{animationDelay: "0.1s"}}>
              <CardContent className="p-8 text-center">
                <Star className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor your learning journey with detailed analytics and achievement badges.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors animate-float" style={{animationDelay: "0.3s"}}>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">Study Together</h3>
                <p className="text-muted-foreground">
                  Share study materials and compete with friends in learning challenges.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors animate-float" style={{animationDelay: "0.5s"}}>
              <CardContent className="p-8 text-center">
                <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">Multi-Format Support</h3>
                <p className="text-muted-foreground">
                  Works with text, PDFs, images, YouTube videos, and more learning materials.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students who have revolutionized their study habits with DUKL.
            Start your cosmic learning journey today!
          </p>
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-nebula hover:opacity-90 text-white px-12 py-6 text-xl animate-glow"
          >
            <Link to="/auth">
              <Rocket className="w-6 h-6 mr-3" />
              Begin Your Adventure
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;