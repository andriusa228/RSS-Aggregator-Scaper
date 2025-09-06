"use client";
import { useState } from 'react';
import { IngestProgress } from './IngestProgress';

interface RunAllButtonProps {
  adminToken: string;
  strategy?: 'AUTO' | 'RSS' | 'HTML';
  categorySlug?: string;
  className?: string;
}

export function RunAllButton({ 
  adminToken, 
  strategy, 
  categorySlug, 
  className = '' 
}: RunAllButtonProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    if (!adminToken) {
      setError('Admin token required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const body: any = {};
      if (strategy) body.strategy = strategy;
      if (categorySlug) body.categorySlug = categorySlug;

      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });

      if (!res.ok && res.status !== 409) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setJobId(data.jobId);
      
    } catch (e: any) {
      setError(e.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJobId(null);
    setError(null);
  };

  if (jobId) {
    return (
      <IngestProgress 
        jobId={jobId} 
        onClose={handleClose}
        adminToken={adminToken}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={onClick}
        disabled={loading || !adminToken}
        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Starting…' : 'Run All'}
      </button>
      {error && (
        <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </span>
      )}
      {!adminToken && (
        <span className="text-sm text-gray-500">
          Enter admin token to enable
        </span>
      )}
    </div>
  );
}
