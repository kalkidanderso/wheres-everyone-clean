const WebSocket = require('ws');

// Configuration
const WS_PORT = process.env.WS_PORT || 8084;
const HEARTBEAT_TIMEOUT = 120000; // 2 minutes - more lenient for React Native

// Create a new WebSocket server instance
const wss = new WebSocket.Server({ port: WS_PORT });

// Store connected clients and their data
const clients = new Map();

// Broadcast to all connected clients
function broadcast(message, sender) {
  const messageStr = JSON.stringify(message);
  const promises = [];
  
  clients.forEach((client, id) => {
    if (client.ws.readyState === WebSocket.OPEN && (!sender || id !== sender)) {
      promises.push(
        new Promise((resolve) => {
          try {
            client.ws.send(messageStr, (err) => {
              if (err) {
                console.error(`Error broadcasting to client ${id}:`, err);
              }
              resolve();
            });
          } catch (error) {
            console.error(`Error broadcasting to client ${id}:`, error);
            resolve();
          }
        })
      );
    }
  });

  return Promise.all(promises);
}

// Send existing users to a new client
async function sendExistingUsers(ws, newUserId) {
  const existingUsers = [];
  clients.forEach((client) => {
    if (client.user.id !== newUserId) {
      existingUsers.push(client.user);
    }
  });

  if (existingUsers.length > 0) {
    try {
      await new Promise((resolve, reject) => {
        ws.send(JSON.stringify({
          type: 'existing_users',
          users: existingUsers,
        }), (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      console.error('Error sending existing users:', error);
    }
  }
}

// Clean up inactive users - more lenient timing
async function cleanupInactiveUsers() {
  const now = Date.now();
  const cleanupPromises = [];

  clients.forEach((client, id) => {
    const timeDiff = now - client.lastHeartbeat;
    const connectionAge = now - client.connectionTime;
    
    // Only cleanup if connection is old AND hasn't sent heartbeat
    if (timeDiff > HEARTBEAT_TIMEOUT && connectionAge > 60000) {
      console.log(`Client ${id} timed out after ${timeDiff}ms of inactivity`);
      const message = {
        type: 'leave',
        user: client.user,
      };
      cleanupPromises.push(broadcast(message, id));
      client.ws.terminate();
      clients.delete(id);
    }
  });

  await Promise.all(cleanupPromises);
}

// Start cleanup interval - less frequent
setInterval(cleanupInactiveUsers, 60000); // Check every minute

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const connectionId = Math.random().toString(36).substr(2, 9);
  const connectionTime = Date.now();
  console.log(`New client connected with ID: ${connectionId}`);
  
  let userId = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      const { type, user } = message;
      
      console.log(`Received message from ${connectionId}:`, type);

      switch (type) {
        case 'join':
          userId = user.id;
          const newUser = {
            ...user,
            joinedAt: Date.now(),
            lastUpdated: Date.now(),
            isOnline: true,
          };
          
          clients.set(user.id, {
            ws,
            user: newUser,
            lastHeartbeat: Date.now(),
            connectionTime: connectionTime,
            connectionId: connectionId
          });
          
          console.log(`User joined: ${user.name} (${user.id})`);
          
          // Send existing users to new client and broadcast new user in parallel
          await Promise.all([
            sendExistingUsers(ws, user.id),
            broadcast({
              type: 'join',
              user: newUser,
            }, user.id)
          ]);
          break;

        case 'leave':
          if (clients.has(user.id)) {
            const client = clients.get(user.id);
            await broadcast({
              type: 'leave',
              user: client.user,
            });
            clients.delete(user.id);
            console.log(`User left: ${user.name} (${user.id})`);
          }
          break;

        case 'update':
          if (clients.has(user.id)) {
            const client = clients.get(user.id);
            const updatedUser = {
              ...client.user,
              ...user,
              lastUpdated: Date.now(),
            };
            client.user = updatedUser;
            client.lastHeartbeat = Date.now();
            await broadcast({
              type: 'update',
              user: updatedUser,
            });
          }
          break;

        case 'emoji':
          if (clients.has(user.id)) {
            const client = clients.get(user.id);
            const updatedUser = {
              ...client.user,
              emoji: user.emoji,
              lastUpdated: Date.now(),
            };
            client.user = updatedUser;
            client.lastHeartbeat = Date.now();
            await broadcast({
              type: 'emoji',
              user: updatedUser,
            });
            console.log(`User ${user.name} changed emoji to ${user.emoji}`);
          }
          break;

        case 'heartbeat':
          if (clients.has(user.id)) {
            const client = clients.get(user.id);
            client.lastHeartbeat = Date.now();
            client.user.lastUpdated = Date.now();
          }
          break;
      }
    } catch (error) {
      console.error(`Error handling message from ${connectionId}:`, error);
    }
  });

  ws.on('close', async (code, reason) => {
    console.log(`Connection ${connectionId} closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    if (userId && clients.has(userId)) {
      const client = clients.get(userId);
      await broadcast({
        type: 'leave',
        user: client.user,
      });
      clients.delete(userId);
      console.log(`User disconnected: ${client.user.name} (${userId})`);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error);
    if (userId && clients.has(userId)) {
      clients.delete(userId);
    }
  });
});

console.log(`WebSocket server is running on port ${WS_PORT}`);