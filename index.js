import dotenv from "dotenv";
import express from "express";
import cors from "cors";
// import { chats } from "./data/data.js";
// import mongoose from "mongoose";
import path from "path";
// import https from "https";
// import fs from "fs";
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import messageRouter from "./routes/messageRouter.js";
import { errorHandler, notFound } from "./middlewares/error.js";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const port =  process.env.PORT;

const app = express();
// var options = {
//   key: fs.readFileSync('sslcert/server.key','utf-8'),
//   cert: fs.readFileSync('sslcert/server.crt','utf-8')
// };
// const server = https.createServer(options,app);

app.use(express.json());
// app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

// app.get("/",(req,res)=>{
//     res.send("Hello world");
// });

app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

// ---------------Deployment----------------

const __dirname1 = path.resolve();
 console.log(__dirname1);
 console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Hello world");
  });
}

// ---------------Deployment----------------

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, console.log(`listening at port ${port}`));

const io = new Server(server,{
  // allowEIO3: true,
  cors: {
    origin: "*",
    // handlePreflightRequest: (req,res)=>{
    //   res.write(200,{
    //     "Access-Control-Allow-Origin": "*",
    //     "Access-Control-Allow-Methods": "GET,POST",
    //     "Access-Control-Allow-Headers": "my-custom-header",
    //     "Access-Control-Allow-Credentials": true,
    //   });
    //   res.end();
    // }
  }

});
io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined room : " + room);
  });
  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    if (!chat.users) return console.log("chat.users not defined");
    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });
  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });
  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });

  socket.off("setup",()=>{
      console.log("USER DISCONNECTED");
      socket.leave(userData._id)
  })
});


// server.listen(port,()=>{
//   console.log(`server listening at port ${port}`);
// })


//garret.ns.cloudflare.com
//sima.ns.cloudflare.com