import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";

const app = express();
app.use(express.static("./"));
const server = createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
const password = process.env.PM_PWD;
const hashedPassword = bcrypt.hashSync(password, 10);

server.listen(port, () => console.log(`Listening on port ${port}.`));

const users = {};
const buffers = {};

io.on("connection", (socket) => {
  const token = socket.handshake.auth.token;
  if (!token || !bcrypt.compareSync(token, hashedPassword)) {
    socket.emit("auth", { success: false });
    socket.disconnect();
    return;
  }
  socket.emit("auth", { success: true });

  // set username
  socket.on("username", (username) => {
    if (users[username]) {
      socket.emit("username", { success: false });
      return;
    }
    socket.data.username = username;
    users[socket.data.username] = socket.id;
    socket.data.username = username;
    socket.emit("username", { success: true, username: socket.data.username });
  });

  // handle data from max
  socket.on("pm", (incoming) => {
    for (const packet of incoming) {
      const target = users[packet.target];
      if (!target && packet.target !== "all") {
        return console.log("Target not found");
      }
      const outgoing = {
        sender: socket.data.username,
        header: packet.header,
        data: packet.data
      };
      if (packet.target === "all") {
        socket.broadcast.emit("pm", [outgoing]);
      } else {
        buffers[target] = buffers[target] || [];
        buffers[target].push(outgoing);
      }
    }
  });

  // handle data from phone
  socket.on("phone", (incoming) => {
    const target = users[incoming.target];
    socket.to(target).emit("phone", incoming.data);
  });

  socket.on("chat", (incoming) => {
    const outgoing = `<p>${socket.data.username}: ${incoming}</p>`;
    io.emit("chat", outgoing);
  });

  socket.on("disconnect", () => {
    delete users[socket.data.username];
    delete buffers[socket.id];
  });
});

setInterval(() => {
  for (const user in buffers) {
    if (buffers[user].length > 0) {
      io.to(user).emit("pm", buffers[user]);
      buffers[user] = [];
    }
  }
}, 50);
