const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


//----generates a random six digit alphnumerical string represent short URL
const generateRandomString = function() {
  let shortURL = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    shortURL += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return shortURL;
};


//---return register endpoint template
app.get('/register', (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["randomID"] };
  res.render('email_register', templateVars);
});

//---
app.post('/register', (req, res) => {
  res.cookie('randomID', req.body.email);
  const randomID = generateRandomString();
  users[randomID] = {
    id: randomID,
    email: req.body.email,
    password: req.body.password,
  };
  res.cookies('user_id', randomID);
  console.log(req.body.email);
  res.redirect('/urls');
});


//----login saves cookie
app.post("/login", (req, res) => {
  res.cookie("username",req.body.username);
  res.redirect(`/urls`);
});


//----index of stored urls
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});


//----If url is valid, redirect to longURL else 404
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


//----let user enter new url
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});


//----logout
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});


//----update longURL
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  res.send("urls_show", {shortURL: shortURL, urlDatabase: urlDatabase});
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});



app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL] };
  res.render("urls_show", templateVars);
});

//---generates new short url
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
  console.log(req.body);
});


//----posts updated url
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.newURL;
  urlDatabase[shortURL] = longURL;
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
  res.redirect(`/urls/${shortURL}`);
});


// ---- deletes the url from the database
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});