var conf = require('./config.json');
var u = require('underscore');
var range = require('./range');
var get_controller = require('./parser').get_controller;
var async = require('async');
var logger = require('./logger');
var db = require('./db');

function conf_to_controllers(conf) {
  return u.flatten(u.keys(conf).map(function(k){
    return range(conf[k]).toArray().map(function(x){
      return 'http://192.168.'+k+'.'+x+':8000/';
    });
  }));
}

var controller_urls = conf_to_controllers(conf);

function worker(callback) {
  var failed = [];
  var stats = [];
  var job_id = +new Date();
  db.new_job(job_id);
  logger.info("Start scraping");
  async.each(controller_urls,
	     function(url,callback){
	       get_controller(url,function(err,res) {
		 if(err) {
		   failed.push(url);
		 } else {
		   stats.push(res);
		 }
		 callback();
	       });
	     },
	     function(err){
	       logger.info("Scraping Done.");
	       logger.info("MySQL start.");
	       db.insert_failed(failed.map(db.url_to_ip),job_id);
	       db.insert_stats(stats,job_id,callback);
	     });
}

exports.worker = worker;
