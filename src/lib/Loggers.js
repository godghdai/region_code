const fs = require('fs');
const path = require('path');
const { ROOT_PATH, LOG_SAVE_PATH } = require("../../config");
const filename = path.join(LOG_SAVE_PATH, 'error.log');
const {loggers,transports} = require('winston');
loggers.add('request', {
  transports: [ new transports.File({ filename: path.join(LOG_SAVE_PATH, 'request.log'), level: 'error' })]
});
module.exports = loggers;
