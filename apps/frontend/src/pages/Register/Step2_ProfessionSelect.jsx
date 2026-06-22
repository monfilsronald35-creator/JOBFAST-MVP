import React, { memo } from 'react';
import { PROFESSION_METADATA, CATEGORIES } from '../../constants/categories';

function Step2_ProfessionSelect({ category, professions, selected, onSelect }) {
  const categoryData = Object.values(CATEGORIES).find(c => c.id === category);

  return (
    <div className="w-full">
      <p className="text-sm text-gray-300 mb-4">
        Chwazi pwofesyon ou pou <strong>{categoryData?.label}</strong>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {professions.map((profession) => {
          const metadata = PROFESSION_METADATA[profession];
          return (
            <button
              key={profession}
              onClick={() => onSelect(profession)}
              className={`p-4 rounded-lg border-2 transition transform hover:scale-105 ${
                selected === profession
                  ? 'border-yellow-400 bg-yellow-400/10 scale-105'
                  : 'border-gray-600 bg-gray-700/30 hover:border-yellow-400/50'
              }`}
            >
              <div className="text-2xl mb-2">{metadata?.icon || '👤'}</div>
              <div className="text-sm font-bold">{metadata?.label || profession}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(Step2_ProfessionSelect);
