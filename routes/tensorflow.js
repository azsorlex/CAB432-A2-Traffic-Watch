const express = require('express');
const router = express.Router();
const axios = require('axios');
const AWS = require('aws-sdk');
let crontab = require('node-crontab');
require('dotenv').config();

require('@tensorflow/tfjs-backend-cpu');
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const image = require('get-image-data');
const redis = require('redis');
AWS.config.loadFromPath('./config.json');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const model = cocoSsd.load(); // Pre-load the model for all instances
const { QLDTRAFFIC_GEOJSON_API_KEY } = process.env;
let cronJobs = [];
//Setup S3 bucket storage
const bucketName = 'alex-ethan-a2-s3';

const cache = redis.createClient(); // Use this for local development
/*const cache = redis.createClient({
  host: 'alex-ethan-ass2-cache.km2jzi.ng.0001.apse2.cache.amazonaws.com',
  port: 6379
});*/

crontab.scheduleJob("59 6 * * *", () => { // Create a job that runs at 6:59am that queries the QLDTraffic API and creates a new cron job for every camera returned
  cronJobs.forEach(job => { // Delete the stored job(s)
    crontab.cancelJob(job);
  });
  cronJobs = [];

  axios.get(`https://api.qldtraffic.qld.gov.au/v1/webcams?apikey=${QLDTRAFFIC_GEOJSON_API_KEY}`)
    .then((response) => {

      const uploadPromise = s3.putObject({ Bucket: bucketName, Key: "QLDTrafficResults", Body: JSON.stringify(response.data.features) }).promise(); //update the S3 camera data
      uploadPromise.then((data) => {
        console.log(`Successfully uploaded QLDTrafficResults to ${bucketName}`);
      });

      response.data.features.forEach(cam => {
        const refreshJob = crontab.scheduleJob("* 7-21 * * *", () => { // Fetch predictions for the image and store it to cache every minute
          image(cam.properties.image_url, async function (err, image) {
            const numChannels = 3;
            const numPixels = image.width * image.height;
            const values = new Int32Array(numPixels * numChannels);
            pixels = image.data;

            for (let i = 0; i < numPixels; i++) {
              for (let channel = 0; channel < numChannels; ++channel) {
                values[i * numChannels + channel] = pixels[i * 4 + channel];
              }
            }
            const outShape = [image.height, image.width, numChannels];
            const input = tf.tensor3d(values, outShape, 'int32');

            (await model).detect(input)
              .then(predictions => {
                // Only filer out "car" predictions
                let finalPredictions = [];
                predictions.forEach(prediction => {
                  if (prediction.class === "car") {
                    finalPredictions.push(prediction);
                  }
                });

                // Update the current count by adding what was currently detected on top of the current total
                let key = `${cam.properties.id}:CurrentCount`;
                cache.get(key, function (err, res) {
                  let value;
                  if (res) {
                    value = parseInt(res) + finalPredictions.length;
                  } else {
                    value = finalPredictions.length;
                  }
                  cache.set(key, value.toString());
                });

                // Update the day count
                key = `${cam.properties.id}:DayCount`;
                cache.get(key, function (err, res) {
                  let value;
                  if (res) {
                    value = parseInt(res) + finalPredictions.length;
                  } else {
                    value = finalPredictions.length;
                  }
                  cache.set(key, value.toString());
                });
              })

              .catch(error => {
                console.log(error);
              });
          });
        });

        const hourlyJob = crontab.scheduleJob("0 8-22 * * *", () => { // Get the current count, add it to the hourly counts, then reset it
          const cacheKey = `${cam.properties.id}:CurrentCount`;
          const s3Key = `${cam.properties.id}:HourlyCounts`;
          const params = { Bucket: bucketName, Key: s3Key };

          s3.getObject(params, (err, s3Result) => {
            let hourlyCounts;
            if (s3Result) { // Add the current count from cache into the existing array
              hourlyCounts = s3Result.Body;
              cache.get(cacheKey, function (e, result) { // Get the hourly count from cache
                hourlyCounts.push(parseInt(result));
              });
            } else { // Otherwise create a new one
              cache.get(cacheKey, function (e, result) { // Get the hourly count from cache
                hourlyCounts = [parseInt(result)];
              });
            }

            const objectParams = { Bucket: s3Result.Bucket, Key: s3Key, Body: JSON.stringify(hourlyCounts) };
            const uploadPromise = s3.putObject(objectParams).promise(); //update the s3 camera data
            uploadPromise.then((data) => {
              console.log(`Successfully uploaded ${s3Key} to ${bucketName}`);
            });

            cache.del(cacheKey);

          }).catch(console.log(err));
        });

        cronJobs.push(refreshJob, hourlyJob);
      });
    });
});

/* Refresh the image predictions and then cache the number of cars detected */
router.get('/refreshpredictions/:id/:url', function (req, res, next) {
  const { id } = req.params;
  const url = req.params.url;
  
  res.status(200).send();
});

/* Get the current count from cache and the count array from S3, append the current one, update the S3 object with the new value, and delete the item from cache */
router.get('/updatehourlycounts/:id', function (req, res, next) {
  const { id } = req.params;
  
  res.status(200).send();
});


/* Query ElastiCache to retrieve latest predictions for the chosen cam */
router.get('/getpredictions/:id', function (req, res, next) {
  const { id } = req.params;
  
  res.json([{}]);
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

  }).catch(console.log(err));
});

module.exports = router;