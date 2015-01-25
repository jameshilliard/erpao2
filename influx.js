var influx = require('influx');
var logger = require('./logger');
var async = require('async');

var username = 'erpao';
var password = 'laitayipao';
var database = 'workers_db';

var workers_db = influx({host : 'localhost', port : 8086, database:database, username : username, password : password });

function save_worker(name,hashrate,timestamp,callback) {
  workers_db.writePoint(name,{hashrate:hashrate,time:timestamp}, function(err,res) {
    if(!err)
      logger.debug("Saved worker "+name);
    else
      logger.debug(err);
    callback(err);
  });
}

exports.save_worker = save_worker;
