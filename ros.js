var ROS = (function() {

  var socket = null;
  var handlers = {};

  var ros = function(url) {
    if (!(this instanceof ros)) {
      return new ros(url);
    }
    var that = this;

    socket = new WebSocket(url);
    socket.onopen = function(event) {
      that.emit('connection', event);
    };

    socket.onclose = function(event) {
      that.emit('close', event);
    };

    socket.onerror = function(event) {
      that.emit('error', event);
    };

    socket.onmessage = function(message) {
      var data = JSON.parse(message.data);
      if (handlers[data.receiver]) {
        handlers[data.receiver](data.msg);
      }
    };
  };
  ros.prototype.__proto__ = EventEmitter2.prototype;


  // Topics
  // ------

  ros.prototype.getTopicList = function(callback) {
    handlers['/rosjs/topics'] = function(data) {
      callback(data);
    };
    var call = {
      receiver : '/rosjs/topics'
    , msg      : []
    };
    socket.send(JSON.stringify(call));
  };

  ros.prototype.messageTypes = function(messageTypes, callback) {
    var that = this;

    function fetchMessageTypes() {
      var messages = [];
      messageTypes.forEach(function(messageType) {
        details = {
          messageType: messageType
        };
        var message = buildMessage(details);
        messages.push(message);
      });

      callback.apply(that, messages);
    }

    if (socket.readyState !== WebSocket.OPEN) {
      that.on('connection', fetchMessageTypes);
    }
    else {
      fetchMessageTypes();
    }
  };

  ros.prototype.topic = function(options) {
    if (!(this instanceof ros.prototype.topic)) {
      return new ros.prototype.topic(options);
    }
    var that = this;

    options          = options || {};
    that.node        = options.node;
    that.name        = options.name;
    that.messageType = options.messageType

    that.subscribe = function(callback) {
      that.on('message', function(message) {
        callback(message);
      });

      handlers[that.name] = function(data) {
        var message = new that.messageType(data);
        that.emit('message', message);
      };
      var call = {
        receiver : '/rosjs/subscribe'
      , msg      : [
          that.name
        , -1
        ]
      };
      socket.send(JSON.stringify(call));
    };

    that.unregisterSubscriber = function() {
      var call = {
        receiver : '/rosjs/unsubscribe'
      , msg      : [that.name]
      };

      socket.send(JSON.stringify(call));
    };

    that.publish = function(message) {
      var call = {
        receiver : that.name
      , msg      : message.toJSON()
      , type     : that.messageType.messageType
      };

      socket.send(JSON.stringify(call));
    };
  };
  ros.prototype.topic.prototype.__proto__ = EventEmitter2.prototype;

  function buildMessage(details) {
    function message(values) {
      if (!(this instanceof message)) {
        return new message(values);
      }

      var that = this;
      if (values) {
        Object.keys(values).forEach(function(name) {
          that[name] = values[name];
        });
      }

      that.toJSON = function() {
        var object = {};
        Object.keys(that).forEach(function(name) {
          if (name !== 'messageType') {
            object[name] = that[name];
          }
        });
        return object;
      };
    }

    message.messageType = details.messageType;

    return message;
  }


  // Services
  // --------

  ros.prototype.getServiceList = function (callback) {
    handlers['/rosjs/services'] = function(data) {
      callback(data);
    };
    var call = {
      receiver : '/rosjs/services'
    , msg      : []
    };
    socket.send(JSON.stringify(call));
  };

  ros.prototype.serviceTypes = function(serviceTypes, callback) {
    var that = this;

    function fetchServiceTypes() {
      var services = [];
      serviceTypes.forEach(function(serviceType) {
        details = {
          serviceType: serviceType
        };
        var service = buildService(details);
        services.push(service);
      });

      callback.apply(that, services);
    }

    if (socket.readyState !== WebSocket.OPEN) {
      that.on('connection', fetchServiceTypes);
    }
    else {
      fetchServiceTypes();
    }
  };

  ros.prototype.service = function(options) {
    if (!(this instanceof ros.prototype.service)) {
      return new ros.prototype.service(options);
    }
    var that = this;

    options          = options || {};
    that.name        = options.name;
    that.serviceType = options.serviceType;

    that.callService = function(service, callback) {
      handlers[that.name] = function(data) {
        var response = new that.serviceType.response(data);
        callback(response);
      };
      var call = {
        receiver : that.name
      , msg      : service.toJSON()
      };
      socket.send(JSON.stringify(call));
    };
  };
  ros.prototype.service.prototype.__proto__ = EventEmitter2.prototype;

  function buildService(details) {

    function request(values) {
      if (!(this instanceof request)) {
        return new request(values);
      }

      var that = this;
      if (values) {
        Object.keys(values).forEach(function(name) {
          that[name] = values[name];
        });
      }

      that.toJSON = function() {
        var values = [];
        Object.keys(that).forEach(function(name) {
          if (typeof that[name] !== 'function') {
            values.push(that[name]);
          }
        });
        return values;
      };
    }

    function response(values) {
      if (!(this instanceof response)) {
        return new response(values);
      }

      var that = this;
      if (values) {
        Object.keys(values).forEach(function(name) {
          that[name] = values[name];
        });
      }

      that.toJSON = function() {
        var values = [];
        Object.keys(that).forEach(function(name) {
          if (typeof that[name] !== 'function') {
            values.push(that[name]);
          }
        });
      };
    }

    return {
      request     : request
    , response    : response
    , serviceType : details.serviceType
    };
  }


  // Params
  // ------

  ros.prototype.getParamList = function(callback) {
    handlers['/rosjs/get_param_names'] = function(data) {
      callback(data);
    };
    var call = {
      receiver : '/rosjs/get_param_names'
    , msg      : []
    };
    socket.send(JSON.stringify(call));
  };

  ros.prototype.param = function(options) {
    if (!(this instanceof ros.prototype.param)) {
      return new ros.prototype.param(options);
    }
    var that = this;

    options    = options || {};
    that.name  = options.name;

    that.get = function(callback) {
      handlers['/rosjs/get_param'] = function(value) {
        callback(value);
      };
      var call = {
        receiver : '/rosjs/get_param'
      , msg      : [that.name]
      };
      socket.send(JSON.stringify(call));
    };

    that.set = function(value) {
      var call = {
        receiver : '/rosjs/set_param'
      , msg      : [that.name, value]
      };
      socket.send(JSON.stringify(call));
    };
  }
  ros.prototype.param.prototype.__proto__ = EventEmitter2.prototype;

  return ros;

}());

