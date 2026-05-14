const { WebSocketServer } = require('ws');

let wss = null;
const clients = new Set();

function initWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer });
  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ event: 'connected', data: { message: 'SafeTransit AI real-time feed connected' }, timestamp: new Date().toISOString() }));
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });
  console.log('WebSocket server initialized');
}

function broadcast(event, data) {
  const msg = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  clients.forEach(c => {
    if (c.readyState === 1) {
      try { c.send(msg); } catch { clients.delete(c); }
    }
  });
}

module.exports = { initWebSocket, broadcast };
