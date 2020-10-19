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
const bucketName = 'alex-ethan-a2-s3';
const model = cocoSsd.load(); // Pre-load the model
const { QLDTRAFFIC_GEOJSON_API_KEY } = process.env;
let cronJobs = [];

const ip = "http://localhost:3000"; // Use this for local development 
//const ip = "";

const cache = redis.createClient(); // Use this for local development
//const cache = redis.createClient({ host: 'alex-ethan-ass2-cache.km2jzi.ng.0001.apse2.cache.amazonaws.com', port: 6379 });

crontab.scheduleJob("59 6 * * *", () => { // Create a job that runs at 6:59am that queries the QLDTraffic API and creates a new cron job for every camera returned
  cronJobs.forEach(job => { // Delete the stored job(s)
    crontab.cancelJob(job);
  });
  cronJobs = [];

  axios.get(`https://api.qldtraffic.qld.gov.au/v1/webcams?apikey=${QLDTRAFFIC_GEOJSON_API_KEY}`)
    .then((response) => {

      s3.putObject({ Bucket: bucketName, Key: "QLDTrafficResults", Body: JSON.stringify(response.data.features) }).promise() //update the S3 camera data
        .then(() => {
          cache.del("QLDTrafficResults");
          console.log(`Successfully updated the QLDTraffic results.`);
        })
        .catch((error) => console.log(error));

      response.data.features.forEach(cam => {
        // Just runs the refreshpredictions command at 7, instead of also writing results to S3
        const oneTimeRefreshJob = crontab.scheduleJob("0 7 * * *", () => {
          axios.get(`${ip}/tensorflow/refreshpredictions/${cam.properties.id}/${cam.properties.image_url.replace(/\//g, '$')}`)
            .then(() => crontab.cancelJob(oneTimeRefreshJob));
        });

        const refreshJob = crontab.scheduleJob("1-59 7-21 * * *", () => { // Fetch predictions for the image and store it to cache (almost) every minute
          axios.get(`${ip}/tensorflow/refreshpredictions/${cam.properties.id}/${cam.properties.image_url.replace(/\//g, '$')}`);
        });

        const hourlyJob = crontab.scheduleJob("0 8-22 * * *", () => {
          // Run the refresh job first, and then once that's done, run the hourly job. This prevents any write conflicts
          axios.get(`${ip}/tensorflow/refreshpredictions/${cam.properties.id}/${cam.properties.image_url.replace(/\//g, '$')}`)
            .then(() => { // Get the current count, add it to the hourly counts, then reset it
              axios.get(`${ip}/tensorflow/updatehourlycounts/${cam.properties.id}`);
            });
        });

        cronJobs.push(refreshJob, hourlyJob);
      });
    });

  const midnightClearing = crontab.scheduleJob("0 0 * * *", () => { // Clear most of the S3 bucket's items at midnight
    s3.listObjects({ Bucket: bucketName }, function (err, data) {
      let items = [];
      data.Contents.forEach(item => {
        if (item.Key !== "QLDTrafficResults") {
          items.push({ Key: item.Key });
        }
      });

      let params = {
        Bucket: bucketName,
        Delete: {
          Objects: items,
          Quiet: true
        }
      };
      s3.deleteObjects(params, function (err, data) {
        console.log("S3 successfully cleared.");
      });
    });
  });

  cronJobs.push(midnightClearing);
});

/* Refresh the image predictions and then cache the number of cars detected */
router.get('/refreshpredictions/:id/:url', function (req, res, next) {
  const { id } = req.params;
  const url = req.params.url.replace(/\$/g, '/');

  image(url, async function (err, image) {
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
        let predictionBoxes=[];
        predictions.forEach(prediction => {
          if (prediction.class === "car") {
            finalPredictions.push(prediction);
            predictionBoxes.push(prediction.bbox);
          }
        });

        // Update the current count by adding what was currently detected on top of the current total
        cache.get(`${id}:CurrentCount`, function (err, response) {
          let value;
          if (response) {
            value = parseInt(response) + finalPredictions.length;
          } else {
            value = finalPredictions.length;
          }
          cache.set(`${id}:CurrentCount`, value.toString(), 'EX', 180);
        });

        cache.get(`${id}:DayCount`, function (err, response) {
          let value;
          if (response) {
            value = parseInt(response) + finalPredictions.length;
          } else {
            value = finalPredictions.length;
          }
          cache.set(`${id}:DayCount`, value.toString(), 'EX', 2 * 60 * 60, function (e, r) {
            res.status(200).send();
          });
        });

        cache.set(`${id}:PredictionBoxes`, predictionBoxes.toString(), function (e, r) {
          res.status(200).send();
        });

      })
      .catch(error => console.log(error));
  });
});

/* Get the current count from cache and the count array from S3, append the current one, update the S3 object with the new value, and delete the item from cache */
router.get('/updatehourlycounts/:id', function (req, res, next) {
  const { id } = req.params;
  const cacheKey = `${id}:CurrentCount`;
  const s3Key = `${id}:HourlyCounts`;
  const params = { Bucket: bucketName, Key: s3Key };

  s3.getObject(params, (err, s3Result) => {
    let hourlyCounts;
    if (s3Result) { // Add the current count from cache into the existing array
      hourlyCounts = JSON.parse(s3Result.Body);
    } else {
      hourlyCounts = [];
    }

    cache.get(cacheKey, function (e, result) { // Get the hourly count from cache, then push the results to s3
      hourlyCounts.push(parseInt(result));

      const objectParams = { Bucket: bucketName, Key: s3Key, Body: JSON.stringify(hourlyCounts) };
      s3.putObject(objectParams).promise() //update the s3 camera data
        .then(() => {
          console.log(`Successfully uploaded ${s3Key} to ${bucketName}`);
          cache.del(cacheKey);
          res.status(200).send();
        })
        .catch((error) => console.log(error));
    });
  });
});

module.exports = router;