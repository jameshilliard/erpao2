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

function url_to_ip(url) {
  return url.slice(7,-6);
}

var controller_urls = conf_to_controllers(conf);



function update_failed_controllers(failed){
  logger.info("Start updating failed controllers...");
  
}

function update_live_controllers(stats){
  
}

function worker() {
  var failed = [];
  var stats = [];
  logger.info("Start.");
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
	       logger.info("Done.");
	       db.insert_failed(failed.map(url_to_ip));
	       // console.log(JSON.stringify(stats,null,2));
	     });
}

worker();
