var conf = require('./config.json');
var u = require('underscore');
var range = require('./range');
var get_controller = require('./parser').get_controller;
var async = require('async');
var logger = require('./logger');
var db = require('./db');
var moment = require('moment');
var reboot_ip = require('./reboot').reboot_ip;

function conf_to_controllers(conf) {
  return u.flatten(u.keys(conf).map(function(k){
    return range(conf[k]).toArray().map(function(x){
      return 'http://192.168.'+k+'.'+x+':8000/';
    });
  }));
}

function url_to_ip(url) {
  return url.slice(7,-6);
}


var controller_urls = conf_to_controllers(conf);
var last_reboot = new moment();
var force_reboot = true;
 
function worker(callback) {
  var failed = [];
  var stats = [];
  var job_id = +new Date();
  db.new_job(job_id);
  logger.info("Start scraping");
  async.eachLimit(controller_urls,120,
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
	       async.parallel([
		 function(cb){
		   db.insert_failed(failed.map(db.url_to_ip),job_id);
		   cb();
		 },
		 function(cb){
		   db.insert_stats(stats,job_id,callback);
		   cb();
		 },
		 function(cb){
		   var now = new moment();
		   if(force_reboot || now.diff(last_reboot,'minutes')>=10) {
		     force_reboot = false;
		     last_reboot = now;
		     logger.info("Rebooting lame controllers");
		     async.each(stats,
		   		function(stat,cb){
		   		  var controller = stat[0];
		   		  var boards = stat[1].length;
		   		  var ip  = url_to_ip(controller.url);
		   		  if(boards>0 && boards<16) {
		   		    db.save_reboot_controller(ip,boards,job_id);
		   		    reboot_ip(ip);
		   		  }
		   		  cb();
		   		},function(err){
		   		  logger.info("Rebooting lame controllers Done.");
		   		});
		   }
		   cb();
		 }],function(err){
		   logger.info("Worker Done.");
		 });
	       });
}

exports.worker = worker;
