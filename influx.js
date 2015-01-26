var influx = require('influx');
var logger = require('./logger');
var async = require('async');
var sprintf = require('sprintf');
var helpers = require('./helpers');
var _ = require('underscore');

var username = 'erpao';
var password = 'laitayipao';
var database = 'workers_db';
var database_pool = 'pool_db';

var workers_db = influx({host:'localhost', port:8086, database:database, username : username, password : password });
var pool_db = influx({host:'localhost', port:8086, database:database_pool, username : username, password : password });

function save_pool(stats,timestamp,callback) {
  var stats = _.extend(stats,{time:timestamp});
  stats.hashrate1m = parseFloat(stats.hashrate1m);
  stats.hashrate5m = parseFloat(stats.hashrate5m);
  stats.hashrate15m = parseFloat(stats.hashrate15m);
  stats.hashrate1hr = parseFloat(stats.hashrate1hr);
  stats.hashrate6hr = parseFloat(stats.hashrate6hr);
  stats.hashrate1d = parseFloat(stats.hashrate1d);
  stats.hashrate7d = parseFloat(stats.hashrate7d);

  pool_db.writePoint('stats', stats, function(err,res) {
    if(!err)
      logger.debug("Saved pool stats");
    else
      logger.debug(err);
    callback(err);
  });
}

function save_worker(name,hashrate,timestamp,callback) {
  workers_db.writePoint(name,{hashrate:hashrate,time:timestamp}, function(err,res) {
    if(!err)
      logger.debug("Saved worker "+name);
    else
      logger.debug(err);
    callback(err);
  });
}

function get_pool(callback) {
  var sql = "select mean(hashrate1m),first(Users),first(Workers),first(Idle) from stats group by time(10m) limit 100 order asc";
  pool_db.query(sql,
		function(err,res){
		  if(err) {
		    logger.debug(err);
		    callback([]);
		  } else {
		    var points = res[0].points;
		    var times = points.map(function(e){return e[0];});
		    var hashrates = points.map(function(e){return parseFloat(e[1]);});
		    var users = points.map(function(e){return e[2];});
		    var workers = points.map(function(e){return e[3];});
		    var idles = points.map(function(e){return e[4];});
		    var series = [];
		    series[0] = _.zip(times,hashrates);
		    series[1] = _.zip(times,users);
		    series[2] = _.zip(times,workers);
		    series[3] = _.zip(times,idles);
		    callback(series);
		  }
		});
}

// [ { name: name, column:[time, mean], points: [ [time,mean], [],[],[] ] ]
var tera = 1000000000000;
function get_worker(name,callback) {
  var sql = sprintf("select mean(hashrate) from %s group by time(15m) limit 100 order asc",name);
  workers_db.query(sql,
		   function(err,res){
		     if(err) {
		       logger.debug(err);
		       callback([]);
		     } else {
		       callback(res[0].points.map(function(item){return [item[0],item[1]/tera];}));
		     }
		   });
}

exports.save_pool = save_pool;
exports.save_worker = save_worker;
exports.get_worker = get_worker;
exports.get_pool = get_pool;
