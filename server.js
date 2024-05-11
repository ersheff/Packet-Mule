import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
app.use(express.static("./"));
const server = createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Listening on port ${port}.`));

const users = {};

io.on("connection", (socket) => {
  // set username
  socket.on("username", (username) => {
    if (users[username]) {
      socket.emit("username", { success: false });
      return;
    }
    socket.emit("username", { success: true });
    users[username] = socket.id;
    socket.data.username = username;
  });

  // handle data from max
  socket.on("pm", (incoming) => {
    const target = users[incoming.target];
    if (!target && incoming.target !== "all") {
      return console.log("Target not found");
    }
    const outgoing = {
      sender: socket.data.username,
      data: incoming.data,
    };
    incoming.target === "all"
      ? socket.broadcast.emit("pm", outgoing)
      : socket.to(target).emit("pm", outgoing);
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
  });
});
