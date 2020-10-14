const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');
require('@tensorflow/tfjs-backend-cpu');
const cocoSsd = require('@tensorflow-models/coco-ssd');
//const tf = require('@tensorflow/tfjs');
const tfn=require('@tensorflow/tfjs-node');
//const tfds=require('@tensorflow/tfjs-data');

const { Image,createCanvas, loadImage } = require('canvas');
const { getImageType } = require('@tensorflow/tfjs-node/dist/image');
var { image } = require('@tensorflow/tfjs-node');
/* Process the webcam's feed and send the results back to the client */
router.get('/', function (req, res, next) { 
  //https://webcams.qldtraffic.qld.gov.au/Sunshine_Coast/MRNCHD-435.jpg?
  //const url ='https://webcams.qldtraffic.qld.gov.au/Sunshine_Coast/MRNCHD-435.jpg';
  const url= 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Cars_in_traffic_in_Auckland%2C_New_Zealand_-_copyright-free_photo_released_to_public_domain.jpg';
  //const url = req.params.url;//.replace(/\$/g, '/'); // Change the $ back into /
  image=setImage(url);
  setup(image);
    //process the image using tensorflow
});



router.get('/graph/:id', function (req, res, next) { 
    const { id } = req.params;
    res.json([{}]); // Just a blank response
});

async function setImage(url){
  const canvas=createCanvas(800,600);
  const ctx = canvas.getContext('2d');
  let img=new Image();
  img.onload= () => ctx.drawImage(img,0,0);
  img.onerror = err => {throw err};
  img.src=url;
  var dataURL = canvas.toDataURL(base64Img);
  image = tfn.browser.fromPixels(dataURL);
  return image;
}

async function setup(img) {
     // Load the model.
     //let image= await loadImage(img);
     console.log('here');
     console.log(img);
     //await tf.setBackend('cpu');
    const model = await cocoSsd.load();
    console.log('here2');
    const predictions = await model.detect(img);
    console.log('Predictions: ');
    console.log(predictions);
}
module.exports = router;