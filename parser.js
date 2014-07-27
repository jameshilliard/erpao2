var cheerio=require('cheerio');
var download = (require('./download.js')).download;
var async = require('async');
var u = require('underscore');

String.prototype.startsWith = function(prefix) {
  return this.indexOf(prefix) === 0;
};

String.prototype.fulltrim = function() {
  return this.replace(/(?:(?:^|\r|\n)\s+|\s+(?:$|\r|\n))/g,'').replace(/\s+/g,'');
};

function str_to_seconds(str){
    var nums = str.split(':').map(function(x){return parseInt(x);});
    return nums[0]*86400+nums[1]*3600+nums[2]*60+nums[3]
}

function seconds_to_str(sec){
    var d = sec/86400;
    sec = sec%86400;
    var h = sec/3600;
    sec = sec%3600;
    var m = sec/60;
    sec = sec%60;
    return util.format("%02d:%02h:%02m:%02s");
}

function parse_detail(str) {
    var chunks =  str.split(',').map(function(x){return x.trim();});
    var detail = {};
    detail.Accepted = parseFloat(chunks[0].split(':')[1]);
    detail.Rejected = parseFloat(chunks[1].split(':')[1]);
    detail.HwError  = parseFloat(chunks[2].split(':')[1]);
    detail.PwrDn    = parseInt  (chunks[3].split(':')[1]);
    detail.HashRate = parseFloat(chunks[4].split(':')[1]);
    detail.Expected = parseFloat(chunks[5].split(':')[1]);

    detail.Eff      = parseFloat(chunks[7].split(':')[1]);

    detail.Diff     = parseFloat(chunks[9].split(':')[1]);
    
    detail.RunningTime = str_to_seconds(chunks[11].split(':').slice(1).join(':'));
    detail.SessionTime = str_to_seconds(chunks[12].split(':').slice(1).join(':'));
    
    return detail;
}


function stat_parser(err,$,handler,callback) {
    if(!err) {
	var boards = [];
	$('br').parent().contents().each(function(i,elem){
	    if(elem.data && elem.data.startsWith('Board')) {
		boards.push(elem.data.fulltrim());
	    }
	});
	var clock = $.html().match(/Clock:([\d]+)MHz/)[1];
	var detail_str = u.filter($('h3').get(1).children,function(x){return u.has(x,'data')}).map(function(x){return x.data;}).join();
	var detail = parse_detail(detail_str);
	detail.Clock = parseInt(clock);
	handler(null,[detail,boards],callback);
    } else {
	handler(err,null,callback);
    }
}

function test_parser(err,$,handler,callback) {
  if(!err) {
    var boards = [];
    $('br').parent().contents().each(function(i,elem){
      if(elem.data && elem.data.startsWith('Board')) {
	boards.push(elem.data.fulltrim());
      }
    });
      handler(null,boards,callback);
  } else {
      handler(err,null,callback);
  }
}

function get_board_stat(str) {
  var id = parseInt(str.slice(5,7));
  str = str.slice(8);
  var chunks = str.split(',');
  var hashrate = parseFloat(chunks[0].slice(4,-3));
  var expected = parseFloat(chunks[1].slice(4,-3));
  var util     = parseFloat(chunks[2].slice(4));
  var eff      = parseFloat(chunks[3].slice(4,-1));
  var hwe      = parseFloat(chunks[4].slice(4,-1));
  var pdn      = parseInt(chunks[5].slice(6));
  return [id,{
    'id' : id,
    'hashrate' : hashrate,
    'expected' : expected,
    'util' : util,
    'eff' : eff,
    'hwe' : hwe,
    'pdn' : pdn
  }];
}

function get_all_boards(err,full_detail,callback) {
    if(!err) {
	var stats = [];
	var boards = full_detail[1];  
	boards.forEach(
	    function(board) {
		var res = get_board_stat(board);
		stats[res[0]]=res[1];
	    }
	);
	callback(null,[full_detail[0],stats]);
    } else {
	callback(err,null);
    }
}

function get_core_test(str) {
  var id = parseInt(str.slice(5,7));
  str = str.slice(8);
  var chunks = str.split('|');
  var asics = chunks.slice(1,-1).join('');
  var ver = chunks[9].slice(3);
  return [id,{
    'id' : id,
    'asics' : asics,
    'ver' : ver
  }];
}

function get_all_cores(err,boards,callback) {
    if(!err) {
	var stats = [];
	boards.forEach(
	    function(board) {
		var res = get_core_test(board);
		stats[res[0]]=res[1];
	    }
	);
	callback(null,stats);  
    } else {
	callback(err,null);
    }
}

function parse_page(url,parser,handler,callback) {
  download(url, function(data) {
    if (data) {
      var $;
      $=cheerio.load(data);
	parser(null,$,handler,callback);
    } else {
	parser('ConnectionFailed:'+url,null,handler,callback);
    }
  });
}


function get_controller(url,callback) {
  var stat;
  var url_stat = url+"Statistics/";
//    var url_stat = "http://127.0.0.1:3000/stat.htm";
  var url_test = url+"TestStatus/";
//    var url_test = "http://127.0.0.1:3000/test.htm";
    
  async.series([function(cb){parse_page(url_stat,stat_parser,get_all_boards,cb);},
		function(cb){parse_page(url_test,test_parser,get_all_cores,cb);}
	       ],
	       function(err,res){
		   if(!err) {
		       stat = u.zip(u.compact(res[0][1]),u.compact(res[1])).map(
			   function(elem) {
			       return (u.extend(elem[0],elem[1]));
			   });
		       res[0][0].url = url;
		       callback(null,[res[0][0],stat]);
		   } else {
		       callback(err,null);
		   }
	       });
}

exports.get_controller = get_controller;
