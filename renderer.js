const oscThruDisplay = document.getElementById("osc-thru-display");

window.electronAPI.oscDataFromApp((event, data) => {
    let fullData = "";
    for(d of data.args) {
        fullData += `${d.value} `;
    }
    const oscThruDisplayText = `${data.address} ${fullData}`;
    oscThruDisplay.innerText = oscThruDisplayText;
});

//
const usernameInput = document.getElementById("username-input");

usernameInput.addEventListener("input", () => {
    if (usernameInput.value.length > 0) {
        connectButton.disabled = false;
    } else connectButton.disabled = true;
});

const connectButton = document.getElementById("connect-button");

connectButton.addEventListener("click", () => {
    window.electronAPI.requestConnection(usernameInput.value);
});

//
const clientConsole = document.getElementById("client-console");

window.electronAPI.serverMessage((event, message) => {
    const newLine = document.createElement("p");
    newLine.innerText = `Server: ${message}`;
    newLine.style.color = "red";
    clientConsole.appendChild(newLine);
    clientConsole.scrollTop = clientConsole.scrollHeight;
});

window.electronAPI.bridgeMessage((event, message) => {
    const newLine = document.createElement("p");
    newLine.innerText = `OSC Bridge: ${message}`;
    newLine.style.color = "red";
    clientConsole.appendChild(newLine);
    clientConsole.scrollTop = clientConsole.scrollHeight;
});

const disconnectButton = document.getElementById("disconnect-button");

window.electronAPI.confirmConnection((event, username) => {
    usernameInput.value = "";
    usernameInput.placeholder = username;
    connectButton.hidden = true;
    disconnectButton.hidden = false;
});

disconnectButton.addEventListener("click", () => {
    window.electronAPI.requestDisconnection();
    disconnectButton.hidden = true;
    connectButton.hidden = false;
    if (!usernameInput.value) {
        connectButton.disabled = true;
    }
    usernameInput.placeholder = "username";
    userList.replaceChildren();
    const newLine = document.createElement("p");
    newLine.innerText = "Disconnected";
    newLine.style.color = "red";
    clientConsole.appendChild(newLine);
    clientConsole.scrollTop = clientConsole.scrollHeight;
});

//

const userList = document.getElementById("user-list");

window.electronAPI.connectedUsers((event, connectedUsers) => {
    userList.replaceChildren();
    for(u of connectedUsers) {
        const userElement = document.createElement("p");
        userElement.innerText = u;
        userList.appendChild(userElement);
    }
});

//

const chatInput = document.getElementById("chat-input");

chatInput.addEventListener("change", () => {
    window.electronAPI.outgoingChat(chatInput.value);
    chatInput.value = "";
});

window.electronAPI.incomingChat((event, message) => {
    const newLine = document.createElement("p");
    newLine.innerText = `${message.sender}: ${message.content}`;
    clientConsole.appendChild(newLine);
    clientConsole.scrollTop = clientConsole.scrollHeight;
});