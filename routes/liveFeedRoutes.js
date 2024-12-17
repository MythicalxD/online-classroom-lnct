const { Server } = require("socket.io");

const liveFeedSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinClassroom", (classroomId) => {
      socket.join(classroomId);
      console.log(`Socket ${socket.id} joined classroom ${classroomId}`);
    });

    socket.on("sendMessage", ({ classroomId, message, user }) => {
      io.to(classroomId).emit("receiveMessage", { message, user });
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });
};

module.exports = liveFeedSocket;
