const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user.id, expectedOutput, '👹They do not match!');
  });

  it('it should return undefined when passed an email not in database', function() {
    const user = getUserByEmail("notinDatabase@gmail.com", testUsers);
    const expectedOutput = undefined;
    assert.isUndefined(user, 'no user defined by email');
  });
});