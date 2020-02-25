const AWS = require('aws-sdk');

AWS.config.update({
    region: 'ap-south-1'
});

// Create the SQS service object
const sqs = new AWS.SQS({
    apiVersion: '2019-12-01'
});

let queueParams = {};

const listQueues = async function listQueues() {
    try {
        const queueList = await sqs.listQueues({}).promise();
        return queueList;
    } catch (e) {
        console.log("Error4: ", e);
        throw e;
    }
}

const configureSQS = async function configureSQS() {
    try {
        // create an error queue
        let params = {
            ...queueParams
        };
        params.QueueName = 'pranay-sqs-test-error';
        let errorQueue = await sqs.createQueue(params).promise();

        const fetchARNParams = {
            QueueUrl: errorQueue.QueueUrl,
            AttributeNames: [
                "All"
            ]
        };
        // get ARN of error queue
        const errorQueueArn = await sqs.getQueueAttributes(fetchARNParams).promise();

        params.QueueName = 'pranay-sqs-test';
        params.Attributes = {};
        params.Attributes.MessageRetentionPeriod = "1209600";
        params.Attributes.VisibilityTimeout = "30";
        params.Attributes.DelaySeconds = "0";
        params.Attributes.RedrivePolicy = JSON.stringify({
            deadLetterTargetArn: errorQueueArn.Attributes.QueueArn,
            maxReceiveCount: 5
        });
        params.Attributes.ReceiveMessageWaitTimeSeconds = "0";

        let queue = await sqs.createQueue(params).promise();

        // get ARN of queue
        fetchARNParams.QueueUrl = queue.QueueUrl;
        const queueArn = await sqs.getQueueAttributes(fetchARNParams).promise();

        let policy = {
            "Version": "2012-10-17",
            "Id": "AWS_Queue_Policy",
            "Statement": {
                "Sid": "AWS_Queue_Access",
                "Effect": "Allow",
                "Principal": "*",
                "Action": [
                    "SQS:*"
                ],
                "Resource": [
                    queueArn.Attributes.QueueArn
                ]
            }
        }

        let policyParams = {
            QueueUrl: queue.QueueUrl,
            Attributes: {
                Policy: JSON.stringify(policy)
            }
        }

        await sqs.setQueueAttributes(policyParams).promise();
        return queue.QueueUrl;
    } catch (e) {
        console.log("Error2: ", e);
        throw e;
    }
}

const startConsuming = async function startConsuming(queueUrl) {
    let consumerParams = {
        ...queueParams
    }
    console.log(consumerParams);
    consumerParams.QueueUrl = queueUrl;
    consumerParams.WaitTimeSeconds = 0;
    try {
        const result = await sqs.receiveMessage(consumerParams).promise();
        console.log("listner: ", result);
        return;
    } catch (e) {
        console.log("Error3: ", e);
        throw e;
    }
}

// const setAttributes = async function setAttributes(queueUrl) {
//     params.QueueUrl = queueUrl;
//     try {
//         const result = await sqs.setQueueAttributes(params).promise();
//         console.log("setAttributes:  ", result);
//     } catch (e) {
//         throw e;
//     }
// };

const sqsConsumerStarter = async () => {
    try {
        let queueUrl = await configureSQS();
        // await setAttributes(queueUrl);
        await startConsuming(queueUrl);
    } catch (e) {
        console.log("Error1: ", e);
        throw e;
    }
}

module.exports = {
    sqsConsumerStarter: sqsConsumerStarter,
    listQueues: listQueues
}