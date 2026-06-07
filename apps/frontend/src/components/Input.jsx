import React from "react";

const Input = ({ 
  as: Component = "input", 
  label, 
  error, 
  icon: IconComponent, 
  className = "", 
  ...props 
}) => {
  return (
    <div className="animate-fade-in mb-4 w-full select-none">
      {label && (
        <label className="block ml-1 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center w-full">
        {IconComponent && (
          <div className="absolute left-4 flex items-center justify-center pointer-events-none text-slate-500">
            <IconComponent className="h-4 w-4" strokeWidth={2} />
          </div>
        )}
        
        <Component
          {...props}
          className={`
            w-full bg-navy-950 border ${error ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-800/60 focus:border-gold-400'} 
            text-sm font-medium text-white py-3.5 rounded-xl outline-none transition-all duration-200
            placeholder:text-slate-600 focus:ring-4 ${error ? 'focus:ring-rose-500/10' : 'focus:ring-gold-400/10'}
            focus-visible:ring-4 focus-visible:ring-${error ? 'rose' : 'gold'}-400/20
            ${IconComponent ? 'pl-11' : 'px-4'} pr-4
            ${Component === 'textarea' ? 'h-28 resize-none pt-3.5' : ''}
            ${className}
          `}
        />
      </div>
      
      {error && (
        <p className="ml-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
