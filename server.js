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
      }
      socket.on("username", (incoming) => handleUsername(socket, incoming));
      socket.on("chat", (incoming) => handleChat(socket, incoming));
      socket.on("pm", (incoming) => handlePm(socket, incoming));
      socket.on("phone", (incoming) => handlePhone(socket, incoming));
      socket.on("join-room", (room) => joinRoom(socket, room));
      socket.on("leave-room", (room) => leaveRoom(socket, room));
    })
    .catch((error) => {
      socket.emit("auth", { success: false });
      handleDisconnect(socket);
      socket.disconnect(true);
      console.error(error.message);
    });
  socket.on("disconnect", (reason) => handleDisconnect(socket, reason));
  socket.on("purge-user", () => handlePurge(socket));
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
    const $room = `$${target}`;
    const $roomTarget = io.sockets.adapter.rooms.has($room);
    if (userId || $roomTarget || target === "all") {
      const outgoing = {
        source: $roomTarget ? target : socket.data.username,
        header: packet.header,
        data: packet.data
      };
      if (target === "all") {
        socket.broadcast.emit("pm", [outgoing]);
      } else if ($roomTarget) {
        buffers[$room] = buffers[$room] || [];
        buffers[$room].push(outgoing);
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
  const $room = `$${room}`;
  const $roomNew = !io.sockets.adapter.rooms.has($room);
  socket.join($room);
  if ($roomNew) {
    updateRoomsAll();
  } else updateRooms(socket);
}

function leaveRoom(socket, room) {
  const $room = `$${room}`;
  socket.leave($room);
  const $roomEmpty = !io.sockets.adapter.rooms.has($room);
  if ($roomEmpty) {
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
  if (!socket.data.username) return;
  console.log(`${socket.id} disconnected due to ${reason}`);
  if (socket.data.purge) {
    console.log(
      `${socket.data.username}'s browser was refreshed, purging data.`
    );
    clearData(socket);
  } else {
    socket.data.reconnectTimeout = setTimeout(() => {
      clearData(socket);
    }, disconnectTimeout - 1000);
  }
}

function handlePurge(socket) {
  socket.data.purge = true;
  const $rooms = Array.from(socket.rooms).filter((room) =>
    room.startsWith("$")
  );
  for (const $room of $rooms) {
    if (io.sockets.adapter.rooms.get($room).size === 1) {
      socket.data.lastIn$room = true;
      break;
    }
  }
}

function clearData(socket) {
  const { username } = socket.data;
  if (users[username]) {
    delete users[username];
    delete buffers[socket.id];
    updateUsers();
  }
  const $rooms = Array.from(socket.rooms).filter((room) =>
    room.startsWith("$")
  );
  for (const $room of $rooms) {
    if (io.sockets.adapter.rooms.get($room).size === 1) {
      socket.data.lastIn$room = true;
      break;
    }
  }
  socket.rooms.clear();
  if (socket.data.lastIn$room) updateRoomsAll();
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
  const $rooms = Array.from(io.sockets.adapter.rooms.keys()).filter((room) =>
    room.startsWith("$")
  );
  let roomlist = `<ul>`;
  $rooms.forEach(($room) => {
    const isChecked = socket.rooms.has($room) ? "checked" : "";
    roomlist +=
      /* HTML */
      ` <li>
        <input type="checkbox" value="${$room.substring(1)}" ${isChecked} />
        <span>${$room.substring(1)}</span>
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
