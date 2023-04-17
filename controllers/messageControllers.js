import asyncHandler from "express-async-handler";
import Message from "../models/message.js";
import User from "../models/user.js";
import Chat from "../models/chat.js";

const sendMessage = asyncHandler(async(req,res)=>{
    const {content, chatId} = req.body;
    if(!content || !chatId){
        return res.sendStatus(400);
    }
    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId
    };

    try{
        var message = await Message.create(newMessage);
        message = await message.populate("sender","name pic");
        message = await message.populate("chat");
        message = await User.populate(message,{
            path: "chat.users",
            select: "name pic email"
        });
        await Chat.findByIdAndUpdate(chatId,{
            latestMessage: message,
        })

        res.json(message);
    }catch(error){
        res.status(400);
        throw new Error(error.message);
    }
})

const allMessage = asyncHandler(async(req,res)=>{
    const {chatId} = req.params;
    try{
        const messages = await Message.find({chat: chatId}).populate("sender","name pic email").populate("chat");

        res.json(messages);
    }catch(error){
        res.status(400);
        throw new Error(error.message);
    }
})


export { sendMessage,allMessage };