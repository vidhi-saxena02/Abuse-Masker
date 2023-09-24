const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: 'localhost',   
  port: 9000,
  useSSL: false,           
  accessKey: 'ROOTNAME',
  secretKey: 'CHANGEME123',
});

module.exports = minioClient;