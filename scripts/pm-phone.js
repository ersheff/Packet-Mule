export default {
  setup,
  auth,
  init
};

function setup(socket) {
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const outgoing = {
      username: e.target.username.value,
      password: e.target.password.value,
      isPhone: true
    };
    socket.emit("auth", outgoing);
  });
  window.addEventListener("pagehide", () => {
    socket.emit("purge");
  });
  window.addEventListener("unload", () => {
    socket.emit("purge");
  });
  socket.on("phonelist", (phonelist) => {
    document.querySelector("#username-input").innerHTML = phonelist;
  });
  document.querySelector("#auth-modal").showModal();
  socket.emit("ready", true);
}

function auth(socket, response) {
  const { username, password, manual } = response;
  const usernameInput = document.querySelector("#username-input");
  const passwordInput = document.querySelector("#password-input");
  const authModal = document.querySelector("#auth-modal");
  const phoneUser = document.querySelector("#phone-user");

  if (username && password) {
    phoneUser.innerHTML = `Sending data to: <strong>${username}</strong>`;
    authModal.close();
    return;
  }

  if (username) {
    phoneUser.innerHTML = `Sending data to: <strong>${username}</strong>`;
    if (!manual) {
      usernameInput.hidden = true;
    } else usernameInput.disabled = true;
  } else if (manual) {
    socket.emit("phonelist");
  }

  if (password) {
    if (!manual) {
      passwordInput.hidden = true;
    } else passwordInput.disabled = true;
  } else if (manual) {
    passwordInput.value = "";
    passwordInput.placeholder = "incorrect password";
  }
  throw "Phone authentication failed";
}

function init(socket) {
  let xyz = [0, 0, 0];
  let abg = [0, 0, 0];
  let xyzabg12, sentXyzabg12;
  let lastXyz = [0, 0, 0];
  const sliderVals = [0, 0];

  if (typeof DeviceMotionEvent.requestPermission === "function") {
    document.querySelector("#motion-modal").showModal();
    document.querySelector("#motion-close").addEventListener("click", () => {
      document.querySelector("#motion-modal").close();
    });
    document.querySelector("#motion-confirm").addEventListener("click", () => {
      DeviceMotionEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            window.addEventListener("devicemotion", (event) => {
              [xyz, lastXyz] = handleMotion(event, xyz, lastXyz);
            });
          }
          document.querySelector("#motion-modal").close();
        })
        .catch(console.error);
    });
  } else {
    window.addEventListener("devicemotion", (event) => {
      [xyz, lastXyz] = handleMotion(event, xyz, lastXyz);
    });
  }

  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    document.querySelector("#orientation-modal").showModal();
    document
      .querySelector("#orientation-close")
      .addEventListener("click", () => {
        document.querySelector("#orientation-modal").close();
      });
    document
      .querySelector("#orientation-confirm")
      .addEventListener("click", () => {
        DeviceOrientationEvent.requestPermission()
          .then((permissionState) => {
            if (permissionState === "granted") {
              window.addEventListener("deviceorientation", (event) => {
                abg = handleOrientation(event);
              });
            }
            document.querySelector("#orientation-modal").close();
          })
          .catch(console.error);
      });
  } else {
    window.addEventListener("deviceorientation", (event) => {
      abg = handleOrientation(event);
    });
  }

  document.querySelector("#slider1").addEventListener("input", (e) => {
    sliderVals[0] = +e.target.value;
  });
  document.querySelector("#slider2").addEventListener("input", (e) => {
    sliderVals[1] = +e.target.value;
  });

  setInterval(() => {
    xyzabg12 = [...xyz, ...abg, ...sliderVals];
    if (JSON.stringify(sentXyzabg12) !== JSON.stringify(xyzabg12)) {
      sentXyzabg12 = Array.from(xyzabg12);
      socket.emit("phone-data", sentXyzabg12);
    }
  }, 50);
}

function handleMotion(event, xyz, lastXyz) {
  const newXyz = [
    event.accelerationIncludingGravity.x,
    event.accelerationIncludingGravity.y,
    event.accelerationIncludingGravity.z
  ];
  xyz = lastXyz.map((v, i) => v * 0.85 + newXyz[i] * 0.15);
  lastXyz = xyz;
  document.querySelector("#accel-data").innerHTML =
    /* HTML */
    ` <p>x: ${xyz[0].toFixed(2)}</p>
      <p>y: ${xyz[1].toFixed(2)}</p>
      <p>z: ${xyz[2].toFixed(2)}</p>`;
  return [xyz, lastXyz];
}

function handleOrientation(event) {
  const abg = [event.alpha, event.beta, event.gamma];
  document.querySelector("#gyro-data").innerHTML =
    /* HTML */
    ` <p>yaw: ${abg[0].toFixed(2)}</p>
      <p>pitch: ${abg[1].toFixed(2)}</p>
      <p>roll: ${abg[2].toFixed(2)}</p>`;
  return abg;
}
