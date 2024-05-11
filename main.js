import { handlePhone } from "./pm-phone.js";
import { handleMax } from "./pm-max.js";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const phone = params.get("phone");
  const max = params.get("max");

  if (!window.max && !phone) {
    document.body.innerHTML = `<h1>Whatchoo doin'?</h1>`;
    return;
  }

  const socket = io();

  if (!window.max) {
    handlePhone(socket, phone);
    return;
  }

  handleMax(socket, max);
});
