var ROS = (function() {

  var ros = function(bridge) {
    if ((this instanceof ros) === false) {
      return new ros(bridge);
    }

    this.bridge = bridge;
  };
  ros.prototype.__proto__ = EventEmitter2.prototype;

  ros.prototype.types = function(types, callback) {
    var that = this;

    var messages = [];
    types.forEach(function(type) {
      var message = new that.bridge.message(type);
      messages.push(message);
    });

    callback.apply(that, messages);
  };

  ros.prototype.node = function(name) {
    var ros = this;

    return {
      topics: function(topics, callback) {
        var that = this;

        var sockets = [];
        topics.forEach(function(topic) {
          var socket = new ros.bridge.topic(topic.topic, topic.type);
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
      }
    };
  };

  ros.prototype.services = function(services, callback) {
    var that = this;

    var sockets = [];
    services.forEach(function(service) {
      var socket = new that.bridge.service(service.service);
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

  ros.prototype.params = function(params, callback) {
    var that = this;

    var sockets = [];
    params.forEach(function(param) {
      var socket = new that.bridge.param(param.param);
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

