/*
 * Copyright (c) 2011 Vinay Pulim <vinay@milewise.com>
 * MIT Licensed
 */

"use strict";

var url = require('url');
var req = require('request');

var VERSION = require('../package.json').version;

exports.request = function(rurl, data, callback, exheaders, exoptions) {
  var curl = url.parse(rurl);
  var secure = curl.protocol === 'https:';
  var host = curl.hostname;
  var port = parseInt(curl.port || (secure ? 443 : false));
  var path = [curl.pathname || '/', curl.search || '', curl.hash || ''].join('');
  var method = data ? "POST" : "GET";
  var headers = {
    "User-Agent": "node-soap/" + VERSION,
    "Accept" : "text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "none",
    "Accept-Charset": "utf-8",
    "Connection": "close",
    "Host" : host + ((secure && port != 443) || (!secure && port != 80) ? ":"+port : "")
  };
  var attr;

  if (typeof data === 'string') {
    headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  exheaders = exheaders || {};
  for (attr in exheaders) { headers[attr] = exheaders[attr]; }

  var options = {
    uri: curl,
    method: method,
    headers: headers
  };

  exoptions = exoptions || {};
  for (attr in exoptions) { options[attr] = exoptions[attr]; }

  var request = req(options, function (error, res, body) {
    if (error) {
      callback(error);
    } else {
      if (typeof body === "string") {
        // Remove any extra characters that appear before or after the SOAP
        // envelope.
        var match = body.match(/(?:<\?[^?]*\?>[\s]*)?<([^:]*):Envelope([\S\s]*)<\/\1:Envelope>/i);
        if (match) {
          body = match[0];
        }
      }
      request.on('error', callback);
      callback(null, res, body);
    }
  });
  request.end(data);

  return request;
};
