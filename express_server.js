const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const morgan = require("morgan");
const bcrypt = require('bcrypt');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('combined'));


const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", shortURL: "b2xVn2", userID: "astb34" },
  "9sm5xK": { longURL: "http://www.google.com", shortURL: "9sm5xK", userID: "yoyo" },
  "9sm5xg": { longURL: "http://www.example.com", shortURL: "9sm5xg", userID: "yoyo" }
};


const users = {
  "userRandomID": {
    id: "yoyo",
    email: "user@example.com",
    password: "pop"
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


//-----FUINCTIONS-------//


//----- gets a user by their id
const getUserById = function(id) {
  if (users[id])
    return users[id];
};


//----checks if emails match in user object
const checkEmail = function(email) {
  for (let id in users) {
    if (users[id].email === email)
      return true;
  }
  return false;
};


//---- Identifies if user can edit by ID
const checkUserID = function(userID, shortURL) {
  for (let id in urlDatabase) {
    if ((urlDatabase[id].userID === userID) && (urlDatabase[id].shortURL === shortURL)) return true;
  }
  return false;
};


//----Returns users urls
const urlsForUser = function(id) {
  let list = {};
  for (let key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      list[key] =  urlDatabase[key];
    }
  }
  return list;
};

//===== Email and password correct and correspond =====
const loginUser = function(email, password) {
  let accepted = false;
  let userId;
  for (let key in users) {
    if ((users[key].email === email) && bcrypt.compareSync(password, users[key].hashedPassword)) {
      accepted = true;
      userId = key;
      break;
    }
  }
  return userId;
};

//----index of stored urls
app.get("/urls", (req, res) => {
  let user = getUserById(req.cookies["user_id"]);
  if (user) {
    let urlDatabase = urlsForUser(user.id);
    let templateVars = { urls: urlDatabase, user };
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});


//----get user login information
app.get("/login", (req, res) => {
  let user = getUserById(req.cookies["user_id"]);
  if (!user) {
    let templateVars = { urls: urlDatabase, user: req.cookies["user_id"] };
    res.render('login', templateVars);
  } else {
    res.end("you must login to see urls");
    res.redirect('/urls');
  }
});



//----let user enter new url
app.get("/urls/new", (req, res) => {
  let user = getUserById(req.cookies["user_id"]);
  let templateVars = { urls: urlDatabase, user };
  if (!user) {
    res.redirect("/login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  }
});


//----email registration
app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.cookies["user_id"] };
  res.render("user_registration", templateVars);
});



app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//----provides form for updating url
app.get("/urls/:shortURL", (req, res) => {
  let user = getUserById(req.cookies["user_id"]);
  let shortURL = req.params.shortURL;
  let templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user
  };
  res.render("urls_show", templateVars);
});



// update longURL
app.post("/urls/:id/update", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    let userUrls = urlsForUser(req.cookies["user_id"]);
    if (userUrls[req.params.id]) {
      let shortURL = req.params.id;
      urlDatabase[shortURL].longURL = req.body.newURL;
      res.redirect('/urls');
    } else {
      res.status(403).send('You may only edit your own urls.');
    }
  }
});
// app.post("/urls/:id/update", (req, res) => {
//   let shortURL = req.params.id;
//   res.send("urls_show", {shortURL: shortURL, urlDatabase: urlDatabase});
//   let templateVars = { urls: urlDatabase, user: req.cookies["user_id"] };
//   res.render("urls_index", templateVars);
// });


app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    shortURL: shortURL,
    userID: req.cookies.user_id
  };
  
  res.redirect(`/urls/${shortURL}`);
});


//----gets short url
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.newURL;
  urlDatabase[shortURL] = longURL;
  let templateVars = { urls: urlDatabase, user: req.cookies["user_id"] };
  res.render("urls_index", templateVars);
  res.redirect(`/urls/${shortURL}`);
});



//---checks user email and password for login
app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Enter both an email and a password");
    return;
  }
  
  let email = req.body.email;
  let password = req.body.password;
  let result = loginUser(email, password);
  if (result) {
    //user is and password matched
    res.cookie("user_id", result);
    res.redirect('/urls');
  } else {
    //user id and password didnt match
    res.status(403).send('Password or email address wrong');
    res.redirect(`/urls`);
  }
});


//---- adds new user to database
app.post("/register", (req, res) => {
  if (!req.body.password || !req.body.email) {
    res.status(400).send("Enter an email and password");
    return;
  }
  
  if (checkEmail(req.body.email) === true) {
    res.status(400).send("That email already exists");
    return;
  } else {
    
    const randomID = generateRandomString();
    users[randomID] = {
      id: randomID,
      email: req.body.email,
      hashedPassword: bcrypt.hashSync(req.body.password, 10),
    };
    res.cookie("user_id", randomID);
  }
  res.redirect("/urls");
});


  


// logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});


// ---- deletes the url from the database -------- //
// app.post("/urls/:id/delete", (req, res) => {
//   delete urlDatabase[req.params.id];
//   res.redirect(`/urls`);
// });

app.post("/urls/:id/delete", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    let userUrls = urlsForUser(req.cookies["user_id"]);
    if (userUrls[req.params.id]) {
      delete urlDatabase[req.params.id];
      res.redirect('/urls');
    } else {
      res.status(403).send('You may only delete your own urls.');
    }
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});