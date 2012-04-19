var ROS = (function() {

  var ros = function(url) {
    // connect to web socket
  };
  ros.prototype.__proto__ = EventEmitter2.prototype;

  ros.prototype.types = function(messageTypes, callback) {
    var that = this;

    var messages = [];
    messageTypes.forEach(function(messageType) {
      var message = new that.message(messageType);
      messages.push(message);
    });

    callback.apply(that, messages);
  };

  ros.prototype.message = function(options) {

  };

  ros.prototype.topic = function(options) {
    options = options || {};
    this.node        = options.node;
    this.topic       = options.topic;
    this.messageType = options.messageType;

    this.subscribe = function(callback) {
      // ws.on(uniqueId, callback);
    };

    this.publish = function(message) {
      // ws.send(uniqueId, callback);
    };
  };
  ros.prototype.topic.prototype.__proto__ = EventEmitter2.prototype;

  ros.prototype.service = function(options) {
    options = options || {};
    this.node    = options.node;
    this.service = options.service;

    this.callService = function(args, callback) {

    };
  };
  ros.prototype.service.prototype.__proto__ = EventEmitter2.prototype;

  ros.prototype.param = function(options) {
    this.node  = options.node;
    this.param = options.param;
    this.value = options.value;

    this.on('update', function(value) {
      this.value = value;
    });

    this.get = function() {
      return this.value;
    };

    this.set = function(value) {

    };
  }
  ros.prototype.param.prototype.__proto__ = EventEmitter2.prototype;

  return ros;

}());

