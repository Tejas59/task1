const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const UserModel = require("./models/User.js");
const LoginAttemptModel = require("./models/Attempt.js");

const app = express();

app.use(express.json());

app.use(cors({
    origin:["http://localhost:5173"],
    methods:["GET", "post"],
    credentials: true
}));


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

    if (user.lockedUntil > new Date()) {
      const remainingTime = new Date(user.lockedUntil - new Date());
      return res.status(403).json({
        message: `Account is locked. Please try again after ${remainingTime.getUTCHours()} hours, ${remainingTime.getUTCMinutes()} minutes, and ${remainingTime.getUTCSeconds()} seconds.`,
      });
    }

    const response = await bcrypt.compare(password, user.password);
    console.log('After bcrypt.compare:', response);

    if (response) {
      await LoginAttemptModel.deleteMany({ email, outcome: 'failure' });
      return res.json({ status: "success", name: user.name });
    } else {
      const now = new Date();
      // create the failed login attempt 
      await LoginAttemptModel.create({ email, timestamp: now, outcome: 'failure' });

      const failedAttemptsCount = await LoginAttemptModel.countDocuments({
        email,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        outcome: 'failure'
      });


      if (failedAttemptsCount >= 5) {
        // Lock the account
        const lockExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await UserModel.findOneAndUpdate({ email }, { lockedUntil: lockExpiry });
        await LoginAttemptModel.deleteMany({ email, outcome: 'failure' });
        return res.status(403).json({
          message: "Your account is locked due to multiple failed login attempts within the last 24 hours. Please try again later.",
          lockedUntil: lockExpiry
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
  .connect("mongodb+srv://tejasvaidya59:mRfp17JPirHGDnpw@cluster0.ut3opzj.mongodb.net/temp?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected")
  })
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("Error:", err));