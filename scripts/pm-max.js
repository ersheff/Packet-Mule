export function setupMax(socket, max) {
  usernameMethod(socket, max);

  socket.on("username", (response) => {
    if (response.success) {
      setupInterface(socket, response.username);
      setupListeners(socket);
      setupEmitter(socket);
    } else {
      const usernameInput = document.querySelector("#username-input");
      usernameInput.value = "";
      usernameInput.placeholder = "try another username";
      document.querySelector("#username-modal").showModal();
    }
  });
}

//

function usernameMethod(socket, max) {
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    socket.emit("username", document.querySelector("#username-input").value);
  });

  if (!max) {
    document.querySelector("#username-modal").showModal();
  } else socket.emit("username", max);
}

//

function setupInterface(socket, username) {
  document.querySelector("#chat-input").addEventListener("change", (e) => {
    socket.emit("chat", e.target.value);
    e.target.value = "";
  });

  document.querySelector("#userlist-button").addEventListener("click", () => {
    document.querySelector("#userlist-modal").showModal();
  });

  document.querySelector("#roomlist-button").addEventListener("click", () => {
    document.querySelector("#roomlist-modal").showModal();
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (e) => {
      if (e.target.nodeName !== "INPUT") {
        dialog.close();
      }
    });
  });
}

//

function setupListeners(socket) {
  socket.on("chat", (incoming) => {
    const chatOutput = document.querySelector("#chat-output");
    chatOutput.innerHTML += incoming;
    chatOutput.scrollTop = chatOutput.scrollHeight;
  });

  socket.on("pm", (incoming) => {
    for (const packet of incoming) {
      const msg = [packet.source, packet.header, ...packet.data];
      window.max.outlet(...msg);
    }
  });

  socket.on("phone", (incoming) => {
    const msg = ["phone", ...incoming];
    window.max.outlet(...msg);
  });

  socket.on("userlist", (incoming) => {
    document.querySelector("#userlist-modal").innerHTML = incoming;
  });

  socket.on("roomlist", (incoming) => {
    document.querySelector("#roomlist-modal").innerHTML = incoming;
    document.querySelector("#room-input").addEventListener("change", (e) => {
      socket.emit("join-room", e.target.value);
      e.target.value = "";
    });
    document.querySelectorAll("input[type='checkbox']").forEach((check) => {
      check.addEventListener("click", (e) => {
        e.preventDefault();
        if (e.target.checked) {
          socket.emit("join-room", e.target.value);
        } else socket.emit("leave-room", e.target.value);
      });
    });
  });
}

//

function setupEmitter(socket) {
  let payload = {};

  window.max.bindInlet("pm", function () {
    const args = Array.from(arguments);
    const [target, header, ...data] = args;
    const key = `${target}/${header}`;
    const packet = { target, header, data };
    payload[key] = packet;
  });

  setInterval(() => {
    if (Object.keys(payload).length > 0) {
      const outgoing = Object.values(payload);
      socket.emit("pm", outgoing);
      payload = {};
    }
  }, 50);
}
