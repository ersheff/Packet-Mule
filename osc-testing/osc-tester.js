const osc = require("osc");

const udpPort = new osc.UDPPort({
  localAddress: "localhost",
  localPort: 7001,
  metadata: true
});

// listen for incoming OSC messages.
udpPort.on("message", (msg) => {
  const fullAddress = msg.address;
  const slashIndex = fullAddress.indexOf("/", 1);
  const targetUsername = fullAddress.slice(1, slashIndex);
  const shortAddress = fullAddress.slice(slashIndex);
  msg.address = shortAddress;
  udpPort.send(msg, "localhost", 8001);
});

// Ooen the socket
udpPort.open();

// send an OSC message Wwen the port is ready
udpPort.on("ready", () => {
  udpPort.send({
      address: "/handshake",
      args: [
          {
              type: "i",
              value: "1"
          }
      ]
  }, "localhost", 8001);
});

