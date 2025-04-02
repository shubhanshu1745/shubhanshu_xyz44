import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Clock, Shield, Award, Star, CalendarDays, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface Coach {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  specialty: string;
  experience: number;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  skills: string[];
}

export function BookCoachingSession() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBooking, setIsBooking] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("60");
  const [selectedType, setSelectedType] = useState("online");
  const [selectedFocus, setSelectedFocus] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch coaches
  const { data: coaches, isLoading: coachesLoading } = useQuery({
    queryKey: ['/api/coaching/coaches', specialtyFilter],
    queryFn: async () => {
      let url = '/api/coaching/coaches';
      if (specialtyFilter) {
        url += `?specialty=${specialtyFilter}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch coaches');
      }
      return response.json();
    }
  });
  
  // Book session mutation
  const bookSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await fetch('/api/coaching/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book session');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/sessions'] });
      toast({
        title: "Session Booked",
        description: "Your coaching session has been booked successfully.",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book session. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsBooking(false);
    }
  });
  
  // Generate time slots for selected date
  const getTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 20; // 8 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      slots.push(timeString);
    }
    
    return slots;
  };
  
  const resetForm = () => {
    setSelectedCoach(null);
    setSelectedDate(undefined);
    setSelectedTimeSlot("");
    setSelectedDuration("60");
    setSelectedType("online");
    setSelectedFocus("");
    setSessionTitle("");
    setSessionNotes("");
    setErrors({});
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    if (!selectedCoach) {
      newErrors.coach = "Please select a coach";
      isValid = false;
    }
    
    if (!selectedDate) {
      newErrors.date = "Please select a date";
      isValid = false;
    }
    
    if (!selectedTimeSlot) {
      newErrors.timeSlot = "Please select a time slot";
      isValid = false;
    }
    
    if (!selectedType) {
      newErrors.type = "Please select a session type";
      isValid = false;
    }
    
    if (!selectedFocus) {
      newErrors.focus = "Please select a focus area";
      isValid = false;
    }
    
    if (!sessionTitle.trim()) {
      newErrors.title = "Please enter a session title";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleBookSession = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsBooking(true);
    
    // Create the session date from selected date and time
    const [timeStr, period] = selectedTimeSlot.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    const sessionDate = new Date(selectedDate!);
    
    // Convert to 24-hour format
    sessionDate.setHours(
      period === 'PM' && hours !== 12 ? hours + 12 : (period === 'AM' && hours === 12 ? 0 : hours),
      parseInt(minutes || '0', 10)
    );
    
    // Create session data
    const sessionData = {
      coachId: selectedCoach!.id,
      title: sessionTitle,
      date: sessionDate.toISOString(),
      duration: parseInt(selectedDuration, 10),
      type: selectedType,
      focus: selectedFocus,
      notes: sessionNotes
    };
    
    bookSessionMutation.mutate(sessionData);
  };
  
  // Effect to auto-generate title when focus is selected
  useEffect(() => {
    if (selectedFocus && !sessionTitle) {
      setSessionTitle(`${selectedFocus} Training Session`);
    }
  }, [selectedFocus, sessionTitle]);
  
  if (isBooking) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative h-16 w-16">
              <RotateCcw className="h-16 w-16 text-primary animate-spin" />
              <CalendarDays className="h-8 w-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <h3 className="text-xl font-medium">Booking Your Session</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Please wait while we book your coaching session with {selectedCoach?.name}
            </p>
            <Progress value={70} className="w-full max-w-md" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Book a Coaching Session</h2>
        
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Specialties</SelectItem>
            <SelectItem value="batting">Batting</SelectItem>
            <SelectItem value="bowling">Bowling</SelectItem>
            <SelectItem value="fielding">Fielding</SelectItem>
            <SelectItem value="wicketkeeping">Wicketkeeping</SelectItem>
            <SelectItem value="all-round">All-Round</SelectItem>
            <SelectItem value="mental">Mental Skills</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coach Selection */}
        <div>
          {coachesLoading ? (
            <Card>
              <CardContent className="py-10">
                <div className="flex justify-center">
                  <p>Loading coaches...</p>
                </div>
              </CardContent>
            </Card>
          ) : !coaches || coaches.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-muted-foreground">No coaches found</p>
                  {specialtyFilter && (
                    <Button variant="outline" onClick={() => setSpecialtyFilter("")}>
                      Clear Filter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a coach to book a session with:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coaches.map((coach: Coach) => (
                  <Card 
                    key={coach.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedCoach?.id === coach.id ? 'ring-2 ring-primary' : ''
                    }`}
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
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm line-clamp-3">{coach.bio}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {coach.skills.slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {coach.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{coach.skills.length - 3} more</Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm">{coach.rating} ({coach.reviewCount})</span>
                      </div>
                      <Badge variant="outline">
                        ${coach.hourlyRate}/hr
                      </Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {errors.coach && <p className="text-xs text-destructive">{errors.coach}</p>}
            </div>
          )}
        </div>
        
        {/* Session Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>
              {selectedCoach 
                ? `Book a session with ${selectedCoach.name}` 
                : "Select a coach and fill in the details to book a session"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input 
                id="title" 
                value={sessionTitle} 
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g., Batting Technique Session"
                className={errors.title ? "border-destructive" : ""}
                disabled={!selectedCoach}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Session Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!selectedDate ? "text-muted-foreground" : ""} ${errors.date ? "border-destructive" : ""}`}
                      disabled={!selectedCoach}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => 
                        date < new Date(new Date().setHours(0, 0, 0, 0)) || // Past dates
                        date > new Date(new Date().setDate(new Date().getDate() + 30)) // >30 days ahead
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Time Slot</Label>
                <Select 
                  value={selectedTimeSlot} 
                  onValueChange={setSelectedTimeSlot}
                  disabled={!selectedCoach || !selectedDate}
                >
                  <SelectTrigger id="timeSlot" className={errors.timeSlot ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTimeSlots().map(slot => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timeSlot && <p className="text-xs text-destructive">{errors.timeSlot}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Session Duration</Label>
                <Select 
                  value={selectedDuration} 
                  onValueChange={setSelectedDuration}
                  disabled={!selectedCoach}
                >
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Session Type</Label>
                <Select 
                  value={selectedType} 
                  onValueChange={setSelectedType}
                  disabled={!selectedCoach}
                >
                  <SelectTrigger id="type" className={errors.type ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online Session</SelectItem>
                    <SelectItem value="in-person">In-Person Session</SelectItem>
                    <SelectItem value="group">Group Session</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="focus">Session Focus</Label>
              <Select 
                value={selectedFocus} 
                onValueChange={setSelectedFocus}
                disabled={!selectedCoach}
              >
                <SelectTrigger id="focus" className={errors.focus ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select focus area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Batting Technique">Batting Technique</SelectItem>
                  <SelectItem value="Bowling Action">Bowling Action</SelectItem>
                  <SelectItem value="Shot Selection">Shot Selection</SelectItem>
                  <SelectItem value="Defensive Play">Defensive Play</SelectItem>
                  <SelectItem value="Power Hitting">Power Hitting</SelectItem>
                  <SelectItem value="Fielding Skills">Fielding Skills</SelectItem>
                  <SelectItem value="Wicketkeeping">Wicketkeeping</SelectItem>
                  <SelectItem value="Match Strategy">Match Strategy</SelectItem>
                </SelectContent>
              </Select>
              {errors.focus && <p className="text-xs text-destructive">{errors.focus}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Session Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                value={sessionNotes} 
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Any specific areas you'd like to focus on or questions for the coach"
                disabled={!selectedCoach}
              />
            </div>
            
            {selectedCoach && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span>Coach Fee ({selectedDuration} min)</span>
                  <span className="font-medium">
                    ${((selectedCoach.hourlyRate / 60) * parseInt(selectedDuration, 10)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm mb-2">
                  <span>Platform Fee</span>
                  <span>${(5).toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>
                    ${((selectedCoach.hourlyRate / 60) * parseInt(selectedDuration, 10) + 5).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleBookSession}
              disabled={!selectedCoach || isBooking}
            >
              Book Session
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}