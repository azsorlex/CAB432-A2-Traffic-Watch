const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const redis = require('redis');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
require('dotenv').config();

const bucketName = 'alex-ethan-a2-s3';

/* Query the QLDTraffic API and send the results to the client-side */
router.get('/', function (req, res, next) {
  res.render('index', { MAPS_JS_API_KEY: process.env.MAPS_JS_API_KEY })
});

/* Query S3 to retrieve the QLDTraffic API results */
router.get('/getwebcamdata', function (req, res, next) {
  const cache = redis.createClient(); // Use this for local development
  //const cache = redis.createClient({ host: 'alex-ethan-ass2-cache.km2jzi.ng.0001.apse2.cache.amazonaws.com', port: 6379 });

  const key = "QLDTrafficResults";
  cache.on("connect", () => {
    cache.get(key, function (err, cacheRes) {
      if (cacheRes) { // Return the data from the cache if it's there and update the expiry
        cache.expire(key, 30 * 60);
        res.json(JSON.parse(cacheRes));
        cache.quit();

      } else { // Otherwise fetch it from S3 and add it to the cache
        s3.getObject({ Bucket: bucketName, Key: key }, (err, s3Result) => {
          if (s3Result) {
            cache.set(key, s3Result.Body, 'EX', 30 * 60);
            res.json(JSON.parse(s3Result.Body));
          } else {
            res.json[{}]; // Just a blank response
          }
          cache.quit();
        });
      }
    });
  });
});

/* Query ElastiCache to retrieve the current and day counts for the chosen cam */
router.get('/getcounts/:id', function (req, res, next) {
  const { id } = req.params;
  const cache = redis.createClient(); // Use this for local development
  //const cache = redis.createClient({ host: 'alex-ethan-ass2-cache.km2jzi.ng.0001.apse2.cache.amazonaws.com', port: 6379 });

  cache.on("connect", () => {
    cache.get(`${id}:CurrentCount`, function (e1, r1) {
      let result = {};
      let counts=[];
      if (r1) {
        counts.push(r1);
      } else {
        counts.push("0");
      }
      cache.get(`${id}:DayCount`, function (e2, r2) {
        if (r2) {
          counts.push(r2);
        } else {
          counts.push("0");
        }
        cache.get(`${id}:PredictionBoxes`, function (e3, r3) {
          res.json({ counts: counts, boxes: JSON.parse(r3) });
          cache.quit();
        });
      });
    });
  });
});

/* Query S3 and ElastiCache to retrieve the graph data and total vehicle count (which is graph data plus current vehicle count) */
router.get('/getgraph/:id', function (req, res, next) {
  const key = `${req.params.id}:HourlyCounts`;
  const params = { Bucket: bucketName, Key: key };

  s3.getObject(params, (err, s3Result) => {
    if (s3Result) { // Get the past hours array for the camera
      res.json(JSON.parse(s3Result.Body));
    } else { // Otherwise return a blank array
      res.json([]);
    }
  });
});

module.exports = router;