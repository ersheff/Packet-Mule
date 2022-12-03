const usernameInput = document.querySelector("#username-input");
const connectButton = document.querySelector("#connect-button");
const chatInput = document.querySelector("#chat-input");

const userList = document.querySelector("#user-list");
const pmConsole = document.querySelector("#pm-console");


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
  for (user of incoming.users) {
    const newLine = document.createElement("li");
    newLine.innerText = user;
    userList.appendChild(newLine);
  }
});

window.pmc.onConsoleLog((event, message) => {
  console.log(message);
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