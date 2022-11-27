document.querySelector("#connect-button").addEventListener("click", () => {
  const username = document.querySelector("#username-input").value;
  if (username) { window.pmc.connect(username); }
  else pmConsole("please provide a username before connecting");
});

window.pmc.onConfirmUser((event, data) => {
  document.querySelector("#username-input").value = "";
  document.querySelector("#username-input").placeholder = data;
});

window.pmc.onMessage((event, data) => {
  pmConsole(`${data.sender}: ${data.content}`);
});

window.pmc.onServerMessage((event, data) => {
  pmConsole(`server: ${data.content}`, "server");
});

window.pmc.onUserList((event, data) => {
  for (u of data.data) {
    const newLine = document.createElement("li");
    newLine.innerText = u;
    document.querySelector("#user-list").appendChild(newLine);
  }
});

function pmConsole(text, level) {
  const newLine = document.createElement("li");
  newLine.innerText = text;
  if (level === "server") newLine.style.color = "red";
  document.querySelector("#pm-console").appendChild(newLine);
}

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