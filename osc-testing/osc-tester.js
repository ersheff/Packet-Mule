const oscSender = require("dgram").createSocket("udp4");
const oscReceiver = require("dgram").createSocket("udp4");

// sender
oscSender.on("error", (err) => {
  const message = `server error:\n${err.stack}`;
  console.log(message);
  oscSender.close();
});

//oscSender.send(msg, 8001, 'localhost');

// receiver
oscReceiver.on("error", (err) => {
  const message = `server error:\n${err.stack}`;
  console.log(message);
  oscReceiver.close();
});

oscReceiver.on("message", (msg) => {
  const nextSlashIndex = msg.indexOf(0x2F, 1);
  const username = msg.subarray(1, nextSlashIndex).toString("ascii");
  const data = msg.subarray(nextSlashIndex);
  const padding = Buffer.from("0".repeat(nextSlashIndex));
  const paddedData = Buffer.concat([data, padding]);
  console.log(paddedData.toString());
});

oscReceiver.on("listening", () => {
    const address = oscReceiver.address();
    const message = `server listening on ${address.address}:${address.port}`;
    console.log(message);
});

oscReceiver.bind(7001);