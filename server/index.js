const express = require("express");
const dotenv = require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./user_model.js");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const JWT_SECRET = "ThisIsJWTSecret";

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(
  "mongodb+srv://admin:12345@cluster0.jq6cp0d.mongodb.net/?retryWrites=true&w=majority",
  () => {
    console.log("DATABASE CONNECTED TO MONGOOSE");
  }
);

app.post(
  "/api/createuser",
  [
    body("password", "Password must be atleast 8 characters long").isLength({
      min: 5,
    }),
    body("email", "Please enter a valid email").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      //Unique email checker
      let userEmail = await User.findOne({ email: req.body.email });
      if (userEmail) {
        return res.status(400).json({ error: "This email is already in use" });
      }
      //Unique user checker
      let userName = await User.findOne({
        username: req.body.username,
      });
      if (userName) {
        return res.status(400).json({ error: "This username already exists" });
      }

      const salt = await bcrypt.genSalt(15);
      const SecuredPassword = await bcrypt.hash(req.body.password, salt);

      // User Creation
      const user = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: SecuredPassword,
      });

      const data = {
        id: user.id,
      };
      const authToken = jwt.sign(data, JWT_SECRET);
      res.status(200).json({ authToken });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Intternal Server Error");
    }
  }
);

//2. ROUTE TO =>  USER LOGIN : POST(/api/auth/login)   LOGIN NOT REQUIRED
app.post(
  "/api/login",
  [
    body("email", "Enter a valid mail").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "User does not exist" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ error: "Wrong Password" });
      }

      const data = {
        id: user.id,
      };
      const authToken = jwt.sign(data, JWT_SECRET);
      res.status(200);
      res.json({ authToken });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);
// console.log(port);
app.listen(port, () => console.log(`SERVER STARTED on port:${port}`));
