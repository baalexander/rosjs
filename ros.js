// Ros.js can be included using <script src="ros.js"> or AMD.  The next few
// lines provide support for both formats and are based on the Universal Module
// Definition.
//
// See:
//  * AMD - http://bryanforbes.github.com/amd-commonjs-modules-presentation/2011-10-29/)
//  * UMD - https://github.com/umdjs/umd/blob/master/amdWeb.js
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['eventemitter2'], factory);
  }
  else {
    root.ROS = factory(root.EventEmitter2);
  }
}(this, function (EventEmitter2) {

  // Takes in the URL of the WebSocket server.
  // Emits the following events:
  //  * 'error' - there was an error with ROS
  //  * 'connection' - connected to the WebSocket server
  //  * 'close' - disconnected to the WebSocket server
  var ROS = function(url) {
    var ros = this;

    // Socket Handling
    // ---------------

    var socket = new WebSocket(url);
    socket.onopen = function(event) {
      ros.emit('connection', event);
    };
    socket.onclose = function(event) {
      ros.emit('close', event);
    };
    socket.onerror = function(event) {
      ros.emit('error', event);
    };
    // Parses message responses from rosbridge and sends to the appropriate
    // topic, service, or param.
    socket.onmessage = function(message) {
      var data = JSON.parse(message.data);
      if (data.receiver) {
        ros.emit(data.receiver, data.msg);
      }
    };

    // Sends the message over the WebSocket, but queues the message up if not
    // yet connected.
    function callOnConnection(message) {
      var messageJson = JSON.stringify(message);
      if (socket.readyState !== WebSocket.OPEN) {
        ros.once('connection', function() {
          socket.send(messageJson);
        });
      }
      else {
        socket.send(messageJson);
      }
    };

    // Topics
    // ------

    // Retrieves list of topics in ROS as an array.
    ros.getTopicList = function(callback) {
      ros.once('/rosjs/topics', function(data) {
        callback(data);
      });
      var call = {
        receiver : '/rosjs/topics'
      , msg      : []
      };
      callOnConnection(call);
    };

    // Message objects are used for publishing and subscribing to and from
    // topics. Takes in an object matching the fields defined in the .msg
    // definition file.
    ros.Message = function(values) {
      var message = this;
      if (values) {
        Object.keys(values).forEach(function(name) {
          message[name] = values[name];
        });
      }
    }

    // Publish and/or subscribe to a topic in ROS. Options include:
    //  * node - the name of the node to register under
    //  * name - the topic name, like /cmd_vel
    //  * messageType - the message type, like 'std_msgs/String'
    ros.Topic = function(options) {
      var topic         = this;
      options           = options || {};
      topic.node        = options.node;
      topic.name        = options.name;
      topic.messageType = options.messageType

      // Every time a message is published for the given topic, the callback
      // will be called with the message object.
      topic.subscribe = function(callback) {
        topic.on('message', function(message) {
          callback(message);
        });

        ros.on(topic.name, function(data) {
          var message = new ros.Message(data);
          topic.emit('message', message);
        });
        var call = {
          receiver : '/rosjs/subscribe'
        , msg      : [topic.name, -1]
        };
        callOnConnection(call);
      };

      // Unregisters as a subscriber for the topic. Unsubscribing will remove
      // all subscribe callbacks.
      topic.unregisterSubscriber = function() {
        ros.removeAllListeners([topic.name]);
        var call = {
          receiver : '/rosjs/unsubscribe'
        , msg      : [topic.name]
        };
        callOnConnection(call);
      };

      // Publish the message. Takes in a ros.Message.
      topic.publish = function(message) {
        var call = {
          receiver : topic.name
        , msg      : message
        , type     : topic.messageType
        };
        callOnConnection(call);
      };
    };
    ros.Topic.prototype.__proto__ = EventEmitter2.prototype;

    // Services
    // --------

    // Retrieves list of active service names in ROS as an array.
    ros.getServiceList = function(callback) {
      ros.once('/rosjs/services', function(data) {
        callback(data);
      });
      var call = {
        receiver : '/rosjs/services'
      , msg      : []
      };
      callOnConnection(call);
    };

    // A ServiceRequest is passed into the service call. Takes in an object
    // matching the values of the request part from the .srv file.
    ros.ServiceRequest = function(values) {
      var serviceRequest = this;
      if (values) {
        Object.keys(values).forEach(function(name) {
          serviceRequest[name] = values[name];
        });
      }
    }

    // A ServiceResponse is returned from the service call. Takes in an object
    // matching the values of the response part from the .srv file.
    ros.ServiceResponse = function(values) {
      var serviceResponse = this;
      if (values) {
        Object.keys(values).forEach(function(name) {
          serviceResponse[name] = values[name];
        });
      }
    }

    // A ROS service client. Options include:
    //  * name - the service name, like /add_two_ints
    //  * serviceType - the service type, like 'rospy_tutorials/AddTwoInts'
    ros.Service = function(options) {
      var service         = this;
      options             = options || {};
      service.name        = options.name;
      service.serviceType = options.serviceType;

      // Calls the service. Returns the service response in the callback.
      service.callService = function(request, callback) {
        ros.once(service.name, function(data) {
          var response = new ros.ServiceResponse(data);
          callback(response);
        });
        var requestValues = [];
        Object.keys(request).forEach(function(name) {
          requestValues.push(request[name]);
        });
        var call = {
          receiver : service.name
        , msg      : requestValues
        };
        callOnConnection(call);
      };
    };
    ros.Service.prototype.__proto__ = EventEmitter2.prototype;

    // Params
    // ------

    // Retrieves list of param names from the ROS Parameter Server as an array.
    ros.getParamList = function(callback) {
      ros.once('/rosjs/get_param_names', function(data) {
        callback(data);
      });
      var call = {
        receiver : '/rosjs/get_param_names'
      , msg      : []
      };
      callOnConnection(call);
    };

    // A ROS param. Options include:
    //  * name - the param name, like max_vel_x
    ros.Param = function(options) {
      var param  = this;
      options    = options || {};
      param.name = options.name;

      // Fetches the value of the param and returns in the callback.
      param.get = function(callback) {
        ros.once('/rosjs/get_param', function(value) {
          callback(value);
        });
        var call = {
          receiver : '/rosjs/get_param'
        , msg      : [param.name]
        };
        callOnConnection(call);
      };

      // Sets the value of the param in ROS.
      param.set = function(value) {
        var call = {
          receiver : '/rosjs/set_param'
        , msg      : [param.name, value]
        };
        callOnConnection(call);
      };
    }
    ros.Param.prototype.__proto__ = EventEmitter2.prototype;

  };
  ROS.prototype.__proto__ = EventEmitter2.prototype;

  return ROS;

}));

