export default {
  setup,
  auth,
  chat,
  pm,
  phone,
  userlist,
  roomlist,
  roomError
};

let currentUsername;

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
    document.querySelector("#room-input").placeholder = "create group";
    document.querySelector("#room-input").focus();
  });
  document.querySelectorAll(".list-modals").forEach((dialog) => {
    dialog.addEventListener("click", (e) => {
      if (e.target.nodeName !== "INPUT") {
        dialog.close();
        document.querySelector("#chat-input").focus();
      }
    });
  });
  document.querySelector("#room-input").addEventListener("change", (e) => {
    socket.emit("join-room", e.target.value);
    e.target.value = "";
    e.target.placeholder = "create group";
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
    document.querySelector("#chat-input").focus();
    currentUsername = username;
    return;
  }
  if (username) {
    chatInput.placeholder = `Chat: ${username}`;
    if (!manual) {
      usernameInput.hidden = true;
    } else usernameInput.disabled = true;
  } else if (manual) {
    usernameInput.value = "";
    usernameInput.placeholder = "username not available";
  }

  if (password) {
    if (!manual) {
      passwordInput.hidden = true;
    } else passwordInput.disabled = true;
  } else if (manual) {
    passwordInput.value = "";
    passwordInput.placeholder = "incorrect password";
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

function phone(incoming) {
  const msg = ["phone", ...incoming];
  if (window.max) {
    window.max.outlet(...msg);
  } else {
    const accelGyro = incoming
      .slice(0, 6)
      .map((value) => value.toFixed(2).toString().substring(0, 4));
    const sliders = incoming.slice(6);
    const phoneArray = [...accelGyro, ...sliders];
    document.querySelector("#phone-monitor").innerHTML =
      phoneArray.join("&nbsp;&nbsp;&nbsp;");
  }
}

function userlist(incoming) {
  let userlist = `<p>Connected users: ${incoming.length}</p><ul>`;
  incoming.forEach((user) => {
    if (user === currentUsername) {
      userlist += `<li><strong>${user} (you)</strong></li>`;
    } else userlist += `<li>${user}</li>`;
  });
  userlist += "</ul>";
  // document.querySelector("#userlist-output").innerHTML = incoming;
  document.querySelector("#userlist-output").innerHTML = userlist;
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

function roomError() {
  const roomInput = document.querySelector("#room-input");
  roomInput.value = "";
  roomInput.placeholder = "not a valid group name";
}
