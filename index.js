import express from 'express';

const app = express();

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