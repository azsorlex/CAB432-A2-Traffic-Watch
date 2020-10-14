const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');

require('@tensorflow/tfjs-backend-cpu');
const cocoSsd = require('@tensorflow-models/coco-ssd');

const tfn=require('@tensorflow/tfjs-node');
//const tfds=require('@tensorflow/tfjs-data');

const { Image,createCanvas,loadImage } = require('canvas');
const canvas = createCanvas(500,500);
const ctx = canvas.getContext('2d');

/* Process the webcam's feed and send the results back to the client */
router.get('/', function (req, res, next) { 
  //https://webcams.qldtraffic.qld.gov.au/Sunshine_Coast/MRNCHD-435.jpg?
  //const url ='https://webcams.qldtraffic.qld.gov.au/Sunshine_Coast/MRNCHD-435.jpg';
  const url= 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Cars_in_traffic_in_Auckland%2C_New_Zealand_-_copyright-free_photo_released_to_public_domain.jpg';
  //const url = req.params.url;//.replace(/\$/g, '/'); // Change the $ back into /
  //const img=new Image();
  //img.onload=()=>ctx.drawImage(img,0,0);
  //img.onerror = err => {throw err};
  //img.src=url;
  setup(url);
    //process the image using tensorflow
});



router.get('/graph/:id', function (req, res, next) { 
    const { id } = req.params;
    res.json([{}]); // Just a blank response
});

const readImage = url => {
  const imageBuffer=loadImage(url);
  const tfimage=tfn.node.decodeImage(imageBuffer);
  return tfimage;
}

/*async function loadImage(url){
  const image= new Image();
  const promise = new promise((resolve,reject) =>{
    image.crossOrign = '';
    image.onload = () => {
      resolve(image);
    };
  });
  image.src=url;
  return promise;
}*/

function setup(url) {
     
     var img=loadImage(url);
     img.then(()=>{
        console.log('\n\n\n'+img+'\n');
        let tensor=tfn.browser.fromPixels(img.Image);
        console.log(tensor);
        const model = cocoSsd.load();
        model.then(()=>{
          const predictions = model.detect(tensor);
          predictions.then(()=>{
            console.log('Predictions: ');
            console.log(predictions);
          })
        
        })
       
     }).catch( err =>{
       console.log(err);
     })
     
    
     //await tf.setBackend('cpu');
     
}
module.exports = router;