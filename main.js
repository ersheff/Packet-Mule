import { setupBrowser } from "./scripts/pm-browser.js";
import { setupMax } from "./scripts/pm-max.js";
import { setupPhone } from "./scripts/pm-phone.js";

const params = new URLSearchParams(window.location.search);
const phone = params.get("phone");
const max = params.get("max");
const pass = params.get("pass");

const socket = io({ auth: { token: pass } });

socket.on("connect", () => {
  socket.once("auth", async (response) => {
    if (!response.success) {
      document.body.innerHTML = await fetchHTML("auth-error.html");
      return;
    }
    if (!socket.recovered) {
      if (window.max) {
        document.body.innerHTML = await fetchHTML("max.html");
        setupMax(socket, max);
      } else if (phone) {
        document.body.innerHTML = await fetchHTML("phone.html");
        setupPhone(socket, phone);
      } else {
        document.body.innerHTML = await fetchHTML("browser.html");
        setupBrowser(socket, browser);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("disconnected");
    console.log(socket);
    // socket.removeAllListeners();
    //socket.once("connect", handleConnect);
  });

  setTimeout(() => {
    socket.io.engine.close();
  }, 5000);
});

async function fetchHTML(path) {
  const response = await fetch(path);
  return await response.text();
}
