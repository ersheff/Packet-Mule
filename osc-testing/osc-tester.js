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
  const sender = msg.subarray(1, nextSlashIndex).toString("ascii");
  const data = msg.subarray(nextSlashIndex);
  const targetLength = Math.ceil(data.length/4)*4;
  const paddedData = Buffer.concat([data], targetLength);
});

oscReceiver.on("listening", () => {
    const address = oscReceiver.address();
    const message = `server listening on ${address.address}:${address.port}`;
    console.log(message);
});

oscReceiver.bind(7001);