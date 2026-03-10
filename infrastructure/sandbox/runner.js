/**
 * Sandboxed code execution runner.
 * Runs user code in isolated subprocess with resource limits.
 */
const http = require('http');
const { execFile } = require('child_process');
const { writeFileSync, unlinkSync, mkdtempSync } = require('fs');
const { join } = require('path');
const os = require('os');

const MAX_EXECUTION_TIME = parseInt(process.env.MAX_EXECUTION_TIME || '30', 10) * 1000;
const MAX_OUTPUT_SIZE = 1024 * 100; // 100 KB

const RUNNERS = {
  javascript: { cmd: 'node', ext: '.js' },
  python: { cmd: 'python3', ext: '.py' },
  bash: { cmd: 'bash', ext: '.sh' },
};

function runCode(language, code) {
  return new Promise((resolve) => {
    const runner = RUNNERS[language];
    if (!runner) {
      return resolve({ error: `Unsupported language: ${language}`, output: '', exitCode: 1 });
    }

    const tmpDir = mkdtempSync(join(os.tmpdir(), 'sandbox-'));
    const filePath = join(tmpDir, `code${runner.ext}`);

    try {
      writeFileSync(filePath, code, 'utf-8');
    } catch (err) {
      return resolve({ error: 'Failed to write code file', output: '', exitCode: 1 });
    }

    const startTime = Date.now();
    const child = execFile(runner.cmd, [filePath], {
      timeout: MAX_EXECUTION_TIME,
      maxBuffer: MAX_OUTPUT_SIZE,
      cwd: tmpDir,
      env: { PATH: process.env.PATH, HOME: tmpDir },
    }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;

      // Clean up
      try { unlinkSync(filePath); } catch {}

      if (error && error.killed) {
        return resolve({
          output: stdout || '',
          error: `Execution timed out after ${MAX_EXECUTION_TIME / 1000}s`,
          exitCode: 124,
          duration,
        });
      }

      resolve({
        output: stdout || '',
        error: stderr || (error ? error.message : ''),
        exitCode: error ? error.code || 1 : 0,
        duration,
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/run') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { language, code } = JSON.parse(body);
        if (!language || !code) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'language and code are required' }));
        }

        const result = await runCode(language, code);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', languages: Object.keys(RUNNERS) }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Sandbox runner listening on port ${PORT}`);
});
