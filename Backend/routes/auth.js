const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const jwtGen = require('../utils/jwtGen');
const validInfo = require('../middleware/validInfo');
const authorization = require('../middleware/userAuth');

//Sign in
router.post('/signup', validInfo, async (req, res, next) => {
  try {
    const {
      name,
      password,
      gender,
      date_of_birth,
      email,
      address,
      state,
    } = req.body;

    const user = await db.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    if (user.rows.length !== 0) {
      return res.status(401).json('User already exist');
    }
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (name, email, password, gender, date_of_birth, address, state) VALUES($1,$2,$3,$4,$5,$6,$7)  RETURNING *',
      [name, email, bcryptPassword, gender, date_of_birth, address, state]
    );
    const token = jwtGen(newUser.rows[0].id);
    res.json({ token });
  } catch (err) {
    return next(err);
  }
});

// login
router.post('/login', validInfo, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (user.rows.length === 0) {
      return res.status(401).json('Invalid Credential');
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json('Incorrect Password');
    }

    const token = jwtGen(user.rows[0].id);
    res.json({ token });
  } catch (err) {
    // console.error(err.message);
    // res.status(500).send('Server Error');
    return next(err);
  }
});

router.get('/verify', authorization, async (req, res) => {
  try {
    res.json(true);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
