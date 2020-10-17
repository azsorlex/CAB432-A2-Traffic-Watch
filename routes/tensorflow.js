const express = require('express');
const router = express.Router();
const axios = require('axios');
const aws = require('aws-sdk');
let crontab = require('node-crontab');
require('dotenv').config();

require('@tensorflow/tfjs-backend-cpu');
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const image = require('get-image-data');
aws.config.loadFromPath('./config.json');
const Redis=require('ioredis');

const model = cocoSsd.load(); // Pre-load the model for all instances
const { QLDTRAFFIC_GEOJSON_API_KEY } = process.env;
let refreshJobs = [];
//Setup S3 bucket storage
const bucketName ='alex-ethan-a2-s3';
const cacheName='alex-ethan-a2-cache';
const redis_address='alex-ethan-a2-cache.km2jzi.ng.0001.apse2.cache.amazonaws.com:6379';
const redis=new Redis(redis_address);

crontab.scheduleJob("59 6 * * *", () => { // Create a job that runs at 6:59am that queries the QLDTraffic API and creates a new cron job for every camera returned
  refreshJobs.forEach(job => { // Delete the stored job(s)
    crontab.cancelJob(job);
  });
  refreshJobs = [];

  axios.get(`https://api.qldtraffic.qld.gov.au/v1/webcams?apikey=${QLDTRAFFIC_GEOJSON_API_KEY}`)
    .then((response) => {

      // Write JSON.stringify(response.data.features) to S3

      response.data.features.forEach(cam => {
        let job = crontab.scheduleJob("* 7-21 * * *", () => { // Fetch predictions for the image and store it to cache every minute

          image(cam.properties.image_url, async function (err, image) {
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
              .then(predictions => {
                //store the minute in the cache
                //and return the object containing the boxes, daycount and hour count
                let frameCount=0;
                let predictionResult=[];
                if (predictions.length!=0){
                  for (prediction in predictions){
                    if (prediction.class=="car"){
                      frameCount+=1;
                      predictionResult[frameCount]=prediction.bbox;
                    }
                  }
                }
                //pull the total count from s3 add to it and post both the minute count and the total count
                //pull the hour count from cache and add
                storeCamData(cam.properties.id,frameCount);
                //let returnJson={boxes:predictionResult,dayCount:counts.dayCount,hourCount:counts.hourCount}
                //res.json(returnJson)
                // Write the predictions with a key like "cam.properties.id + CurrentVal" and JSON.stringify(predictions) as the value
              })
              .catch(error => {
                console.log(error);
              });
          });

        });
        refreshJobs.push(job);
      });
    });
});

/* Query ElastiCache to retrieve latest predictions for the chosen cam */
router.get('/getpredictions/:id', function (req, res, next) {
  const { id } = req.params;
  redis.get(id,function(err,result){
    if(result){
      //cache contains data
      let hourArray=result.hourArray;
      hourArray[hourArray.length]=frameCount;//add the frame count to the hours array
      let totalCount=reult.dayCount+frameCount;
      data={dayCount:totalCount,hourArray:hourArray};
      redis.del(camId);//delete the data
      redis.set(camId,data);
      let hourCount= hourArray.reduce((a,b)=>a+b,0); //sum the current hour
      let returnObj={dayCount:totalCount, hourCount:hourCount};
      res.json(returnObj);
    }}).catch(console.log(err));
});

/* Query S3 and ElastiCache to retrieve the graph data and total vehicle count (which is graph data plus current vehicle count) */
router.get('/getgraph/:id', function (req, res, next) {
  const { id } = req.params;
  res.json([{}]); // Just a blank response. Update this
});

//store data in the cache every minute
function storeCamData(camId,frameCount){
//set up a cache
  redis.get({key:camId,function(err,result){
    if(result){
      //cache contains data
      let hourArray=result.hourArray;
      hourArray[hourArray.length]=frameCount;//add the frame count to the hours array
      let totalCount=reult.dayCount+frameCount;
      data={dayCount:totalCount,hourArray:hourArray};
      redis.del(camId);//delete the data
      redis.set(camId,data);
      //let returnObj={dayCount:totalCount, hourCount:hourCount};
    }
    else{
      //cache does not contain data
      console.log(err);
    }
  }}).catch(console.log(err));
}

//update the s3 bucket and cache hourly
//pull the days data from the s3
//pull the hours data from the cache
//add the hours array to the s3 data and update s3
//clear the cache keeping only the days total count
function S3StorageHour(id){
  const s3Key=id;
  const params = {Bucket: bucketName, Key: s3Key};
  //check the bucket
  const s3= new AWS.S3({apiVersion: '2006-03-01'});
  s3.getObject(params, (err,s3Result) => {
      if(s3Result) {         
          //camId exists
          redis.get({key:camId,function(err1,cacheResult){
            if(cacheResult){
              //add the new hours array to the S3 day array
              const resultJSON = JSON.parse(s3Result.Body);        
              const dayArray=resultJSON.dayArray;
              dayArray[dayArray.length]=cacheResult.hourArray;
              let s3Obj=JSON.stringify({camURL:resultJSON.Body.camURL, dayArray:dayArray});
              //clean the cache
              cleanCache={dayCount:cacheResult.dayCount,hourArray:[]};
              redis.del(camId);//delete the data
              redis.set(camId,cleanCache);//refresh the cache keeping only the total count
              //update the s3 bucket
              const objectParams = {Bucket: s3Result.Bucket, Key: s3Result.Key, Body: s3Obj};
              //s3.deleteObject({Bucket:s3Result.Bucket,Key:s3Result.Key});//clean the s3
              s3.putObject(objectParams); //update the s3 camera data
            }

          }});
      } else {
      //error
      console.log(err)
      }
    }).catch(console.log(err));
}

//clear the S3 storage at the completion of the day? or just overwrite?
function S3StorageClear(){

}

//create new keys or overwrite old at the start of a new day
function S3StorageNewDay(URL,camId){
  const s3Key=`camId:${camId}`;
  //setup the empty object for storing the count data:
  const dayArray=[];// empty array that will be populated with each hour array
  const body = JSON.stringify({camURL:URL, dayArray:dayArray});
  const objectParams = {Bucket: bucketName, Key: s3Key, Body: body};
  const uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();
  uploadPromise.then(function(data){
      console.log("Successfully uploaded data to " + bucketName + "/"+s3Key);
  });
  //initialise the cache for each camera
  let initCache = {dayCount: 0 ,hourArray: []};
  redis.set(camId,initCache);
}

module.exports = router;