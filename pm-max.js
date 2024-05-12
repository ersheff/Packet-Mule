export function handleMax(socket, max) {
  socket.on("auth", (response) => {
    if (!response.success) {
      document.body.innerHTML = `<h1 style="text-align: center;">What's the password?</h1>`;
      return;
    }
  });

  usernameMethod(socket, max);

  socket.on("username", (response) => {
    if (response.success) {
      setupInterface(socket, response.username);
      setupListeners(socket);
      setupEmitter(socket);
      return;
    }

    const usernameInput = document.querySelector("#username-input");
    usernameInput.value = "";
    usernameInput.placeholder = "try another username";

    document.querySelector("dialog").showModal();
  });
}

//

function usernameMethod(socket, max) {
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    socket.emit("username", document.querySelector("#username-input").value);
  });

  if (!max) {
    document.querySelector("dialog").showModal();
    return;
  }

  socket.emit("username", max);
}

//

function setupInterface(socket, username) {
  document.querySelector("dialog").close();

  document.body.innerHTML = `
    <div class="max-window">
      <div id="chat-output"></div>
      <input type="text" id="chat-input" placeholder="chat: ${username}">
    </div>`;

  document.querySelector("#chat-input").addEventListener("change", (e) => {
    window.max.outlet("chat", e.target.value);
    socket.emit("chat", e.target.value);
    e.target.value = "";
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
      const msg = [packet.sender, packet.header, ...packet.data];
      window.max.outlet(...msg);
    }
  });

  socket.on("phone", (incoming) => {
    const msg = ["phone", ...incoming];
    window.max.outlet(...msg);
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
