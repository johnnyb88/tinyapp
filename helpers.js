//----checks if emails match in user database
const getUserByEmail = function(email, database) {
  let user;
  for (let id in database) {
    if (database[id].email === email)
      user = database[id];
  }
  return user;
};

//----- generates a random six digit alphnumerical string represent short URL -----//
const generateRandomString = function() {
  let shortURL = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    shortURL += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return shortURL;
};

module.exports = { getUserByEmail, generateRandomString };