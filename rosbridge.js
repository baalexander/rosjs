var Rosbridge = (function() {

  var rosbridge = function() {
    if ((this instanceof rosbridge) === false) {
      return new rosbridge();
    }
  }

  rosbridge.prototype.message = function(type) {
    this.type = type;
  };

  rosbridge.prototype.topic = function(name, type) {
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
  rosbridge.prototype.topic.prototype.__proto__ = EventEmitter2.prototype;

  rosbridge.prototype.service = function(name) {
    this.name = name;

    this.connect = function() {
      this.emit('connect');
    };

    this.callService = function(args, callback) {

    };
  };
  rosbridge.prototype.service.prototype.__proto__ = EventEmitter2.prototype;

  rosbridge.prototype.param = function(name) {
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
  rosbridge.prototype.param.prototype.__proto__ = EventEmitter2.prototype;

  return rosbridge;

}());

