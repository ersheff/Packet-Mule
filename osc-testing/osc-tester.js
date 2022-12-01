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
  //const nextSlashIndex = sansFirstSlash.indexOf(0x2f);
  //const slicedName = sansFirstSlash.slice(0, nextSlashIndex);
  //let nameString = "";
  //for (s of slicedName) {
  //  nameString += String.fromCharCode(s);
  //}
  //let remaining = sansFirstSlash.slice(nextSlashIndex);
  //console.log(nameString);
  //console.log(remaining);
  //const sansFirstSlash = msg.subarray(1);

  const nextSlashIndex = msg.indexOf(0x2F, 1);
  const sender = msg.subarray(1, nextSlashIndex).toString("ascii");
  const data = msg.subarray(nextSlashIndex);
  console.log(sender);
  console.log(data.toString("ascii"));
});

oscReceiver.on("listening", () => {
    const address = oscReceiver.address();
    const message = `server listening on ${address.address}:${address.port}`;
    console.log(message);
});

oscReceiver.bind(7001);