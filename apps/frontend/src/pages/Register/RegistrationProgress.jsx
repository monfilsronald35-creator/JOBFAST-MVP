import React, { memo } from 'react';

function RegistrationProgress({ current, total }) {
  const progress = ((current - 1) / (total - 1)) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto my-6 z-10">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {current} / {total}
        </span>
      </div>

      <div className="flex justify-between px-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition ${
              i < current ? 'bg-yellow-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(RegistrationProgress);
