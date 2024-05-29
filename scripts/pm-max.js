export default {
  setup
};

function setup(socket) {
  document.querySelector(".browser-header").style.display = "none";
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
}
