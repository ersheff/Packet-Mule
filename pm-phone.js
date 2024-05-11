export function handlePhone(socket, phone) {
  let xyz, abg, xyzabg, sentXyzabg;
  let lastXyz = [0, 0, 0];

  document.body.innerHTML = `<p>Accelerometer:</p>
  <div id="accel-data"></div>
  <p>Gyro:</p>
  <div id="gyro-data"></div>`;

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

  setInterval(() => {
    xyzabg = [...xyz, ...abg];
    if (JSON.stringify(sentXyzabg) !== JSON.stringify(xyzabg)) {
      sentXyzabg = Array.from(xyzabg);
      socket.emit("phone", { target: phone, data: sentXyzabg });
    }
  }, 50);
}

function handleMotion(event, xyz, lastXyz) {
  const newXyz = [
    event.accelerationIncludingGravity.x,
    event.accelerationIncludingGravity.y,
    event.accelerationIncludingGravity.z,
  ];
  xyz = lastXyz.map((v, i) => v * 0.85 + newXyz[i] * 0.15);
  lastXyz = xyz;
  document.getElementById("accel-data").innerHTML = `
    <p>x: ${xyz[0].toFixed(2)}</p>
    <p>x: ${xyz[1].toFixed(2)}</p>
    <p>x: ${xyz[2].toFixed(2)}</p>`;
  return [xyz, lastXyz];
}

function handleOrientation(event) {
  const abg = [event.alpha, event.beta, event.gamma];
  document.getElementById("gyro-data").innerHTML = `
    <p>x: ${abg[0].toFixed(2)}</p>
    <p>x: ${abg[1].toFixed(2)}</p>
    <p>x: ${abg[2].toFixed(2)}</p>`;
  return abg;
}
