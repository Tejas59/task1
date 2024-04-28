const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const UserModel = require("./models/User.js");


const app = express();

app.use(express.json());

app.use(cors({
    origin:["http://localhost:5173"],
    methods:["GET", "post"],
    credentials: true
}));

app.use(cookieParser());



app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Received registration request:", { name, email, password });

  try {
    const existingUser = await UserModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    console.log("Generated hash:", hash);
    const user = await UserModel.create({ name, email, password: hash });
    console.log("User registered successfully:", user);
    return res.json("success");
  } catch (err) {
    console.error("Error registering user:", err);
    return res.status(500).json({ error: "Error registering user" });
  }
});

app.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "No record found for the provided email." });
    }

    if (user.lockedUntil  > new Date()) {
      const remainingTime = new Date(user.lockedUntil - new Date());
      return res.status(403).json({
        message: `Account is locked. Please try again after ${remainingTime.getUTCHours()} hours, ${remainingTime.getUTCMinutes()} minutes, and ${remainingTime.getUTCSeconds()} seconds.`,
      });
    }

    console.log('Before bcrypt.compare:', email, password);
    const response = await bcrypt.compare(password, user.password);
    console.log('After bcrypt.compare:', response);

    if (response) {
      await UserModel.findOneAndUpdate({ email }, { loginAttempts: 0, lastLoginAttempt: new Date() });
      const token = jwt.sign({ email: user.email, role: user.role }, "jwt-secret-key", { expiresIn: "1d" });
      console.log('JWT:', token);
      res.cookie("token", token);
      return res.json({ status: "success", role: user.role, name: user.name });
    }else if (user.lastLoginAttempt === null) {
      const now = new Date();
      const nullUser = await UserModel.findOneAndUpdate(
        { email },
        { $inc: { loginAttempts: 1 }, lastLoginAttempt: now },
        { new: true }
      );
    
      return res.status(401).json({ message: "Incorrect email or password. Please try again." });
    }
    else {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const updatedUser = await UserModel.findOneAndUpdate(
        { email, lastLoginAttempt: { $gt: twentyFourHoursAgo } },
        { $inc: { loginAttempts: 1 }, lastLoginAttempt: now },
        { new: true }
      );

      if (updatedUser && updatedUser.loginAttempts >= 5) {
        const lockExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await UserModel.findOneAndUpdate({ email }, { loginAttempts: 0, lockedUntil: lockExpiry });
        return res.status(403).json({
          message: "Your account is locked due to multiple failed login attempts within the last 24 hours. Please try again later.",
          lockedUntil: lockExpiry,
        });
      } else {
        return res.status(401).json({ message: "Incorrect email or password. Please try again." });
      }
    }
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});



mongoose
  .connect("mongodb+srv://tejasvaidya59:mRfp17JPirHGDnpw@cluster0.ut3opzj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected")
    return UserModel.collection.indexes()
  })
  .then((indexes) => {
    const nameIndex = indexes.find((index) => index.key.name === 1);
    if (nameIndex) {
      return UserModel.collection.dropIndex('name_1');
    }
  })
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("Error:", err));