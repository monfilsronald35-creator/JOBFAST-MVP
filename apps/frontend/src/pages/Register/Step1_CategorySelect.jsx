import React, { memo } from 'react';
import { CATEGORIES } from '../../constants/categories';

function Step1_CategorySelect({ selected, onSelect }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3">
        {Object.values(CATEGORIES).map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`p-4 rounded-lg border-2 transition transform hover:scale-105 ${
              selected === category.id
                ? 'border-yellow-400 bg-yellow-400/10 scale-105'
                : 'border-gray-600 bg-gray-700/30 hover:border-yellow-400/50'
            }`}
          >
            <div className="text-3xl mb-2">{category.icon}</div>
            <div className="text-sm font-bold">{category.label}</div>
            <div className="text-xs text-gray-300 mt-1">{category.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(Step1_CategorySelect);
