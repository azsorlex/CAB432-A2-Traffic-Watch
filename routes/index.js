var express = require('express');
var router = express.Router();
var cv = require('opencv');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { MAPS_JS_API_KEY: process.env.MAPS_JS_API_KEY, QLDTRAFFIC_GEOJSON_API_KEY: process.env.QLDTRAFFIC_GEOJSON_API_KEY });
});

module.exports = router;
