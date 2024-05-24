export default {
  usernameMethod,
  handleUsername,
  setup,
  handleChat,
  handlePm,
  handlePhone,
  handleUserlist,
  handleRoomlist
};

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
  window.addEventListener("beforeunload", () => {
    socket.emit("purge-user", true);
  });
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
      const maxHtml = "<div>Max monitor:</div>";
      msg.forEach((value) => {
        maxHtml += `<div>${value}</div>`;
      });
      document.querySelector("#max-monitor").innerHtml = maxHtml;
    }
  }
}

function handlePhone(incoming) {
  const msg = ["phone", ...incoming];
  if (window.max) {
    window.max.outlet(...msg);
  } else {
    const phoneHtml = "<div>Phone monitor:</div>";
    msg.forEach((value) => {
      phoneHtml += `<div>${Number(value).toFixed(2)}</div>`;
    });
    document.querySelector("#phone-monitor").innerHTML = phoneHtml;
  }
}

function handleUserlist(incoming) {
  document.querySelector("#userlist-output").innerHTML = incoming;
}

function handleRoomlist(socket, incoming) {
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
