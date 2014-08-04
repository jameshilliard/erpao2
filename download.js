var request = require('request');

function download(url,callback) {
    request({url:url,timeout:500}, function (error, response, body) {
	if(!error && response.statusCode == 200) {
	    callback(body);
	} else {
	    callback(null);
	}
    });
}

exports.download = download;
