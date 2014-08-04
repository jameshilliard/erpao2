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
var range = require('./range');
var moment = require('moment');

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
  var groups = range('A','O').toArray();
  var online;
  var offline;
  db.get_last_job(function(err,job){
    db.get_controllers_by_job(job.job_id,function(err,controllers){
      var count = u.countBy(controllers,function(x){return x.online;});
      online = count['1'];
      offline = count['0'];
      async.each(controllers,
		 function(controller,callback) {
		   controller.group = groups[parseInt(controller.ip.split('.')[2])-1];
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
      job.online = online;
      job.offline = offline;
      job.avg = Math.floor(job.hashrate*1000/job.online)/1000;
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

app.get('/flash',function(req,res){
  var ip = req.query.ip;
  var url = "http://"+ip+":8000/FlashMega/";
  console.log(url);
  download(url,function(data){
    if(data) {
      res.send("Done");
    } else {
      res.send("Failed");
    }
  });
});


app.get('/reclock',function(req,res){
  var ip = req.query.ip;
  var clock = req.query.clock;
  var cur = req.query.cur;
  var url,step;
  if(cur == clock) return;
  if(cur>clock){
    url = "http://"+ip+":8000/Clk_Down/";
    step = (cur-clock)/10;
  } else {
    url = "http://"+ip+":8000/Clk_Up/";
    step = (clock-cur)/10;
  }
  async.times(step, function(n,next){
    download(url, function(page) {
      next(null,page);
    });
  }, function(err, pages) {
    res.send("Done");
  });
});

app.get('/reboots',function(req,res){
  db.get_latest_reboots(function(err,reboots){
    async.each(reboots,function(reboot,callback){
      reboot.reboot_time = moment(reboot.job_id).format('YYYY-M-D HH:mm:ss');
      reboot.ip_value = ip_to_value(reboot.ip);
      callback();
    },function(err){
      res.render('reboots',{'reboots':reboots});
    });
  });
});

app.get('/scan',function(req,res){
  worker(function(){
    res.redirect("/");
  });
});

app.get('/groups',function(req,res){
  var groups = range('A','O').toArray().map(function(x){return {G:x};});
  res.render('groups',{groups:groups});
});

app.get('/groups/:g/:s',function(req,res){
  var g = req.params.g;
  var ip1 = g.charCodeAt()-'A'.charCodeAt()+1;
  var s = req.params.s;
  var r = range(1+12*(s-1),12*s);
  var ips = r.toArray().map(function(x){return {ip1:ip1,ip2:x};});
  res.render('group',{ips:ips,layout:false});
});

var server = app.listen(80);
console.log("Listening on Port 80");

logger.info("Started worker process");
worker(function(){});
setInterval(function(){worker(function(){});},500000);
