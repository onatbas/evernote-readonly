'use strict';

var request = require("request");
var cfconfig = require("../../config/env/cfconfig.js");
module.exports = {
    sendYoToMe: function (message) {
        var yo = cfconfig.getYoObject();
        var options = {
            method: 'POST',
            url: 'https://api.justyo.co/yo/',
            headers:
            {
                'postman-token': '95fd34e8-f3e7-6a6a-e24e-db89ea056ac9',
                'cache-control': 'no-cache',
                'content-type': 'application/x-www-form-urlencoded'
            },
            form:
            {
                username: yo.username,
                api_token: yo.API_TOKEN,
                text: message
            }
        };

        request(options, function (error, response, body) {
            if (error) //throw new Error(error);
		console.log(error);
	    else
            	console.log(body);
        });


    }
};
