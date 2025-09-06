"use client";
import { useEffect, useState } from 'react';
import { RunAllButton } from '@/components/RunAllButton';

type DashboardStats = {
  totalArticles: number;
  totalSources: number;
  recentIngests: Array<{
    id: string;
    sourceId: string;
    sourceName: string;
    status: string;
    itemsFound: number;
    itemsCreated: number;
    duration: number;
    createdAt: string;
    errorMessage?: string;
  }>;
  topSources: Array<{
    sourceId: string;
    sourceName: string;
    articleCount: number;
  }>;
  queueStats: {
    ingest: any;
    ingestAll: any;
  };
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminToken, setAdminToken] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [dashboardRes, queueRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/queue/stats', {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      ]);
      
      const dashboardData = await dashboardRes.json();
      const queueData = adminToken ? await queueRes.json() : { ingest: {}, ingestAll: {} };
      
      setStats({ ...dashboardData, queueStats: queueData });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="p-4 text-red-600">Failed to load dashboard data</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <input 
            value={adminToken} 
            onChange={(e) => setAdminToken(e.target.value)} 
            className="px-2 py-1 border rounded text-sm" 
            placeholder="Admin Token" 
          />
          <button 
            onClick={loadStats} 
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <RunAllButton adminToken={adminToken} />
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">Total Articles</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalArticles.toLocaleString()}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">Active Sources</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalSources}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">Queue Jobs</h3>
          <p className="text-3xl font-bold text-purple-600">
            {(stats.queueStats.ingest.waiting || 0) + (stats.queueStats.ingestAll.waiting || 0)}
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">Recent Ingestions</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.recentIngests.length}</p>
        </div>
      </div>

      {/* Queue Stats */}
      {adminToken && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Ingest Queue</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Waiting:</span>
                <span className="font-mono">{stats.queueStats.ingest.waiting || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Active:</span>
                <span className="font-mono">{stats.queueStats.ingest.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-mono">{stats.queueStats.ingest.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-mono text-red-600">{stats.queueStats.ingest.failed || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Ingest-All Queue</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Waiting:</span>
                <span className="font-mono">{stats.queueStats.ingestAll.waiting || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Active:</span>
                <span className="font-mono">{stats.queueStats.ingestAll.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-mono">{stats.queueStats.ingestAll.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-mono text-red-600">{stats.queueStats.ingestAll.failed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Ingestions */}
      <div className="border rounded-lg">
        <h2 className="text-xl font-semibold p-4 border-b">Recent Ingestions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Found</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentIngests.map((ingest) => (
                <tr key={ingest.id} className="border-t">
                  <td className="px-4 py-2">{ingest.sourceName}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      ingest.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      ingest.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ingest.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{ingest.itemsFound}</td>
                  <td className="px-4 py-2">{ingest.itemsCreated}</td>
                  <td className="px-4 py-2">{ingest.duration}ms</td>
                  <td className="px-4 py-2">
                    {new Date(ingest.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Sources */}
      <div className="border rounded-lg">
        <h2 className="text-xl font-semibold p-4 border-b">Top Sources by Article Count</h2>
        <div className="p-4">
          <div className="space-y-2">
            {stats.topSources.map((source, index) => (
              <div key={source.sourceId} className="flex justify-between items-center">
                <span className="font-medium">{index + 1}. {source.sourceName}</span>
                <span className="text-blue-600 font-semibold">{source.articleCount} articles</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
