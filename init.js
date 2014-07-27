var conf = require('./config.json');
var u = require('underscore');
var range = require('./range');
var get_controller = require('./parser').get_controller;
var async = require('async');

function conf_to_controllers(conf) {
    return u.flatten(u.keys(conf).map(function(k){
	return range(conf[k]).toArray().map(function(x){
	    return 'http://192.168.'+k+'.'+x+':8000/';
	})
    }));
}


var controller_urls = conf_to_controllers(conf);

async.each(controller_urls,
    //controller_urls,
	   function(url){
	       get_controller(url,function(err,res) {
		   if(err) {
		       console.log(err);
		   } else {
		       console.log(res);
		   }
	       });
	   },
	   function(err){
	       
	   });
