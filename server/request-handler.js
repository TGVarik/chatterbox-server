/* You should implement your request handler function in this file.
 * And hey! This is already getting passed to http.createServer()
 * in basic-server.js. But it won't work as is.
 * You'll have to figure out a way to export this function from
 * this file and include it in basic-server.js so that it actually works.
 * *Hint* Check out the node module documentation at http://nodejs.org/api/modules.html. */
module.exports = function() {
  var _ = require('underscore');
  var path = require('path');
  var fs = require('fs');
  var util = require('util');
  var purse = require('./purse.js');

  var mimeTypes = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html'
  };

  var handleRequest = function (request, response) {
    /* the 'request' argument comes from nodes http module. It includes info about the
     request - such as what URL the browser is requesting. */

    /* Documentation for both request and response can be found at
     * http://nodemanual.org/0.8.14/nodejs_ref_guide/http.html */
    console.log("Serving request type " + request.method + " for url " + request.url);
    var resp;
    var headers = _defaultCorsHeaders;
    var sendResponse = function() {
      headers['Content-Type'] = (typeof resp.message === 'string' ? "text/plain" : "application/json");
      /* .writeHead() tells our server what HTTP status code to send back */
      response.writeHead(resp.status, headers);
      /* Make sure to always call response.end() - Node will not send
       * anything back to the client until you do. The string you pass to
       * response.end() will be the body of the response - i.e. what shows
       * up in the browser.*/
      response.end(JSON.stringify(resp.message));
    };
    var s = request.url.split('?');
    var url = s[0].split('/');
    var qs = s[1];
    if (url[1].toLowerCase() === 'classes') {
      switch (request.method) {
        case "OPTIONS":
          resp = {status: 200, message: "OK"};
          sendResponse();
          break;
        case "GET":
          if (url.length > 3){
            resp = purse.retrieve(request);
            sendResponse();
          } else {
            request.body = qs;
            resp = purse.query(request);
            sendResponse();
          }
          break;

        case "PUT":
          request.body = "";
            request.on('data', function(chunk){
              request.body += chunk.toString();
            });
            request.on('end', function(){
              resp = purse.update(request);
              sendResponse();
            });
          break;

        case "POST":
          request.body = "";
          request.on('data', function(chunk){
            request.body += chunk.toString();
          });
          request.on('end', function(){
            resp = purse.create(request);
            if (resp.status === 201){
              headers['Location'] = "classes/" + url[2] + "/" + resp.message.objectId
            }
            sendResponse();
          });
          break;

        case "DELETE":
          resp = purse.delete(request);
          sendResponse();
          break;

        default:
          resp = {status: 405, message: "Method not allowed"};
            sendResponse();
          break;
      }
    } else {
      var filepath = '../client' + request.url.split('?')[0];
      fs.exists(filepath, function(file){
        if (!file){
          resp = {status: 404, message: "Not found"};
          sendResponse();
        } else {
          var stream = fs.createReadStream(filepath);
          stream.on('error', function(){
            resp = {status: 500, message: "Internal server error"}
          });
          var contentType = mimeTypes[path.extname(filepath)];
          response.setHeader('Content-Type', contentType);
          response.writeHead(200);
          stream.pipe(response);
          stream.on('end', function(){
            response.end();
          });
        }
      });
    }
  };

  /* These headers will allow Cross-Origin Resource Sharing (CORS).
   * This CRUCIAL code allows this server to talk to websites that
   * are on different domains. (Your chat client is running from a url
   * like file://your/chat/client/index.html, which is considered a
   * different domain.) */
  var _defaultCorsHeaders = {
    "access-control-allow-origin" : "*",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, accept, x-purse-application-id, x-purse-rest-api-key",
    "access-control-max-age"      : 10 // Seconds.
  };

  return {
    handleRequest: handleRequest,
    handler: handleRequest
  };

}();