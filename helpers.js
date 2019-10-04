//----checks if emails match in user database
const getUserByEmail = function(email, database) {
  let user;
  for (let id in database) {
    if (database[id].email === email)
      user = database[id];
  }
  return user;
};



module.exports = { getUserByEmail };