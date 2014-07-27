var moment = require('moment');
var winston = require('winston');

var myCustomLevels = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },
  colors: {
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red'
  }
};

winston.addColors(myCustomLevels.colors);

var logger = new (winston.Logger)({
  levels: myCustomLevels.levels,
  transports: [
    new (winston.transports.Console)({timestamp:function(){return moment().format('YYYY-M-D HH:mm:ss Z');},
				      level:'debug',
				      colorize:true})
  ]});

exports.debug = logger.debug;
exports.info = logger.info;
exports.warn = logger.warn;
exports.error = logger.error;
