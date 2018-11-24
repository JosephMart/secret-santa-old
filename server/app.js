const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

require('dotenv').config();

const genMatches = require('./routes/genMatches');

const app = express();

console.log(process.env.env === "PROD");

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/santa-api/genMatches', genMatches);

module.exports = app;
