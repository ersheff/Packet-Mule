const { Server } = require("socket.io");

const io = new Server(3000, { /* options */ });

io.on("connection", (socket) => {
  console.log("hi, there!")
});