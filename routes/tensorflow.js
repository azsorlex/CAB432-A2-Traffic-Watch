const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');
let crontab = require('node-crontab');
require('dotenv').config();

require('@tensorflow/tfjs-backend-cpu');
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const image = require('get-image-data');

const model = cocoSsd.load(); // Pre-load the model for all instances
const { QLDTRAFFIC_GEOJSON_API_KEY } = process.env;
let refreshJobs = [];



crontab.scheduleJob("59 6 * * *", () => { // Create a job that runs at 6:59am that queries the QLDTraffic API and creates a new cron job for every camera returned
  refreshJobs.forEach(job => { // Delete the stored job(s)
    crontab.cancelJob(job);
  });
  refreshJobs = [];

  axios.get(`https://api.qldtraffic.qld.gov.au/v1/webcams?apikey=${QLDTRAFFIC_GEOJSON_API_KEY}`)
    .then((response) => {

      // Write JSON.stringify(response.data.features) to S3

      response.data.features.forEach(cam => {
        let job = crontab.scheduleJob("* 7-21 * * *", () => { // Fetch predictions for the image and store it to cache every minute

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
                // Write the predictions with a key like "cam.properties.id + CurrentVal" and JSON.stringify(predictions) as the value
              })
              .catch(error => {
                console.log(error);
              });
          });

        });
        refreshJobs.push(job);
      });
    });
});

/* Query ElastiCache to retrieve latest predictions for the chosen cam */
router.get('/getpredictions/:id', function (req, res, next) {
  const { id } = req.params;
  res.json([{}]); // Just a blank response. Update this
});

/* Query S3 and ElastiCache to retrieve the graph data and total vehicle count (which is graph data plus current vehicle count) */
router.get('/getgraph/:id', function (req, res, next) {
  const { id } = req.params;
  res.json([{}]); // Just a blank response. Update this
});

module.exports = router;