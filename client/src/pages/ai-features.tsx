import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Laugh, BarChart4, UserSquare } from 'lucide-react';

const AIFeaturesPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">AI-Powered Cricket Features</h1>
        <p className="text-muted-foreground">
          Explore our advanced AI-powered cricket features that enhance your cricket experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Match Prediction Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-primary/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Match Prediction</CardTitle>
            <CardDescription>
              Get AI-powered predictions for upcoming cricket matches
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p>Predict match outcomes with our advanced AI analysis. See win probabilities, key factors, and team performance insights.</p>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/match-prediction">
              <Button className="w-full">Try Match Prediction</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Player Trading Cards Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-primary/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Player Trading Cards</CardTitle>
            <CardDescription>
              Create unique digital trading cards for cricket players
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p>Generate collectible player cards with AI-enhanced designs. Each card features unique attributes, rarity levels, and player stats.</p>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/player-cards">
              <Button className="w-full">Create Player Cards</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Meme Generator Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-primary/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <Laugh className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Cricket Meme Generator</CardTitle>
            <CardDescription>
              Generate fun cricket-themed memes with AI
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p>Create hilarious cricket memes with our AI meme generator. Just provide a prompt and let AI do the rest!</p>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/meme-generator">
              <Button className="w-full">Create Memes</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Match Emotion Tracker Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-primary/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <BarChart4 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Match Emotion Tracker</CardTitle>
            <CardDescription>
              Analyze emotional shifts during cricket matches
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p>Track real-time crowd emotions during matches. See how emotions change with key moments and dramatic turns in the game.</p>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/emotion-tracker">
              <Button className="w-full">Track Match Emotions</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Player Avatar Creator Feature */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-primary/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <UserSquare className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Player Avatar Creator</CardTitle>
            <CardDescription>
              Generate fun stylized avatars of cricket players
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p>Create custom avatars of your favorite cricket players in different artistic styles, from cartoon to pixel art.</p>
          </CardContent>
          <CardFooter>
            <Link href="/ai-features/player-avatar">
              <Button className="w-full">Create Avatars</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AIFeaturesPage;