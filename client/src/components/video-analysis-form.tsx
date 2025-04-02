import React, { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Video, Upload, RotateCcw, Camera } from "lucide-react";

export function VideoAnalysisForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview for video
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
    }
  };
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }
    
    if (!formData.skill) {
      newErrors.skill = "Please select a skill";
      isValid = false;
    }
    
    if (!selectedFile) {
      newErrors.file = "Please upload a video";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    simulateUploadProgress();
    
    try {
      // Create form data for file upload
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description);
      formPayload.append('skill', formData.skill);
      
      if (selectedFile) {
        formPayload.append('video', selectedFile);
      }
      
      const response = await fetch('/api/coaching/analyze-video', {
        method: 'POST',
        body: formPayload
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload and analyze video');
      }
      
      setIsUploading(false);
      setIsAnalyzing(true);
      simulateAnalyzeProgress();
      
      const result = await response.json();
      
      // In a real app, we would wait for the analysis to complete
      // For now, we'll simulate it with a timeout
      
      toast({
        title: "Analysis Complete",
        description: "Your video has been analyzed successfully. View the results in My Coaching.",
      });
      
      // Reset the form
      setFormData({
        title: "",
        description: "",
        skill: ""
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and analyze video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      setUploadProgress(0);
      setAnalyzeProgress(0);
    }
  };
  
  const simulateUploadProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(progress);
    }, 300);
  };
  
  const simulateAnalyzeProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 5;
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
      }
      setAnalyzeProgress(progress);
    }, 400);
    
    // Simulate analysis completion
    setTimeout(() => {
      clearInterval(interval);
      setIsAnalyzing(false);
      setAnalyzeProgress(0);
    }, 8000);
  };
  
  if (isUploading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="h-10 w-10 text-primary animate-pulse" />
            <h3 className="text-lg font-medium">Uploading Video</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Please wait while we upload your video. This may take a few minutes depending on the file size.
            </p>
            <div className="w-full max-w-md mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative h-14 w-14">
              <RotateCcw className="h-14 w-14 text-primary animate-spin" />
              <Video className="h-7 w-7 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Analyzing Your Technique</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Our AI is analyzing your cricket technique. This may take a few minutes depending on the video length.
            </p>
            <div className="w-full max-w-md mt-4">
              <Progress value={analyzeProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {Math.round(analyzeProgress)}%
              </p>
            </div>
            <p className="text-sm mt-4">
              Step {analyzeProgress < 30 ? "1/4: Processing video" : 
                   analyzeProgress < 60 ? "2/4: Analyzing technique" : 
                   analyzeProgress < 90 ? "3/4: Identifying improvements" : 
                   "4/4: Generating feedback"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Analysis</CardTitle>
        <CardDescription>
          Upload a video of your cricket technique for AI-powered analysis and feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input 
              id="title" 
              name="title" 
              value={formData.title} 
              onChange={handleChange}
              placeholder="e.g., My Cover Drive Technique"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              placeholder="Describe what you'd like feedback on"
              className={`min-h-[80px] ${errors.description ? "border-destructive" : ""}`}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skill">Cricket Skill</Label>
            <Select 
              value={formData.skill} 
              onValueChange={(value) => handleSelectChange("skill", value)}
            >
              <SelectTrigger id="skill" className={errors.skill ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="batting">Batting</SelectItem>
                <SelectItem value="bowling">Bowling</SelectItem>
                <SelectItem value="fielding">Fielding</SelectItem>
                <SelectItem value="wicketkeeping">Wicketkeeping</SelectItem>
              </SelectContent>
            </Select>
            {errors.skill && <p className="text-xs text-destructive">{errors.skill}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Upload Video</Label>
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            {!previewUrl ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleUploadClick}
              >
                <Camera className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    MP4, MOV or WEBM up to 100MB
                  </p>
                </div>
                <Button variant="outline" type="button" onClick={handleUploadClick}>
                  Select Video
                </Button>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border">
                <video 
                  src={previewUrl} 
                  controls 
                  className="w-full h-full max-h-[320px] object-cover" 
                />
                <div className="p-3 flex justify-between items-center">
                  <div className="text-sm truncate">
                    {selectedFile?.name}
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile?.size ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0)} MB
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    type="button"
                    onClick={handleUploadClick}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
            {errors.file && <p className="text-xs text-destructive">{errors.file}</p>}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          type="submit"
          onClick={handleSubmit}
          disabled={isUploading || isAnalyzing}
        >
          <Video className="h-4 w-4 mr-2" />
          Analyze Technique
        </Button>
      </CardFooter>
    </Card>
  );
}