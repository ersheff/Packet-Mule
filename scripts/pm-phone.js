export default {
  setup,
  usernameMethod,
  handlePhoneUser
};

let ready = false;

function setup(socket, username) {
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    socket.emit("phone-user", document.querySelector("#username-input").value);
  });
  document.querySelector("#username-modal").showModal();

  let xyz = [0, 0, 0];
  let abg = [0, 0, 0];
  let xyzabg12, sentXyzabg12;
  let lastXyz = [0, 0, 0];
  const sliderVals = [0, 0];

  document
    .querySelector("html")
    .style.setProperty("overscroll-behavior", "none");

  if (typeof DeviceMotionEvent.requestPermission === "function") {
    window.alert(
      "This application requires access to your device's motion sensors."
    );
    DeviceMotionEvent.requestPermission()
      .then((permissionState) => {
        if (permissionState === "granted") {
          window.addEventListener("devicemotion", (event) => {
            [xyz, lastXyz] = handleMotion(event, xyz, lastXyz);
          });
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener("devicemotion", (event) => {
      [xyz, lastXyz] = handleMotion(event, xyz, lastXyz);
    });
  }

  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    window.alert(
      "This application requires access to your device's orientation sensors."
    );
    DeviceOrientationEvent.requestPermission()
      .then((permissionState) => {
        if (permissionState === "granted") {
          window.addEventListener("deviceorientation", (event) => {
            abg = handleOrientation(event);
          });
        }
      })
      .catch(console.error);
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
      if (ready) {
        socket.emit("phone", { target: username, data: sentXyzabg12 });
      }
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

function usernameMethod(socket, username) {
  if (username) {
    socket.emit("phone-user", username);
  }
}

function handlePhoneUser(response) {
  if (response.success) {
    document.querySelector("#username-modal").close();
    ready = true;
  } else {
    const usernameInput = document.querySelector("#username-input");
    usernameInput.value = "";
    usernameInput.placeholder = "try another username";
  }
}
