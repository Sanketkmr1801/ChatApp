const express = require("express")
const bodyParser = require("body-parser")
const fs = require('fs')

const app = express();
const server = require('http').createServer(app)
const io = require('socket.io')(server, {cors: {origin: "*"}})

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'))
app.set('view engine', 'ejs')
var port = process.env.PORT || 3000

secretAdminPass = "secret"

const saveFile = (obj, file) => {
    fs.writeFile(file, JSON.stringify(obj), err => {
        if(err) throw err
        console.log("JSON SAVED!")
    });
}

let rooms = {};
let users = fs.readFileSync('users.json', (err, data) => {
})
if(users.length !== 0) users = JSON.parse(users) 
else users = {}

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/app/:userName', (req, res) => {
    // userName = req.params.userName
    let userName = req.params.userName
    if(users[userName].isLoggedIn) res.render('index', {name: userName})
    else res.render('error', {error: 'Invalid Request'})
})

app.post('/login', (req, res) => {
    user = req.body.user
    if(users[user.name] && users[user.name]["pass"] == user.pass) {
        users[user.name].isLoggedIn = true
        res.render('index', {name: user.name})
    } else {
        res.render('error', {error: "Wrong User Info"})
    }
})

app.post('/register', (req, res) => {
    newUser = req.body.user
    users[newUser.name] = {isLoggedIn: false, pass: newUser.pass, isAdmin: false, rooms: []}
    if(newUser.adminPass == secretAdminPass) {
        users[newUser.name].isAdmin = true    
    } 
    saveFile(users, "users.json")
    res.redirect('/login')
})

app.post('/room', (req, res) => {
    const {roomname, username} = req.body
    res.render('room', {username: username, roomname: roomname, isAdmin: users[username].isAdmin})

})

app.post('/logout', (req, res) => {
    res.redirect('/login')
})

server.listen(port, "https://chatappjucse17.onrender.com, () => {
    console.log("Server Listening on port ", port)
})


//Socket connection
io.on('connection', (socket) => {

    socket.on('joined-user', (data) => {
        socket.join(data.roomname)
        if(!rooms[data.roomname]) {
            rooms[data.roomname] = [data.username]
        } else {
            let doesUserExist = false 
            for(let user of rooms[data.roomname]) {
                if (user == data.username) {
                    doesUserExist = true
                    break
                }
            }
            if(!doesUserExist)
            rooms[data.roomname].push(data.username)
        }
        console.log(rooms)
        io.to(data.roomname).emit('joined-user', data.username);
        io.to(data.roomname).emit('user-online', rooms[data.roomname])
    })

    socket.on('message', (data) => {
        socket.broadcast.to(data.roomname).emit('message', data)  
    })

    socket.on('typing', (data) => {
        socket.broadcast.to(data.roomname).emit('typing', data.username)
    })

    socket.on('logout', (data) => {
        for(let i = 0; i < rooms[data.roomname].length; i++) {
            if(rooms[data.roomname][i] == data.username) {
                rooms[data.roomname].splice(i, 1)
                break
            }
        }
        console.log(rooms)
        socket.broadcast.to(data.roomname).emit('logout', data.username)
        io.to(data.roomname).emit('user-online', rooms[data.roomname])
    })

    socket.on('whisper', (data) => {
        console.log(data)
        const {whisperTo, whisperMessage, whisperBy, roomname} = data
        socket.broadcast.to(data.roomname).emit('whisper', {whisperBy: whisperBy, whisperMessage: whisperMessage, whisperTo: whisperTo})
    })

    socket.on('kick', (data) => {
        const {username, roomname} = data
        socket.broadcast.to(roomname).emit('kick', {kickusername: username, roomname: roomname})
    }) 
})


