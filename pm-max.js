export function handleMax(socket, max) {
  usernameMethod(socket, max);

  socket.on("username", (response) => {
    if (response.success) {
      setupInterface(socket, response.username);
      setupListeners(socket);
      setupEmitter(socket);
      return;
    }

    document.getElementById("username-input").value = "";
    document.getElementById("username-input").placeholder =
      "try another username";
    document.querySelector("dialog").showModal();
  });
}

//

function usernameMethod(socket, max) {
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    socket.emit("username", document.getElementById("username-input").value);
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

  document.getElementById("chat-input").addEventListener("change", (e) => {
    window.max.outlet("chat", e.target.value);
    socket.emit("chat", e.target.value);
    e.target.value = "";
  });
}

//

function setupListeners(socket) {
  socket.on("chat", (incoming) => {
    const chatOutput = document.getElementById("chat-output");
    chatOutput.innerHTML += incoming;
    chatOutput.scrollTop = chatOutput.scrollHeight;
  });

  socket.on("pm", (incoming) => {
    const msg = [incoming.sender, ...incoming.data];
    window.max.outlet(...msg);
  });

  socket.on("phone", (incoming) => {
    const msg = ["phone", ...incoming];
    window.max.outlet(...msg);
  });
}

//

function setupEmitter(socket) {
  let args, lastArgs;

  window.max.bindInlet("pm", function () {
    args = Array.from(arguments);
  });

  setInterval(() => {
    if (JSON.stringify(args) !== JSON.stringify(lastArgs)) {
      lastArgs = Array.from(args);
      const target = args[0];
      const outgoing = {
        target: target,
        data: args.slice(1),
      };
      socket.emit("pm", outgoing);
    }
  }, 50);
}
