import React, { useRef, useEffect, useMemo, useState } from 'react';

export default function LivePreview({ files }) {
  const iframeRef = useRef(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const htmlContent = useMemo(() => {
    if (!files) return '';

    // Find the HTML entry point
    const htmlFile = files['index.html'] ?? files['index.htm'] ?? null;
    if (!htmlFile && htmlFile !== '') {
      // No HTML file — check if it's a non-web project
      if (files['main.py'] || files['index.js'] || files['main.go']) {
        return null; // Not a web project
      }
      return '';
    }

    let html = htmlFile || '';

    // Inline CSS files referenced via <link> tags
    html = html.replace(
      /<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi,
      (_match, href) => {
        const cssContent = files[href];
        if (cssContent !== undefined) {
          return `<style>/* ${href} */\n${cssContent}</style>`;
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
        const jsContent = files[src];
        if (jsContent !== undefined) {
          return `<script>/* ${src} */\n${jsContent}<\/script>`;
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

  if (htmlContent === null) {
    return (
      <div className="h-full flex flex-col bg-ide-panel">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-ide-border shrink-0">
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ide-textMuted"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span className="text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest">Preview</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-ide-textMuted text-sm">
          <div className="text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-ide-textSubtle"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            <p>Preview not available for this project type.</p>
            <p className="text-xs text-ide-textSubtle mt-1">Use the terminal to run your code.</p>
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ide-textMuted"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <span className="text-[11px] font-semibold text-ide-textMuted uppercase tracking-widest">Preview</span>
          {lastUpdate && (
            <span className="text-[10px] text-ide-textSubtle">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {error && (
            <span className="text-[10px] text-ide-error mr-2 max-w-[200px] truncate flex items-center gap-1" title={error}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
              {error}
            </span>
          )}
          <button
            onClick={() => {
              if (iframeRef.current) {
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                iframeRef.current.src = url;
                setLastUpdate(new Date());
              }
            }}
            className="text-ide-textMuted hover:text-ide-text p-1 rounded-md hover:bg-ide-bg/50 transition-colors"
            title="Refresh"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          </button>
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 bg-white">
        <iframe
          ref={iframeRef}
          title="Live Preview"
          sandbox="allow-scripts allow-modals"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
