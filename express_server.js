const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const morgan = require("morgan");
const bcrypt = require('bcrypt');
const { getUserByEmail, generateRandomString } = require('./helpers');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('combined'));


//----- CookieSession -----//
app.use(cookieSession({
  name: 'session',
  secret: 'thisissupersecret'
}));


//----- URL Database -----//
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", shortURL: "b2xVn2", userID: "astb34" },
  "9sm5xK": { longURL: "http://www.google.com", shortURL: "9sm5xK", userID: "yoyo" },
  "9sm5xg": { longURL: "http://www.example.com", shortURL: "9sm5xg", userID: "yoyo" }
};


//----- User Database -----//
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



//-----FUINCTIONS-----//



//----- gets a user by their id -----//
const getUserById = function(id) {
  if (users[id])
    return users[id];
};



//----- Returns users urls -----//
const urlsForUser = function(id) {
  let list = {};
  for (let key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      list[key] =  urlDatabase[key];
    }
  }
  return list;
};



//----- Email and password correct and correspond -----//
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



//-----ALL MY GETS-----//


//-----index of stored urls -----//
app.get("/urls", (req, res) => {
  let user = getUserById(req.session.user_id);
  if (user) {
    let urlDatabase = urlsForUser(user.id);
    let templateVars = { urls: urlDatabase, user };
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});



//----- renders login page -----//
app.get("/login", (req, res) => {
  let user = getUserById(req.session.user_id);
  let templateVars = { urls: urlDatabase, user: req.session.user_id };
  if (user) {
    res.redirect('/urls');
  } else {
    res.render('login', templateVars);
  }
});



//----- let user enter new url -----//
app.get("/urls/new", (req, res) => {
  let user = getUserById(req.session.user_id);
  let templateVars = { urls: urlDatabase, user };
  if (!user) {
    res.redirect('/login');
  } else {
    res.render("urls_new", templateVars);
  }
});



//----- email registration -----//
app.get("/register", (req, res) => {
  let user = getUserById(req.session.user_id);
  let templateVars = { urls: urlDatabase, user: req.session.user_id };
  if (user) {
    res.redirect('/urls');
  } else {
    res.render("user_registration", templateVars);
  }
});



//----- ShortURL Page -----//
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send('url not found');
  }
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});



//----- provides form for updating url -----//
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send('url not found');
  }
  let user = getUserById(req.session.user_id);
  let shortURL = req.params.shortURL;
  if (!user) {
    res.status(401).send('You cannot access this url');
  } else {
    let templateVars = {
      shortURL: shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user
    };
    res.render("urls_show", templateVars);
  }
});



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



//----- Redirect to the login -----//
app.get("/", (req, res) => {
  let userId = req.session.user_id;
  if (userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

  


//-------MY POSTS--------//

//----- update longURL -----//
app.post("/urls/:id/update", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/urls");
  } else {
    let userUrls = urlsForUser(req.session.user_id);
    if (userUrls[req.params.id]) {
      let shortURL = req.params.id;
      urlDatabase[shortURL].longURL = req.body.newURL;
      res.redirect('/urls');
    } else {
      res.status(403).send('You may only edit your own urls.');
    }
  }
});



//----- generates new short url -----//
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    shortURL: shortURL,
    userID: req.session.user_id
  };
  
  res.redirect(`/urls/${shortURL}`);
});



//----- post updated url -----//
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.newURL;
  urlDatabase[shortURL] = longURL;
  let templateVars = { urls: urlDatabase, user: req.session.user_id };
  res.render("urls_index", templateVars);
  res.redirect(`/urls/${shortURL}`);
});



//-----checks user email and password for login -----//
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
    req.session.user_id = result;
    res.redirect('/urls');
  } else {
    //user id and password didnt match
    res.status(403).send('Password or email address wrong');
    res.redirect(`/urls`);
  }
});



//----- adds new user to database -----//
app.post("/register", (req, res) => {
  if (!req.body.password || !req.body.email) {
    res.status(404).send("Please enter a email address and password");
  }
  
  if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("That email already exists");
    return;
  } else {
    
    const randomID = generateRandomString();
    users[randomID] = {
      id: randomID,
      email: req.body.email,
      hashedPassword: bcrypt.hashSync(req.body.password, 10),
    };
    req.session.user_id = randomID;
  }
  res.redirect("/urls");
});


  
//----- deletes url -----//
app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/urls");
  } else {
    let userUrls = urlsForUser(req.session.user_id);
    if (userUrls[req.params.id]) {
      delete urlDatabase[req.params.id];
      res.redirect('/urls');
    } else {
      res.status(403).send('You may only delete your own urls.');
    }
  }
});



//----- logout -----//
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
  
});



//----- listen port -----//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});