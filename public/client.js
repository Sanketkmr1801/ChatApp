//To get HTML elements
const output = document.getElementById('output');
const message = document.getElementById('message');
const whisperMessage = document.getElementById('whisperMessage');
const whisperToSelect = document.querySelector('#whisperTo')
const send = document.getElementById('send');
const feedback = document.getElementById('feedback');
const users = document.querySelector('.users');
const username = document.querySelector('#username').innerHTML.split(":")[1].trim()
const roomname = document.querySelector('#roomname').innerHTML.split(":")[1].trim()
const whisper = document.querySelector('#whisper')
const logout = document.getElementById('logout')
const isAdmin = document.getElementById('isAdmin').innerHTML
const body = document.querySelector('body')
//Socket server URL
const socket = io.connect('https://chatappjucse17.onrender.com/');

socket.on('connection', () => {})

socket.emit('joined-user', {username: username, roomname: roomname, isAdmin: isAdmin})

whisper.addEventListener('click', () => {
    if(whisperToSelect.value == username) {}
    else {
        let div = document.createElement('div')
        div.style.marginLeft = "400px"
        div.style.color = 'purple'
        div.innerHTML = "you" + " to " + whisperToSelect.value + ": " + whisperMessage.value
        output.innerHTML += div.outerHTML
        socket.emit('whisper', {whisperMessage: whisperMessage.value, whisperTo: whisperToSelect.value, whisperBy: username, roomname: roomname})
        whisperMessage.value = ""
    }
})

logout.addEventListener('click', () => {
    socket.emit('logout', {username: username, roomname: roomname})
    socket.close()
})

send.addEventListener('click', () => {
    if(message.value[0] == "!" && isAdmin == "true" && message.value.split("!")[1].split(" ")[0] == "kick") {
        let command = message.value.split("!")[1].split(" ")[0]
        let target = message.value.split("!")[1].split(" ")[1]
        if(command.toLowerCase() == "kick") {
            console.log("kicking user:", target)
            socket.emit('kick', {username: target, roomname: roomname})
        }
    } else {
        if(message.value[0] == "!") {
            let command = message.value.split("!")[1].split(" ")[0].toLowerCase()
            let messageContent = message.value.split("!")[1].split(" ")[1]
            if(command == "link") {
                console.log("user wants to send a link", messageContent)
                let div = document.createElement('div')
                div.style.marginLeft = "500px"
                let a = document.createElement('a')
                a.href = messageContent
                a.target = "_blank"
                a.rel = "noopener noreferrer"
                let link = document.createTextNode(messageContent)
                a.appendChild(link)
                div.innerHTML = username + ":" + a.outerHTML
                output.innerHTML += div.outerHTML
                socket.emit("message", {message: messageContent, username: username, roomname: roomname, type: "link"})

            } else if(command == "img") {
                console.log("user wants to send an image", messageContent)
                let img = document.createElement('img')
                let div = document.createElement('div')
                div.style.marginLeft = "500px"
                img.alt = messageContent
                img.src = messageContent
                img.style.width = "100px"
                img.style.height = "100px"
                div.innerHTML = username + ":" + img.outerHTML
                output.innerHTML += div.outerHTML
                socket.emit("message", {message: messageContent, username: username, roomname: roomname, type: "img"})
            } else if(message.value != "") {
                let div = document.createElement('div')
                div.style.marginLeft = "500px"
                div.innerHTML = username + ": " + message.value
                output.innerHTML += div.outerHTML
                socket.emit("message", {message: message.value, username: username, roomname: roomname})
            }
        }
        else if(message.value != "") {
            let div = document.createElement('div')
            div.style.marginLeft = "500px"
            div.innerHTML = username + ": " + message.value
            output.innerHTML += div.outerHTML
            socket.emit("message", {message: message.value, username: username, roomname: roomname})
        }
    }
    message.value = ""  
})

message.addEventListener('keypress', () => {
    if(isAdmin == "false")
    socket.emit('typing', {username: username, roomname: roomname})
})

socket.on('joined-user', (data) => {
    let div = document.createElement('div')
    div.innerHTML = data + " has joined!"
    feedback.appendChild(div)
})

socket.on('message', (data) => {
    if(!data.type) {
        output.innerHTML += '<div>' + data.username + ":" + data.message + '</div>'
        feedback.innerHTML = ""
    } else if(data.type == "img") {
        let img = document.createElement('img')
        img.alt = data.message
        img.src = data.message
        img.style.width = "100px"
        img.style.height = "100px"
        output.innerHTML += '<div>' + data.username + ":" + img.outerHTML + '</div>'
        feedback.innerHTML = ""
    } else if(data.type == "link") {
        let div = document.createElement('div')
        div.style.marginLeft = "500px"
        let a = document.createElement('a')
        a.href = data.message
        a.target = "_blank"
        a.rel = "noopener noreferrer"
        let link = document.createTextNode(data.message)
        a.appendChild(link)
        div.innerHTML = data.username + ":" + a.outerHTML
        output.innerHTML += div.outerHTML
        feedback.innerHTML = ""
    }

})

socket.on('whisper', (data) => {
    const {whisperMessage, whisperTo, whisperBy} = data
    if(whisperTo == username) {
        let div = document.createElement('div')
        div.innerHTML = whisperBy + " to you: " + whisperMessage
        div.style.color = 'purple'
        output.innerHTML += div.outerHTML
    }
})

socket.on('typing', (data) => {
    feedback.innerHTML = data + " is typing..."
})

socket.on('logout', (data) => {
    let div = document.createElement('div')
    div.innerHTML = data + " has left!"
    feedback.appendChild(div)
})


socket.on('user-online', (data) => {
    users.innerHTML = data
    whisperToSelect.innerHTML = ""
    for(let user of data) {
        let option = document.createElement('option')
        option.value = user
        option.innerHTML = user
        whisperToSelect.add(option)
    }
})

socket.on('kick', (data) => {
    const {kickusername, roomname} = data
    if(kickusername == username) {
        socket.emit('logout', {username: username, roomname: roomname})
        body.innerHTML = "You Have Been Kicked by an administrator"
        socket.close()
    }
})
