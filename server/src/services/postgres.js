const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');

module.exports = function postgresStore(TEMPLATES) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, max: 10, idleTimeoutMillis: 30000, statement_timeout: 10000, idle_in_transaction_session_timeout: 10000 });
  pool.on('error', () => console.error('PostgreSQL idle connection failed'));
  const userColumns = 'id, username, email, password_hash AS password, created_at AS "createdAt"';
  const projectColumns = 'id, revision, name, user_id AS "userId", template, created_at AS "createdAt", updated_at AS "updatedAt"';
  const fileColumns = 'project_id AS "projectId", path, content, updated_at AS "updatedAt"';
  const one = async (sql, values) => (await pool.query(sql, values)).rows[0] || null;
  return {
    TEMPLATES,
    async initialize() {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(73491021)');
        await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
        const applied = await client.query('SELECT version FROM schema_migrations WHERE version=1');
        if (!applied.rowCount) {
          await client.query(fs.readFileSync(path.join(__dirname, '../../schema.sql'), 'utf8'));
          await client.query('INSERT INTO schema_migrations(version) VALUES(1)');
        }
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
    close: () => pool.end(),
    health: () => pool.query('SELECT 1'),
    createUser: ({ username, email, password }) => one(`INSERT INTO users(username,email,password_hash) VALUES($1,$2,$3) RETURNING ${userColumns}`, [username,email,password]),
    getUserByEmail: email => one(`SELECT ${userColumns} FROM users WHERE email=$1`, [email]),
    getUser: id => one(`SELECT ${userColumns} FROM users WHERE id=$1`, [id]),
    getProject: id => one(`SELECT ${projectColumns} FROM projects WHERE id=$1`, [id]),
    getProjectsByUser: async id => (await pool.query(`SELECT ${projectColumns} FROM projects WHERE user_id=$1 ORDER BY created_at`, [id])).rows,
    async createProject({ name, userId, template, files }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows: [project] } = await client.query(`INSERT INTO projects(name,user_id,template) VALUES($1,$2,$3) RETURNING ${projectColumns}`, [name,userId,template]);
        for (const [filePath, content] of Object.entries(files || TEMPLATES[template] || {})) {
          await client.query('INSERT INTO files(project_id,path,content) VALUES($1,$2,$3)', [project.id,filePath,content]);
        }
        await client.query('COMMIT');
        return project;
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
    async readSnapshot(id) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const { rows: [project] } = await client.query(`SELECT ${projectColumns} FROM projects WHERE id=$1`, [id]);
        const { rows: files } = await client.query(`SELECT ${fileColumns} FROM files WHERE project_id=$1 ORDER BY path`, [id]);
        await client.query('COMMIT');
        return project ? { project, files: Object.fromEntries(files.map(f => [f.path, f.content])) } : null;
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
    async replaceSnapshot(id, userId, revision, name, files) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows: [project] } = await client.query(`UPDATE projects SET name=$4, revision=revision+1, updated_at=NOW() WHERE id=$1 AND user_id=$2 AND revision=$3 RETURNING ${projectColumns}`, [id,userId,revision,name]);
        if (!project) { await client.query('ROLLBACK'); return null; }
        await client.query('DELETE FROM files WHERE project_id=$1', [id]);
        for (const [filePath, content] of Object.entries(files)) await client.query('INSERT INTO files(project_id,path,content) VALUES($1,$2,$3)', [id,filePath,content]);
        await client.query('COMMIT');
        return project;
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
    deleteProject: id => pool.query('DELETE FROM projects WHERE id=$1', [id]),
    async upsertFile(projectId, filePath, content) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE projects SET updated_at=NOW(), revision=revision+1 WHERE id=$1', [projectId]);
        const { rows: [file] } = await client.query(`INSERT INTO files(project_id,path,content) VALUES($1,$2,$3) ON CONFLICT(project_id,path) DO UPDATE SET content=EXCLUDED.content,updated_at=NOW() RETURNING ${fileColumns}`, [projectId,filePath,content]);
        await client.query('COMMIT');
        return file;
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
    getFilesByProject: async id => (await pool.query(`SELECT ${fileColumns} FROM files WHERE project_id=$1 ORDER BY path`, [id])).rows,
    getFile: (id,filePath) => one(`SELECT ${fileColumns} FROM files WHERE project_id=$1 AND path=$2`, [id,filePath]),
    async deleteFile(id, filePath) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE projects SET revision=revision+1,updated_at=NOW() WHERE id=$1', [id]);
        await client.query('DELETE FROM files WHERE project_id=$1 AND path=$2', [id,filePath]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    }
  };
};
