import { handlePhone } from "./pm-phone.js";
import { handleMax } from "./pm-max.js";
import { handleTest } from "./pm-test.js";

const params = new URLSearchParams(window.location.search);
const phone = params.get("phone");
const max = params.get("max");
const pass = params.get("pass");

// if (!window.max && !phone) {
//   document.body.innerHTML =
//     /* HTML */
//     `<div style="padding: 1rem; text-align: center;">
//       <h1 style="margin-top: 1rem;">Whatchoo doin'?</h1>
//       <p>
//         To use Packet Mule in Max, load this page in a jweb object with the
//         query string <code>?pass=password</code>.
//       </p>
//       <p>
//         To send controller data from your phone to Max, load this page in a
//         mobile browser with the query string
//         <code>?pass=password?phone=username</code>.
//       </p>
//     </div>`;
//   return;
// }

const socket = io({ auth: { token: pass } });

socket.on("connect", () => {
  if (socket.recovered) {
    console.log("recovered");
  } else {
    handleConnect();
  }
  setTimeout(() => {
    // close the low-level connection and trigger a reconnection
    socket.io.engine.close();
  }, 5000);
});

function handleConnect() {
  authAndHandlers(socket, phone, max);

  socket.once("disconnect", () => {
    console.log("disconnected");
    console.log(socket);
    // socket.removeAllListeners();
    //socket.once("connect", handleConnect);
  });
}

function authAndHandlers(socket, phone, max) {
  socket.once("auth", (response) => {
    if (!response.success) {
      document.body.innerHTML = `<h1 style="text-align: center;">What's the password?</h1>`;
      return;
    }

    if (!window.max) {
      // handlePhone(socket, phone);
      document.body.innerHTML =
        /* HTML */
        `<dialog id="username-modal">
          <form method="dialog">
            <input
              type="text"
              id="username-input"
              placeholder="enter username"
            />
          </form>
        </dialog>`;
      handleTest(socket);
    } else {
      document.body.innerHTML =
        /* HTML */
        `<dialog id="username-modal">
          <form method="dialog">
            <input
              type="text"
              id="username-input"
              placeholder="enter username"
            />
          </form>
        </dialog>`;
      handleMax(socket, max);
    }
  });
}
