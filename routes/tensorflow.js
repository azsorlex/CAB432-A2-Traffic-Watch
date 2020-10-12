const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');
const tf = require('@tensorflow/tfjs');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const chartjs = require('chart.js');
require('dotenv').config();
require('@tensorflow/tfjs-node');

/* Process the webcam's feed and send the results back to the client */
router.get('/', function (req, res, next) { 
  //https://webcams.qldtraffic.qld.gov.au/Sunshine_Coast/MRNCHD-435.jpg?
  //const url ='https://webcams.qldtraffic.qld.gov.au/Sunshine_Coast/MRNCHD-435.jpg';
  const url= 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Cars_in_traffic_in_Auckland%2C_New_Zealand_-_copyright-free_photo_released_to_public_domain.jpg';
  //const url = req.params.url;//.replace(/\$/g, '/'); // Change the $ back into /
  console.log('URL: ');  
  console.log(url);
  //const image=document.createElement('img');
  //image.src=url;
  setup(url);
    //process the image using tensorflow

});

router.get('/graph/:id', function (req, res, next) { 
    const { id } = req.params;
    res.json([{}]); // Just a blank response
});

async function setup(img) {
     // Load the model.
     await tf.setBackend('cpu');
    const model = await cocoSsd.load();
    const predictions = await model.detect(img);
    console.log('Predictions: ');
    console.log(predictions);
}
module.exports = router;