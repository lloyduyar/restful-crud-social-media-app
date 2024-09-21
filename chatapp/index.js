const app = require("express")();
const cors = require("cors");
app.use(cors());
const http = require("http").createServer(app);
const port = 3000;
const io = require("socket.io")(http);

io.on("connection", (socket) => {
  socket.on("login", ({ name, room }, callback) => {});

  socket.on("sendMessage", (message) => {});

  socket.on("disconnect", () => {});
});
app.get("/", (req, res) => {
  res.send("server is up and running");
});

http.listen(port, () => {
  console.log("3000");
});
