const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');
require('dotenv').config();

/* Query the QLDTraffic API and send the results to the client-side */
router.get('/', function(req, res, next) {
  const { QLDTRAFFIC_GEOJSON_API_KEY } = process.env;

  axios.get(`https://api.qldtraffic.qld.gov.au/v1/webcams?apikey=${QLDTRAFFIC_GEOJSON_API_KEY}`)
    .then((response) => res.render('index', { MAPS_JS_API_KEY: process.env.MAPS_JS_API_KEY, webcamData: JSON.stringify(response.data.features) }))
    .catch((error) => res.render('index', { MAPS_JS_API_KEY: process.env.MAPS_JS_API_KEY, webcamData: JSON.stringify([{}]) }));
});

module.exports = router;