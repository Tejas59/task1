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



app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  console.log("Received registration request:", { name, email, password });

  UserModel.findOne({ email: email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      } else {
        // Validate password length
        if (password.length < 5) {
          return res.status(400).json({ error: "Password must be at least 5 characters long" });
        }

        bcrypt
          .hash(password, 10)
          .then((hash) => {
            console.log("Generated hash:", hash);
            UserModel.create({ name, email, password: hash })
              .then((user) => {
                console.log("User registered successfully:", user);
                res.json("success");
              })
              .catch((err) => {
                console.error("Error registering user:", err);
                res.status(500).json({ error: "Error registering user" });
              });
          })
          .catch((err) => {
            console.error("Error hashing password:", err);
            res.status(500).json({ error: "Error hashing password" });
          });
      }
    })
    .catch((err) => {
      console.error("Error checking existing user:", err);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.post("/", (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({ email: email }).then((user) => {
    if (user) {
     if (user.lockedUntil && user.lockedUntil > new Date()) { // Use new Date() to get current UTC timestamp
        const remainingTime = new Date(user.lockedUntil - new Date()); // Calculate remaining time using UTC timestamps
        return res.status(403).json({
          message: `Account is locked. Please try again after ${remainingTime.getUTCHours()} hours, ${remainingTime.getUTCMinutes()} minutes, and ${remainingTime.getUTCSeconds()} seconds.`,
        });
      }
      bcrypt.compare(password, user.password, (err, response) => {
        if (response) {
          UserModel.findOneAndUpdate({ email }, { loginAttempts: 0 })
            .then(() => {
              const token = jwt.sign(
                { email: user.email, role: user.role },
                "jwt-secret-key",
                { expiresIn: "1d" }
              );
              res.cookie("token", token);
              return res.json({
                status: "success",
                role: user.role,
                name: user.name,
              });
            })
            .catch((err) => {
              console.error("Error updating login attempts:", err);
              return res.status(500).json({
                error: "Internal server error",
              });
            });
        } else {
          UserModel.findOneAndUpdate(
            { email },
            { $inc: { loginAttempts: 1 }, lastLoginAttempt: Date.now() },
            { new: true }
          )
            .then((updatedUser) => {
              if (updatedUser.loginAttempts >= 5) {
                const lockExpiry = new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ); 
                UserModel.findOneAndUpdate(
                  { email },
                  { 
                    loginAttempts: 0, 
                    lockedUntil: lockExpiry 
                  }
                )
                  .then(() => {
                    return res.status(403).json({
                      message: "Account locked, please try again later.",
                    });
                  })
                  .catch((err) => {
                    console.error("Error locking account:", err);
                    return res.status(500).json({
                      error: "Internal server error",
                    });
                  });
              } else {
                return res.json("The password is incorrect");
              }
            })
            .catch((err) => {
              console.error("Error updating login attempts:", err);
              return res.status(500).json({
                error: "Internal server error",
              });
            });
        }
      });
    } else {
      return res.json("No record existed");
    }
  });
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