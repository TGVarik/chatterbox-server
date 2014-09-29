  // YOUR CODE HERE:
var app = {

  messageHeight: 102,
  rooms: {lobby: true},

  init: function(){
    //handlers

    $('#sidebar').scrollFixed();

    app.fetch();

    $('.fetch').on('click', function() {
      app.fetch();
    });

    app.svg = d3.select('#canvas').append('svg')
      .attr('width', '100%')
      .attr('id', 'chats');

    $('#chats').on('click', '.add', function(e) {
      e.preventDefault();
      app.addFriend($(this).parent().find('.username').text());
      app.fetch();
    });

    $('#chats').on('click', '.remove', function(e) {
      e.preventDefault();
      app.removeFriend($(this).parent().find('.username').text());
      app.fetch();
    });

    //sends message on button click based on current room selection
    $('.send').on('click', function(e) {
      e.preventDefault();
      var room = $('.room-selector').val();
      if (room === 'all'){
        room = 'lobby';
      }
      var message = {};
        message.text = $('input').val();
        message.username = document.URL.replace(/.+username=(.+)/, '$1');
        message.roomname = room;

      app.send(message);
      //wait for a period so message will fetch
      setTimeout(function(){app.fetch()}, 1000);
      $('input').val("");
    });

    //select a new room using the dropdown menu
    $('.room-selector').on('change', function(e){
      e.preventDefault();
      app.fetch();
      $('input.newroom').val("")
    })

    //add a new room via the input field and button
    $('button.newroom').on('click', function(e) {
      e.preventDefault();
      app.createRoom($('input.newroom').val());
    })

    //automatic refreshing every 5 seconds
    setInterval(function() {app.fetch();}, 5000);
  },

  send: function(data){
    $.ajax({
      url: this.server,
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: function(d) {
        console.log("POST successful");},
      error: function(jqXHR, status, error) {
        console.log(error);
      }
    })
  },

  fetch: function(){
    var where = {
      updatedAt:{
        $gte: {
          __type: 'Date',
          iso: app.lastHour()
        }
      }
    };
    var room = $('.room-selector').val();
    if (!(room === 'all' || room === undefined || room === '')){
      where.roomname = room;
    }
    $.ajax({
      url: this.server,
      type: 'GET',
      data: 'where=' + JSON.stringify(where) + '&order=-createdAt',
      contentType: 'application/json',
      success: app.update,
      error: function(jqXHR, status, error) {
        console.log(error);
      }
    })
  },

  server: 'https://api.parse.com/1/classes/chatterbox',

  clean: function(message) {
    //cleans one message
    if(message.hasOwnProperty('room') && !message.hasOwnProperty('roomname')){
      message.roomname = message.room;
      delete message.room;
    }
    if(message.hasOwnProperty('text') && message.hasOwnProperty('roomname') && message.hasOwnProperty('username') &&
       message.text     !== undefined && message.text     !== 'undefined' && $.trim(message.text)     !== '' &&
       message.roomname !== undefined && message.roomname !== 'undefined' && $.trim(message.roomname) !== '' &&
       message.username !== undefined && message.username !== 'undefined' && $.trim(message.username) !== ''){
      var cleaned = {};
      // start with dirty text, e.g., message.text
      cleaned.text = message.text;
      cleaned.roomname = _.escape(message.roomname);
      cleaned.username = _.escape(message.username);
      cleaned.createdAt = _.escape(message.createdAt);
      cleaned.objectId = message.objectId;
      cleaned.updatedAt = message.updatedAt;
      cleaned.friend = app.hasFriend(cleaned.username);

      return cleaned;
    } else {
      return null;
    }
  },

  update: function(successData) {
    var data = successData.results;

    for(var i = 0; i < data.length; i++) {
      var clean = app.clean(data[i]);
      if(clean) {
        data[i] = clean;
      } else {
        data.splice(i, 1);
        i--;
      }
    }

    app.updateRoomObject(data);

    app.svg.attr('height', data.length * app.messageHeight);

    // update
    var messages = app.svg.selectAll('.message').data(data, function(d) { return d.objectId;});
    //entering
    var enteringMessages = messages.enter()
      .append('g').attr('class', 'message')
      .attr('transform', 'translate(0,' + -app.messageHeight + ')');

    enteringMessages
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('rx', 15)
      .attr('ry', 15)
      .attr('width', '100%')
      .attr('height', app.messageHeight - 10)
      .attr('class', 'message-box');

    //message text
    enteringMessages
      .append('text').attr('class', 'text');

    //friend icon
    enteringMessages
      .append('text')
      .attr('class', 'icon')
      //.append('image')
      //.attr('class', 'friend-image')
      //.attr('width', '15')
      //.attr('height', '15');

    //username
    enteringMessages
      .append('text').attr('class', 'username');

    //roomname
    enteringMessages
      .append('text').attr('class', 'roomname')

    //update + entering
    // svg group elements
    messages
      .transition()
      .duration(750)
      .ease('linear')
      .attr('transform', function(d, i){
        return 'translate(0,' + (app.messageHeight * i) + ')';
      });

    //message text
    messages
      .select('.text')
      .text(function(d){return "'" + d['text'] + "'"})
      .attr('transform', 'translate(50, 50)');

    //username
    messages.select('.username')
    .text(function(d){return d['username']})
    .attr('transform', 'translate(30, 30)')
    .attr('font-weight',
      function(d) {
        if(d.friend) {
          return "800";
        } else {
          return '400';
        }
      })
    .attr('class', function(d){
      if (d.friend){
        return 'username remove';
      } else {
        return 'username add';
      }
    });

    messages.select('.icon').text(function(d){
      if (d.friend){
        return '\uf068';
      } else {
        return '\uf067';
      }
    })
      .attr('class', function(d){
        if (d.friend){
          return 'icon remove';
        } else {
          return 'icon add';
        }
      })
      .attr('transform', 'translate(15, 30)');

    //Room Name
    messages.select('.roomname')
    .text(function(d){
      return "Room Name: " + d['roomname'];
    })
    .attr('transform', function(d,i){return 'translate(300,60)';})
    .attr('fill', 'grey').attr('size', '8');

    // add/remove friend image
    // messages.select('.friend-image')
    //   .attr('xlink:href', function(d) {
    //       if(d.friend) {
    //         return 'images/delete_profile-128.png'
    //       } else {
    //         return 'images/add_friend-128.png'
    //       }
    //     })
    //   .attr('class', function(d) {
    //     if(d.friend) {
    //       return 'friend-image remove';
    //     } else {
    //       return 'friend-image add';
    //     }
    //   })
    //   .attr('transform', 'translate(10, 18)');


    //remove
    messages
      .exit().remove();

  },

  clearMessages: function(){
    app.svg.selectAll('.message').data([]).exit().remove();
  },

  addMessage: function(input){
    app.send(input);
    app.update();
  },

  lastHour: function() {
    var now = new Date();
    now.setUTCHours(now.getUTCHours() - 1);
    return now.toISOString();
  },

  friends: {},

  addFriend: function(username) {
    app.friends[username] = true;
    return app.friends;
  },

  hasFriend: function(username) {
    return app.friends[username] ? true : false;
  },

  removeFriend: function(username) {
    delete app.friends[username];
    return app.friends;
  },

  updateRoomObject: function(data){

    //search through data for room names
    for (var i = 0; i < data.length; i++){
      if (data[i].roomname !== undefined && $.trim(data[i].roomname) !== '') {
      //set rooms object to key (roomname), value true
      app.rooms[data[i].roomname] = true;
      }
    }

    app.updateRoomSelector();
  },

 updateRoomSelector: function() {
    var rooms = [];
    for (var key in app.rooms) {
      //add all the rooms into a rooms array
      rooms.push(key);
    }
    //sort the array
    rooms = rooms.sort();

    //dropdown bar
    var el = $('.room-selector');

    //store values from old bar
    var oldValue = el.val();
    //clear bar
    el.find('option')
      .remove()
      .end()
      .append('<option value="all">All Rooms</option>');

    //iterate through rooms array
    for (i = 0; i < rooms.length; i++){
      //add options to the bar
      el.append('<option value="' + rooms[i] + '">' + rooms[i] + '</option>')
    }

    if (rooms.indexOf(oldValue) >= 0){
      el.val(oldValue);
    } else {
      el.val('all');
    }
  },

  createRoom: function(roomName) {
    var inputChecker = /\w/g;
    if(typeof roomName === 'string' && roomName.search(inputChecker) !== -1 && roomName !== 'Room Name') {
      //manually add to object
      app.rooms[roomName] = true;
      //call updateRoomSelector()
      app.updateRoomSelector();
      //change option on bar to reflect room change using jQuery, re 324, 343
      $('.room-selector').val(roomName);
      //updates page to reflect new room name
      app.fetch();
    }
  }



};

(function($){
  $.fn.scrollFixed = function(params){
    params = $.extend( {appearAfterDiv: 0, hideBeforeDiv: 0}, params);
    var element = $(this);

    if(params.appearAfterDiv) {
      var distanceTop = element.offset().top + $(params.appearAfterDiv).outerHeight(true) + element.outerHeight(true);
    } else {
      var distanceTop = element.offset().top;
    }

    if(params.hideBeforeDiv) {
      var bottom = $(params.hideBeforeDiv).offset().top - element.outerHeight(true) - 10;
    } else {
      var bottom = 200000;
    }

    $(window).scroll(function(){
      if( $(window).scrollTop() > distanceTop && $(window).scrollTop() < bottom ) {
        element.css({'position':'fixed', 'top':'10px'});
      } else {
        element.css({'position':'absolute'});
      }
    });
  };
})(jQuery);





