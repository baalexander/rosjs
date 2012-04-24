var ROS = (function() {

  var ros = function(url) {
    // connect to web socket
  };
  ros.prototype.__proto__ = EventEmitter2.prototype;

  ros.prototype.types = function(messageTypes, callback) {
    var that = this;

    var messages = [];
    messageTypes.forEach(function(messageType) {
      // Request from the server the details for the message type:
      details = {};
      // Create the message class:
      var message = buildMessage(details);
      messages.push(message);
    });

    callback.apply(that, messages);
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

  function buildMessage(details) {
    function message(values) {
      if (!(this instanceof message)) {
        return new message(values);
      }

      var that = this;
      if (details.constants) {
        details.constants.forEach(function(constant) {
          that[constant.name] = constant.value || null;
        });
      }
      if (details.fields) {
        details.fields.forEach(function(field) {
          that[field.name] = field.value || null;
        });
      }
      if (values) {
        Object.keys(values).forEach(function(name) {
          that[name] = values[name];
        });
      }
    }

    message.messageType = message.prototype.messageType = details.messageType;
    message.packageName = message.prototype.packageName = details.packageName;
    message.messageName = message.prototype.messageName = details.messageName;
    message.md5         = message.prototype.md5         = details.md5;
    message.constants   = message.prototype.constants   = details.constants;
    message.fields      = message.prototype.fields      = details.fields;

    if (details.fields) {
      details.fields.forEach(function(field) {
        if (field.messageType) {
          field.messageType = buildMessage(field.messageType);
        }
      });
    }

    return message;
  }

  return ros;

}());

