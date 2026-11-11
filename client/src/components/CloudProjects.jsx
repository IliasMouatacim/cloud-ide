import React, { useEffect, useRef, useState } from 'react';
import { useCloudSync } from '../hooks/useCloudSync';
import { Cloud, ArrowUpRight, FolderOpen, X, Trash2, Search, Plus } from 'lucide-react';
const API = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`;

export default function CloudProjects({ token, user, workspace, onSignIn }) {
  const sync = useCloudSync(token, workspace);
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const dialog = useRef(null);
  const generation = useRef(0);
  useEffect(() => { generation.current++; setProjects([]); setMessage(''); setOpen(false); }, [token]);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  async function request(path, method = 'GET', body) {
    const response = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed. Try again.');
    return data;
  }
  async function run(action) {
    const current = generation.current;
    setBusy(true); setMessage('');
    try { await action(() => current === generation.current); }
    catch (error) { if (current === generation.current) setMessage(error.message); }
    finally { setBusy(false); }
  }
  const refresh = () => run(async valid => { const data = await request('/projects'); if(valid()) setProjects(data); });
  function browse() { if (!token) return onSignIn(); setOpen(true); refresh(); }
  function save() {
    if (!token) return onSignIn();
    run(async valid => {
      const files = workspace.files;
      const project = await request('/projects/snapshot', 'POST', { name: workspace.projectName, files });
      if(valid()) { sync.attach(project, files); setMessage('Cloud copy created. Autosave is on.'); }
    });
  }
  return <>
    <div className="workspace-bar">
      <div className="flex items-center gap-3"><span className="workspace-mark"><Cloud size={19}/></span><div><strong>Workspace</strong><span className="workspace-subtitle">{user ? `Your creative space, ${user.username}` : 'A little space for your next big idea'}</span></div></div>
      <div className="flex items-center gap-2"><span className="workspace-feedback" role="status">{sync.error || message || sync.status}</span><span className="sync-status" role="status">{sync.status}</span>{sync.error && <button onClick={sync.retry}>Retry sync</button>}<button onClick={browse} disabled={busy}><FolderOpen size={15}/> My projects</button><button className="workspace-primary" onClick={save} disabled={busy}><Plus size={15}/>{busy ? 'Working…' : 'Save cloud copy'}</button></div>
    </div>
    <dialog ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} className="project-dialog">
      <header><div><span className="project-eyebrow">YOUR WORKSPACE</span><h2>Pick up where you left off.</h2><p>Saved projects, ready for your next idea.</p></div><button aria-label="Close projects" onClick={() => setOpen(false)}><X size={20}/></button></header>
      <label className="project-search"><Search size={18}/><input autoFocus aria-label="Search projects" placeholder="Find a project…" value={query} onChange={e => setQuery(e.target.value)}/></label>
      <div role="status" className="project-feedback">{message || (busy ? 'Loading…' : `${projects.length} saved projects`)}</div>
      <div className="project-grid">{projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map(project => <article key={project.id}>
        <FolderOpen size={25} className="text-ide-accent"/><h3>{project.name}</h3><p>Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
        <div className="flex justify-between"><button disabled={busy} onClick={() => {
          if (!window.confirm('Open this project? Your current workspace will be replaced. Save a cloud copy first if you need it.')) return;
          run(async valid => { const snapshot = await request(`/projects/${project.id}/snapshot`); if(valid()) { workspace.replaceWorkspace(snapshot.files, snapshot.project.name); sync.attach(snapshot.project, snapshot.files, workspace.workspaceEpoch + 1); setMessage(''); setOpen(false); } });
        }}>Open project <ArrowUpRight size={15}/></button><button aria-label={`Delete ${project.name}`} disabled={busy} onClick={() => {
          if (!window.confirm(`Delete “${project.name}” and its files permanently?`)) return;
          run(async valid => { await request(`/projects/${project.id}`, 'DELETE'); if(valid()) { sync.detach(project.id); setProjects(list => list.filter(p => p.id !== project.id)); } });
        }}><Trash2 size={15}/></button></div>
      </article>)}</div>
      {!busy && projects.length === 0 && <div className="project-empty"><Cloud size={32}/><h3>Your ideas belong here.</h3><p>Close this panel and choose “Save cloud copy” to keep your current workspace.</p></div>}
      {!busy && projects.length > 0 && !projects.some(p => p.name.toLowerCase().includes(query.toLowerCase())) && <p className="project-empty">No projects match your search.</p>}
    </dialog>
  </>;
}
