export default {
  setup,
  auth,
  chat,
  pm,
  phoneData,
  userlist,
  roomlist
};

function setup(socket) {
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const outgoing = {
      username: e.target.username.value,
      password: e.target.password.value
    };
    socket.emit("auth", outgoing);
  });
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
  document.querySelectorAll(".list-modals").forEach((dialog) => {
    dialog.addEventListener("click", (e) => {
      if (e.target.nodeName !== "INPUT") {
        dialog.close();
      }
    });
  });
  document.querySelector("#room-input").addEventListener("change", (e) => {
    socket.emit("join-room", e.target.value);
    e.target.value = "";
  });
  window.addEventListener("pagehide", () => {
    socket.emit("purge");
  });
  window.addEventListener("beforeunload", () => {
    socket.emit("purge");
  });
  document.querySelector("#auth-modal").showModal();
  socket.emit("ready");
}

function auth(response) {
  const { username, password, manual } = response;
  const usernameInput = document.querySelector("#username-input");
  const passwordInput = document.querySelector("#password-input");
  const authModal = document.querySelector("#auth-modal");
  const chatInput = document.querySelector("#chat-input");

  if (username && password) {
    chatInput.placeholder = `Chat: ${username}`;
    authModal.close();
    return;
  }
  if (username) {
    chatInput.placeholder = `Chat: ${username}`;
    if (!manual) {
      usernameInput.hidden = true;
    }
  } else if (manual) {
    usernameInput.value = "";
    usernameInput.placeholder = "try another username";
  }

  if (password) {
    if (!manual) {
      passwordInput.hidden = true;
    }
  } else if (manual) {
    passwordInput.value = "";
    passwordInput.placeholder = "try another password";
  }
  throw "Browser authentication failed";
}

function chat(incoming) {
  const chatOutput = document.querySelector("#chat-output");
  chatOutput.innerHTML += incoming;
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function pm(incoming) {
  for (const packet of incoming) {
    const msg = [packet.source, packet.header, ...packet.data];
    if (window.max) {
      window.max.outlet(...msg);
    } else {
      document.querySelector("#max-monitor").innerText = msg.join(" ");
    }
  }
}

function phoneData(incoming) {
  const msg = ["phone-data", ...incoming];
  if (window.max) {
    window.max.outlet(...msg);
  } else {
    const phoneArray = incoming.map((value) => Number(value).toFixed(2));
    document.querySelector("#phone-monitor").innerText = phoneArray.join(" ");
  }
}

function userlist(incoming) {
  document.querySelector("#userlist-output").innerHTML = incoming;
}

function roomlist(socket, incoming) {
  document.querySelector("#roomlist-output").innerHTML = incoming;
  document.querySelectorAll("input[type='checkbox']").forEach((check) => {
    check.addEventListener("click", (e) => {
      e.preventDefault();
      if (e.target.checked) {
        socket.emit("join-room", e.target.value);
      } else socket.emit("leave-room", e.target.value);
    });
  });
}
