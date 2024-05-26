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

server.listen(port, () => console.log(`Listening on port ${port}.`));

const users = {};
const buffers = {};

io.on("connection", (socket) => {
  if (socket.recovered && socket.data.reconnectTimeout) {
    console.log(`${socket.data.username} recovered!`);
    clearTimeout(socket.data.reconnectTimeout);
    socket.data.reconnectTimeout = null;
  } else {
    const { username, password, isPhone } = socket.handshake.auth;

    socket.on("ready", async () => {
      if (username || password) {
        try {
          const response = await auth(
            socket,
            username,
            password,
            isPhone,
            false
          );
          socket.emit("auth", response);
          if (!isPhone) {
            updateUsers();
            updateRooms(socket);
          }
        } catch (error) {
          socket.emit("auth", error.response);
        }
      }
    });

    socket.on("auth", async (incoming) => {
      const { username, password, isPhone } = incoming;
      if (username || password) {
        try {
          const response = await auth(
            socket,
            username,
            password,
            isPhone,
            true
          );
          socket.emit("auth", response);
          if (!isPhone) {
            updateUsers();
            updateRooms(socket);
          }
        } catch (error) {
          socket.emit("auth", error.response);
        }
      }
    });
  }

  socket.on("chat", (incoming) => handleChat(socket, incoming));
  socket.on("pm", (incoming) => handlePm(socket, incoming));
  socket.on("phone-data", (incoming) => handlePhone(socket, incoming));
  socket.on("join-room", (room) => joinRoom(socket, room));
  socket.on("leave-room", (room) => leaveRoom(socket, room));
  socket.on("disconnect", (reason) => handleDisconnect(socket, reason));
  socket.on("purge", () => (socket.data.purge = true));
});

setInterval(() => {
  for (const target in buffers) {
    if (buffers[target].length > 0) {
      io.to(target).emit("pm", buffers[target]);
      buffers[target] = [];
    }
  }
}, 50);

// connection and auth

async function auth(socket, username, password, isPhone, manual) {
  const response = {
    username: socket.data.username || socket.data.phoneTargetId,
    password: socket.data.password,
    isPhone,
    manual
  };
  if (isPhone) {
    if (username && !response.username && users[username]) {
      response.username = username;
      socket.data.phoneTargetId = users[username];
      const phoneTargetSocket = io.sockets.sockets.get(users[username]);
      phoneTargetSocket.data.phoneSourceId = socket.id;
    }
  } else {
    if (username && !response.username && !users[username]) {
      response.username = username;
      users[username] = socket.id;
      socket.data.username = username;
    }
  }
  if (password && !response.password) {
    try {
      if (process.env.HASHED_PWD) {
        response.password = await bcrypt.compare(
          password,
          process.env.HASHED_PWD
        );
        socket.data.password = response.password;
      } else {
        response.password = password === process.env.PLAIN_PWD;
        socket.data.password = response.password;
      }
    } catch (error) {}
  }
  if (response.username && response.password) {
    return response;
  }
  const error = new Error();
  error.response = response;
  throw error;
}

function handleDisconnect(socket, reason) {
  if (!socket.data.username && !socket.data.phoneTargetId) return;
  console.log(`${socket.id} disconnected due to ${reason}`);
  if (socket.data.purge) {
    if (socket.data.username) {
      console.log(
        `${socket.data.username}'s browser was refreshed, purging data.`
      );
    }
    if (socket.data.phoneTargetId) {
      console.log(
        `${socket.data.phoneTargetId}'s phone was refreshed, purging data.`
      );
    }
    clearData(socket);
  } else {
    socket.data.reconnectTimeout = setTimeout(() => {
      clearData(socket);
    }, disconnectTimeout - 1000);
  }
}

function clearData(socket) {
  const { username, phoneSourceId, phoneTargetId } = socket.data;
  const $rooms = Array.from(socket.rooms).filter((room) =>
    room.startsWith("$")
  );
  let lastIn$room = false;
  for (const $room of $rooms) {
    if (io.sockets.adapter.rooms.get($room).size === 1) {
      lastIn$room = true;
      break;
    }
  }
  if (lastIn$room) updateRoomsAll();
  socket.data = {};
  socket.rooms.clear();
  if (users[username]) {
    delete users[username];
    delete buffers[socket.id];
    console.log(`${username}'s user data deleted.`);
    updateUsers();
  }
  if (phoneSourceId) {
    const phoneSourceSocket = io.sockets.sockets.get(phoneSourceId);
    if (phoneSourceSocket) {
      phoneSourceSocket.emit("phone-refresh");
      console.log(`${username}'s phone being refreshed.`);
      delete phoneSourceSocket.data.phoneTargetId;
      console.log(`${username}'s phone data deleted.`);
    }
  }
  if (phoneTargetId) {
    const phoneTargetSocket = io.sockets.sockets.get(phoneTargetId);
    if (phoneTargetSocket) {
      delete phoneTargetSocket.data.phoneSourceId;
      console.log(`${phoneTargetId}'s phone data deleted.`);
    }
  }
}

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
  const target = socket.data.phoneTargetId;
  if (target) {
    socket.to(target).emit("phone-data", incoming);
  }
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
