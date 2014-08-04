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

function reboot_ip(ip){
  logger.info("reboot by ip:"+ip);
  var chunks=ip.split('.');
  var ip1=chunks[2];
  var ip2=chunks[3];
  var ip_opt = ip1+' '+ip2;
  exec('bin\\reboot.exe 1 250 '+ ip_opt,function(err,stdout,stderr){
  });
}

exports.reboot = reboot;
exports.reboot_ip = reboot_ip;
