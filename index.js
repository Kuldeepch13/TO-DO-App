import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import "dotenv/config";
import {User, Todo, syncDB} from "./db.js";



await syncDB();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;

const publicPath = path.resolve("public");
app.use(express.static(publicPath));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Db connection
// const dbName = "node-project";
// const collectionName = "TO-DO";
// const url = "mongodb://localhost:27017";
// const client = new MongoClient(url);
// const connection = async () => {
//   const connect = await client.connect();
//   return await connect.db(dbName);
// };

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


  // const db = await connection();
  // const users = db.collection("users");


  const existing = await User.findOne({ where:{email: req.body.email } });
  if (existing) return res.send("User already exists");

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  await User.create({ email: req.body.email, password: hashedPassword });
  res.redirect("/login");
});

//it will show login page
app.get("/login", (req, res) => res.render("login"));

//it will Handle login
app.post("/login", async (req, res) => {
  // const db = await connection();
  // const users = db.collection("users");

  const user = await User.findOne({ where:{email: req.body.email} });
  if (!user) return res.send("! Invalid Credentials");

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) return res.send("! Invalid Credentials");

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
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
  // const db = await connection();
  // const collection = db.collection(collectionName);
  const result = await Todo.findAll({ where: {userId: req.user.userId} });
  res.render("list", { result });
});

app.get("/add", authMiddleware, (req, res) => {
  res.render("add");
});

app.get("/update", authMiddleware, (req, res) => {
  res.render("update");
});

app.post("/add", authMiddleware, async (req, res) => {
  // const db = await connection();
  // const collection = db.collection(collectionName);
  await Todo.create({
    title: req.body.title,
    description: req.body.description,
    userId: req.user.userId,
  });
  res.redirect("/add");
});


//delete one todo
app.get("/delete/:id", authMiddleware, async (req, res) => {
  const deleted = await Todo.destroy({
      where:{id: req.params.id, userId: req.user.userId}
});
  if (deleted) {
    res.redirect("/");
  } else {
    res.send("Some Error");
  }
});


//show updated form
app.get("/update/:id", authMiddleware, async (req, res) => {
  const result = await Todo.findOne({ where:{id: req.params.id, userId: req.user.userId }});
  if (result) {
    res.render("update", { result });
  } else {
    res.send("Some Error");
  }
});



//save the updated todo
app.post("/update/:id", authMiddleware, async (req, res) => {
  await Todo.update(
    {title: req.body.title, description: req.body.description },
    {where: {id: req.params.id, userId: req.user.userId}}
  );
  res.redirect("/");
});



//multi delete
app.post("/multi-delete", authMiddleware, async (req, res) => {
  let selectedTask = undefined;
  if (Array.isArray(req.body.selectedTask)) {
    selectedTask = req.body.selectedTask;
  } else {
    selectedTask = [req.body.selectedTask];
  }

  await Todo.destroy({
    where: {
      id: selectedTask,
      userId: req.user.userId
    }
  });
res.redirect("/");
});


app.listen(3200);
