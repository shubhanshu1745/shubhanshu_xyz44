import React, { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, Video, Camera, Upload, Play, Shield, Award, FileText, Calendar as CalendarIcon, Clock, ArrowRight, Check, X, AlertCircle, Users, User, PlayCircle, ChevronRight, MessageSquare, ThumbsUp, Share2, Download, RotateCcw } from "lucide-react";
import { BecomeCoachDialog } from "@/components/become-coach-dialog";
import { VideoAnalysisForm } from "@/components/video-analysis-form";
import { BookCoachingSession } from "@/components/book-coaching-session";

export default function CricketCoaching() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-coaching");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBookingSession, setIsBookingSession] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCoach, setSelectedCoach] = useState<any | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch coaching sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/coaching/sessions'],
    queryFn: async () => {
      const response = await fetch('/api/coaching/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch coaching sessions');
      }
      return response.json();
    }
  });
  
  // Fetch training plans
  const { data: trainingPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/coaching/training-plans'],
    queryFn: async () => {
      const response = await fetch('/api/coaching/training-plans');
      if (!response.ok) {
        throw new Error('Failed to fetch training plans');
      }
      return response.json();
    }
  });
  
  // Fetch coaches
  const { data: coaches, isLoading: coachesLoading } = useQuery({
    queryKey: ['/api/coaching/coaches'],
    queryFn: async () => {
      const response = await fetch('/api/coaching/coaches');
      if (!response.ok) {
        throw new Error('Failed to fetch coaches');
      }
      return response.json();
    }
  });
  
  // Fetch skill analysis videos
  const { data: analysisVideos, isLoading: videosLoading } = useQuery({
    queryKey: ['/api/coaching/analysis-videos', selectedSkill],
    queryFn: async () => {
      let url = '/api/coaching/analysis-videos';
      if (selectedSkill) {
        url += `?skill=${selectedSkill}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch analysis videos');
      }
      return response.json();
    },
    enabled: activeTab === "video-analysis"
  });
  
  const handleUploadVideo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsAnalyzing(true);
      
      // Simulate upload and analysis
      setTimeout(() => {
        toast({
          title: "Video Uploaded",
          description: "Your video is being analyzed by our AI",
        });
        
        // Simulate analysis completion after 3 more seconds
        setTimeout(() => {
          setIsAnalyzing(false);
          toast({
            title: "Analysis Complete",
            description: "Your video has been analyzed. View results in 'My Coaching'",
          });
        }, 3000);
      }, 2000);
    }
  };
  
  const handleBookSession = () => {
    if (!selectedCoach) {
      toast({
        title: "Please Select a Coach",
        description: "You need to select a coach to book a session",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedDate) {
      toast({
        title: "Please Select a Date",
        description: "You need to select a date for your session",
        variant: "destructive"
      });
      return;
    }
    
    setIsBookingSession(true);
    
    // Simulate booking
    setTimeout(() => {
      toast({
        title: "Session Booked",
        description: `Your coaching session with ${selectedCoach.name} has been booked successfully`,
      });
      setIsBookingSession(false);
      setSelectedCoach(null);
      setSelectedDate(new Date());
    }, 2000);
  };
  
  const renderMyCoaching = () => {
    if (sessionsLoading || plansLoading) {
      return (
        <div className="flex justify-center items-center h-60">
          <p>Loading your coaching data...</p>
        </div>
      );
    }
    
    const upcomingSessions = sessions?.filter((session: any) => new Date(session.date) > new Date()) || [];
    const pastSessions = sessions?.filter((session: any) => new Date(session.date) <= new Date()) || [];
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Your Training Plan</h2>
          {!trainingPlans || trainingPlans.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Training Plan</CardTitle>
                <CardDescription>
                  You don't have an active training plan. Book a session with a coach to get started.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => setActiveTab("book-coach")}>Find a Coach</Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{trainingPlans[0].title}</CardTitle>
                    <CardDescription>Created on {new Date(trainingPlans[0].created).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge variant="outline">
                    {trainingPlans[0].difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Focus Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {trainingPlans[0].focusAreas.map((area: string, i: number) => (
                      <Badge key={i} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Weekly Schedule</h4>
                  <div className="grid gap-2">
                    {trainingPlans[0].schedule.map((item: any, i: number) => (
                      <div key={i} className="flex items-start p-2 border rounded-md">
                        <div className="mr-3 bg-primary/10 p-1 rounded-md flex items-center justify-center w-8 h-8">
                          <span className="font-bold">{item.day.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.duration} min
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Progress Tracking</h4>
                  <div className="space-y-3">
                    {trainingPlans[0].progressTracking.map((track: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{track.skill}</span>
                          <span className="text-sm text-muted-foreground">{track.progress}%</span>
                        </div>
                        <Progress value={track.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">View Details</Button>
                <Button>Update Progress</Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Upcoming Sessions</h2>
          {upcomingSessions.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Upcoming Sessions</CardTitle>
                <CardDescription>
                  You don't have any upcoming coaching sessions scheduled.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => setActiveTab("book-coach")}>Book a Session</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingSessions.map((session: any) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle>{session.title}</CardTitle>
                      <Badge variant={
                        new Date(session.date).getTime() - new Date().getTime() < 86400000 
                          ? "destructive" 
                          : "default"
                      }>
                        {new Date(session.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <CardDescription>with {session.coach.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-3">
                      <Avatar className="h-10 w-10 mr-2">
                        <AvatarImage src={session.coach.avatar} alt={session.coach.name} />
                        <AvatarFallback>{session.coach.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{session.coach.name}</p>
                        <p className="text-xs text-muted-foreground">{session.coach.specialty}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.duration} mins</span>
                      </div>
                      <div className="flex">
                        <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{session.type}</span>
                      </div>
                      <div className="flex">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{session.focus}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Reschedule</Button>
                    <Button>Join Session</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Skill Analysis History</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Batting Technique</CardTitle>
                <CardDescription>Analyzed on March 18, 2023</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-md bg-muted mb-3 overflow-hidden">
                  <img 
                    src="https://cricketcoaching.nz/wp-content/uploads/2019/06/cricket-coaching-batting-stance.jpg" 
                    alt="Batting Technique" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Stance</span>
                    <Badge variant="outline">Good</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Footwork</span>
                    <Badge variant="outline">Needs Work</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Balance</span>
                    <Badge variant="outline">Excellent</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Full Analysis</Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Bowling Action</CardTitle>
                <CardDescription>Analyzed on February 5, 2023</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-md bg-muted mb-3 overflow-hidden">
                  <img 
                    src="https://static.wixstatic.com/media/761262_db0e44a59c7e49a0a53c748d30d16cd0~mv2.jpg/v1/fill/w_640,h_360,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/761262_db0e44a59c7e49a0a53c748d30d16cd0~mv2.jpg" 
                    alt="Bowling Action" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Run-up</span>
                    <Badge variant="outline">Good</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Arm Action</span>
                    <Badge variant="outline">Good</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Follow-through</span>
                    <Badge variant="outline">Needs Work</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Full Analysis</Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Upload New Video</CardTitle>
                <CardDescription>Get AI analysis of your technique</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="mb-4 bg-muted/50 h-16 w-16 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-center text-sm text-muted-foreground mb-4">
                  Upload a video of your cricket technique for AI analysis
                </p>
                <Button variant="default" onClick={() => setActiveTab("video-analysis")}>
                  Upload Video
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Past Sessions</h2>
          {pastSessions.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Past Sessions</CardTitle>
                <CardDescription>
                  You haven't had any coaching sessions yet.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastSessions.map((session: any) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{session.title}</CardTitle>
                        <CardDescription>
                          {new Date(session.date).toLocaleDateString()} with {session.coach.name}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{session.duration} mins</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Key Learnings:</p>
                      <ul className="space-y-1">
                        {session.learnings.map((learning: string, i: number) => (
                          <li key={i} className="text-sm flex">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            {learning}
                          </li>
                        ))}
                      </ul>
                      
                      <p className="text-sm font-medium mt-3">Areas to Improve:</p>
                      <ul className="space-y-1">
                        {session.improvements.map((improvement: string, i: number) => (
                          <li key={i} className="text-sm flex">
                            <ArrowRight className="h-4 w-4 mr-2 text-amber-500" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">View Notes</Button>
                    <Button>Watch Recording</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderVideoAnalysis = () => {
    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative h-20 w-20">
            <RotateCcw className="h-20 w-20 text-primary animate-spin" />
            <Video className="h-10 w-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Analyzing Your Video</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Our AI is analyzing your cricket technique. This may take a few minutes depending on the video length.
          </p>
          <div className="w-full max-w-md">
            <Progress value={45} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground">Step 2/4: Identifying body positioning and technique</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold">Video Analysis</h2>
            <p className="text-muted-foreground">Upload and analyze your cricket technique</p>
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedSkill || ""} onValueChange={setSelectedSkill}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Skills</SelectItem>
                <SelectItem value="batting">Batting</SelectItem>
                <SelectItem value="bowling">Bowling</SelectItem>
                <SelectItem value="fielding">Fielding</SelectItem>
                <SelectItem value="wicketkeeping">Wicketkeeping</SelectItem>
              </SelectContent>
            </Select>
            
            <div>
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleVideoFileChange}
              />
              <Button onClick={handleUploadVideo}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>How Video Analysis Works</CardTitle>
            <CardDescription>
              Get detailed feedback on your cricket technique through AI-powered analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Upload Video</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a video of your cricket technique from any angle
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI will analyze your technique and provide feedback
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Get Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Receive detailed feedback and suggestions for improvement
                </p>
              </div>
            </div>
            
            <div className="aspect-video rounded-lg overflow-hidden border">
              <video 
                src="https://static.videezy.com/system/resources/previews/000/005/550/original/Cricket_Bowler.mp4"
                poster="https://static.wixstatic.com/media/761262_db0e44a59c7e49a0a53c748d30d16cd0~mv2.jpg/v1/fill/w_640,h_360,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/761262_db0e44a59c7e49a0a53c748d30d16cd0~mv2.jpg"
                controls
                className="w-full h-full object-cover"
              ></video>
            </div>
          </CardContent>
        </Card>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Sample Analyses</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!analysisVideos || videosLoading ? (
              <div className="col-span-full flex justify-center py-6">
                <p>Loading sample videos...</p>
              </div>
            ) : analysisVideos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center py-6">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p>No analysis videos found for the selected skill</p>
              </div>
            ) : (
              analysisVideos.map((video: any) => (
                <Card key={video.id} className="overflow-hidden">
                  <div 
                    className="aspect-video relative cursor-pointer"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    <Badge 
                      className="absolute top-2 right-2"
                      variant={video.skill === 'batting' ? 'default' : 
                               video.skill === 'bowling' ? 'secondary' : 'outline'}
                    >
                      {video.skill}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{video.title}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {video.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="border-t pt-3 flex justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={video.coach.avatar} alt={video.coach.name} />
                        <AvatarFallback>{video.coach.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{video.coach.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderBookCoach = () => {
    if (coachesLoading) {
      return (
        <div className="flex justify-center items-center h-60">
          <p>Loading coaches...</p>
        </div>
      );
    }
    
    if (isBookingSession) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative h-20 w-20">
            <RotateCcw className="h-20 w-20 text-primary animate-spin" />
            <CalendarIcon className="h-10 w-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Booking Your Session</h2>
          <p className="text-muted-foreground text-center max-w-md">
            We're setting up your coaching session. This will only take a moment.
          </p>
          <div className="w-full max-w-md">
            <Progress value={65} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground">Step 3/4: Processing payment and booking coach</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Book a Coaching Session</h2>
          <p className="text-muted-foreground mb-6">
            Schedule a one-on-one session with a cricket coach specializing in your area of interest
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coaches?.map((coach: any) => (
                  <Card 
                    key={coach.id} 
                    className={`cursor-pointer transition-all ${selectedCoach?.id === coach.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedCoach(coach)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={coach.avatar} alt={coach.name} />
                            <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{coach.name}</CardTitle>
                            <CardDescription>{coach.specialty}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">${coach.hourlyRate}/hr</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm line-clamp-3">{coach.bio}</p>
                      
                      <div className="flex gap-1 mt-2">
                        {coach.skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm">{coach.experience} yrs exp</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm">{coach.rating} ({coach.reviewCount})</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Book Your Session</CardTitle>
                  <CardDescription>
                    Select a coach and schedule your session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Selected Coach</Label>
                    {selectedCoach ? (
                      <div className="flex items-center p-2 border rounded-md">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={selectedCoach.avatar} alt={selectedCoach.name} />
                          <AvatarFallback>{selectedCoach.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{selectedCoach.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedCoach.specialty}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 border rounded-md text-sm text-muted-foreground">
                        No coach selected
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Session Type</Label>
                    <Select defaultValue="online">
                      <SelectTrigger>
                        <SelectValue placeholder="Select session type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online Session</SelectItem>
                        <SelectItem value="in-person">In-Person Session</SelectItem>
                        <SelectItem value="group">Group Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Focus Area</Label>
                    <Select defaultValue="batting-technique">
                      <SelectTrigger>
                        <SelectValue placeholder="Select focus area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batting-technique">Batting Technique</SelectItem>
                        <SelectItem value="bowling-action">Bowling Action</SelectItem>
                        <SelectItem value="fielding">Fielding Skills</SelectItem>
                        <SelectItem value="wicketkeeping">Wicketkeeping</SelectItem>
                        <SelectItem value="strategy">Match Strategy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Session Date</Label>
                    <div className="border rounded-md p-3">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="mx-auto"
                        disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Session Time</Label>
                    <Select defaultValue="morning">
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9:00 AM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (2:00 PM)</SelectItem>
                        <SelectItem value="evening">Evening (6:00 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Session Duration</Label>
                    <Select defaultValue="60">
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex-col space-y-2">
                  <div className="flex justify-between w-full pb-2">
                    <span className="font-medium">Total Price:</span>
                    <span className="font-bold">${selectedCoach ? selectedCoach.hourlyRate : '0.00'}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleBookSession}
                    disabled={!selectedCoach || !selectedDate}
                  >
                    Book Session
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderSelectedVideo = () => {
    if (!selectedVideo) return null;
    
    return (
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo.title}</DialogTitle>
            <DialogDescription>
              Skill analysis by {selectedVideo.coach.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-md overflow-hidden">
              <video 
                src={selectedVideo.videoUrl} 
                poster={selectedVideo.thumbnailUrl}
                controls 
                autoPlay
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{selectedVideo.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
              </div>
              <Badge variant="outline" className="capitalize">
                {selectedVideo.skill}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Key Observations</h4>
                <ul className="space-y-2 text-sm">
                  {selectedVideo.observations.map((observation: string, i: number) => (
                    <li key={i} className="flex">
                      <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                      <span>{observation}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Improvement Areas</h4>
                <ul className="space-y-2 text-sm">
                  {selectedVideo.improvements.map((improvement: string, i: number) => (
                    <li key={i} className="flex">
                      <X className="h-4 w-4 mr-2 text-destructive mt-0.5" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Drills & Exercises</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedVideo.drills.map((drill: any, i: number) => (
                  <div key={i} className="border rounded-md p-3">
                    <h5 className="font-medium text-sm">{drill.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1">{drill.description}</p>
                    <div className="flex items-center mt-2">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{drill.duration} minutes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-1">
                <ThumbsUp className="h-4 w-4" />
                Helpful
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                Comment
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Cricket Coaching</h1>
          <p className="text-muted-foreground">Improve your cricket skills with personalized coaching</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Schedule
          </Button>
          <Button className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Book a Coach
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="my-coaching">My Coaching</TabsTrigger>
          <TabsTrigger value="video-analysis">Video Analysis</TabsTrigger>
          <TabsTrigger value="book-coach">Book a Coach</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-coaching" className="space-y-4">
          {renderMyCoaching()}
        </TabsContent>
        
        <TabsContent value="video-analysis" className="space-y-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold">Video Analysis</h2>
                <p className="text-muted-foreground">Upload and analyze your cricket technique</p>
              </div>
              
              <div className="flex gap-3">
                <Select value={selectedSkill || ""} onValueChange={setSelectedSkill}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Skills</SelectItem>
                    <SelectItem value="batting">Batting</SelectItem>
                    <SelectItem value="bowling">Bowling</SelectItem>
                    <SelectItem value="fielding">Fielding</SelectItem>
                    <SelectItem value="wicketkeeping">Wicketkeeping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <VideoAnalysisForm />
            
            <div>
              <h2 className="text-xl font-bold mb-4">Your Recent Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* The existing card components for analysis history */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Cover Drive Analysis</CardTitle>
                    <CardDescription>Analyzed on April 1, 2023</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="aspect-video rounded-md bg-muted mb-3 overflow-hidden">
                      <img 
                        src="https://cricketcoaching.nz/wp-content/uploads/2019/06/cricket-coaching-batting-stance.jpg" 
                        alt="Cover Drive" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Stance</span>
                        <Badge variant="outline">Good</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Backswing</span>
                        <Badge variant="outline">Needs Work</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Follow Through</span>
                        <Badge variant="outline">Good</Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">View Analysis</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pull Shot Analysis</CardTitle>
                    <CardDescription>Analyzed on March 25, 2023</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="aspect-video rounded-md bg-muted mb-3 overflow-hidden">
                      <img 
                        src="https://static.toiimg.com/thumb/msid-102664581,width-1280,height-720,resizemode-4/102664581.jpg" 
                        alt="Pull Shot" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Weight Transfer</span>
                        <Badge variant="outline">Excellent</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Head Position</span>
                        <Badge variant="outline">Good</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Timing</span>
                        <Badge variant="outline">Needs Work</Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">View Analysis</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Bowling Action</CardTitle>
                    <CardDescription>Analyzed on March 10, 2023</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="aspect-video rounded-md bg-muted mb-3 overflow-hidden">
                      <img 
                        src="https://static.wixstatic.com/media/761262_db0e44a59c7e49a0a53c748d30d16cd0~mv2.jpg/v1/fill/w_640,h_360,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/761262_db0e44a59c7e49a0a53c748d30d16cd0~mv2.jpg" 
                        alt="Bowling Action" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Run-up</span>
                        <Badge variant="outline">Good</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Arm Action</span>
                        <Badge variant="outline">Good</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Follow Through</span>
                        <Badge variant="outline">Good</Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">View Analysis</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="book-coach" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Cricket Coaching</h2>
              <p className="text-muted-foreground">Book sessions with expert cricket coaches</p>
            </div>
            
            <BecomeCoachDialog />
          </div>
          
          <BookCoachingSession />
        </TabsContent>
      </Tabs>
      
      {renderSelectedVideo()}
    </div>
  );
}