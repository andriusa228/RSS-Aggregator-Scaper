"use client";
import { useEffect, useState } from 'react';

interface IngestStatus {
  jobId: string;
  total: number;
  processed: number;
  successes: number;
  failures: { sourceId: string; error: string }[];
  done: boolean;
  canceled?: boolean;
  startedAt: string;
  updatedAt: string;
}

interface IngestProgressProps {
  jobId: string;
  onClose: () => void;
  adminToken: string;
}

export function IngestProgress({ jobId, onClose, adminToken }: IngestProgressProps) {
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFailures, setShowFailures] = useState(false);

  useEffect(() => {
    let alive = true;
    
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/ingest/status?jobId=${jobId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        if (!alive) return;
        
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          setError(null);
          
          // Continue polling if not done
          if (!data.done) {
            setTimeout(pollStatus, 1200);
          }
        } else if (res.status === 404) {
          setError('Job not found or expired');
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.error || `HTTP ${res.status}`);
          // Retry on error
          setTimeout(pollStatus, 2000);
        }
      } catch (e: any) {
        if (alive) {
          setError(e.message || 'Failed to fetch status');
          setTimeout(pollStatus, 2000);
        }
      }
    };

    // Start polling
    pollStatus();

    return () => {
      alive = false;
    };
  }, [jobId, adminToken]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-100"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">Loading status…</div>
      </div>
    );
  }

  const progress = status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;
  const duration = new Date(status.updatedAt).getTime() - new Date(status.startedAt).getTime();
  const durationMinutes = Math.round(duration / 60000);

  return (
    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-blue-800 font-medium">
          {status.canceled ? 'Ingestion Canceled' : 
           status.done ? 'Ingestion Complete' : 'Ingestion Running'}
        </h3>
        {status.done && (
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded hover:bg-blue-100"
          >
            Close
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">
            Processing {status.processed}/{status.total} sources ({progress}%)
          </span>
          <span className="text-blue-600">
            {durationMinutes > 0 ? `${durationMinutes}m` : '<1m'}
          </span>
        </div>
        <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-green-600 font-semibold">{status.successes}</div>
          <div className="text-gray-600">Success</div>
        </div>
        <div className="text-center">
          <div className="text-red-600 font-semibold">{status.failures.length}</div>
          <div className="text-gray-600">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-blue-600 font-semibold">{status.processed}</div>
          <div className="text-gray-600">Processed</div>
        </div>
      </div>

      {/* Failures */}
      {status.failures.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowFailures(!showFailures)}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            {showFailures ? 'Hide' : 'Show'} {status.failures.length} failure{status.failures.length !== 1 ? 's' : ''}
          </button>
          
          {showFailures && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {status.failures.map((failure, index) => (
                <div key={index} className="text-xs bg-red-100 p-2 rounded border">
                  <div className="font-medium text-red-800">
                    Source: {failure.sourceId}
                  </div>
                  <div className="text-red-600">
                    {failure.error}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {status.done && (
        <div className="pt-2 border-t border-blue-200">
          <div className="text-sm text-blue-700">
            <strong>Summary:</strong> {status.successes} sources processed successfully, 
            {status.failures.length > 0 && ` ${status.failures.length} failed`}
          </div>
        </div>
      )}
    </div>
  );
}
