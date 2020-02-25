const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function getBucketContents() {
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Delimiter: '/',
        Prefix: process.env.FOLDER_NAME + '/'
    };

    const data = await s3.listObjects(params).promise();

    for (let index = 1; index < data['Contents'].length; index++) {
        console.log(data['Contents'][index]['Key'].split('/')[1])
    }
}

getBucketContents();