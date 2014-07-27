var download = (require('./download.js')).download;
var cheerio = require('cheerio');
var express = require('express');
var bodyParser = require('body-parser')

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


app.get('/',function(req,res){
    res.render('index');
});

app.get('/manage',function(req,res){
    res.render('manage');
});


var server = app.listen(3000);
console.log("Listening on Port 3000");
