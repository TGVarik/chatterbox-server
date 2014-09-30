module.exports = function(){
  var _sift = require('sift');
  var _ = require('underscore');
  // POST to classes/<className>
  var create = function(message){
    if (!_auth(message)){
      return { status: 403, message: "Unauthorized" };
    }
    if (message.headers['content-type'] !== "application/json"){
      return { status: 415, message: "Invalid Content-Type" };
    }
    try {
      var body = JSON.parse(message.body);
    } catch (e) {
      return { status: 400, message: e};
    }
    if (_hasIllegalKeys(body)) {
      return { status: 400, message: "Invalid key name"};
    }
    classStore = _getClassStore(message);
    var id = _generateId();
    while (classStore[id] !== undefined){
      id = _generateId();
    }
    body.createdAt = new Date().toISOString();
    body.updatedAt = body.createdAt;
    body.objectId = id;
    classStore[id] = body;
    return {
      status: 201,
      message: body
    }
  };

  // GET to classes/<className>/<objectId>
  var retrieve = function(message){
    var item = _retrieve(message);
    if (item instanceof Number){
      switch (item){
        case 302: return {status: 302, message: "Object not found"};
        case 400: return {status: 400, message: "Invalid objectId"};
        case 403: return {status: 403, message: "Unauthorized"};
      }
    } else {
      return {status: 200, message: item};
    }
  };

  // PUT to classes/<className>/<objectId>
  var update = function(message){
    var item = _retrieve(message);
    if (item instanceof Number){
      switch (item){
        case 302: return {status: 302, message: "Object not found"};
        case 400: return {status: 400, message: "Invalid objectId"};
        case 403: return {status: 403, message: "Unauthorized"};
      }
    } else {
      try {
        var body = JSON.parse(message.body);
      } catch (e) {
        return {status: 400, message: e};
      }
      if (_hasIllegalKeys(body)){
        return { status: 400, message: "Invalid key name"};
      }
      var changed = false;
      for (var key in body){
        if (key !== 'updatedAt' && key !== 'createdAt' && key !== 'objectId' && body[key] !== item[key]){
          item[key] = body[key];
          item.updatedAt = new Date().toISOString();
        }
      }
      return {status: 200, message: {updatedAt: item.updatedAt}};
    }
  };

  // GET to classes/<className>
  var query = function(message){
    if (!_auth(message)){
      return { status: 403, message: "Unauthorized" };
    }
    var res = [];
    var classStore = _getClassStore(message);
    for (var id in classStore){
      res.push(classStore[id]);
    }
    if (message.body && message.body !== ""){
      var q = {};
      var p = message.body.split('&');
      for (var i = 0; i < p.length; i++){
        var r = p[i].split('=',2);
        if (r[0] === 'where') {
          q[r[0]] = JSON.parse(decodeURIComponent(r[1]));
        } else if (r[0] === 'order'){
          q[r[0]] = r[1];
        }
      }
      res = _filterSort(res, q['where'] || undefined, q['order'] || undefined);
    }


    return {status: 200, message: {results: res}};
  };


  // DELETE to classes/<className>/<objectId>
  var del = function(){};



  // HELPER FUNCTIONS //

  var _auth = function(message){
    var appId = message.headers['x-purse-application-id'];
    if (!appId) { return false; }
    var apiKey = message.headers['x-purse-rest-api-key'];
    if (!apiKey) { return false; }
    if (!_authKeys[appId]) { return false; }
    return apiKey === _authKeys[appId]['restKey'];
  };

  var _filterSort = function(store, where, sort){
    var sifted = _sift(where, store);
    var reverse = false;
    if (sort) {
      if (sort.slice(0, 1) === '-') {
        reverse = true;
        sort = sort.slice(1);
      }
    }

    var sorted = _.sortBy(sifted, sort);
    if (reverse){
      sorted.reverse();
    }
    return sorted;
  };

  var _generateId = function(){
    id = "";
    for (var i = 0; i < 10; i++){
      id += _randomChar();
    }
    return id;
  };

  var _getClassStore = function(message){
    var appId = message.headers['x-purse-application-id'];
    var className = message.url.split("?")[0].split("/")[2];
    var store = _authKeys[appId]['classes'][className];
    if (!store){
      store = _authKeys[appId]['classes'][className] = {};
    }
    return store;
  };

  var _hasIllegalKeys = function(obj){
    for (var key in obj){
      if (key.search(/[^\w]/) > -1){
        return true;
      }
    }
    return false;
  };

  var _randomChar = function(){
    var n = Math.floor(Math.random() * 62);
    n += 48;
    if (n > 57){ n += 7; }
    if (n > 90){ n += 6; }
    return String.fromCharCode(n)
  };

  var _retrieve = function(message){
    if (!_auth(message)){
      return 403;
    }
    classStore = _getClassStore(message);
    var id = message.url.split('/')[3];
    if (id.length !== 10 || id.search(/[^\w]/) > -1){
      return 400;
    }
    var item = classStore[id];
    if (!item){
      return 302;
    }
    return item;
  };

  // STORAGE //

  var _authKeys = {
    '12345': {
      restKey: 'abcde',
      classes: {
        room1: {}
      }
    },
    'voLazbq9nXuZuos9hsmprUz7JwM2N0asnPnUcI7r': {
      restKey: 'QC2F43aSAghM97XidJw8Qiy1NXlpL5LR45rhAVAf',
      classes: {}
    }
  };

  // INTERFACE //

  return {
    create: create,
    retrieve: retrieve,
    update: update,
    query: query
  };
}();