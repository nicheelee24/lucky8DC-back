let io = null;

const initSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: "*", // allow requests from the frontend
      methods: ["GET", "POST"], // allow these HTTP methods
      credentials: true
    }
  });
  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIo };