import React from 'react';

interface HeatMapProps {
  playerId: number;
  isForBatting: boolean;
}

export default function HeatMap({ playerId, isForBatting }: HeatMapProps) {
  return (
    <div className="aspect-square w-full relative border rounded-md p-4 flex items-center justify-center">
      <div className="absolute inset-0 p-4">
        <div className="w-full h-full grid grid-cols-5 grid-rows-5 gap-1">
          {Array.from({ length: 25 }).map((_, index) => {
            // Generate random heat values for demonstration
            const intensity = Math.random();
            const colorIntensity = Math.floor(255 * intensity);
            const bgColor = isForBatting
              ? `rgba(46, 139, 87, ${intensity.toFixed(1)})`
              : `rgba(31, 59, 77, ${intensity.toFixed(1)})`;
            
            return (
              <div
                key={index}
                className="rounded-sm flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: bgColor }}
              >
                {Math.floor(intensity * 10)}
              </div>
            );
          })}
        </div>
      </div>
      <div className="relative z-10 text-center">
        <div className="border-2 border-dashed border-gray-300 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
          {isForBatting ? "Pitch" : "Pitch"}
        </div>
      </div>
    </div>
  );
}