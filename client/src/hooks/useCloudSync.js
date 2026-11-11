import { useEffect, useRef, useState } from 'react';
const API = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`;
export function useCloudSync(token, workspace) {
  const binding = useRef(null);
  const current = useRef(null);
  const lastChange = useRef(Date.now());
  const [status, setStatus] = useState('Local workspace');
  const [error, setError] = useState('');
  const payload = JSON.stringify({ name: workspace.projectName, files: workspace.files });
  current.current = { payload, epoch: workspace.workspaceEpoch };
  useEffect(() => { lastChange.current = Date.now(); }, [payload]);
  useEffect(() => { binding.current = null; setStatus('Local workspace'); setError(''); }, [token]);
  useEffect(() => {
    const tick = async () => {
      const active = binding.current;
      if (!active) return;
      if (active.epoch !== current.current.epoch) { binding.current = null; setStatus('Local workspace'); setError(''); return; }
      if (active.failed || active.saving) return;
      if (active.saved === current.current.payload) { setStatus('All changes saved'); return; }
      setStatus('Unsaved changes');
      if (Date.now() - lastChange.current < 800) return;
      active.saving = true;
      setStatus('Saving…');
      const sent = current.current.payload;
      try {
        const response = await fetch(`${API}/projects/${active.id}/snapshot`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...JSON.parse(sent), revision: active.revision }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not save changes');
        if (binding.current !== active) return;
        active.revision = data.revision;
        active.saved = sent;
        setStatus(sent === current.current.payload ? 'All changes saved' : 'Unsaved changes');
      } catch (e) {
        if (binding.current !== active) return;
        active.failed = true;
        setStatus('Changes not synced');
        setError(e.message);
      } finally { active.saving = false; }
    };
    const timer = setInterval(tick, 250);
    const warn = e => {
      const active = binding.current;
      if (active && active.epoch === current.current.epoch && active.saved !== current.current.payload) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => { clearInterval(timer); window.removeEventListener('beforeunload', warn); };
  }, [token]);
  function attach(project, files, epoch = workspace.workspaceEpoch) {
    binding.current = { id: project.id, revision: project.revision, epoch, saved: JSON.stringify({name:project.name, files}), saving:false, failed:false };
    setError(''); setStatus('All changes saved');
  }
  function detach(id) { if (!id || binding.current?.id === id) { binding.current = null; setError(''); setStatus('Local workspace'); } }
  function retry() { if (binding.current) { binding.current.failed = false; setError(''); setStatus('Retrying…'); } }
  return { attach, detach, retry, status, error };
}
