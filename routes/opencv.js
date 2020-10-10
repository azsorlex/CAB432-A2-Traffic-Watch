const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');
const cv = require('opencv4nodejs');
require('dotenv').config();

/* Process the webcam's feed and send the results back to the client */
router.get('/:url', function (req, res, next) { 
    const url = req.params.url.replace(/\$/g, '/'); // Change the $ back into /
    console.log(url);

    // Got the following from the opencv4nodejs NPM webpage. There's a possibility we can't use this.
    /*const wCap = new cv.VideoCapture(url);
    const delay = 10;
    let done = false;
    while (!done) {
        let frame = wCap.read();

        if (frame.empty) {
            wCap.reset();
            frame = wCap.read();
        }

        const key = cv.waitKey(delay);
        done = key !== 255;
    }*/

    
});

router.get('/graph/:id', function (req, res, next) { 
    const { id } = req.params;

    res.json([{}]); // Just a blank response
});

module.exports = router;