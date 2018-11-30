const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

class User {
  /**
   * @param {string} id
   * @param {string} name
   * @param {string} email
   */
  constructor(id, name, email) {
    this.id = id;
    this.myName = name;
    this.myEmail = email;
    this.myMatchName = "";
    this.myMatchEmail = "";
    this.currAdjList = [];
  }
}

function UserPayload() {
  this.id = '';
  this.name = '';
  this.email = '';
  this.noMatch = [];
}

router.post('/', function (req, res, next) {
  res.setHeader('Content-Type', 'application/json');

  /**
   * @type Array.<UserPayload>
   */
  const users = req.body;

  if (users.length < 2) {
    res.send(JSON.stringify({
      status: "failure",
      msg: "You need at least 2 users",
    }));
    return;
  }

  // Construct list of users and their adj matrix
  const matrix = users.map((user, i) => {
    const u = new User(user.id, user.name, user.email);

    // Construct adj matrix
    u.currAdjList = users.map(({id}, j) => (
      j === i || user.noMatch.includes(id) ? 0 : 1
    ));
    return u;
  });

  // Sort matrix by sum
  matrix.sort((i, j) => (
    i.currAdjList.reduce((a, b) => a + b, 0) - j.currAdjList.reduce((a, b) => a + b, 0)
  ));

  // Find matches
  for (let i = 0; i < matrix.length; i++) {
    // Construct array of possible indexes in matrix
    const options = [];
    for (let j = 0; j < matrix[i].currAdjList.length; j++) {
      if (matrix[i].currAdjList[j] !== 0) {
        options.push(j);
      }
    }

    if (options.length === 0) {
      res.send(JSON.stringify({
        status: "failure",
        msg: `Cycled. The current configuration does not seem possible`,
      }));
      return;
    }

    // Pick a random number out of possible indexes
    const matchIndex = options[Math.floor(Math.random() * options.length)];

    // Assign matched user to current user
    matrix[i].myMatchName = matrix[matchIndex].myName;
    matrix[i].myMatchEmail = matrix[matchIndex].myEmail;

    // Zero matrix for the random index
    for (let j = 0; j < matrix.length; j++) {
      matrix[j].currAdjList[matchIndex] = 0;
    }
  }

  // Construct and send the emails
  const invalidEmails = [];
  const emails = [];
  let user;
  for (let i = 0; i < matrix.length; i++) {
    user = matrix[i];
    if (!validateEmail(user.myEmail)) {
      invalidEmails.push(user.myEmail);
    }
    emails.push({
      santa: {
        name: user.myName,
        email: user.myEmail,
      },
      matched: {
        name: user.myMatchName,
        email: user.myMatchEmail,
      }
    })
  }
  if (invalidEmails.length > 0) {
    res.send(JSON.stringify({
      status: "failure",
      msg: `Invalid emails: ${invalidEmails.toString()}`,
    }));
    return;
  }

  if (process.env.env === "PROD")
    sendEmails(emails);
  res.send(JSON.stringify({
    status: "success",
    msg: "Successfully sent the emails!"
  }));
});

function sendEmails(emails) {
  const transporter = nodemailer.createTransport({
    pool: true,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // use TLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PWD
    }
  });
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log('Server is ready to take our messages');
    }
  });

  emails.forEach(({santa, matched}) => {
    console.log(`${santa.email} - ${matched.email}`);
    transporter.sendMail({
      ...generateEmail(santa.name, matched.name),
      subject: 'Secret Santa Assignment!',
      from: 'SecretSanta@r0s.io', // listed in rfc822 message header
      to: santa.email, // listed in rfc822 message header
      envelope: {
        to: `${santa.name} <${santa.email}>`,
        from: 'SecretSanta <SecretSanta@r0s.io>', // used as MAIL FROM: address for SMTP
      }
    }, sendMailCB);
  });
}

function generateEmail(santa, matched) {
  const text = `Howdy ${santa}!
    
    You have been matched with ${matched}!
    `;
  return {
    text, html: text,
  }
}

function sendMailCB(error, info) {
  if (error) {
    return console.log(error);
  }
  console.log('Message sent: ' + info.response);
}

// https://stackoverflow.com/a/46181/7249729
function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

module.exports = router;
