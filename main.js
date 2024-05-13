import { handlePhone } from "./pm-phone.js";
import { handleMax } from "./pm-max.js";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const phone = params.get("phone");
  const max = params.get("max");
  const pass = params.get("pass");

  if (!window.max && !phone) {
    document.body.innerHTML =
      /* HTML */
      `<div style="padding: 1rem; text-align: center;">
        <h1 style="margin-top: 1rem;">Whatchoo doin'?</h1>
        <p>
          To use Packet Mule in Max, load this page in a jweb object with the
          query string <code>?pass=password</code>.
        </p>
        <p>
          To send controller data from your phone to Max, load this page in a
          mobile browser with the query string
          <code>?pass=password?phone=username</code>.
        </p>
      </div>`;
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
