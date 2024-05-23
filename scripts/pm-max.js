export default {
  setup
};

function setup(socket) {
  let payload = {};
  window.max.bindInlet("pm", function () {
    const args = Array.from(arguments);
    const [target, header, ...data] = args;
    const key = `${target}/${header}`;
    const packet = { target, header, data };
    payload[key] = packet;
  });
  setInterval(() => {
    if (Object.keys(payload).length > 0) {
      const outgoing = Object.values(payload);
      socket.emit("pm", outgoing);
      payload = {};
    }
  }, 50);
  document.querySelectorAll(".list-modals").forEach((dialog) => {
    dialog.addEventListener("click", (e) => {
      if (e.target.nodeName !== "INPUT") {
        dialog.close();
      }
    });
  });
}
