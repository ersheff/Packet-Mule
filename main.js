import pmBrowser from "./scripts/pm-browser.js";
import pmMax from "./scripts/pm-max.js";
import pmPhone from "./scripts/pm-phone.js";
import { phoneCheck } from "./scripts/pm-phone-check.js";

const params = new URLSearchParams(window.location.search);
let isPhone = params.has("phone");
const username = params.get("user") || params.get("phone");
const password = params.get("pass");

const mobile = isMobile();

const socket = io({
  auth: { username, password, isPhone }
});

socket.on("connect", async () => {
  if (!socket.recovered) {
    removeBrowserListeners();
    if (mobile && !isPhone) {
      document.body.innerHTML = await fetchHTML("./pages/phone-check.html");
      isPhone = await phoneCheck();
    }
    if (isPhone) {
      document.body.innerHTML = await fetchHTML("./pages/phone.html");
      pmPhone.setup(socket);
      return;
    }
    document.body.innerHTML = await fetchHTML("./pages/browser.html");
    pmBrowser.setup(socket);
    if (window.max) {
      pmMax.setup(socket);
    }
  }
});

socket.on("auth", async (response) => {
  try {
    if (response.isPhone) {
      await pmPhone.auth(socket, response);
      pmPhone.init(socket);
      socket.once("phone-refresh", async () => {
        document.body.innerHTML = await fetchHTML("./pages/phone-refresh.html");
      });
      console.log("Ready to send phone data.");
    } else {
      removeBrowserListeners();
      await pmBrowser.auth(response);
      addBrowserListeners();
      console.log("Ready to listen as browser/max.");
    }
  } catch (error) {
    console.log(error);
  }
});

function addBrowserListeners() {
  socket.on("chat", (incoming) => pmBrowser.chat(incoming));
  socket.on("pm", (incoming) => pmBrowser.pm(incoming));
  socket.on("phone-data", (incoming) => pmBrowser.phoneData(incoming));
  socket.on("userlist", (incoming) => pmBrowser.userlist(incoming));
  socket.on("roomlist", (incoming) => pmBrowser.roomlist(socket, incoming));
}

function removeBrowserListeners() {
  socket.off("chat");
  socket.off("pm");
  socket.off("phone-data");
  socket.off("userlist");
  socket.off("roomlist");
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
