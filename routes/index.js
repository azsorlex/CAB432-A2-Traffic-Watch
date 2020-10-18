const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
require('dotenv').config();

const bucketName = 'alex-ethan-a2-s3';

/* Query the QLDTraffic API and send the results to the client-side */
router.get('/', function(req, res, next) {
  res.render('index', { MAPS_JS_API_KEY: process.env.MAPS_JS_API_KEY })
});

/* Query S3 to retrieve the QLDTraffic API results */
router.get('/getwebcamdata', function (req, res, next) {
  s3.getObject({ Bucket: bucketName, Key: "QLDTrafficResults" }, (err, s3Result) => {
    if (s3Result) {
      res.json(JSON.parse(s3Result.Body));
    } else {
      res.json[{}]; // Just a blank response
    }
  });
});

module.exports = router;