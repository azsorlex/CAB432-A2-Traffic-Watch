const https = require("https");
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const bucketName = 'alex-ethan-a2-s3';

let request_call = new Promise((resolve, reject) => {
    https.get(`https://api.qldtraffic.qld.gov.au/v1/webcams?apikey=zInNksWyUl15WGZOx9Kdg1XGPJiTYnax5u3KHcaR`, (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                console.log(parsedData);
                resolve(JSON.stringify(parsedData.features)); // Only fetch one particular camera since I couldn't get the other two Lambda functions to process all of them
            }
            catch (e) {
                reject(e);
            }
        });
    });
});

exports.handler = async(event) => {

    const apidata = await request_call;
    const putobject = await s3.putObject({ Bucket: bucketName, Key: "QLDTrafficResults", Body: apidata }).promise();

    // Get all objects from the bucket
    const data = await s3.listObjects({ Bucket: bucketName }).promise();

    let items = [];

    // Mark each item for deletion unless they are two specific keys
    data.Contents.forEach(item => {
        if (item.Key !== "QLDTrafficResults") {
            items.push({ Key: item.Key });
        }
    });

    try {
        // Delete the marked items
        let params = {
            Bucket: bucketName,
            Delete: {
                Objects: items,
                Quiet: true
            }
        };
        const del = await s3.deleteObjects(params).promise();
    }
    catch (e) {
        console.log(e);
    }

    const response = {
        statusCode: 200,
        body: "Success",
    };
    return response;
};
