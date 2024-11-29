import express from "express";
import http from "http";
import { Server } from 'socket.io';
import {dirname} from "path";
import path from "path";
import {fileURLToPath} from "url";
const __dirname=dirname(fileURLToPath(import.meta.url));
import { formatMessage } from './utils/messages.js';
import { userJoin, getCurrentUser, userLeave, getRoomUsers } from './utils/users.js';


const app=express();
const server= http.createServer(app);
const io= new Server(server);

//set static folder 
app.use(express.static(path.join(process.cwd(), 'public')));
const port=3000 || process.env.port;

const botName= 'ChatCord Bot';

//Run when client connects

io.on('connection', socket=>{
    // console.log('New Ws Connection...');

    socket.on('joinRoom', ({username, room})=>{
        const user= userJoin(socket.id, username, room );
        
        socket.join(user.room);

    //Welcome the current: emit the event (used for sending the messsage to the single user when connects)
    socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

    //Broadcast when a user connects(used to send the messag to all the user except for the user connected)
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

     //Send users and room info
     io.to(user.room).emit('roomUsers', {
        room: user.room, 
        users: getRoomUsers(user.room),
    });

});

    //Listen for chat message
    socket.on('chatMessage', (msg)=>{
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMessage(user.username, msg));
    });

    //Runs when client disconnects
 socket.on('disconnect', () => {
    const user =  userLeave(socket.id);

    if(user){
        io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`)); //used to send the message to all the user i general
    
    //Send users and room info
    io.to(user.room).emit('roomUsers', {
        room: user.room, 
        users: getRoomUsers(user.room),
    });
    
    }
   
});
});


server.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});