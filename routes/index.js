const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');
require('dotenv').config();

/* Query the QLDTraffic API and send the results to the client-side */
router.get('/', function(req, res, next) {
  res.render('index', { MAPS_JS_API_KEY: process.env.MAPS_JS_API_KEY })
});

/* Query S3 to retrieve the QLDTraffic API results */
router.get('/getwebcamdata', function (req, res, next) {
  res.json([{}]); // Just a blank response. Replace with S3 fetching all of the webcam data
});

module.exports = router;