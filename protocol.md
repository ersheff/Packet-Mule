Special roles:
- conductor and server are reserved usernames
- conductor requires auth, they are the only one that can send system messages
- there should be an option to set conductor as a performer as well (e.g. they receive system commands)

Types of data:
- message (go to chat window)
- control (passed over OSC)
- system (e.g. launching)

Message format:
to server:
{
  target:
  message:
}
from server:
{
  sender:
  message:
}

Control format:
to server:
{
  target:
  data: OSC
}
from server:
{
  data: OSC
}

OSC message format:
- outgoing (to client) target/header/values
- incoming (from server) sender/header/values


System format:
to server:
{
  scope:
  command:
}
from server:
{
  command:
}

Path:
1. OSC packet comes into client as target/header/values
2. target is stripped out and added to object
3. object is transmitted to server
4. server prepends sender to OSC packet and broadcasts (based on data)
