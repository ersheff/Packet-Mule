import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import bcrypt from "bcrypt";

const app = express();
app.use(express.static("./"));
const server = createServer(app);
const disconnectTimeout = 11000;
const io = new Server(server, {
  connectionStateRecovery: {
    maxDisconnectionDuration: disconnectTimeout,
    skipMiddlewares: true
  }
});

const port = process.env.PORT || 3000;
const password = process.env.PM_PWD;
const hashedPassword = bcrypt.hashSync(password, 10);

server.listen(port, () => console.log(`Listening on port ${port}.`));

const users = {};
const buffers = {};

io.on("connection", (socket) => {
  authentication(socket)
    .then(() => {
      socket.emit("auth", { success: true });
      if (socket.recovered && socket.data.reconnectTimeout) {
        console.log(`${socket.data.username} recovered!`);
        clearTimeout(socket.data.reconnectTimeout);
        socket.data.reconnectTimeout = null;
      } else {
        socket.on("username", (incoming) => handleUsername(socket, incoming));
      }
      socket.on("chat", (incoming) => handleChat(socket, incoming));
      socket.on("pm", (incoming) => handlePm(socket, incoming));
      socket.on("phone", (incoming) => handlePhone(socket, incoming));
      socket.on("join-room", (room) => joinRoom(socket, room));
      socket.on("leave-room", (room) => leaveRoom(socket, room));
      socket.on("disconnect", (reason) => handleDisconnect(socket, reason));
    })
    .catch((error) => {
      console.error(error.message);
    });
});

setInterval(() => {
  for (const target in buffers) {
    if (buffers[target].length > 0) {
      io.to(target).emit("pm", buffers[target]);
      buffers[target] = [];
    }
  }
}, 50);

// data handlers

function handleChat(socket, incoming) {
  const outgoing = `<p>${socket.data.username}: ${incoming}</p>`;
  io.emit("chat", outgoing);
}

function handlePm(socket, incoming) {
  incoming.forEach((packet) => {
    const { target } = packet;
    const userId = users[target];
    const _room = `_${target}`;
    const _roomTarget = io.sockets.adapter.rooms.has(_room);
    if (userId || _roomTarget || target === "all") {
      const outgoing = {
        source: _roomTarget ? target : socket.data.username,
        header: packet.header,
        data: packet.data
      };
      if (target === "all") {
        socket.broadcast.emit("pm", outgoing);
      } else if (_roomTarget) {
        buffers[_room] = buffers[_room] || [];
        buffers[_room].push(outgoing);
      } else {
        buffers[userId] = buffers[userId] || [];
        buffers[userId].push(outgoing);
      }
    } else {
      console.log(`No target found for ${target}.`);
    }
  });
}

function joinRoom(socket, room) {
  const _room = `_${room}`;
  const _roomNew = !io.sockets.adapter.rooms.has(_room);
  socket.join(_room);
  if (_roomNew) {
    updateRoomsAll();
  } else updateRooms(socket);
}

function leaveRoom(socket, room) {
  const _room = `_${room}`;
  socket.leave(_room);
  const _roomEmpty = !io.sockets.adapter.rooms.has(_room);
  if (_roomEmpty) {
    updateRoomsAll();
  } else updateRooms(socket);
}

function handlePhone(socket, incoming) {
  const target = users[incoming.target];
  socket.to(target).emit("phone", incoming.data);
}

// connection handlers

function authentication(socket) {
  return new Promise((resolve, reject) => {
    if (password) {
      const token = socket.handshake.auth.token;
      if (!token || !bcrypt.compareSync(token, hashedPassword)) {
        socket.emit("auth", { success: false });
        handleDisconnect(socket);
        socket.disconnect(true);
        reject(new Error("Authentication failed."));
      } else {
        console.log(`${socket.id} authenticated.`);
        resolve();
      }
    } else resolve();
  });
}

function handleUsername(socket, username) {
  if (users[username]) {
    socket.emit("username", { success: false });
  } else {
    socket.data.username = username;
    users[socket.data.username] = socket.id;
    socket.emit("username", {
      success: true,
      username: socket.data.username
    });
    updateUsers();
    updateRooms(socket);
  }
}

function handleDisconnect(socket, reason) {
  console.log(`${socket.id} disconnected due to ${reason}`);
  socket.data.reconnectTimeout = setTimeout(() => {
    clearData(socket);
  }, disconnectTimeout - 1000);
}

function clearData(socket) {
  const { username } = socket.data;
  if (users[username]) {
    delete users[username];
    delete buffers[socket.id];
    updateUsers();
  }
  const _rooms = Array.from(socket.rooms).filter((room) =>
    room.startsWith("_")
  );
  for (const _room of _rooms) {
    if (io.sockets.adapter.rooms.get(_room).size === 1) {
      socket.rooms.clear();
      updateRoomsAll();
      break;
    }
  }
  socket.data = {};
  console.log(`${username}'s user data deleted.`);
}

// updaters

function updateUsers() {
  const userArray = Object.keys(users);
  let userlist = `<p>Connected users: ${userArray.length}</p><ul>`;
  userArray.forEach((user) => {
    userlist += `<li>${user}</li>`;
  });
  userlist += "</ul>";
  io.emit("userlist", userlist);
}

function updateRooms(socket) {
  const _rooms = Array.from(io.sockets.adapter.rooms.keys()).filter((room) =>
    room.startsWith("_")
  );
  let roomlist = `
        <input type="text" id="room-input" placeholder="create group" />
        <div class="spacer"></div>
        <ul>
    `;
  _rooms.forEach((_room) => {
    const isChecked = socket.rooms.has(_room) ? "checked" : "";
    roomlist +=
      /* HTML */
      ` <li>
        <input type="checkbox" value="${_room.substring(1)}" ${isChecked} />
        <span>${_room.substring(1)}</span>
      </li>`;
  });
  roomlist += "</ul>";
  socket.emit("roomlist", roomlist);
}

function updateRoomsAll() {
  io.of("/").sockets.forEach((socket) => {
    updateRooms(socket);
  });
}
