const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');

require('@tensorflow/tfjs-backend-cpu');
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const image = require('get-image-data');

const model = cocoSsd.load(); // Pre-load the model for all instances

/* Process the webcam's image and send the results back to the client */
router.get('/:url', function (req, res, next) {
  const url = req.params.url.replace(/\$/g, '/'); // Change all of the $ back into /

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
      .then(predictions => res.json(predictions))
      .catch(error => {
        console.log(error);
        res.json([{}]);
      });
  });
});

router.get('/graph/:id', function (req, res, next) {
  const { id } = req.params;
  res.json([{}]); // Just a blank response
});

module.exports = router;