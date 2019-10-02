const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'secret-string'],
}));

//----glogal user
app.use((req, res, next) => {
  res.locals = {
    userDB: users,
    urlDB: urlDatabase
  };
  res.locals.user = users[req.session.user_id];
  next();
});



//----url database
const urlDatabase = {
  "b2xVn2": { longURL : "http://www.lighthouselabs.ca", shortURL: "b2xVn2", userID: "a@a"},
  "9sm5xK": { longURL: "http://www.google.com", shortURL: "9sm5xk", userID: "a@a"}
};



//----user database
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
  },
  "user3RandomID": {
    id: "user2RandomID",
    email: "a@a",
    password: "x"
  }
};



//----Function that generates a random string
const generateRandomString = function() {
  let generatedID = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    generatedID += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return generatedID;
};



//----function that checks email
const checkEmail = function(email) {
  for (let id in users) {
    if (users[id].email === email)
      return true;
  }
  return false;
};


//----email and password correct
const loginUser = function(email, password) {
  let accepted = false;
  let userId;
  for (let key in users) {
    if ((users[key].email === email) && (bcrypt.compareSync(users[key].password))) {
      accepted = true;
      userId = key;
      break;
    }
  }
  return userId;
};

//----identifies if user can edit by id
const checkUserID = function(userID, shortURL) {
  for (let id in urlDatabase) {
    if ((urlDatabase[id].userID === userID) && (urlDatabase[id].shortURL === shortURL))
      return true;
  }
  return false;
};

//----shows user their specific index of urls
const urlsForUserID = function(id) {
  let list = {};
  for (let item in urlDatabase) {
    if (id === urlDatabase[item].userid) {
      list[item] = urlDatabase[item].url;
    }
  }
  return list;
};



//----renders login page
app.get("/login", (req, res) => {
  let userId = req.session.user_id;
  if (userId) {
    res.redirect('/urls');
  } else {
    res.render("login");
  }
});


//---- email register endpoint template
app.get('/register', (req, res) => {
  let userId = req.session.user_id;
  if (userId) {
    res.redirect('/urls');
  } else {
    res.render("email_register");
  }
//   let templateVars = { urls: urlDatabase, username: req.cookies[req.session.user_id] };
//   res.render('email_register', templateVars);
});

//----index of stored urls
app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  if (userId) {
    let templateVars = {
      userId: req.session.user_id,
      urls: urlDatabase,
      user
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});



//----let user enter new url
app.get("/urls/new", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  if (userId) {
    let templateVars = {
      urls: urlDatabase,
      user
    };
    res.render("urls_new", templateVars);
  } else {
    res.render("login");
  }
});



//----form for updating url
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let userId = req.session.user_id;
  let user = users[userId];
  if (checkUserID(userId, shortURL)) {
    let templateVars = {
      urls: urlDatabase,
      shortURL: req.params.id,
      urlObj: urlDatabase[req.params.id],
      user
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("You can only update your own urls");
  }
});



//----shortURL PAGE
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(400).send('URL submitted is incorrct.');
  } else {
    res.redirect(urlDatabase[req.params.id].longURL);
  }
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//----redirect to login
app.get("/", (req, res) => {
  let userId = req.session.user_id;
  if (userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

//----update longURL
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let templateVars = { shortURL: shortURL, urls: urlDatabase, username: req.cookies[req.session.user_id] };
  res.render("urls_show", templateVars);
});




// //----If url is valid, redirect to longURL else 404
// app.get("/u/:shortURL", (req, res) => {
//   let longURL = urlDatabase[req.params.shortURL];
//   res.redirect(longURL);
// });



//---check if email exists
app.post('/register', (req, res) => {
  let userID = generateRandomString();
  let newUser = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };

  if (!newUser.password || !newUser.email) {
    res.status(400).send("Enter an email and password");
    //loops through users to check if email exists
  } else if (checkEmail(newUser.email)) {
    res.status(400).send("A user with this email already exists.");
  } else {
    users[userID] = newUser;
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});




//----login
app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Enter both an email and a password");
    return;
  }
  let email = req.body.email;
  let password = req.body.password;
  let result = loginUser(email, password);
  if (result) {
    //----user and password match
    req.session.user_id = result;
    res.redirect('/urls');
  } else {
    //----user id and password dont match
    res.status(403).send("Password or email address is wrong");
  }
});



//---generates new short url
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let userId = req.session.user_id;
  let user = users[userId];
  if (userId) {
    urlDatabase[shortURL] = {
      shortURL,
      longURL,
      userID: userId
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(400).send("Login to access your urls");
  }
});



//----posts updated url
app.post("/urls/:id", (req, res) => {
  let userId = req.session.user.user_id;
  if (userId) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.status(400).send("Login to update URLs");
  }
});



// ---- deletes the url from the database
app.post("/urls/:id/delete", (req, res) => {
  const UrlObj = urlDatabase[req.params.id];
  if (UrlObj.userID === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(403).send("You may only delete your own urls.");
  }
});



//----logout
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});