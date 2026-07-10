import React, { memo, useCallback } from "react";
import {
  getRoleConfig,
  getRegistrationRoles
} from "../../config/roleConfig";

function Step1_CategorySelect({
  selected,
  onSelect,
  t
}) {
  const roles = getRegistrationRoles();

  const handleSelect = useCallback(
    (role) => {
      onSelect(role);
    },
    [onSelect]
  );

  return (
    <div className="w-full">
      <p className="text-sm text-gray-300 mb-4 text-center">
        {t("registration.choose_account_type")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((roleKey)=>{
          const config = getRoleConfig(roleKey);
          if(!config) return null;
          const Icon = config.icon;
          return (
            <button
              key={roleKey}
              type="button"
              onClick={()=>handleSelect(roleKey)}
              aria-selected={selected===roleKey}
              className={`
              p-5 rounded-xl border-2 transition
              ${selected===roleKey
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-gray-600"}
              `}
            >
              <Icon className="w-8 h-8 mb-3"/>
              <h3 className="font-bold">{config.label}</h3>
              <p className="text-xs text-gray-400">{config.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(Step1_CategorySelect);