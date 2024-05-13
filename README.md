# Packet Mule

Packet Mule is a web-based tool to simplify network communication in Cycling 74's[Max](https://cycling74.com/products/max).

It's not a library or a package. There's nothing to install on the client (other than Max), though once you're up and running, you may want to download the [pm-demo.maxpat] file to try it out.

To deploy your own Packet Mule server:

1. Create a new Node.js application on your chosen platform using the files in this repository (e.g. [Render](https://render.com), [Fly.io](https://fly.io), [Google Cloud](https://cloud.google.com/appengine/docs/standard/nodejs/building-app), [Heroku](https://www.heroku.com), etc.).
2. Create a `PM_PWD` environment variable to store a password for your instance of Packet Mule (a very basic authentication to help restrict access to your server).
3. Set up the build - `npm install` - and start - `npm start` - commands if needed.

Using Packet Mule in Max:

- Launch your Packet Mule server's url in a jweb object in Max. Make sure to include the password that you set in your environment variables during server deployment as a url parameter, e.g. `https://my.pm-server.com?pass=password`.
- If it is not provided as an additional url parameter - `max=username` - you will be prompted for a username.
- If your username is accepted (i.e. it's not already in use by someone else on the same server), the jweb window will load a basic chat application.
- Outgoing messages can be sent to the inlet of the jweb object in the format `pm target header data...`.
  - `target` can either be `all` (to send to everyone) or the username of another connected user.
  - `header` can be any message header that you want e.g. `volume`, `pitch`, `cue`, etc.
  - `data...` can be a Max list comprised of one or more integers, floats, symbols, or a combination thereof.
- Incoming messages are received at the jweb object's outlet in the format `sender header data...`.

Using Packet Mule on a mobile device:

- The Packet Mule mobile client is intended to send basic control data (accelerometer, gyroscope, and sliders) from a user's mobile device to their own laptop. It does not include any built-in sound synthesis.
- Launch your Packet Mule server's url in the browser on your mobile device with the additional url parameter `phone=username`, e.g. `https://my.pm-server.com?pass=password&phone=username`. The username should match the one that was set in the Max client.
- Mobile device control data is received at the jweb object's outlet in the format `phone accelX accelY accelZ yaw pitch roll slider1 slider2`.

Other details:

- Outgoing messages are limited to a speed of 25 messages per second (every 50ms) within the client. If more than one message is attempted within that 50ms window, they are gathered into a single "payload" for transmission at the next interval.
- The payload is cleared after every outgoing transmission, and nothing is sent again until new messages are put in the queue.
- There is a built-in mechanism to help eliminate redundnancy. If more than one message with the same `target` and `header` pair is attempted within the 50ms window, only the last one will be sent.
