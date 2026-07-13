import React from 'react';

export default function Step4_Confirm({ formData, loading, onSubmit }) {
  return (
    <div className="w-full flex flex-col items-center gap-6 pt-8 pb-8">
      {/* Big checkmark */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(250,204,21,0.15)',
        border: '2px solid rgba(250,204,21,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36,
      }}>✅</div>

      <div className="text-center">
        <p className="text-xl font-black text-white">{formData.fullName || 'Ou prèt!'}</p>
        <p className="text-sm text-slate-400 mt-1">
          {formData.professionLabel || formData.profession || formData.role}
        </p>
        {formData.city && (
          <p className="text-xs text-slate-500 mt-1">📍 {formData.city}</p>
        )}
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="rounded-2xl p-4" style={{ background: '#0d1526', border: '1px solid #1F2937' }}>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Email</span>
            <span className="text-white font-bold">{formData.email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background: loading ? '#334155' : 'linear-gradient(to right, #f59e0b, #facc15)',
            color: loading ? '#94a3b8' : '#020617',
            fontWeight: 900,
            fontSize: '16px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '⏳ Ap kreye kont...' : '🚀 Kreye Kont Mwen'}
        </button>
      </div>
    </div>
  );
}