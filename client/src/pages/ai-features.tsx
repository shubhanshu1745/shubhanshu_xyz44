import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Laugh, BarChart4, UserSquare, Sparkles, Brain, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AIFeaturesPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="h-12 w-12 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold">AI-Powered Cricket Features</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience the future of cricket analysis with our Gemini AI-powered features. 
          Get intelligent predictions, creative content, and deep insights.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by Gemini AI
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Real-time Analysis
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Match Prediction Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="flex items-center gap-2">
              Match Prediction
              <Badge variant="secondary" className="text-xs">AI</Badge>
            </CardTitle>
            <CardDescription>
              Get AI-powered predictions for cricket matches
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Win probability percentages
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Detailed reasoning & analysis
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Key factors & predicted scores
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Weather & venue analysis
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/match-prediction" className="w-full">
              <Button className="w-full">
                <Check className="mr-2 h-4 w-4" />
                Try Match Prediction
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Player Trading Cards Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <CardTitle className="flex items-center gap-2">
              Player Trading Cards
              <Badge variant="secondary" className="text-xs">AI</Badge>
            </CardTitle>
            <CardDescription>
              Create unique digital trading cards
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI-generated card descriptions
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Special abilities & attributes
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Multiple card styles
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Rarity system & values
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/player-cards" className="w-full">
              <Button className="w-full">
                <Star className="mr-2 h-4 w-4" />
                Create Player Cards
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Meme Generator Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-2">
              <Laugh className="w-6 h-6 text-pink-600" />
            </div>
            <CardTitle className="flex items-center gap-2">
              Cricket Meme Generator
              <Badge variant="secondary" className="text-xs">AI</Badge>
            </CardTitle>
            <CardDescription>
              Generate hilarious cricket memes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI-crafted meme text
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Template suggestions
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Viral potential scoring
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Multiple humor styles
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/meme-generator" className="w-full">
              <Button className="w-full">
                <Laugh className="mr-2 h-4 w-4" />
                Create Memes
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Match Emotion Tracker Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-br from-red-500/10 to-pink-500/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
              <BarChart4 className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="flex items-center gap-2">
              Match Emotion Tracker
              <Badge variant="secondary" className="text-xs">AI</Badge>
            </CardTitle>
            <CardDescription>
              Analyze emotional shifts during matches
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Crowd sentiment analysis
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Key emotional moments
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Fan mood tracking
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Meme-worthy moment detection
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/emotion-tracker" className="w-full">
              <Button className="w-full">
                <BarChart4 className="mr-2 h-4 w-4" />
                Track Match Emotions
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Player Avatar Creator Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
              <UserSquare className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle className="flex items-center gap-2">
              Player Avatar Creator
              <Badge variant="secondary" className="text-xs">AI</Badge>
            </CardTitle>
            <CardDescription>
              Generate stylized player avatars
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Multiple artistic styles
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI visual descriptions
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Custom color palettes
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Signature elements
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/player-avatar" className="w-full">
              <Button className="w-full">
                <UserSquare className="mr-2 h-4 w-4" />
                Create Avatars
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-10 text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">Powered by Google Gemini AI</h3>
            </div>
            <p className="text-muted-foreground">
              All AI features use Google's advanced Gemini 2.5 Flash model for intelligent, 
              context-aware cricket analysis and creative content generation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIFeaturesPage;
