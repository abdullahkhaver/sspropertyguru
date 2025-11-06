import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
import './src/models/district.model.js';
import './src/models/area.model.js';
import './src/models/franchise.model.js';
import { Server } from 'socket.io';
import http from 'http';
dotenv.config({
  path: './.env',
  quiet: true
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

let onlineAgents = new Map();

// When an agent connects
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('registerAgent', (agentId) => {
    onlineAgents.set(agentId, socket.id);
  });

  // When agent disconnects
  socket.on('disconnect', () => {
    for (let [id, sid] of onlineAgents.entries()) {
      if (sid === socket.id) {
        onlineAgents.delete(id);
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

connectDB()
.then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
});

export { io, server };
