import React, { useRef, useEffect, useMemo, useState } from 'react';

export default function LivePreview({ files, activeFile, devServerPort }) {
  const iframeRef = useRef(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const previewUrl = useMemo(() => {
    if (!devServerPort) return '';

    if (import.meta.env.VITE_PREVIEW_URL) {
      return import.meta.env.VITE_PREVIEW_URL;
    }

    if (import.meta.env.VITE_PREVIEW_BASE_URL) {
      return `${import.meta.env.VITE_PREVIEW_BASE_URL.replace(/\/$/, '')}:${devServerPort}`;
    }

    return `http://localhost:${devServerPort}`;
  }, [devServerPort]);

  const htmlContent = useMemo(() => {
    if (!files) return '';

    let htmlPath = null;
    let htmlFile = null;

    // 1. If active file is an HTML file, use it directly
    if (activeFile && (activeFile.endsWith('.html') || activeFile.endsWith('.htm'))) {
      if (files[activeFile] !== undefined) {
        htmlPath = activeFile;
        htmlFile = files[activeFile];
      }
    }

    // 2. If active file is in a folder, look for index.html in that same folder
    if (!htmlPath && activeFile) {
      const slashIdx = activeFile.lastIndexOf('/');
      if (slashIdx !== -1) {
        const folder = activeFile.substring(0, slashIdx);
        if (files[`${folder}/index.html`] !== undefined) {
          htmlPath = `${folder}/index.html`;
          htmlFile = files[htmlPath];
        }
      }
    }

    // 3. Fallback to root index.html
    if (!htmlPath) {
      if (files['index.html'] !== undefined) {
        htmlPath = 'index.html';
        htmlFile = files['index.html'];
      } else if (files['index.htm'] !== undefined) {
        htmlPath = 'index.htm';
        htmlFile = files['index.htm'];
      }
    }

    // 4. Any index.html anywhere
    if (!htmlPath) {
      htmlPath = Object.keys(files).find(p => p.endsWith('index.html') || p.endsWith('index.htm'));
      if (htmlPath) {
        htmlFile = files[htmlPath];
      }
    }

    // 5. Any .html file anywhere
    if (!htmlPath) {
      htmlPath = Object.keys(files).find(p => p.endsWith('.html') || p.endsWith('.htm'));
      if (htmlPath) {
        htmlFile = files[htmlPath];
      }
    }

    if (!htmlPath) {
      // No HTML file — check if it's a non-web project
      const hasNextJs = Boolean(files['next.config.mjs'])
        || Boolean(files['next.config.js'])
        || Boolean(files['app/page.jsx'])
        || Boolean(files['app/page.tsx'])
        || (typeof files['package.json'] === 'string' && files['package.json'].includes('"next"'));

      if (files['main.py'] || files['index.js'] || files['main.go'] || hasNextJs) {
        return null; // Not a web project
      }
      return '';
    }

    const basePath = htmlPath && htmlPath.includes('/') ? htmlPath.substring(0, htmlPath.lastIndexOf('/')) : '';

    const resolvePath = (relative) => {
      if (relative.startsWith('http://') || relative.startsWith('https://') || relative.startsWith('//') || relative.startsWith('data:')) {
        return relative;
      }
      if (relative.startsWith('/')) return relative.substring(1);

      const parts = basePath ? basePath.split('/') : [];
      const relParts = relative.split('/');

      for (const p of relParts) {
        if (p === '..') {
          parts.pop();
        } else if (p !== '.' && p !== '') {
          parts.push(p);
        }
      }
      return parts.join('/');
    };

    let html = htmlFile || '';

    // Convert image sources to blob URLs if they reference workspace files
    html = html.replace(
      /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi,
      (_match, src) => {
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) {
          return _match;
        }
        const resolved = resolvePath(src);
        const imgContent = files[resolved]; // Text representation of the image
        if (imgContent !== undefined) {
          // If the file is stored as raw binary text, we need to convert it, but base64 is better.
          // In this IDE, since files are text, images will be corrupted unless they are SVG
          if (resolved.endsWith('.svg')) {
            const svg64 = btoa(unescape(encodeURIComponent(imgContent)));
            return _match.replace(src, `data:image/svg+xml;base64,${svg64}`);
          }
          // Note: Binary images won't work perfectly due to utf-8 text read, but we will pass it 
          // as data URI anyway just in case it was encoded or is SVG.
        }
        return _match;
      }
    );

    // Inline CSS files referenced via <link> tags
    html = html.replace(
      /<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
      (_match, href) => {
        const resolved = resolvePath(href);
        const cssContent = files[resolved];
        if (cssContent !== undefined) {
          return `<style>/* ${resolved} */\n${cssContent}</style>`;
        }
        return _match;
      }
    );

    // Inline JS files referenced via <script> tags
    html = html.replace(
      /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,
      (_match, src) => {
        // Skip external URLs
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
          return _match;
        }
        const resolved = resolvePath(src);
        const jsContent = files[resolved];
        if (jsContent !== undefined) {
          return `<script>/* ${resolved} */\n${jsContent}<\/script>`;
        }
        return _match;
      }
    );

    // Inject error catching
    const errorScript = `<script>
      window.onerror = function(msg, url, line, col, error) {
        parent.postMessage({ type: 'preview-error', message: msg, line: line }, '*');
        return false;
      };
      console.log = (function(orig) {
        return function() {
          parent.postMessage({ type: 'preview-log', args: Array.from(arguments).map(String) }, '*');
          orig.apply(console, arguments);
        };
      })(console.log);
      console.error = (function(orig) {
        return function() {
          parent.postMessage({ type: 'preview-error', message: Array.from(arguments).map(String).join(' ') }, '*');
          orig.apply(console, arguments);
        };
      })(console.error);
    <\/script>`;

    // Insert error script right after <head> or at start
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>' + errorScript);
    } else {
      html = errorScript + html;
    }

    return html;
  }, [files]);

  useEffect(() => {
    const handleMessage = (event) => {
      // Only accept messages from blob: origins (our own preview iframe)
      if (event.origin !== 'null' && event.origin !== window.location.origin && !event.origin.startsWith('blob:')) return;
      const data = event.data;
      if (data?.type === 'preview-error') {
        setError(`Line ${data.line || '?'}: ${data.message}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (htmlContent === null) return; // Not a web project
    if (!iframeRef.current) return;

    setError(null);
    setLastUpdate(new Date());

    const iframe = iframeRef.current;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;

    return () => URL.revokeObjectURL(url);
  }, [htmlContent]);

  if (htmlContent === null && !devServerPort) {
    return (
      <div className="h-full flex flex-col bg-ide-panel">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-ide-border shrink-0">
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ide-textMuted"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            <span className="text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest">Preview</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-ide-textMuted text-sm">
          <div className="text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-ide-textSubtle"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
            <p>Preview not available for this project type yet.</p>
            <p className="text-xs text-ide-textSubtle mt-1">For Next.js run npm install && npm run dev, then set Preview Port to 3000.</p>
            <p className="text-xs text-ide-textSubtle mt-1">For Python, run scripts from the terminal.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-ide-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-ide-border shrink-0">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ide-textMuted"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          <span className="text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest">
            {devServerPort ? `Server: Port ${devServerPort}` : 'Preview'}
          </span>
          {lastUpdate && !devServerPort && (
            <span className="text-[10px] text-ide-textSubtle">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {error && (
            <span className="text-[10px] text-ide-error mr-2 max-w-[200px] truncate flex items-center gap-1" title={error}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" /></svg>
              {error}
            </span>
          )}
          <button
            onClick={() => {
              if (devServerPort) {
                // To force refresh a native iframe, we can toggle the key or just reassign src
                if (iframeRef.current) {
                  const currentSrc = iframeRef.current.src;
                  iframeRef.current.src = 'about:blank';
                  setTimeout(() => { if (iframeRef.current) iframeRef.current.src = currentSrc; }, 10);
                }
              } else if (iframeRef.current) {
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                iframeRef.current.src = url;
                setLastUpdate(new Date());
              }
            }}
            className="text-ide-textMuted hover:text-ide-text p-1 rounded-md hover:bg-ide-bg/50 transition-colors"
            title="Refresh"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
          </button>
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 bg-white">
        {devServerPort ? (
          <iframe
            ref={iframeRef}
            title="Live Server Preview"
            src={previewUrl}
            className="w-full h-full border-0"
          />
        ) : (
          <iframe
            ref={iframeRef}
            title="Live Preview"
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
}
