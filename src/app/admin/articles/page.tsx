"use client";
import { useEffect, useState } from 'react';

type Source = { id: string; name: string };
type Article = { id: string; title: string; canonicalUrl: string; publishedAt?: string; status: string; sourceId: string; source: Source };

export default function AdminArticlesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [items, setItems] = useState<Article[]>([]);
  const [q, setQ] = useState('');
  const [sourceId, setSourceId] = useState('');

  useEffect(() => { (async () => { const s = await fetch('/api/sources').then(r=>r.json()); setSources(s); })(); }, []);
  useEffect(() => { load(); }, [q, sourceId]);

  async function load() {
    const sp = new URLSearchParams({ limit: '100', offset: '0' });
    if (q) sp.set('q', q);
    if (sourceId) sp.set('sourceId', sourceId);
    const data = await fetch(`/api/articles?${sp}`).then(r=>r.json());
    setItems(data.items);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} className="px-2 py-1 border rounded" />
        <select value={sourceId} onChange={(e)=>setSourceId(e.target.value)} className="px-2 py-1 border rounded">
          <option value="">All</option>
          {sources.map(s=> <option value={s.id} key={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Published</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2"><a href={a.canonicalUrl} target="_blank" rel="noreferrer">{a.title}</a></td>
                <td className="px-3 py-2">{a.source?.name}</td>
                <td className="px-3 py-2">{a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ''}</td>
                <td className="px-3 py-2">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
