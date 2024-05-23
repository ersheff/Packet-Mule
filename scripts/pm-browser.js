export default {
  setup,
  usernameMethod,
  handleUsername,
  handleChat,
  handlePm,
  handlePhone,
  handleUserlist,
  handleRoomlist
};

function setup(socket) {
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    socket.emit("username", document.querySelector("#username-input").value);
  });
  document.querySelector("#username-modal").showModal();
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
  if (!window.max) {
    document.querySelectorAll(".list-modals").forEach((dialog) => {
      dialog.querySelector("button").addEventListener("click", (e) => {
        dialog.close();
      });
    });
  }
  document.querySelector("#room-input").addEventListener("change", (e) => {
    socket.emit("join-room", e.target.value);
    e.target.value = "";
  });
  window.addEventListener("beforeunload", () => {
    socket.emit("purge-user", true);
  });
}

function usernameMethod(socket, username) {
  if (username) {
    socket.emit("username", username);
  }
}

function handleUsername(response) {
  if (response.success) {
    document.querySelector("#username-modal").close();
    document.querySelector(
      "#chat-input"
    ).placeholder = `chat: ${response.username}`;
  } else {
    const usernameInput = document.querySelector("#username-input");
    usernameInput.value = "";
    usernameInput.placeholder = "try another username";
  }
}

function handleChat(incoming) {
  const chatOutput = document.querySelector("#chat-output");
  chatOutput.innerHTML += incoming;
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function handlePm(incoming) {
  for (const packet of incoming) {
    const msg = [packet.source, packet.header, ...packet.data];
    if (window.max) {
      window.max.outlet(...msg);
    } else {
      document.querySelector("#max-monitor").innerText = msg;
    }
  }
}

function handlePhone(incoming) {
  const msg = ["phone", ...incoming];
  if (window.max) {
    window.max.outlet(...msg);
  } else document.querySelector("#phone-monitor").innerText = msg;
}

function handleUserlist(incoming) {
  document.querySelector("#userlist-container").innerHTML = incoming;
}

function handleRoomlist(socket, incoming) {
  document.querySelector("#roomlist-container").innerHTML = incoming;
  document.querySelectorAll("input[type='checkbox']").forEach((check) => {
    check.addEventListener("click", (e) => {
      e.preventDefault();
      if (e.target.checked) {
        socket.emit("join-room", e.target.value);
      } else socket.emit("leave-room", e.target.value);
    });
  });
}
