import pmBrowser from "./scripts/pm-browser.js";
import pmMax from "./scripts/pm-max.js";
import pmPhone from "./scripts/pm-phone.js";
import { phoneCheck } from "./scripts/pm-phone-check.js";

const params = new URLSearchParams(window.location.search);
const username = params.get("user");
const pass = params.get("pass");
let phone = params.has("phone");
const phoneUser = params.get("phone");

const mobile = isMobile();

const socket = io({ auth: { token: pass } });

socket.on("auth", async (response) => {
  if (!response.success) {
    document.body.innerHTML = await fetchHTML("./pages/auth-error.html");
    return;
  }
  if (!socket.recovered) {
    if (mobile && !phone) {
      document.body.innerHTML = await fetchHTML("./pages/phone-check.html");
      phone = await phoneCheck();
    }
    if (phone) {
      document.body.innerHTML = await fetchHTML("./pages/phone.html");
      pmPhone.usernameMethod(socket, phoneUser);
    } else {
      document.body.innerHTML = await fetchHTML("./pages/browser.html");
      pmBrowser.setup(socket);
      pmBrowser.usernameMethod(socket, username);
      if (window.max) {
        pmMax.setup(socket);
      }
    }
    addListeners(socket, phone);
  }
});

function addListeners(socket, phone) {
  // browser and max handlers
  if (!phone) {
    socket.on("username", (response) => pmBrowser.handleUsername(response));
    socket.on("chat", (incoming) => pmBrowser.handleChat(incoming));
    socket.on("pm", (incoming) => pmBrowser.handlePm(incoming));
    socket.on("phone", (incoming) => pmBrowser.handlePhone(incoming));
    socket.on("userlist", (incoming) => pmBrowser.handleUserlist(incoming));
    socket.on("roomlist", (incoming) =>
      pmBrowser.handleRoomlist(socket, incoming)
    );
  } else {
    socket.on("phone-user", async (response) => {
      const phoneConfirm = await pmPhone.handlePhoneUser(response);
      if (phoneConfirm) {
        pmPhone.setup(socket);
      }
    });
  }
}

async function fetchHTML(path) {
  const response = await fetch(path);
  return await response.text();
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// simulate disconnect for recovery testing
// socket.on("connect", () => {
//   setTimeout(() => {
//     socket.io.engine.close();
//   }, 5000);
//   console.log(socket.recovered);
// });
