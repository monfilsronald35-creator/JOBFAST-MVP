import React from 'react';

export class StepErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[StepErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-center">
          <p className="text-sm font-bold text-red-300">Yon erè pase nan etap sa a.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {this.state.error?.message ?? 'Unknown error'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 rounded-xl bg-slate-700 px-4 py-2 text-[11px] text-white hover:bg-slate-600"
          >
            Eseye ankò
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default StepErrorBoundary;