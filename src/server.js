const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

app.use(express.static(`${__dirname}/pages`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const Message = mongoose.model("Messages", {
    name: String,
    message: String,
});

mongoose
    .connect(process.env.DB_TO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((res) =>
        console.log(
            `Mongodb Database connected with HOST: ${res.connection.host}`
        )
    );

app.get("/messages", (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    });
});

app.get("/messages/:user", (req, res) => {
    const user = req.params.user;
    Message.find({ name: user }, (err, messages) => {
        res.send(messages);
    });
});

app.post("/messages", async (req, res) => {
    try {
        const message = new Message(req.body);
        const savedMessage = await message.save();
        const censored = await Message.findOne({ message: "badword" });

        if (censored) {
            await Message.remove({ _id: censored.id });
        } else {
            io.emit("message", req.body);
        }

        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
        return console.log(`Error: ${error}`);
    } finally {
        console.log("Message Posted");
    }
});

io.on("connection", () => {
    console.log("a user is connected");
});

const server = http.listen(3000, () => {
    console.log(`server is running on post: ${server.address().port}`);
});
