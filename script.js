document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const phone = params.get("phone");

  if (!window.max && !phone) {
    document.body.innerHTML = `<h1>Whatchoo doin'?</h1>`;
    return;
  }

  const socket = io();

  if (!window.max) {
    let xyzabg,
      sentXyzabg,
      lastXyzabg = [0, 0, 0, 0, 0, 0];

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      document.body.innerHTML = `<button id="req-perm">Request permission</button>`;
      document.getElementById("req-perm").addEventListener("click", () => {
        DeviceMotionEvent.requestPermission()
          .then((permissionState) => {
            if (permissionState === "granted") {
              window.addEventListener("devicemotion", (event) => {
                const newXyzabg = [
                  event.accelerationIncludingGravity.x,
                  event.accelerationIncludingGravity.y,
                  event.accelerationIncludingGravity.z,
                  event.rotationRate.alpha,
                  event.rotationRate.beta,
                  event.rotationRate.gamma,
                ];
                xyzabg = lastXyzabg.map(
                  (v, i) => v * 0.85 + newXyzabg[i] * 0.15
                );
                lastXyzabg = xyzabg;
                document.body.innerHTML = `
                <p>Accelerometer:</p>
                <p>x: ${xyzabg[0].toFixed(2)}</p>
                <p>x: ${xyzabg[1].toFixed(2)}</p>
                <p>x: ${xyzabg[2].toFixed(2)}</p>
                <p>Gyro:</p>
                <p>alpha: ${xyzabg[3].toFixed(2)}</p>
                <p>beta: ${xyzabg[4].toFixed(2)}</p>
                <p>gamma: ${xyzabg[5].toFixed(2)}</p>`;
              });
            }
          })
          .catch(console.error);
      });
    } else {
      window.addEventListener("devicemotion", (event) => {
        const newXyzabg = [
          event.accelerationIncludingGravity.x,
          event.accelerationIncludingGravity.y,
          event.accelerationIncludingGravity.z,
          event.rotationRate.alpha,
          event.rotationRate.beta,
          event.rotationRate.gamma,
        ];
        xyzabg = lastXyzabg.map((v, i) => v * 0.85 + newXyzabg[i] * 0.15);
        lastXyzabg = xyzabg;
        document.body.innerHTML = `
        <p>Accelerometer:</p>
        <p>x: ${xyzabg[0].toFixed(2)}</p>
        <p>x: ${xyzabg[1].toFixed(2)}</p>
        <p>x: ${xyzabg[2].toFixed(2)}</p>
        <p>Gyro:</p>
        <p>alpha: ${xyzabg[3].toFixed(2)}</p>
        <p>beta: ${xyzabg[4].toFixed(2)}</p>
        <p>gamma: ${xyzabg[5].toFixed(2)}</p>`;
      });
    }

    setInterval(() => {
      if (JSON.stringify(sentXyzabg) !== JSON.stringify(xyzabg)) {
        sentXyzabg = Array.from(xyzabg);
        socket.emit("phone", { target: phone, data: sentXyzabg });
      }
    }, 50);
    return;
  }

  document.querySelector("dialog").showModal();
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById("username-input");
    socket.emit("username", usernameInput.value);
    socket.on("username", (response) => {
      if (response.success) {
        document.querySelector("dialog").close();
        document.body.innerHTML = `
        <div class="max-window">
        <div id="chat-output"></div>
        <input type="text" id="chat-input" placeholder="chat">
        </div>`;
        document
          .getElementById("chat-input")
          .addEventListener("change", (e) => {
            window.max.outlet("chat", e.target.value);
            socket.emit("chat", e.target.value);
            e.target.value = "";
          });
        socket.on("chat", (incoming) => {
          const chatOutput = document.getElementById("chat-output");
          chatOutput.innerHTML += incoming;
          chatOutput.scrollTop = chatOutput.scrollHeight;
        });
        return;
      }
      usernameInput.value = "";
      usernameInput.placeholder = "username taken, try again";
    });
  });

  let args, lastArgs;
  window.max.bindInlet("pm", function () {
    args = Array.from(arguments);
  });

  setInterval(() => {
    if (JSON.stringify(args) !== JSON.stringify(lastArgs)) {
      lastArgs = Array.from(args);
      const target = args[0];
      const outgoing = {
        target: target,
        data: args.slice(1),
      };
      socket.emit("pm", outgoing);
    }
  }, 50);

  socket.on("pm", (incoming) => {
    const msg = [incoming.sender, ...incoming.data];
    window.max.outlet(...msg);
  });

  socket.on("phone", (incoming) => {
    const msg = ["phone", ...incoming];
    window.max.outlet(...msg);
  });
});
