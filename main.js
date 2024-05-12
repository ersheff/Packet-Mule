import { handlePhone } from "./pm-phone.js";
import { handleMax } from "./pm-max.js";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const phone = params.get("phone");
  const max = params.get("max");
  const pass = params.get("pass");

  if (!window.max && !phone) {
    document.body.innerHTML = `<h1 style="text-align: center;">Whatchoo doin'?</h1>`;
    return;
  }

  const socket = io({ auth: { token: pass } });

  socket.on("auth", (response) => {
    if (!response.success) {
      document.body.innerHTML = `<h1 style="text-align: center;">What's the password?</h1>`;
      return;
    }

    if (!window.max) {
      handlePhone(socket, phone);
      return;
    }

    document.body.innerHTML =
      /* HTML */
      `<dialog>
        <form method="dialog">
          <input type="text" id="username-input" placeholder="enter username" />
        </form>
      </dialog>`;
    handleMax(socket, max);
  });
});
