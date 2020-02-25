const express = require('express');
const sqs = require('./aws-sqs');
const app = express();

const init = async function init() {
    try {
        await sqs.sqsConsumerStarter();
    } catch (e) {
        console.log("Index file error: ", e);
    }

    app.listen(3000, () => {
        console.log('Node SQS server listening on port: 3000');
    });

}

init();