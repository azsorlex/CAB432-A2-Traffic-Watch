const http = require('http');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const bucketName = 'alex-ethan-a2-s3';

function requestPromise(ip, id) {
    return new Promise((resolve, reject) => {
        http.get(`${ip}/tensorflow/updatehourlycounts/${id}`, (res) => {
            res.on('end', () => {
                console.log('success');
                resolve("Success");
            });

            res.on('error', () => {
                console.log('error');
                reject("Error");
            });
        });
    })
}

exports.handler = async(event) => {
    const data = await s3.getObject({ Bucket: bucketName, Key: "QLDTrafficResults" }).promise();
    const apiResults = JSON.parse(data.Body);

    const cam = apiResults[0]; // Get the one and only result
    console.log(cam);
    console.log(typeof(apiResults))
    console.log(cam.properties.id);

    const resPromise = requestPromise("http://Alex-Ethan-A2-1766300438.ap-southeast-2.elb.amazonaws.com", cam.properties.id);
    const res = await resPromise;

    // Attempted to do this, but it didn't work

    /*apiResults.forEach(cam => {
        const resPromise = requestPromise("http://Alex-Ethan-A2-1766300438.ap-southeast-2.elb.amazonaws.com", cam.properties.id);
        const res = resPromise;
    });*/

    const response = {
        statusCode: 200,
        body: "Success",
    };
    return response;
};
