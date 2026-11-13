if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in .env. Add a long random string.');
}

module.exports = process.env.JWT_SECRET;