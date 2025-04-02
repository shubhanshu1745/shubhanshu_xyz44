import React from 'react';

interface Shot {
  angle: number;
  distance: number;
  runs: number;
  isWicket: boolean;
}

interface WagonWheelProps {
  data: Shot[];
}

export default function WagonWheel({ data }: WagonWheelProps) {
  const circleSize = 200;
  const center = circleSize / 2;
  const radius = center - 10;
  
  // Generate coordinates for each shot
  const shots = data.map((shot, index) => {
    const angleRad = (shot.angle * Math.PI) / 180;
    const distance = shot.distance * radius;
    const x = center + distance * Math.cos(angleRad);
    const y = center + distance * Math.sin(angleRad);
    
    return {
      ...shot,
      x,
      y,
      color: shot.runs === 6 
        ? "#2E8B57" 
        : shot.runs === 4 
          ? "#1F3B4D" 
          : shot.runs === 0 
            ? "#FFC107" 
            : "#6B7280",
    };
  });
  
  return (
    <div className="w-full flex items-center justify-center">
      <svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`}>
        {/* Field outline */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="#E5E7EB"
          stroke="#D1D5DB"
          strokeWidth={1}
        />
        
        {/* 30 yard circle */}
        <circle
          cx={center}
          cy={center}
          r={radius * 0.7}
          fill="none"
          stroke="#D1D5DB"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        
        {/* Pitch area */}
        <rect
          x={center - 8}
          y={center - 30}
          width={16}
          height={60}
          fill="#D1D5DB"
          stroke="#9CA3AF"
          strokeWidth={1}
        />
        
        {/* Draw shots */}
        {shots.map((shot, index) => (
          <React.Fragment key={index}>
            <line
              x1={center}
              y1={center}
              x2={shot.x}
              y2={shot.y}
              stroke={shot.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={shot.isWicket ? "5,3" : "none"}
            />
            <circle
              cx={shot.x}
              cy={shot.y}
              r={shot.runs === 6 ? 5 : shot.runs === 4 ? 4 : 3}
              fill={shot.color}
              stroke="#fff"
              strokeWidth={1}
            />
          </React.Fragment>
        ))}
        
        {/* Add field segments */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const angleRad = (angle * Math.PI) / 180;
          const x = center + radius * Math.cos(angleRad);
          const y = center + radius * Math.sin(angleRad);
          
          return (
            <line
              key={angle}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#D1D5DB"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          );
        })}
        
        {/* Center point */}
        <circle cx={center} cy={center} r={3} fill="#6B7280" />
      </svg>
    </div>
  );
}