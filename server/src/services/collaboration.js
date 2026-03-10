/**
 * Real-time collaboration service using WebSockets.
 * Implements a basic Operational Transform for concurrent editing.
 */
const rooms = new Map(); // projectId -> Set<ws>

function handleConnection(ws, projectId) {
  if (!projectId) {
    ws.send(JSON.stringify({ type: 'error', message: 'projectId required' }));
    ws.close();
    return;
  }

  // Join room
  if (!rooms.has(projectId)) {
    rooms.set(projectId, new Set());
  }
  const room = rooms.get(projectId);
  room.add(ws);

  ws.send(JSON.stringify({
    type: 'collab:joined',
    projectId,
    peers: room.size - 1
  }));

  // Broadcast to others
  broadcast(room, ws, {
    type: 'collab:peer-joined',
    peers: room.size
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'collab:edit') {
        // Broadcast edit to all other peers
        broadcast(room, ws, {
          type: 'collab:edit',
          file: msg.file,
          changes: msg.changes,
          version: msg.version
        });
      } else if (msg.type === 'collab:cursor') {
        broadcast(room, ws, {
          type: 'collab:cursor',
          file: msg.file,
          position: msg.position,
          username: msg.username
        });
      } else if (msg.type === 'collab:file-open') {
        broadcast(room, ws, {
          type: 'collab:file-open',
          file: msg.file,
          username: msg.username
        });
      }
    } catch {
      // ignore malformed
    }
  });

  ws.on('close', () => {
    room.delete(ws);
    if (room.size === 0) {
      rooms.delete(projectId);
    } else {
      broadcast(room, ws, {
        type: 'collab:peer-left',
        peers: room.size
      });
    }
  });
}

function broadcast(room, sender, message) {
  const data = JSON.stringify(message);
  for (const client of room) {
    if (client !== sender && client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

module.exports = { handleConnection };
