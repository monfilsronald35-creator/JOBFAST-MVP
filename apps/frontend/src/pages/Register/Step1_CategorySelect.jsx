import React, { memo } from 'react';
import ROLE_CONFIGS, { ROLES } from '../../config/roleConfig';

const REGISTRATION_ROLES = [
  ROLES.WORKER,
  ROLES.COMPANY,
  ROLES.ENTERPRISE,
  ROLES.RESTAURANT,
  ROLES.HOTEL,
  ROLES.RENTAL,
  ROLES.OFFICE,
  ROLES.HOSPITAL,
  ROLES.CLINIC,
  ROLES.TOURISM,
  ROLES.SERVICE_PROVIDER,
];

function Step1_CategorySelect({ selected, onSelect }) {
  return (
    <div className="w-full">
      <p className="text-sm text-gray-300 mb-4 text-center">
        Chwazi kalite kont ou vle kreye
      </p>
      <div className="grid grid-cols-2 gap-3">
        {REGISTRATION_ROLES.map((roleKey) => {
          const config = ROLE_CONFIGS[roleKey];
          if (!config) return null;
          return (
            <button
              key={roleKey}
              onClick={() => onSelect(roleKey)}
              className={`p-4 rounded-lg border-2 transition transform hover:scale-105 text-left ${
                selected === roleKey
                  ? 'border-yellow-400 bg-yellow-400/10 scale-105'
                  : 'border-gray-600 bg-gray-700/30 hover:border-yellow-400/50'
              }`}
            >
              <div className="text-3xl mb-2">{config.icon}</div>
              <div className="text-sm font-bold">{config.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(Step1_CategorySelect);