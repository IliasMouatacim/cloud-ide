import React, { useState, useRef, useEffect } from 'react';

export default function AuthModal({ onLogin, onRegister, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        await onRegister(username, email, password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="auth-dialog" onCancel={onClose} aria-labelledby="auth-title">
    <aside className="auth-story"><span className="auth-wordmark">cloud / ide</span><div><span className="eyebrow">A SPACE THAT'S YOURS</span><h2>Your ideas.<br/>A little more<br/><em>possibility.</em></h2><p>Keep your projects close. Pick up anywhere. Make something you're proud of.</p></div><span className="auth-story-footer">WRITE. EXPLORE. MAKE.</span></aside>
    <div className="auth-form-panel"><button className="auth-close" onClick={onClose} aria-label="Close sign in">×</button><span className="eyebrow">{isLogin ? 'GOOD TO SEE YOU AGAIN' : 'YOUR NEXT CHAPTER'}</span><h2 id="auth-title">{isLogin ? 'Welcome back.' : 'Make yourself at home.'}</h2><p>{isLogin ? 'Sign in to get back to your cloud projects.' : 'Create an account to save and revisit your work.'}</p>
    <form onSubmit={handleSubmit}>
      {!isLogin && <label htmlFor="auth-username">Your name<input id="auth-username" autoComplete="username" required maxLength={80} value={username} onChange={e=>setUsername(e.target.value)} placeholder="Alex Morgan"/></label>}
      <label htmlFor="auth-email">Email address<input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label htmlFor="auth-password">Password<input id="auth-password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={isLogin ? 1 : 8} value={password} onChange={e=>setPassword(e.target.value)} placeholder={isLogin ? 'Your password' : 'At least 8 characters'}/></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="auth-submit" disabled={loading}>{loading ? 'One moment…' : isLogin ? 'Sign in →' : 'Create account →'}</button>
    </form><div className="auth-switch">{isLogin ? 'New around here?' : 'Already have an account?'} <button onClick={()=>{setIsLogin(!isLogin);setError('');}}>{isLogin ? 'Create an account' : 'Sign in'}</button></div></div>
  </dialog>;
}
