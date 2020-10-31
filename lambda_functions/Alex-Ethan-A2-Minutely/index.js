const http = require('http');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const bucketName = 'alex-ethan-a2-s3';

exports.handler = async(event) => {
    const data = await s3.getObject({ Bucket: bucketName, Key: "QLDTrafficResults" }).promise();
    const apiResults = JSON.parse(data.Body);
    const ip = "http://Alex-Ethan-A2-1766300438.ap-southeast-2.elb.amazonaws.com";
    let promises = apiResults.map(item => {
        return new Promise((resolve, reject) => {
            http.get(`${ip}/tensorflow/refreshpredictions/${item.properties.id}/${item.properties.image_url.replace(/\//g, '$')}`, (res) => {
                res.on('end', () => {
                    resolve('success');
                });
                res.on('error', () => {
                    reject('error');
                });
            });
        });
    });

    await Promise.all(promises);

    const response = {
        statusCode: 200,
        body: "Success",
    };
    return response;
};
