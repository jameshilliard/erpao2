var exec = require('child_process').exec;
var logger = require('./logger');


function reboot(opts,callback){
  logger.info("reboot "+opts);
  exec('bin\\reboot.exe '+opts,function(err,stdout,stderr){
    if(err) {
      callback(err,null);
    } else {
      callback(null,stdout);
    }
  });
}

exports.reboot = reboot;
