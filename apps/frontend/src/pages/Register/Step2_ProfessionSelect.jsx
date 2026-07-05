import React, { memo } from 'react';
import { PROFESSION_METADATA } from '../../constants/categories';
import ROLE_CONFIGS from '../../config/roleConfig';

function Step2_ProfessionSelect({ role, category, professions, selected, onSelect }) {
  const roleConfig = role ? ROLE_CONFIGS[role] : null;
  const subtitle = roleConfig?.label || category || '';

  return (
    <div className="w-full">
      <p className="text-sm text-gray-300 mb-4">
        Chwazi pwofesyon ou pou <strong>{subtitle}</strong>
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
