const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
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

const cache = redis.createClient(); // Use this for local development
//const cache = redis.createClient(6379, "alex-ethan-ass2-cache.km2jzi.ng.0001.apse2.cache.amazonaws.com");

/* Refresh the image predictions and then cache the number of cars detected */
router.get('/refreshpredictions/:id/:url', function (req, res, next) {
  res.status(200).send();
  try {
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
          let predictionBoxes = [];
          predictions.forEach(prediction => {
            if (prediction.class === "car") {
              predictionBoxes.push(prediction.bbox);
            }
          });

          cache.set(`${id}:PredictionBoxes`, JSON.stringify(predictionBoxes), 'EX', 180);

          // Update the current count by adding what was currently detected on top of the current total
          cache.get(`${id}:CurrentCount`, function (err, response) {
            let value;
            if (response) {
              value = parseInt(response) + predictionBoxes.length;
            } else {
              value = predictionBoxes.length;
            }
            cache.set(`${id}:CurrentCount`, value.toString(), 'EX', 180);
          });

          cache.get(`${id}:DayCount`, function (err, response) {
            let value;
            if (response) {
              value = parseInt(response) + predictionBoxes.length;
            } else {
              value = predictionBoxes.length;
            }
            cache.set(`${id}:DayCount`, value.toString(), 'EX', 2 * 60 * 60);
          });
        });
    });
  } catch (error) {
    console.log(error);
  }
});

/* Get the current count from cache and the count array from S3, append the current one, update the S3 object with the new value, and delete the item from cache */
router.get('/updatehourlycounts/:id', function (req, res, next) {
  const { id } = req.params;
  const cacheKey = `${id}:CurrentCount`;
  const s3Key = `${id}:HourlyCounts`;
  const params = { Bucket: bucketName, Key: s3Key };

  res.status(200).send();
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
        })
        .catch((error) => console.log(error));
    });
  });
});

module.exports = router;