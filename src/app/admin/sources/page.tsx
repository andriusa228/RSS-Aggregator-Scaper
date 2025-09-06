"use client";
import { useEffect, useState } from 'react';
import { RunAllButton } from '@/components/RunAllButton';

type Category = { id: string; name: string; slug: string };
type Source = { id: string; name: string; url: string; type: 'RSS'|'HTML'|'AUTO'; enabled: boolean; rules?: any; categories?: Category[] };

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [form, setForm] = useState<Partial<Source>>({ type: 'AUTO', enabled: true });
  const [adminToken, setAdminToken] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');

  async function load() {
    const res = await fetch('/api/sources');
    setSources(await res.json());
  }
  async function loadCategories() {
    const res = await fetch('/api/categories');
    setCategories(await res.json());
  }
  useEffect(() => { load(); loadCategories(); }, []);

  async function save() {
    const res = await fetch('/api/sources', { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ ...form, rules: form.rules ? JSON.parse(String(form.rules)) : undefined }) });
    if (res.ok) { setForm({ type: 'AUTO', enabled: true }); load(); }
  }
  async function update(src: Source) {
    const res = await fetch('/api/sources', { method: 'PUT', headers: { Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(src) });
    if (res.ok) load();
  }
  async function remove(id: string) {
    const res = await fetch(`/api/sources?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
    if (res.ok) load();
  }
  async function testFetch(src: Source) {
    const res = await fetch('/api/test-fetch', { method: 'POST', body: JSON.stringify({ url: src.url, rules: src.rules }) });
    const data = await res.json();
    alert(`Found ${data.count} items`);
  }
  async function runNow(id?: string) {
    const url = id ? `/api/ingest/${id}` : '/api/ingest';
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
    if (res.ok) alert('Triggered');
  }

  async function runByCategory() {
    const sp = new URLSearchParams();
    if (selectedCategorySlug) sp.set('categorySlug', selectedCategorySlug);
    const res = await fetch(`/api/ingest?${sp.toString()}`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
    const data = await res.json();
    if (res.ok) alert(`ok: ${JSON.stringify(data)}`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Admin Token */}
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Admin Token</label>
            <input 
              value={adminToken} 
              onChange={(e)=>setAdminToken(e.target.value)} 
              className="px-2 py-1 rounded border" 
              placeholder="paste ADMIN_TOKEN" 
            />
          </div>
        </div>

        {/* Run All Controls */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-3">Bulk Operations</h3>
          <div className="space-y-3">
            {/* New Run All Button */}
            <div>
              <label className="text-sm font-medium text-gray-700">Run All Sources</label>
              <div className="mt-1">
                <RunAllButton 
                  adminToken={adminToken}
                  className="mb-2"
                />
              </div>
            </div>

            {/* Legacy buttons */}
            <div className="flex items-end gap-2">
              <button onClick={()=>runNow()} className="px-3 py-1 border rounded text-sm">Legacy: Run All Now</button>
              <div className="flex items-end gap-2">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">Category</label>
                  <select 
                    value={selectedCategorySlug} 
                    onChange={(e)=>setSelectedCategorySlug(e.target.value)} 
                    className="px-2 py-1 rounded border"
                  >
                    <option value="">All</option>
                    {categories.map(c=> <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={runByCategory} className="px-3 py-1 border rounded text-sm">Run by Category</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border rounded space-y-2">
        <h2 className="font-semibold">Add Source</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <input placeholder="Name" value={form.name||''} onChange={(e)=>setForm({...form,name:e.target.value})} className="px-2 py-1 border rounded" />
          <input placeholder="URL" value={form.url||''} onChange={(e)=>setForm({...form,url:e.target.value})} className="px-2 py-1 border rounded" />
          <select value={form.type as any} onChange={(e)=>setForm({...form,type:e.target.value as any})} className="px-2 py-1 border rounded">
            <option value="AUTO">AUTO</option>
            <option value="RSS">RSS</option>
            <option value="HTML">HTML</option>
          </select>
          <select value={String(form.enabled)} onChange={(e)=>setForm({...form,enabled:e.target.value==='true'})} className="px-2 py-1 border rounded">
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
          <input placeholder='Rules JSON' value={form.rules as any || ''} onChange={(e)=>setForm({...form,rules:e.target.value})} className="px-2 py-1 border rounded" />
          <select multiple value={(form.categories||[]).map(c=>c.slug)} onChange={(e)=>{
            const selected = Array.from(e.target.selectedOptions).map(o=>o.value);
            setForm({...form, categories: categories.filter(c=>selected.includes(c.slug))});
          }} className="px-2 py-1 border rounded min-h-[40px]">
            {categories.map(c=> <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={save} className="px-3 py-1 border rounded">Save</button>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">URL</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Enabled</th>
              <th className="px-3 py-2 text-left">Categories</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2 truncate max-w-[300px]"><a href={s.url} target="_blank" rel="noreferrer">{s.url}</a></td>
                <td className="px-3 py-2">{s.type}</td>
                <td className="px-3 py-2">{s.enabled ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(s.categories||[]).map(c=> <span key={c.id} className="px-2 py-0.5 border rounded text-xs">{c.name}</span>)}
                  </div>
                </td>
                <td className="px-3 py-2 space-x-2">
                  <button onClick={()=>update({...s, enabled: !s.enabled})} className="px-2 py-1 border rounded">Toggle</button>
                  <button onClick={()=>runNow(s.id)} className="px-2 py-1 border rounded">Run</button>
                  <button onClick={()=>testFetch(s)} className="px-2 py-1 border rounded">Test fetch</button>
                  <button onClick={()=>remove(s.id)} className="px-2 py-1 border rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
