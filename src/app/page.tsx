"use client";
import { useEffect, useMemo, useRef, useState } from 'react';

type Source = { id: string; name: string };
type Article = { id: string; title: string; canonicalUrl: string; publishedAt?: string; status: string; source: Source };
type Category = { id: string; name: string; slug: string };

export default function HomePage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [items, setItems] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [views, setViews] = useState<{ id: string; name: string; filter: any }[]>([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySlug, setCategorySlug] = useState('');
  const limit = 50;
  const selectedRowRef = useRef<number>(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadSources() {
    const res = await fetch('/api/sources');
    setSources(await res.json());
  }
  async function loadCategories() {
    const res = await fetch('/api/categories');
    setCategories(await res.json());
  }
  async function load() {
    const sp = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (q) sp.set('q', q);
    if (sourceId) sp.set('sourceId', sourceId);
    if (status) sp.set('status', status);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    if (categorySlug) sp.set('categorySlug', categorySlug);
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/articles?${sp.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSources();
    loadCategories();
    (async ()=>{ const res = await fetch('/api/views'); const v = await res.json(); setViews(v.map((x:any)=>({ ...x, filter: x.filter ? JSON.parse(x.filter) : {} }))); })();
    // Initialize from URL once
    const usp = new URLSearchParams(window.location.search);
    const initQ = usp.get('q') || '';
    const initSourceId = usp.get('sourceId') || '';
    const initStatus = usp.get('status') || '';
    const initFrom = usp.get('from') || '';
    const initTo = usp.get('to') || '';
    const initCategory = usp.get('categorySlug') || '';
    if (initQ) setQ(initQ);
    if (initSourceId) setSourceId(initSourceId);
    if (initStatus) setStatus(initStatus);
    if (initFrom) setFrom(initFrom);
    if (initTo) setTo(initTo);
    if (initCategory) setCategorySlug(initCategory);
  }, []);

  // Debounce q changes, and keep URL in sync without feedback loops
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const usp = new URLSearchParams(window.location.search);
      const prevQ = usp.get('q') || '';
      if ((q || '') !== prevQ) {
        if (q) usp.set('q', q); else usp.delete('q');
        const next = `${window.location.pathname}?${usp.toString()}`.replace(/\?$/, '');
        window.history.replaceState(null, '', next);
      }
      load();
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, offset]);

  // Immediate reload for non-debounced filters
  useEffect(() => { load(); }, [sourceId, status, from, to, categorySlug]);

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        const el = document.getElementById('search');
        (el as HTMLInputElement)?.focus();
      }
      const maxIndex = items.length - 1;
      if (e.key === 'j') selectedRowRef.current = Math.min(maxIndex, selectedRowRef.current + 1);
      if (e.key === 'k') selectedRowRef.current = Math.max(0, selectedRowRef.current - 1);
      const current = items[selectedRowRef.current];
      if (!current) return;
      if (e.key === 'o') window.open(current.canonicalUrl, '_blank');
      if (e.key === 's') updateStatus(current.id, 'SAVED');
      if (e.key === 'p') updateStatus(current.id, 'PINNED');
      if (e.key === 'u') updateStatus(current.id, 'UNREAD');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/articles/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    // Optimistic local update to avoid extra fetch
    setItems(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Saved Views</label>
          <select onChange={(e)=>{
            const v = views.find(v=>v.id===e.target.value);
            if (!v) return;
            const f = v.filter||{};
            setQ(f.q||''); setSourceId(f.sources?.[0]||''); setStatus(f.status||'');
            const h = Number(f.fromHours||0);
            setFrom(h ? new Date(Date.now() - h*3600*1000).toISOString().slice(0,16) : '');
            setTo(''); setOffset(0);
          }} className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-900">
            <option value="">Select view</option>
            {views.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Search</label>
          <input id="search" value={q} onChange={(e) => { setOffset(0); setQ(e.target.value); }} className="input input-bordered px-2 py-1 rounded border border-gray-300 bg-white text-gray-900" placeholder="/ to focus" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Source</label>
          <select value={sourceId} onChange={(e) => { setOffset(0); setSourceId(e.target.value); }} className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-900">
            <option value="">All</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Category</label>
          <select value={categorySlug} onChange={(e)=>{ setOffset(0); setCategorySlug(e.target.value); const usp = new URLSearchParams(window.location.search); if (e.target.value) usp.set('categorySlug', e.target.value); else usp.delete('categorySlug'); window.history.replaceState(null,'',`${window.location.pathname}?${usp.toString()}`.replace(/\?$/, '')); }} className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-900">
            <option value="">All</option>
            {categories.map(c=> <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Status</label>
          <select value={status} onChange={(e) => { setOffset(0); setStatus(e.target.value); }} className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-900">
            <option value="">Any</option>
            <option>UNREAD</option>
            <option>SAVED</option>
            <option>READ</option>
            <option>PINNED</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">From</label>
          <input type="datetime-local" value={from} onChange={(e) => { setOffset(0); setFrom(e.target.value); }} className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-900" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">To</label>
          <input type="datetime-local" value={to} onChange={(e) => { setOffset(0); setTo(e.target.value); }} className="px-2 py-1 rounded border border-gray-300 bg-white text-gray-900" />
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Published</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a, idx) => (
              <tr key={a.id} className={"border-t border-gray-100 " + (idx === selectedRowRef.current ? 'bg-yellow-50' : '')}>
                <td className="px-3 py-2"><a href={a.canonicalUrl} target="_blank" rel="noreferrer">{a.title}</a></td>
                <td className="px-3 py-2">{a.source?.name}</td>
                <td className="px-3 py-2">{a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ''}</td>
                <td className="px-3 py-2">{a.status}</td>
                <td className="px-3 py-2 space-x-2">
                  <button className="px-2 py-1 border rounded" onClick={() => window.open(a.canonicalUrl, '_blank')}>Open</button>
                  <button className="px-2 py-1 border rounded" onClick={() => navigator.clipboard.writeText(a.canonicalUrl)}>Copy URL</button>
                  <button className="px-2 py-1 border rounded" onClick={() => updateStatus(a.id, 'SAVED')}>Save</button>
                  <button className="px-2 py-1 border rounded" onClick={() => updateStatus(a.id, 'PINNED')}>Pin</button>
                  <button className="px-2 py-1 border rounded" onClick={() => updateStatus(a.id, 'READ')}>Read</button>
                  <button className="px-2 py-1 border rounded" onClick={() => updateStatus(a.id, 'UNREAD')}>Unread</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button disabled={offset===0} className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => setOffset(Math.max(0, offset - limit))}>Prev</button>
        <span className="text-sm text-gray-600">Page {Math.floor(offset/limit)+1} / {totalPages}</span>
        <button disabled={offset+limit >= total} className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => setOffset(offset + limit)}>Next</button>
        {isLoading && <span className="text-xs text-gray-500">Loading…</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
