const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');
const cv = require('opencv4nodejs');
require('dotenv').config();

/* Process the webcam's feed and send the results back to the client */
router.get('/:webcam', function (req, res, next) { 
    const { webcam } = req.params;
    console.log(webcam);

});

module.exports = router;