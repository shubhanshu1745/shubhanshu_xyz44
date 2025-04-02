import { storage } from "../db-config";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "./email-service";

// Types for coaching service
export interface Coach {
  id: string;
  userId: number;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  specialty: string;
  experience: number;
  hourlyRate: number;
  skills: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  createdAt: Date;
}

export interface CoachApplication {
  id: string;
  userId: number;
  name: string;
  email: string;
  specialty: string;
  experience: number;
  bio: string;
  skills: string[];
  hourlyRate: number;
  qualifications?: string;
  coaching_philosophy?: string;
  references?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
}

export interface CoachingSession {
  id: string;
  coachId: string;
  userId: number;
  title: string;
  date: Date;
  duration: number;
  type: 'online' | 'in-person' | 'group';
  focus: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  feedback?: string;
  feedbackRating?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AnalysisVideo {
  id: string;
  userId: number;
  title: string;
  description: string;
  skill: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  status: 'pending' | 'analyzed' | 'error';
  feedback?: any;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TrainingPlan {
  id: string;
  userId: number;
  coachId?: string;
  title: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
  schedule: any[];
  progressTracking: any[];
  created: Date;
  updated?: Date;
}

// Mock data for development purposes
const mockCoaches: Coach[] = [
  {
    id: "c1",
    userId: 1,
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Former first-class cricketer specializing in batting technique and mental preparation. I've coached at state level for 8 years and worked with young players to develop their batting skills and match temperament.",
    specialty: "batting",
    experience: 10,
    hourlyRate: 75,
    skills: ["Batting Technique", "Mental Strength", "Shot Selection", "Power Hitting"],
    rating: 4.8,
    reviewCount: 24,
    verified: true,
    createdAt: new Date("2023-01-15")
  },
  {
    id: "c2",
    userId: 2,
    name: "Priya Patel",
    email: "priya.patel@example.com",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Spin bowling specialist with experience coaching at academy level. I focus on developing variations, control, and strategy for spin bowlers of all levels.",
    specialty: "bowling",
    experience: 8,
    hourlyRate: 65,
    skills: ["Spin Bowling", "Bowling Variations", "Field Placements", "Match Strategy"],
    rating: 4.7,
    reviewCount: 19,
    verified: true,
    createdAt: new Date("2023-02-10")
  },
  {
    id: "c3",
    userId: 3,
    name: "Michael Davis",
    email: "michael.davis@example.com",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    bio: "Certified strength and conditioning coach specializing in cricket. I help players improve their fielding, throwing, and overall athleticism to excel in all aspects of the game.",
    specialty: "fielding",
    experience: 5,
    hourlyRate: 60,
    skills: ["Ground Fielding", "Catching", "Throwing", "Fielding Strategy"],
    rating: 4.6,
    reviewCount: 12,
    verified: true,
    createdAt: new Date("2023-03-05")
  },
  {
    id: "c4",
    userId: 4,
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: "Former national team wicketkeeper with extensive coaching experience. I specialize in all aspects of wicketkeeping, from basic stance to advanced techniques and batting as a keeper.",
    specialty: "wicketkeeping",
    experience: 12,
    hourlyRate: 80,
    skills: ["Wicketkeeping Basics", "Advanced Techniques", "Keeper-Batter Skills"],
    rating: 4.9,
    reviewCount: 31,
    verified: true,
    createdAt: new Date("2023-01-20")
  },
  {
    id: "c5",
    userId: 5,
    name: "James Wilson",
    email: "james.wilson@example.com",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    bio: "All-round coach with experience at international level. I provide comprehensive coaching covering all aspects of cricket, from technique to strategy and mental preparation.",
    specialty: "all-round",
    experience: 15,
    hourlyRate: 90,
    skills: ["Batting", "Bowling", "Fielding", "Mental Preparation", "Match Strategy"],
    rating: 4.9,
    reviewCount: 42,
    verified: true,
    createdAt: new Date("2022-12-10")
  }
];

const mockCoachingApplications: CoachApplication[] = [];

const mockCoachingSessions: CoachingSession[] = [
  {
    id: "s1",
    coachId: "c1",
    userId: 101,
    title: "Batting Technique Session",
    date: new Date("2023-04-15T14:00:00"),
    duration: 60,
    type: "online",
    focus: "Cover Drive Technique",
    notes: "I want to focus on my cover drive technique, particularly footwork and follow-through.",
    status: "scheduled",
    createdAt: new Date("2023-04-01")
  },
  {
    id: "s2",
    coachId: "c2",
    userId: 102,
    title: "Spin Bowling Masterclass",
    date: new Date("2023-04-18T16:00:00"),
    duration: 90,
    type: "online",
    focus: "Bowling Variations",
    notes: "Need help developing my googly and slider variations.",
    status: "scheduled",
    createdAt: new Date("2023-04-02")
  },
  {
    id: "s3",
    coachId: "c3",
    userId: 101,
    title: "Fielding Improvement",
    date: new Date("2023-03-25T10:00:00"),
    duration: 60,
    type: "in-person",
    focus: "Catching and Throwing",
    notes: "Want to improve my catching technique and throwing accuracy.",
    status: "completed",
    feedback: "Great session, Michael provided excellent drills for improving my catching technique.",
    feedbackRating: 5,
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2023-03-25T12:00:00")
  }
];

const mockAnalysisVideos: AnalysisVideo[] = [
  {
    id: "v1",
    userId: 101,
    title: "Cover Drive Analysis",
    description: "My cover drive technique from side angle",
    skill: "batting",
    videoUrl: "/uploads/videos/cover-drive-analysis.mp4",
    thumbnailUrl: "https://cricketcoaching.nz/wp-content/uploads/2019/06/cricket-coaching-batting-stance.jpg",
    duration: 65,
    status: "analyzed",
    feedback: {
      overallScore: 75,
      strengths: ["Good head position", "Nice follow-through"],
      weaknesses: ["Footwork needs improvement", "Bat angle could be better"],
      recommendations: [
        "Work on front foot movement towards the pitch of the ball",
        "Focus on keeping the bat face angled down during the stroke"
      ]
    },
    createdAt: new Date("2023-03-15"),
    updatedAt: new Date("2023-03-15T14:30:00")
  },
  {
    id: "v2",
    userId: 102,
    title: "Bowling Action Analysis",
    description: "My bowling action, need help with arm position",
    skill: "bowling",
    videoUrl: "/uploads/videos/bowling-action-analysis.mp4",
    thumbnailUrl: "https://static.wixstatic.com/media/761262_db0e44a59c7e49a0a53c748d30d16cd0~mv2.jpg/v1/fill/w_640,h_360,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/761262_db0e44a59c7e49a0a53c748d30d16cd0~mv2.jpg",
    duration: 58,
    status: "analyzed",
    feedback: {
      overallScore: 80,
      strengths: ["Good run-up rhythm", "Nice follow-through"],
      weaknesses: ["Arm could be more vertical", "Front foot landing needs adjustment"],
      recommendations: [
        "Work on getting your arm closer to vertical at release",
        "Focus on landing your front foot parallel to the crease"
      ]
    },
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2023-03-10T11:15:00")
  }
];

const mockTrainingPlans: TrainingPlan[] = [
  {
    id: "tp1",
    userId: 101,
    coachId: "c1",
    title: "Batting Improvement Plan",
    description: "Comprehensive plan to improve batting technique and scoring ability",
    difficulty: "intermediate",
    focusAreas: ["Cover Drive", "Pull Shot", "Footwork", "Power Hitting"],
    schedule: [
      {
        day: "Monday",
        title: "Defensive Technique",
        description: "Focus on defensive shots and balance",
        duration: 60
      },
      {
        day: "Wednesday",
        title: "Attacking Shots",
        description: "Practice cover drives and pull shots",
        duration: 90
      },
      {
        day: "Friday",
        title: "Power Hitting",
        description: "Develop power hitting for boundary shots",
        duration: 60
      },
      {
        day: "Saturday",
        title: "Match Simulation",
        description: "Practice in match-like scenarios",
        duration: 120
      }
    ],
    progressTracking: [
      {
        skill: "Cover Drive",
        progress: 65
      },
      {
        skill: "Pull Shot",
        progress: 45
      },
      {
        skill: "Footwork",
        progress: 70
      },
      {
        skill: "Power Hitting",
        progress: 35
      }
    ],
    created: new Date("2023-03-01"),
    updated: new Date("2023-04-01")
  }
];

// Coaching service functions
export async function getCoaches(specialty?: string): Promise<Coach[]> {
  try {
    // In a production environment, this would fetch from the database
    let coaches = mockCoaches;
    
    if (specialty) {
      coaches = coaches.filter(coach => coach.specialty === specialty);
    }
    
    return coaches;
  } catch (error) {
    console.error("Error getting coaches:", error);
    throw new Error("Failed to fetch coaches");
  }
}

export async function getCoachById(coachId: string): Promise<Coach | null> {
  try {
    const coach = mockCoaches.find(c => c.id === coachId);
    return coach || null;
  } catch (error) {
    console.error("Error getting coach by ID:", error);
    throw new Error("Failed to fetch coach details");
  }
}

export async function applyForCoaching(applicationData: Omit<CoachApplication, 'id' | 'status' | 'submittedAt'>): Promise<CoachApplication> {
  try {
    // Generate a unique ID for the application
    const applicationId = uuidv4();
    
    // Create the application record
    const newApplication: CoachApplication = {
      id: applicationId,
      status: 'pending',
      submittedAt: new Date(),
      ...applicationData
    };
    
    // In a production environment, this would save to the database
    mockCoachingApplications.push(newApplication);
    
    // Send confirmation email to the applicant
    console.log(`[MOCK EMAIL] Sending application confirmation to ${applicationData.email}`);
    console.log(`Subject: Cricket Coaching Application Received`);
    console.log(`Body: Dear ${applicationData.name},\n\nThank you for applying to become a cricket coach on CricSocial. Your application (ID: ${applicationId}) has been received and is currently under review.\n\nWe aim to review all applications within 2-3 business days. You will be notified via email once your application has been processed.\n\nBest regards,\nThe CricSocial Team`);
    
    // Send notification to admin
    console.log(`[MOCK EMAIL] Sending admin notification to admin@cricsocial.com`);
    console.log(`Subject: New Coach Application Submitted`);
    console.log(`Body: A new coaching application has been submitted by ${applicationData.name} (${applicationData.email}) specializing in ${applicationData.specialty}.\n\nApplication ID: ${applicationId}\nExperience: ${applicationData.experience} years\nHourly Rate: $${applicationData.hourlyRate}\n\nPlease review the application in the admin dashboard.`);
    
    return newApplication;
  } catch (error) {
    console.error("Error applying for coaching:", error);
    throw new Error("Failed to submit coaching application");
  }
}

export async function getCoachingSessions(userId: number): Promise<CoachingSession[]> {
  try {
    // In a production environment, this would fetch from the database
    const sessions = mockCoachingSessions.filter(session => session.userId === userId);
    
    // For each session, add the coach details
    const sessionsWithCoachDetails = await Promise.all(sessions.map(async session => {
      const coach = await getCoachById(session.coachId);
      return {
        ...session,
        coach: coach
      };
    }));
    
    return sessionsWithCoachDetails;
  } catch (error) {
    console.error("Error getting coaching sessions:", error);
    throw new Error("Failed to fetch coaching sessions");
  }
}

export async function bookCoachingSession(sessionData: Omit<CoachingSession, 'id' | 'status' | 'createdAt'>): Promise<CoachingSession> {
  try {
    // Validate coach exists
    const coach = await getCoachById(sessionData.coachId);
    if (!coach) {
      throw new Error("Coach not found");
    }
    
    // Generate a unique ID for the session
    const sessionId = uuidv4();
    
    // Create the session record
    const newSession: CoachingSession = {
      id: sessionId,
      status: 'scheduled',
      createdAt: new Date(),
      ...sessionData
    };
    
    // In a production environment, this would save to the database
    mockCoachingSessions.push(newSession);
    
    // Send confirmation email to the user
    console.log(`[MOCK EMAIL] Sending session confirmation to user@example.com`);
    console.log(`Subject: Coaching Session Booked`);
    console.log(`Body: Your coaching session "${newSession.title}" with ${coach.name} has been scheduled for ${newSession.date.toLocaleString()}.\n\nSession details:\nDuration: ${newSession.duration} minutes\nType: ${newSession.type}\nFocus: ${newSession.focus}\n\nYou will receive a reminder 24 hours before your session.`);
    
    // Send notification to the coach
    console.log(`[MOCK EMAIL] Sending coach notification to ${coach.email}`);
    console.log(`Subject: New Coaching Session Booked`);
    console.log(`Body: A new coaching session "${newSession.title}" has been booked with you for ${newSession.date.toLocaleString()}.\n\nSession details:\nDuration: ${newSession.duration} minutes\nType: ${newSession.type}\nFocus: ${newSession.focus}\nNotes: ${newSession.notes || 'None'}\n\nPlease log in to your dashboard to view more details and prepare for the session.`);
    
    return {
      ...newSession,
      coach
    };
  } catch (error) {
    console.error("Error booking coaching session:", error);
    throw new Error("Failed to book coaching session");
  }
}

export async function analyzeVideo(videoData: {
  userId: number;
  title: string;
  description: string;
  skill: string;
  video: any; // In a real implementation, this would be a file object
}): Promise<AnalysisVideo> {
  try {
    // In a real implementation, this would handle file upload and processing
    // For this mock, we'll simulate the process
    
    // Generate a unique ID for the video
    const videoId = uuidv4();
    
    // Simulate file upload (in a real implementation, this would save the file)
    const videoUrl = `/uploads/videos/${videoId}.mp4`;
    const thumbnailUrl = `/uploads/thumbnails/${videoId}.jpg`;
    
    // Create the video analysis record
    const newVideo: AnalysisVideo = {
      id: videoId,
      userId: videoData.userId,
      title: videoData.title,
      description: videoData.description,
      skill: videoData.skill,
      videoUrl,
      thumbnailUrl,
      duration: Math.floor(Math.random() * 60) + 30, // Random duration between 30-90 seconds
      status: 'pending',
      createdAt: new Date()
    };
    
    // In a production environment, this would save to the database and
    // trigger an asynchronous analysis process
    mockAnalysisVideos.push(newVideo);
    
    // Simulate the analysis process (in production, this would be a separate process)
    setTimeout(() => {
      const updatedVideo = mockAnalysisVideos.find(v => v.id === videoId);
      if (updatedVideo) {
        updatedVideo.status = 'analyzed';
        updatedVideo.updatedAt = new Date();
        updatedVideo.feedback = {
          overallScore: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
          strengths: [
            "Good basic technique",
            "Nice follow-through"
          ],
          weaknesses: [
            "Footwork needs improvement",
            "Balance could be better"
          ],
          recommendations: [
            "Focus on moving your feet to the pitch of the ball",
            "Work on maintaining balance throughout the shot"
          ]
        };
        
        // Send notification email when analysis is complete
        console.log(`[MOCK EMAIL] Sending analysis completion to user@example.com`);
        console.log(`Subject: Video Analysis Complete`);
        console.log(`Body: Your video "${updatedVideo.title}" has been analyzed. Log in to view the detailed feedback and recommendations.`);
      }
    }, 5000); // Simulate 5 second analysis time
    
    return newVideo;
  } catch (error) {
    console.error("Error analyzing video:", error);
    throw new Error("Failed to analyze video");
  }
}

export async function getAnalysisVideos(userId: number, skill?: string): Promise<AnalysisVideo[]> {
  try {
    // In a production environment, this would fetch from the database
    let videos = mockAnalysisVideos.filter(video => video.userId === userId);
    
    if (skill) {
      videos = videos.filter(video => video.skill === skill);
    }
    
    return videos;
  } catch (error) {
    console.error("Error getting analysis videos:", error);
    throw new Error("Failed to fetch analysis videos");
  }
}

export async function getTrainingPlans(userId: number): Promise<TrainingPlan[]> {
  try {
    // In a production environment, this would fetch from the database
    const plans = mockTrainingPlans.filter(plan => plan.userId === userId);
    return plans;
  } catch (error) {
    console.error("Error getting training plans:", error);
    throw new Error("Failed to fetch training plans");
  }
}

export async function createTrainingPlan(planData: Omit<TrainingPlan, 'id' | 'created'>): Promise<TrainingPlan> {
  try {
    // Generate a unique ID for the plan
    const planId = uuidv4();
    
    // Create the training plan record
    const newPlan: TrainingPlan = {
      id: planId,
      created: new Date(),
      ...planData
    };
    
    // In a production environment, this would save to the database
    mockTrainingPlans.push(newPlan);
    
    return newPlan;
  } catch (error) {
    console.error("Error creating training plan:", error);
    throw new Error("Failed to create training plan");
  }
}

export async function updateTrainingPlanProgress(planId: string, progressData: any): Promise<TrainingPlan> {
  try {
    // In a production environment, this would update the database
    const plan = mockTrainingPlans.find(p => p.id === planId);
    
    if (!plan) {
      throw new Error("Training plan not found");
    }
    
    // Update the progress tracking
    plan.progressTracking = progressData;
    plan.updated = new Date();
    
    return plan;
  } catch (error) {
    console.error("Error updating training plan progress:", error);
    throw new Error("Failed to update training plan progress");
  }
}

// Route handler functions for Express endpoints

export const getCoachesHandler = async (req: any, res: any) => {
  try {
    const specialty = req.query.specialty as string | undefined;
    const coaches = await getCoaches(specialty);
    res.json(coaches);
  } catch (error: any) {
    console.error("Error in getCoaches handler:", error);
    res.status(500).json({ error: error.message || "Failed to fetch coaches" });
  }
};

export const getCoachByIdHandler = async (req: any, res: any) => {
  try {
    const coachId = req.params.id;
    const coach = await getCoachById(coachId);
    
    if (!coach) {
      return res.status(404).json({ error: "Coach not found" });
    }
    
    res.json(coach);
  } catch (error: any) {
    console.error("Error in getCoachById handler:", error);
    res.status(500).json({ error: error.message || "Failed to fetch coach details" });
  }
};

export const applyToBeCoach = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in to apply" });
    }
    
    const { name, email, specialty, experience, bio, skills, hourlyRate, qualifications, coaching_philosophy, references } = req.body;
    
    // Basic validation
    if (!name || !email || !specialty || !experience || !bio || !skills || !hourlyRate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Create application data
    const applicationData = {
      userId: req.user.id,
      name,
      email,
      specialty,
      experience: parseInt(experience),
      bio,
      skills: Array.isArray(skills) ? skills : [skills],
      hourlyRate: parseFloat(hourlyRate),
      qualifications,
      coaching_philosophy,
      references
    };
    
    const application = await applyForCoaching(applicationData);
    res.status(201).json(application);
  } catch (error: any) {
    console.error("Error in applyToBeCoach handler:", error);
    res.status(500).json({ error: error.message || "Failed to submit coaching application" });
  }
};

export const getCoachApplication = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    // In a real implementation, this would fetch from the database
    const application = mockCoachingApplications.find(app => app.userId === req.user.id);
    
    if (!application) {
      return res.status(404).json({ error: "No application found" });
    }
    
    res.json(application);
  } catch (error: any) {
    console.error("Error in getCoachApplication handler:", error);
    res.status(500).json({ error: error.message || "Failed to fetch application" });
  }
};

export const bookSession = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in to book a session" });
    }
    
    const { coachId, title, date, duration, type, focus, notes } = req.body;
    
    // Basic validation
    if (!coachId || !title || !date || !duration || !type || !focus) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Create session data
    const sessionData = {
      coachId,
      userId: req.user.id,
      title,
      date: new Date(date),
      duration: parseInt(duration),
      type,
      focus,
      notes
    };
    
    const session = await bookCoachingSession(sessionData);
    res.status(201).json(session);
  } catch (error: any) {
    console.error("Error in bookSession handler:", error);
    res.status(500).json({ error: error.message || "Failed to book coaching session" });
  }
};

export const getSessions = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    const sessions = await getCoachingSessions(req.user.id);
    res.json(sessions);
  } catch (error: any) {
    console.error("Error in getSessions handler:", error);
    res.status(500).json({ error: error.message || "Failed to fetch coaching sessions" });
  }
};

export const getSessionById = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    const sessionId = req.params.id;
    
    // In a real implementation, this would fetch from the database
    const session = mockCoachingSessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    // Only allow users to view their own sessions
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to view this session" });
    }
    
    // Add coach details
    const coach = await getCoachById(session.coachId);
    
    res.json({
      ...session,
      coach
    });
  } catch (error: any) {
    console.error("Error in getSessionById handler:", error);
    res.status(500).json({ error: error.message || "Failed to fetch session details" });
  }
};

export const updateSession = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    const sessionId = req.params.id;
    const { status, feedback, feedbackRating } = req.body;
    
    // In a real implementation, this would update the database
    const session = mockCoachingSessions.find(s => s.id === sessionId);
    
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    // Only allow users to update their own sessions
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to update this session" });
    }
    
    // Update session fields
    if (status) session.status = status;
    if (feedback) session.feedback = feedback;
    if (feedbackRating) session.feedbackRating = parseInt(feedbackRating);
    
    session.updatedAt = new Date();
    
    // Add coach details for response
    const coach = await getCoachById(session.coachId);
    
    res.json({
      ...session,
      coach
    });
  } catch (error: any) {
    console.error("Error in updateSession handler:", error);
    res.status(500).json({ error: error.message || "Failed to update session" });
  }
};

export const getTrainingPlansHandler = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    const plans = await getTrainingPlans(req.user.id);
    res.json(plans);
  } catch (error: any) {
    console.error("Error in getTrainingPlans handler:", error);
    res.status(500).json({ error: error.message || "Failed to fetch training plans" });
  }
};

export const createTrainingPlanHandler = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    const { title, description, difficulty, focusAreas, schedule, progressTracking, coachId } = req.body;
    
    // Basic validation
    if (!title || !difficulty || !focusAreas || !schedule) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Create plan data
    const planData = {
      userId: req.user.id,
      title,
      description,
      difficulty,
      focusAreas: Array.isArray(focusAreas) ? focusAreas : [focusAreas],
      schedule,
      progressTracking: progressTracking || [],
      coachId
    };
    
    const plan = await createTrainingPlan(planData);
    res.status(201).json(plan);
  } catch (error: any) {
    console.error("Error in createTrainingPlan handler:", error);
    res.status(500).json({ error: error.message || "Failed to create training plan" });
  }
};

export const updateTrainingPlanProgressHandler = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    const planId = req.params.id;
    const { progressTracking } = req.body;
    
    // Basic validation
    if (!progressTracking) {
      return res.status(400).json({ error: "Missing progress tracking data" });
    }
    
    // In a real implementation, this would verify ownership
    const plan = mockTrainingPlans.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(404).json({ error: "Training plan not found" });
    }
    
    // Only allow users to update their own plans
    if (plan.userId !== req.user.id) {
      return res.status(403).json({ error: "You do not have permission to update this plan" });
    }
    
    const updatedPlan = await updateTrainingPlanProgress(planId, progressTracking);
    res.json(updatedPlan);
  } catch (error: any) {
    console.error("Error in updateTrainingPlanProgress handler:", error);
    res.status(500).json({ error: error.message || "Failed to update training plan progress" });
  }
};

// Video analysis endpoint
export const analyzeVideoHandler = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    const upload = multer({
      storage: multer.diskStorage({
        destination: './public/uploads/videos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, uniqueSuffix + path.extname(file.originalname));
        }
      })
    }).single('video');
    
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: "File upload failed" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }
      
      const { title, description, skill } = req.body;
      
      // Basic validation
      if (!title || !description || !skill) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Create video data
      const videoData = {
        userId: req.user.id,
        title,
        description,
        skill,
        video: req.file
      };
      
      const analysis = await analyzeVideo(videoData);
      res.status(201).json(analysis);
    });
  } catch (error: any) {
    console.error("Error in analyzeVideo handler:", error);
    res.status(500).json({ error: error.message || "Failed to analyze video" });
  }
};

export const getAnalysisVideosHandler = async (req: any, res: any) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    const skill = req.query.skill as string | undefined;
    const videos = await getAnalysisVideos(req.user.id, skill);
    res.json(videos);
  } catch (error: any) {
    console.error("Error in getAnalysisVideos handler:", error);
    res.status(500).json({ error: error.message || "Failed to fetch analysis videos" });
  }
};