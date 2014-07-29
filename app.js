var download = (require('./download.js')).download;
var cheerio = require('cheerio');
var express = require('express');
var bodyParser = require('body-parser');
var worker = require('./worker').worker;
var logger = require('./logger');
var db = require('./db');
var async = require('async');
var u = require('underscore');
var printf = require('printf');
var reboot = require('./reboot').reboot;

var app = express();
app.set('view engine','html');
app.set('views', __dirname + '/views');
app.enable('view cache');
app.engine('html',require('hogan-express'));
app.set('layout', 'layout');
app.enable("jsonp callback");


app.use(bodyParser.urlencoded(({ extended: true })));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

function ip_to_value(ip) {
  var chunks = ip.split('.');
  return parseInt(chunks[2])*1000+parseInt(chunks[3]);
}


function seconds_to_str(sec){
    var d = sec/86400;
    sec = sec%86400;
    var h = sec/3600;
    sec = sec%3600;
    var m = sec/60;
    sec = sec%60;
    return printf("%02dd:%02dh:%02dm:%02ds",d,h,m,sec);
}

app.get('/',function(req,res){
  db.get_last_job(function(err,job){
    db.get_controllers_by_job(job.job_id,function(err,controllers){
      async.each(controllers,
		 function(controller,callback) {
		   controller.ip_value = ip_to_value(controller.ip);
		   controller.uptime_str = seconds_to_str(controller.uptime);
		   if(controller.online) {
		     controller.online = controller.boards;
		   } else {
		     controller.online = -1;
		   }
		   callback();
		 },
		 function(err){
		 });
      job.hashrate = job.hashrate/1000;
      job.expected = job.expected/1000;
      res.render('index',{'job':[job],'controllers':controllers});
    });
  });
});

app.get('/reboot',function(req,res){
  var who = req.query.who;
  var clock = req.query.clock;
  var ip1 = req.query.ip1;
  var ip2 = req.query.ip2;
  var opts = printf("%d %d %d %d",who,clock,ip1,ip2);
  reboot(opts,function(err,resp){
    if(err) {
      res.send("Failed");
    } else {
      res.send("Done");
    }
  });
});

app.get('/scan',function(req,res){
  worker(lock,function(){
    res.redirect("/");
  });
});

app.get('/manage',function(req,res){
  res.render('manage');
});



var server = app.listen(80);
console.log("Listening on Port 80");

var lock = false;
logger.info("Started worker process");
worker(lock,function(){});
setInterval(function(){worker(lock,function(){});},500000);
