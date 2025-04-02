import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Shield, Award, Upload, Check, X, AlertCircle, Clock, RotateCcw } from "lucide-react";

interface CoachSpecialty {
  id: string;
  name: string;
  description: string;
}

interface CoachSkill {
  id: string;
  name: string;
  category: string;
}

const specialties: CoachSpecialty[] = [
  {
    id: "batting",
    name: "Batting Coach",
    description: "Specializing in batting technique, footwork, and shot selection"
  },
  {
    id: "bowling",
    name: "Bowling Coach",
    description: "Specializing in bowling actions, variations, and strategy"
  },
  {
    id: "fielding",
    name: "Fielding Coach",
    description: "Specializing in catching, throwing, and fielding techniques"
  },
  {
    id: "wicketkeeping",
    name: "Wicketkeeping Coach",
    description: "Specializing in wicketkeeping skills and techniques"
  },
  {
    id: "all-round",
    name: "All-Round Coach",
    description: "Well-rounded expertise in multiple aspects of cricket"
  },
  {
    id: "mental",
    name: "Mental Skills Coach",
    description: "Specializing in mental preparation and game strategy"
  }
];

const skills: CoachSkill[] = [
  { id: "batting-technique", name: "Batting Technique", category: "Batting" },
  { id: "footwork", name: "Footwork", category: "Batting" },
  { id: "shot-selection", name: "Shot Selection", category: "Batting" },
  { id: "power-hitting", name: "Power Hitting", category: "Batting" },
  { id: "defensive-play", name: "Defensive Play", category: "Batting" },
  { id: "pace-bowling", name: "Pace Bowling", category: "Bowling" },
  { id: "spin-bowling", name: "Spin Bowling", category: "Bowling" },
  { id: "bowling-variations", name: "Bowling Variations", category: "Bowling" },
  { id: "yorkers", name: "Yorkers", category: "Bowling" },
  { id: "field-placements", name: "Field Placements", category: "Strategy" },
  { id: "catching", name: "Catching", category: "Fielding" },
  { id: "ground-fielding", name: "Ground Fielding", category: "Fielding" },
  { id: "throwing", name: "Throwing", category: "Fielding" },
  { id: "mental-strength", name: "Mental Strength", category: "Mental" },
  { id: "leadership", name: "Leadership", category: "Mental" },
  { id: "game-awareness", name: "Game Awareness", category: "Strategy" },
  { id: "match-strategy", name: "Match Strategy", category: "Strategy" }
];

export function BecomeCoachDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    specialty: "",
    experience: "",
    bio: "",
    skills: [] as string[],
    hourlyRate: "",
    qualifications: "",
    coaching_philosophy: "",
    references: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false
  });
  
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    switch(step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = "Name is required";
          isValid = false;
        }
        
        if (!formData.email.trim()) {
          newErrors.email = "Email is required";
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Email is invalid";
          isValid = false;
        }
        
        if (!formData.specialty) {
          newErrors.specialty = "Please select a specialty";
          isValid = false;
        }
        
        if (!formData.experience) {
          newErrors.experience = "Experience level is required";
          isValid = false;
        }
        break;
        
      case 2:
        if (!formData.bio.trim() || formData.bio.length < 50) {
          newErrors.bio = "Please provide a detailed bio (at least 50 characters)";
          isValid = false;
        }
        
        if (formData.skills.length === 0) {
          newErrors.skills = "Please select at least one skill";
          isValid = false;
        }
        
        if (!formData.hourlyRate.trim()) {
          newErrors.hourlyRate = "Hourly rate is required";
          isValid = false;
        } else if (isNaN(parseFloat(formData.hourlyRate)) || parseFloat(formData.hourlyRate) <= 0) {
          newErrors.hourlyRate = "Please enter a valid hourly rate";
          isValid = false;
        }
        break;
        
      case 3:
        // Optional fields in step 3, so no validation required
        break;
    }
    
    setErrors(newErrors);
    setCompletedSteps(prev => ({...prev, [step]: isValid}));
    return isValid;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => {
      const skills = [...prev.skills];
      
      if (skills.includes(skillId)) {
        return { ...prev, skills: skills.filter(id => id !== skillId) };
      } else {
        return { ...prev, skills: [...skills, skillId] };
      }
    });
  };
  
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/coaching/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          specialty: formData.specialty,
          experience: parseInt(formData.experience),
          bio: formData.bio,
          skills: formData.skills,
          hourlyRate: parseFloat(formData.hourlyRate)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }
      
      const result = await response.json();
      
      toast({
        title: "Application Submitted",
        description: "Your coaching application has been submitted successfully. We'll review it and get back to you soon.",
      });
      
      // Reset the form
      setFormData({
        name: user?.fullName || "",
        email: user?.email || "",
        specialty: "",
        experience: "",
        bio: "",
        skills: [],
        hourlyRate: "",
        qualifications: "",
        coaching_philosophy: "",
        references: ""
      });
      setCurrentStep(1);
      
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          name="name" 
          value={formData.name} 
          onChange={handleChange}
          placeholder="Enter your full name"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input 
          id="email" 
          name="email" 
          type="email"
          value={formData.email} 
          onChange={handleChange}
          placeholder="Enter your email address"
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="specialty">Coaching Specialty</Label>
        <Select 
          value={formData.specialty} 
          onValueChange={(value) => handleSelectChange("specialty", value)}
        >
          <SelectTrigger id="specialty" className={errors.specialty ? "border-destructive" : ""}>
            <SelectValue placeholder="Select your specialty" />
          </SelectTrigger>
          <SelectContent>
            {specialties.map(specialty => (
              <SelectItem key={specialty.id} value={specialty.id}>
                {specialty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.specialty && <p className="text-xs text-destructive">{errors.specialty}</p>}
        {formData.specialty && (
          <p className="text-xs text-muted-foreground mt-1">
            {specialties.find(s => s.id === formData.specialty)?.description}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="experience">Years of Coaching Experience</Label>
        <Select 
          value={formData.experience} 
          onValueChange={(value) => handleSelectChange("experience", value)}
        >
          <SelectTrigger id="experience" className={errors.experience ? "border-destructive" : ""}>
            <SelectValue placeholder="Select years of experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 year</SelectItem>
            <SelectItem value="2">2 years</SelectItem>
            <SelectItem value="3">3 years</SelectItem>
            <SelectItem value="5">5+ years</SelectItem>
            <SelectItem value="10">10+ years</SelectItem>
            <SelectItem value="15">15+ years</SelectItem>
          </SelectContent>
        </Select>
        {errors.experience && <p className="text-xs text-destructive">{errors.experience}</p>}
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bio">Coaching Bio</Label>
        <Textarea 
          id="bio" 
          name="bio" 
          value={formData.bio} 
          onChange={handleChange}
          placeholder="Tell us about your coaching experience, philosophy, and what makes you a great coach"
          className={`min-h-[120px] ${errors.bio ? "border-destructive" : ""}`}
        />
        {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          {formData.bio.length} / 500 characters (minimum 50)
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Coaching Skills</Label>
        <div className="border rounded-md p-4 space-y-3">
          <p className="text-sm text-muted-foreground mb-2">
            Select all the skills you're proficient in coaching
          </p>
          
          {/* Group skills by category */}
          {[...new Set(skills.map(skill => skill.category))].map(category => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-medium">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {skills.filter(skill => skill.category === category).map(skill => (
                  <Badge 
                    key={skill.id} 
                    variant={formData.skills.includes(skill.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleSkillToggle(skill.id)}
                  >
                    {formData.skills.includes(skill.id) && (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        {errors.skills && <p className="text-xs text-destructive">{errors.skills}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
        <div className="flex items-center">
          <span className="mr-2 text-muted-foreground">$</span>
          <Input 
            id="hourlyRate" 
            name="hourlyRate" 
            type="number"
            min="1"
            step="0.01"
            value={formData.hourlyRate} 
            onChange={handleChange}
            placeholder="Enter your hourly rate"
            className={`w-full ${errors.hourlyRate ? "border-destructive" : ""}`}
          />
        </div>
        {errors.hourlyRate && <p className="text-xs text-destructive">{errors.hourlyRate}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Set a competitive rate based on your experience and expertise
        </p>
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="qualifications">Qualifications & Certifications (Optional)</Label>
        <Textarea 
          id="qualifications" 
          name="qualifications" 
          value={formData.qualifications} 
          onChange={handleChange}
          placeholder="List any relevant coaching qualifications, certifications, or playing experience"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="coaching_philosophy">Coaching Philosophy (Optional)</Label>
        <Textarea 
          id="coaching_philosophy" 
          name="coaching_philosophy" 
          value={formData.coaching_philosophy} 
          onChange={handleChange}
          placeholder="Describe your coaching philosophy and approach to teaching cricket"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="references">References (Optional)</Label>
        <Textarea 
          id="references" 
          name="references" 
          value={formData.references} 
          onChange={handleChange}
          placeholder="Provide any references or testimonials from previous coaching experiences"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="rounded-md border p-4 bg-muted/50">
        <h4 className="font-medium flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
          Application Review Process
        </h4>
        <p className="text-sm text-muted-foreground mt-2">
          After submission, your application will be reviewed by our team. This process typically takes 2-3 business days. You'll receive an email notification when your application has been reviewed.
        </p>
      </div>
    </div>
  );
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };
  
  const renderProgressBar = () => (
    <div className="mb-6 space-y-2">
      <div className="flex justify-between mb-1">
        <p className="text-sm font-medium">Application Progress</p>
        <p className="text-sm text-muted-foreground">{currentStep}/3</p>
      </div>
      <Progress value={(currentStep / 3) * 100} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <div className={`flex flex-col items-center ${currentStep >= 1 ? "text-primary" : ""}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
            currentStep > 1 ? "bg-primary text-primary-foreground" : 
            currentStep === 1 ? "bg-primary/20 text-primary border border-primary" : 
            "bg-muted text-muted-foreground"
          }`}>
            {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <span>Basic Info</span>
        </div>
        
        <div className={`flex flex-col items-center ${currentStep >= 2 ? "text-primary" : ""}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
            currentStep > 2 ? "bg-primary text-primary-foreground" : 
            currentStep === 2 ? "bg-primary/20 text-primary border border-primary" : 
            "bg-muted text-muted-foreground"
          }`}>
            {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
          </div>
          <span>Skills & Rates</span>
        </div>
        
        <div className={`flex flex-col items-center ${currentStep >= 3 ? "text-primary" : ""}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
            currentStep > 3 ? "bg-primary text-primary-foreground" : 
            currentStep === 3 ? "bg-primary/20 text-primary border border-primary" : 
            "bg-muted text-muted-foreground"
          }`}>
            {currentStep > 3 ? <Check className="h-4 w-4" /> : "3"}
          </div>
          <span>Additional Info</span>
        </div>
      </div>
    </div>
  );
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <GraduationCap className="h-4 w-4" />
          Become a Coach
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Become a Cricket Coach</DialogTitle>
          <DialogDescription>
            Share your cricket expertise and help others improve their game. Fill out this application to join our coaching team.
          </DialogDescription>
        </DialogHeader>
        
        {isSubmitting ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative h-20 w-20">
              <RotateCcw className="h-20 w-20 text-primary animate-spin" />
              <GraduationCap className="h-10 w-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Submitting Your Application</h2>
            <p className="text-center text-muted-foreground">
              Please wait while we submit your coaching application...
            </p>
          </div>
        ) : (
          <>
            {renderProgressBar()}
            {renderStepContent()}
            
            <DialogFooter className="flex justify-between items-center gap-2 pt-4">
              {currentStep > 1 && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                >
                  Previous
                </Button>
              )}
              
              <div className="flex-1"></div>
              
              {currentStep < 3 ? (
                <Button 
                  type="button"
                  onClick={nextStep}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  Submit Application
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}