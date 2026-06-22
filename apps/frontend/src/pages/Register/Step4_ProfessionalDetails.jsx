import React, { memo, useCallback } from 'react';
import { PROFESSION_METADATA } from '../../constants/categories';

function Step4_ProfessionalDetails({
  profession,
  metadata,
  onMetadataChange,
  requiredFields,
  optionalFields,
  onSubmit,
  loading,
}) {
  const profData = PROFESSION_METADATA[profession];
  const fieldTypes = profData?.fieldTypes || {};

  const renderField = useCallback((fieldName, isRequired) => {
    const fieldType = fieldTypes[fieldName] || 'text';
    const value = metadata[fieldName] || '';
    const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');

    const handleChange = (e) => {
      onMetadataChange(fieldName, e.target.value);
    };

    if (fieldType === 'textarea') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </label>
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={`${label}...`}
            className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
            rows="3"
          />
        </div>
      );
    }

    if (fieldType === 'select') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </label>
          <select
            value={value}
            onChange={handleChange}
            className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white focus:border-yellow-400 outline-none transition"
          >
            <option value="">Chwazi...</option>
            <option value="option1">Opsyon 1</option>
            <option value="option2">Opsyon 2</option>
            <option value="option3">Opsyon 3</option>
          </select>
        </div>
      );
    }

    if (fieldType === 'checkbox') {
      return (
        <div key={fieldName} className="flex items-center">
          <input
            type="checkbox"
            id={fieldName}
            checked={value === true}
            onChange={(e) => onMetadataChange(fieldName, e.target.checked)}
            className="w-4 h-4 accent-yellow-400"
          />
          <label htmlFor={fieldName} className="ml-2 text-sm text-gray-300">
            {label}
          </label>
        </div>
      );
    }

    if (fieldType === 'number') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </label>
          <input
            type="number"
            value={value}
            onChange={handleChange}
            placeholder={label}
            className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
          />
        </div>
      );
    }

    if (fieldType === 'url') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </label>
          <input
            type="url"
            value={value}
            onChange={handleChange}
            placeholder={`https://example.com`}
            className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
          />
        </div>
      );
    }

    if (fieldType === 'location') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1 text-gray-300">
            {label} {isRequired && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder="Vil, Depatman"
            className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
          />
        </div>
      );
    }

    return (
      <div key={fieldName}>
        <label className="block text-sm font-medium mb-1 text-gray-300">
          {label} {isRequired && <span className="text-red-400">*</span>}
        </label>
        <input
          type={fieldType}
          value={value}
          onChange={handleChange}
          placeholder={label}
          className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
        />
      </div>
    );
  }, [fieldTypes, metadata, onMetadataChange]);

  const allFieldsFilled = requiredFields.every(field => metadata[field]);

  return (
    <div className="w-full space-y-6">
      {requiredFields.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-yellow-400 mb-3">Jaden Obligatwa</h3>
          <div className="space-y-4">
            {requiredFields.map(field => renderField(field, true))}
          </div>
        </div>
      )}

      {optionalFields.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-3">Jaden Opsyonèl</h3>
          <div className="space-y-4">
            {optionalFields.map(field => renderField(field, false))}
          </div>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!allFieldsFilled || loading}
        className={`w-full p-4 rounded font-bold transition ${
          allFieldsFilled && !loading
            ? 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95'
            : 'bg-gray-500 text-gray-300 cursor-not-allowed'
        }`}
      >
        {loading ? 'Y ap kreye kont...' : 'Kreye Kont'}
      </button>

      {!allFieldsFilled && (
        <p className="text-xs text-center text-gray-400">
          Tanpri ranpli tout jaden obligatwa yo
        </p>
      )}
    </div>
  );
}

export default memo(Step4_ProfessionalDetails);
