import express from 'express';
import path from 'path';

const app = express();
const publicPath = path.resolve('public')
app.use(express.static(publicPath))

app.set("view engine", 'ejs')

app.get("", (req, res)=>{
    res.render("list");
})

app.get("/add", (req, res)=>{
    res.render("add")
})

app.get("/update", (req, res)=>{
    res.render("update");
})

app.listen(3200);