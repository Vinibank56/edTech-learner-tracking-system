// Set cookies
const jwt = require('jsonwebtoken');
const setTokenCookies= (res, tokens) => {
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};
module.exports = setTokenCookies;