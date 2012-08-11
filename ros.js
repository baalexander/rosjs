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

    // Provides a unique ID for each message sent to the server.
    ros.idCounter = 0;

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
      if (data.op === 'publish') {
        ros.emit(data.topic, data.msg);
      }
      else if (data.op === 'service_response') {
        ros.emit(data.id, data.values);
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
    ros.getTopics = function(callback) {
      var topicsClient = new ros.Service({
        name        : '/rosapi/topics'
      , serviceType : 'rosapi/Topics'
      });

      var request = new ros.ServiceRequest();

      topicsClient.callService(request, function(result) {
        callback(result.topics);
      });
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
      var topic          = this;
      options            = options || {};
      topic.node         = options.node;
      topic.name         = options.name;
      topic.messageType  = options.messageType;
      topic.isAdvertised = false;

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

        ros.idCounter++;
        var subscribeId = 'subscribe:' + topic.name + ':' + ros.idCounter;
        var call = {
          op    : 'subscribe'
        , id    : subscribeId
        , type  : topic.messageType
        , topic : topic.name
        };
        callOnConnection(call);
      };

      // Unregisters as a subscriber for the topic. Unsubscribing will remove
      // all subscribe callbacks.
      topic.unsubscribe = function() {
        ros.removeAllListeners([topic.name]);
        ros.idCounter++;
        var unsubscribeId = 'unsubscribe:' + topic.name + ':' + ros.idCounter;
        var call = {
          op    : 'unsubscribe'
        , id    : unsubscribeId
        , topic : topic.name
        };
        callOnConnection(call);
      };

      // Registers as a publisher for the topic.
      topic.advertise = function() {
        ros.idCounter++;
        var advertiseId = 'advertise:' + topic.name + ':' + ros.idCounter;
        var call = {
          op    : 'advertise'
        , id    : advertiseId
        , type  : topic.messageType
        , topic : topic.name
        };
        callOnConnection(call);
        topic.isAdvertised = true;
      };

      // Unregisters as a publisher for the topic.
      topic.unadvertise = function() {
        ros.idCounter++;
        var unadvertiseId = 'unadvertise:' + topic.name + ':' + ros.idCounter;
        var call = {
          op    : 'unadvertise'
        , id    : unadvertiseId
        , topic : topic.name
        };
        callOnConnection(call);
        topic.isAdvertised = false;
      };

      // Publish the message. Takes in a ros.Message.
      topic.publish = function(message) {
        if (!topic.isAdvertised) {
          topic.advertise();
        }

        ros.idCounter++;
        var publishId = 'publish:' + topic.name + ':' + ros.idCounter;
        var call = {
          op    : 'publish'
        , id    : publishId
        , topic : topic.name
        , msg   : message
        };
        callOnConnection(call);
      };
    };
    ros.Topic.prototype.__proto__ = EventEmitter2.prototype;

    // Services
    // --------

    // Retrieves list of active service names in ROS as an array.
    ros.getServices = function(callback) {
      var servicesClient = new ros.Service({
        name        : '/rosapi/services'
      , serviceType : 'rosapi/Services'
      });

      var request = new ros.ServiceRequest();

      servicesClient.callService(request, function(result) {
        callback(result.services);
      });
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
        ros.idCounter++;
        serviceCallId = 'call_service:' + service.name + ':' + ros.idCounter;

        ros.once(serviceCallId, function(data) {
          var response = new ros.ServiceResponse(data);
          callback(response);
        });

        var requestValues = [];
        Object.keys(request).forEach(function(name) {
          requestValues.push(request[name]);
        });

        var call = {
          op      : 'call_service'
        , id      : serviceCallId
        , service : service.name
        , args    : requestValues
        };
        callOnConnection(call);
      };
    };
    ros.Service.prototype.__proto__ = EventEmitter2.prototype;

    // Params
    // ------

    // Retrieves list of param names from the ROS Parameter Server as an array.
    ros.getParams = function(callback) {
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
        var error = new Error('Param getting not integrated with rosbridge 2.0');
        ros.emit('error', error);
        // ros.once('/rosjs/get_param', function(value) {
        //   callback(value);
        // });
        // var call = {
        //   receiver : '/rosjs/get_param'
        // , msg      : [param.name]
        // };
        // callOnConnection(call);
      };

      // Sets the value of the param in ROS.
      param.set = function(value) {
        var error = new Error('Param setting not integrated with rosbridge 2.0');
        ros.emit('error', error);
        // var call = {
        //   receiver : '/rosjs/set_param'
        // , msg      : [param.name, value]
        // };
        // callOnConnection(call);
      };
    }
    ros.Param.prototype.__proto__ = EventEmitter2.prototype;

  };
  ROS.prototype.__proto__ = EventEmitter2.prototype;

  return ROS;

}));

