const express = require('express');
const router = express.Router();
const cv = require('opencv4nodejs');
require('dotenv').config();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { MAPS_JS_API_KEY: process.env.MAPS_JS_API_KEY, QLDTRAFFIC_GEOJSON_API_KEY: process.env.QLDTRAFFIC_GEOJSON_API_KEY });
});

module.exports = router;
