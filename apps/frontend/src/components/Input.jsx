import React, { memo } from "react";

const Input = memo(({ 
  as: Component = "input", 
  label, 
  error, 
  icon, 
  className = "", 
  ...props 
}) => {
  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1 tracking-wider">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {/* Ikon a si li egziste */}
        {icon && (
          <div className="absolute left-4 text-gray-500 text-lg">
            {icon}
          </div>
        )}
        
        <Component
          {...props}
          className={`
            w-full bg-[#0B1528] border ${error ? 'border-red-500' : 'border-gray-700'} 
            text-white py-3 rounded-xl outline-none transition-all duration-200
            placeholder:text-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500
            ${icon ? 'pl-12' : 'pl-4'} pr-4
            ${Component === 'textarea' ? 'h-32 resize-none pt-3' : ''}
            ${className}
          `}
        />
      </div>
      
      {error && (
        <p className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
