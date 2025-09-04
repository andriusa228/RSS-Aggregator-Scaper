"use client";
import { useEffect, useState } from 'react';

type Source = { id: string; name: string; url: string; type: 'RSS'|'HTML'|'AUTO'; enabled: boolean; rules?: any };

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [form, setForm] = useState<Partial<Source>>({ type: 'AUTO', enabled: true });
  const [adminToken, setAdminToken] = useState('');

  async function load() {
    const res = await fetch('/api/sources');
    setSources(await res.json());
  }
  useEffect(() => { load(); }, []);

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

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Admin Token</label>
          <input value={adminToken} onChange={(e)=>setAdminToken(e.target.value)} className="px-2 py-1 rounded border" placeholder="paste ADMIN_TOKEN" />
        </div>
        <button onClick={()=>runNow()} className="px-3 py-1 border rounded">Run All Now</button>
      </div>

      <div className="p-3 border rounded space-y-2">
        <h2 className="font-semibold">Add Source</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
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
