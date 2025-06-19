import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Trophy, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  type: "verified" | "professional" | "coach" | "official";
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export function VerificationBadge({ type, size = "md", showTooltip = true }: VerificationBadgeProps) {
  const getBadgeConfig = () => {
    switch (type) {
      case "verified":
        return {
          icon: CheckCircle,
          color: "bg-blue-500",
          text: "Verified",
          tooltip: "This account has been verified by CricSocial",
        };
      case "professional":
        return {
          icon: Trophy,
          color: "bg-orange-500",
          text: "Pro Player",
          tooltip: "Verified professional cricket player",
        };
      case "coach":
        return {
          icon: Shield,
          color: "bg-green-500",
          text: "Coach",
          tooltip: "Verified cricket coach or trainer",
        };
      case "official":
        return {
          icon: Star,
          color: "bg-purple-500",
          text: "Official",
          tooltip: "Official cricket organization or board",
        };
      default:
        return {
          icon: CheckCircle,
          color: "bg-blue-500",
          text: "Verified",
          tooltip: "Verified account",
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const badgeContent = (
    <Badge 
      variant="secondary" 
      className={`${config.color} text-white hover:${config.color}/80 flex items-center gap-1 px-2 py-1`}
    >
      <Icon className={sizeClasses[size]} />
      {size !== "sm" && <span className="text-xs font-medium">{config.text}</span>}
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Verification request component for professional players
interface VerificationRequestProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function VerificationRequest({ onSubmit, isLoading = false }: VerificationRequestProps) {
  const [requestType, setRequestType] = useState("professional");
  const [fullName, setFullName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [careerDetails, setCareerDetails] = useState("");
  const [verificationDocuments, setVerificationDocuments] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: requestType,
      fullName,
      teamName,
      careerDetails,
      documents: verificationDocuments,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setVerificationDocuments(Array.from(e.target.files));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Verification</h2>
        <p className="text-gray-600">
          Apply for verification to get a badge that shows you're a legitimate cricket professional.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Type
          </label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="professional">Professional Player</option>
            <option value="coach">Coach/Trainer</option>
            <option value="official">Official Organization</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Your full professional name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team/Organization
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Current or most recent team/organization"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Career Details
          </label>
          <textarea
            value={careerDetails}
            onChange={(e) => setCareerDetails(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Brief description of your cricket career, achievements, and current status..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Documents
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload official documents like player contracts, certificates, or ID cards (PDF, JPG, PNG)
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900 mb-2">Verification Process</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• We'll review your application within 5-7 business days</li>
            <li>• You may be contacted for additional verification</li>
            <li>• Verification badges are awarded to legitimate cricket professionals</li>
            <li>• False information will result in account suspension</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        >
          {isLoading ? "Submitting..." : "Submit Verification Request"}
        </button>
      </form>
    </div>
  );
}