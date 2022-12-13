const usernameInput = document.querySelector("#username-input");
const connectButton = document.querySelector("#connect-button");
const conductorCheck = document.querySelector("#conductor-check");

const chatInput = document.querySelector("#chat-input");
const pmConsole = document.querySelector("#pm-console");
const userList = document.querySelector("#user-list");
const programDisplay = document.querySelector("#program-display");


// events that trigger main methods
// connect listener

connectButton.addEventListener("click", () => {
  const username = usernameInput.value;
  if (username) { window.pmc.connect(username); }
  else {
    const newLine = document.createElement("li");
    newLine.innerText = "please provide a username before connecting";
    newLine.style.color = "red";
    pmConsole.appendChild(newLine);
  };
});

conductorCheck.addEventListener("click", () => {
  window.pmc.requestConductor();
});

// chat-to-server listener
chatInput.addEventListener("change", () => {
  window.pmc.chatMessage(chatInput.value);
  chatInput.value = "";
  chatInput.placeholder = "chat";
})


// events that render content to window 

window.pmc.onConfirmUsername((event, incoming) => {
  usernameInput.value = "";
  usernameInput.placeholder = incoming.username;
  connectButton.disabled = true;
  conductorCheck.disabled = false;
});

window.pmc.onConfirmConductor((event, status) => {
  if (status) {
    conductorCheck.checked = true;
    const newLine = document.createElement("li");
    newLine.innerText = `server: you are now the conductor.`;
    newLine.style.color = "red";
    pmConsole.appendChild(newLine);
  }
  else {
    conductorCheck.checked = false;
    const newLine = document.createElement("li");
    newLine.innerText = `server: conductor already claimed.`;
    newLine.style.color = "red";
    pmConsole.appendChild(newLine);
  }
});

window.pmc.onChatMessage((event, incoming) => {
  const newLine = document.createElement("li");
  newLine.innerText = `${incoming.sender}: ${incoming.content}`;
  pmConsole.appendChild(newLine);
});

window.pmc.onServerMessage((event, incoming) => {
  const newLine = document.createElement("li");
  newLine.innerText = `${incoming.sender}: ${incoming.content}`;
  newLine.style.color = "red";
  pmConsole.appendChild(newLine);
});

window.pmc.onUserList((event, incoming) => {
  userList.replaceChildren();
  for (u of incoming.users) {
    const newLine = document.createElement("li");
    newLine.innerText = u;
    userList.appendChild(newLine);
  }
});

window.pmc.onConsoleLog((event, message) => {
  console.log(message);
});

window.pmc.onProgramOrder((event, programOrder) => {
  for (p of programOrder) {
    const newLine = document.createElement("li");
    newLine.innerText = p;
    programDisplay.appendChild(newLine);
  }
});

/*document.querySelector("#open-file").onclick = () => {
  console.log("launching the file...");
  let fName = "/Users/sheffie/Desktop/guitar-test1.maxpat";
  window.pmc.launchFile(fName)
    .then(() => {
      const newLine = document.createElement("li");
      newLine.innerText = "file opened";
      document.querySelector("#pm-console").appendChild(newLine);
    })
}*/

//document.querySelector("#username-input").addEventListener("change",
//  function() {
//    const newUsername = this.value;
//    window.pmc.changeUsername(newUsername);
//    this.value = "";
//    this.placeholder = newUsername;
//  }
//)