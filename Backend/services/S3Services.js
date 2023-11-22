const AWS = require('aws-sdk')
module.exports.uploadToS3 = async function (BucketName, data, fileName) {
    const s3BucketName = BucketName;
    const IAM_USER_KEY = process.env.IAM_USER_KEY;
    const IAM_USER_SECRET = process.env.IAM_USER_SECRET;
    const s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,
    });

    const params = {
        Bucket: s3BucketName,
        Key: fileName,
        Body: data,
        ACL: 'public-read'
    };

    return new Promise((resolve, reject) => {
        s3bucket.upload(params, (err, s3response) => {
            if (err) {
                reject(err);
            } else {
                resolve(s3response.Location);
            }
        });
    });
}

