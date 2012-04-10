var ros = (function() {

  var ros = {};

  // Messages
  // --------

  ros.message = function(type) {
    this.type = type;
  };

  ros.types = function(types, callback) {
    var that = this;

    var messages = [];
    types.forEach(function(type) {
      var message = new ros.message(type);
      messages.push(message);
    });

    callback.apply(that, messages);
  };

  // Topics
  // ------

  ros.topic = function(name, type) {
    this.name = name;
    this.type = type;

    this.connect = function() {
      this.emit('connect');
    };

    this.subscribe = function(callback) {
      this.on('message', callback);
    };

    this.publish = function(message) {

    };
  };
  ros.topic.prototype.__proto__ = EventEmitter2.prototype;

  ros.node = function(name) {
    if ((this instanceof ros.node) === false) {
      return new ros.node(name);
    }

    this.topics = function(topics, callback) {
      var that = this;

      var sockets = [];
      topics.forEach(function(topic) {
        var socket = new ros.topic(topic.topic, topic.type);
        sockets.push(socket);
      });

      var socketsConnected = 0;
      sockets.forEach(function(socket) {
        socket.once('connect', function() {
          socketsConnected++;
          if (socketsConnected === sockets.length) {
            callback.apply(that, sockets);
          }
        });
        socket.connect();
      });
    };
  };

  // Services
  // --------

  ros.service = function(name) {
    this.name = name;

    this.connect = function() {
      this.emit('connect');
    };

    this.callService = function(args, callback) {

    };
  }
  ros.service.prototype.__proto__ = EventEmitter2.prototype;

  ros.services = function(services, callback) {
    var that = this;

    var sockets = [];
    services.forEach(function(service) {
      var socket = new ros.service(service.service);
      sockets.push(socket);
    });

    var socketsConnected = 0;
    sockets.forEach(function(socket) {
      socket.once('connect', function() {
        socketsConnected++;
        if (socketsConnected === sockets.length) {
          callback.apply(that, sockets);
        }
      });
      socket.connect();
    });
  };

  // Params
  // ------

  ros.param = function(name) {
    this.name = name;
    this.value = null;

    this.connect = function() {
      this.emit('connect');
    };

    this.on('update', function(value) {
      this.value = value;
    });

    this.get = function() {
      return this.value;
    };

    this.set = function(value) {

    };
  }
  ros.param.prototype.__proto__ = EventEmitter2.prototype;

  ros.params = function(params, callback) {
    var that = this;

    var sockets = [];
    params.forEach(function(param) {
      var socket = new ros.param(param.param);
      sockets.push(socket);
    });

    var socketsConnected = 0;
    sockets.forEach(function(socket) {
      socket.once('connect', function() {
        socketsConnected++;
        if (socketsConnected === sockets.length) {
          callback.apply(that, sockets);
        }
      });
      socket.connect();
    });
  };


  return ros;

}());
