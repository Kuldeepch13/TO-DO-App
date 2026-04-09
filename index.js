import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;

const publicPath = path.resolve("public");
app.use(express.static(publicPath));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Db connection
const dbName = "node-project";
const collectionName = "TO-DO";
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const connection = async () => {
  const connect = await client.connect();
  return await connect.db(dbName);
};

// authenticate middleware
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/login");
  }
};

//it will show register page
app.get("/register", (req, res) => res.render("register"));

//it will handle register
app.post("/register", async (req, res) => {
  const db = await connection();
  const users = db.collection("users");
  const existing = await users.findOne({ email: req.body.email });
  if (existing) return res.send("User already exists");

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  await users.insertOne({ email: req.body.email, password: hashedPassword });
  res.redirect("/login");
});

//it will show login page
app.get("/login", (req, res) => res.render("login"));

//it will Handle login
app.post("/login", async (req, res) => {
  const db = await connection();
  const users = db.collection("users");
  const user = await users.findOne({ email: req.body.email });
  if (!user) return res.send("! Invalid Credentials");

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) return res.send("! Invalid Credentials");

  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "1d",
  });
  res.cookie("token", token, { httpOnly: true });
  res.redirect("/");
});

//logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

app.get("/", authMiddleware, async (req, res) => {
  const db = await connection();
  const collection = db.collection(collectionName);
  const result = await collection.find().toArray();
  res.render("list", { result });
});

app.get("/add", authMiddleware, (req, res) => {
  res.render("add");
});

app.get("/update", authMiddleware, (req, res) => {
  res.render("update");
});

app.post("/add", authMiddleware, async (req, res) => {
  const db = await connection();
  const collection = db.collection(collectionName);
  const result = await collection.insertOne(req.body);
  if (result) {
    res.redirect("/");
  } else {
    res.redirect("/add");
  }
});

app.get("/delete/:_id", authMiddleware, async (req, res) => {
  const db = await connection();
  const collection = db.collection(collectionName);
  const result = await collection.deleteOne({
    _id: new ObjectId(req.params._id),
  });
  if ((await result).deletedCount > 0) {
    res.redirect("/");
  } else {
    res.send("Some Error");
  }
});

app.get("/update/:_id", authMiddleware, async (req, res) => {
  const db = await connection();
  const collection = db.collection(collectionName);
  const result = await collection.findOne({
    _id: new ObjectId(req.params._id),
  });
  if (result) {
    res.render("update", { result });
  } else {
    res.send("Some Error");
  }
});

app.post("/update/:_id", authMiddleware, async (req, res) => {
  const db = await connection();
  const collection = db.collection(collectionName);
  const filter = { _id: new ObjectId(req.params._id) };
  const updateData = {
    $set: { title: req.body.title, description: req.body.description },
  };
  const result = await collection.updateOne(filter, updateData);
  if (result) {
    res.redirect("/");
  } else {
    res.send("Some Error");
  }
});

app.post("/multi-delete", authMiddleware, async (req, res) => {
  const db = await connection();
  const collection = db.collection(collectionName);
  console.log(req.body.selectedTask);

  let selectedTask = undefined;
  if (Array.isArray(req.body.selectedTask)) {
    selectedTask = req.body.selectedTask.map((id) => new ObjectId(id));
  } else {
    selectedTask = [new ObjectId(req.body.selectedTask)];
  }

  console.log(selectedTask);
  const result = await collection.deleteMany({ _id: { $in: selectedTask } });

  if (result) {
    res.redirect("/");
  } else {
    res.send("Some Error");
  }
});

app.post("/update", (req, res) => {
  res.redirect("/");
});

app.listen(3200);
