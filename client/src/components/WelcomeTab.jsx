import React from 'react';
import { ArrowUpRight, ArrowRight, Code2, FileCode2, Box, Hexagon, Braces, Terminal, Sparkles, Command, FolderOpen } from 'lucide-react';
const templates = [
  {id:'html',name:'Web essentials',detail:'HTML, CSS & JavaScript',icon:FileCode2,color:'sand'},
  {id:'react',name:'React',detail:'Components, made simple',icon:Braces,color:'blue'},
  {id:'nextjs',name:'Next.js',detail:'Your next full-stack idea',icon:Box,color:'ink'},
  {id:'node',name:'Node.js',detail:'Build something server-side',icon:Hexagon,color:'green'},
  {id:'python',name:'Python',detail:'Scripts with possibilities',icon:Terminal,color:'lavender'},
  {id:'blank',name:'Blank canvas',detail:'Start with a clean slate',icon:Code2,color:'gray'},
];
export default function WelcomeTab({onNewProject,onContinue,projectName}) {
 return <main className="studio-home">
   <div className="home-topline"><span><span className="live-dot"/> YOUR PERSONAL WORKSPACE</span><span className="home-edition">MAKE SOMETHING GOOD.</span></div>
   <section className="home-hero">
     <div className="hero-copy"><span className="eyebrow">FROM A LITTLE IDEA</span><h1>Good things<br/>start <em>here.</em></h1><p>A quiet place to write code, try things out, and bring your next idea to life. Everything you need, right in your browser.</p><button className="hero-action" onClick={onContinue || (()=>onNewProject('html'))}>{onContinue ? 'Back to your workspace' : 'Start building'}<ArrowRight size={17}/></button></div>
     <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-label"><Sparkles size={14}/> ROOM TO EXPERIMENT</div><div className="code-postcard"><div className="postcard-top"><span/><span/><span/><small>your-next-idea.js</small></div><div className="postcard-code"><span className="code-muted">// A small beginning.</span><br/><span className="code-purple">const</span> idea = {'{'}<br/>&nbsp; curiosity: <span className="code-green">true</span>,<br/>&nbsp; possibilities: <span className="code-gold">'endless'</span><br/>{'}'};<br/><br/><span className="code-green">build</span>(idea);<span className="art-cursor"/></div></div><div className="art-badge"><Code2 size={18}/><span>Less setup.<br/><strong>More making.</strong></span></div></div>
   </section>
   {onContinue && <button className="resume-card" onClick={onContinue}><span className="resume-icon"><FolderOpen size={22}/></span><span><small>CONTINUE EXPLORING</small><strong>{projectName || 'Your workspace'}</strong></span><span className="resume-meta">Your local files are right where you left them</span><ArrowUpRight size={20}/></button>}
   <section className="template-section"><div className="section-heading"><div><span className="eyebrow">A HEAD START</span><h2>What will you make?</h2></div><span>Choose a starting point</span></div><div className="template-grid">{templates.map(({id,name,detail,icon:Icon,color})=><button key={id} className="template-card" onClick={()=>onNewProject(id)}><span className={`template-symbol ${color}`}><Icon size={23}/></span><ArrowUpRight className="template-arrow" size={17}/><strong>{name}</strong><span>{detail}</span></button>)}</div></section>
   <footer className="home-footer"><span><Command size={14}/> A few shortcuts to keep you in flow</span><span>Quick open <kbd>Ctrl P</kbd></span><span>Save file <kbd>Ctrl S</kbd></span><span>Run <kbd>Ctrl ↵</kbd></span></footer>
 </main>;
}
