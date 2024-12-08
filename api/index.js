const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Place = require("./models/Place");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");
const { protect } = require("./middleware/auth");
const Booking = require("./models/Booking");
const { error } = require("console");
require("dotenv").config();
const app = express();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

app.use(express.json());

app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

// mongoose.connect(process.env.MONGO_URL);
// const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
    // serverSelectionTimeoutMS: 90000  // 30 seconds timeout
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});


// register endpoint
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }
  try {
    const newUser = new User({
      name,
      email,
      password,
    });
    const user = await newUser.save();

    const token = generateToken(user.id);
    console.log("Token", token);
    res.status(201).json({
      _id: user.id,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(422).json(error);
  }
});

// login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = generateToken(user.id);
    res.header("Authorization", `Bearer ${token}`).json({
      _id: user.id,
      email: user.email,
      name: user.name,
      token,
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

app.get("/test", (req, res) => {
  res.json("test ok");
});

// profile endpoint
// app.get("/profile", async (req, res) => {
//   const { id } = req.user;
//   if (id) {
//     try {
//       const { name, email, _id } = await User.findById(id);
//       res.json({ name, email, _id });
//     } catch (error) {
//       res.status(400).json(error);
//     }
//   }
// });

// logout endpoint
app.post("/logout", protect, (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// upload photo by link endpoint
app.post("/upload-by-link", protect, async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  try {
    await imageDownloader.image({
      url: link,
      dest: __dirname + "/uploads/" + newName,
    });
    res.json(newName);
  } catch (error) {
    res.status(500).json({ error: "Image download failed" });
  }
});

const photosMiddleware = multer({ dest: "uploads" });

// upload photo from your device
app.post("/upload", photosMiddleware.array("photos", 100), async (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace("uploads", ""));
  }
  res.json(uploadedFiles);
});

//places data submit
app.post("/places", protect, async (req, res) => {
  const userData = req.user;
  console.log("userData", userData);
  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  try {
    const newPlace = new Place({
      owner: userData.id,
      price,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    });
    const placeDoc = await newPlace.save();
    res.json(placeDoc);
  } catch (error) {
    res.status(500).json({ error: "Place creation failed" });
  }
});

app.get("/user-places", protect, async (req, res) => {
  const userData = req.user;
  try {
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  } catch (error) {
    res.status(500).json({ error: "Fetching places faileds" });
  }
});

app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});

// To update the new place Or Edit the data
app.put("/places", protect, async (req, res) => {
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;

  const placeDoc = await Place.findById(id);
  placeDoc.set({
    title,
    address,
    photos: addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  });
  await placeDoc.save();
  res.json("Ok");
});

app.get("/places", async (req, res) => {
  res.json(await Place.find());
});

// Booking endpoint
app.post("/bookings", protect, async (req, res) => {
  let userData = req.user;
  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } =
    req.body;
  Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user: userData.id,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((error) => {
      throw error;
    });
});

// getting bookings
app.get("/bookings", protect, async (req, res) => {
  const userData = req.user;
  const response = await Booking.find({ user: userData.id }).populate("place");
  res.json(response);
});

app.listen(4000, () => {
  console.log("Server started!!");
});
