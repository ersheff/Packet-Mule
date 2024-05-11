export function handlePhone(socket, phone) {
  let xyz,
    lastXyz = [0, 0, 0];
  let abg,
    lastAbg = [0, 0, 0];
  let xyzabg, sentXyzabg;

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
            [abg, lastAbg] = handleOrientation(event, abg, lastAbg);
          });
        }
      })
      .catch(console.error);
  } else {
    window.addEventListener("deviceorientation", (event) => {
      [abg, lastAbg] = handleOrientation(event, abg, lastAbg);
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

function handleOrientation(event, abg, lastAbg) {
  const newAbg = [event.alpha, event.beta, event.gamma];
  abg = lastAbg.map((v, i) => v * 0.85 + newAbg[i] * 0.15);
  lastAbg = abg;
  document.getElementById("gyro-data").innerHTML = `
    <p>x: ${abg[0].toFixed(2)}</p>
    <p>x: ${abg[1].toFixed(2)}</p>
    <p>x: ${abg[2].toFixed(2)}</p>`;
  return [abg, lastAbg];
}
