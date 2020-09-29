const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');
require('dotenv').config();

/* Query the QLDTraffic API and send the results to the client-side */
router.get('/', function(req, res, next) {
  const { QLDTRAFFIC_GEOJSON_API_KEY } = process.env;

  const someArray = [{name: "Alex", location: {lat: -27, lng: 150}}, {name: "Ethan", location: {lat: -27.5, lng: 155}}];

  res.render('index', { MAPS_JS_API_KEY: process.env.MAPS_JS_API_KEY, webcamData: JSON.stringify(someArray) });
});

module.exports = router;