Ros.js provides the core JavaScript API for interacting with
[ROS](http://ros.org) via the web. Ros.js supports publishing and subscribing to
topics, getting and setting parameters, and calling services in ROS.

Ros.js uses [rosbridge](http://rosbridge.org/) on the backend and connects to
the server with WebSockets.

## Table of Contents

 * [Set Up Rosbridge](#set-up-rosbridge)
 * [How To](#how-to)
   * [Connect to ROS](#connect-to-ros)
   * [Disconnect from ROS](#disconnect-from-ros)
   * [Publish a topic](#publish-a-topic)
   * [Subscribe to a topic](#subscribe-to-a-topic)
   * [Call a service](#call-a-service)
   * [Set a param value](#set-a-param-value)
   * [Get a param value](#get-a-param-value)
   * [Work with ROS Time](#work-with-ros-time)
   * [Get ROS system info](#get-ros-system-info)
 * [Understanding Events](#understanding-events)
 * [Handling Errors](#handling-errors)
 * [Building](#building)
 * [Example](#example)
 * [License](#license)

## Set Up Rosbridge

Ros.js relies on rosbridge running on the server or robot. Rosbridge provides a
JSON interface to ROS, allowing any client to send JSON to publish or subscribe
to ROS topics, call ROS services, and more. The rosbridge stack contains a
WebSocket server, which ros.js connects to.

To install and run rosbridge, perform the following steps:

 1. Install the [rosbridge 2.0](http://kforge.ros.org/rosbridge/trac) stack

    ```bash
    sudo apt-get install ros-fuerte-rosbridge-suite
    ```

 2. Run ROS if not already running

    ```bash
    roscore
    ```

 3. Run rosapi (provides services that return information about ROS, like topic list)

    ```bash
    rosrun rosapi rosapi.py
    ```

 4. Run rosbridge_server (WebSocket server that rosjs will connect to)

    ```bash
    rosrun rosbridge_server rosbridge.py
    ```

After finishing these steps, rosbridge and its WebSocket server are running. Add
ros.js to your site and [set the URL](#connect-to-ros) to the rosbridge
WebSocket server.

## How To

#### Connect to ROS

```javascript
// Connects to the rosbridge WebSocket server.
var ros = new ROS('ws://localhost:9090');
```

or

```javascript
// Connects to the rosbridge WebSocket server.
var ros = new ROS();
ros.connect('ws://localhost:9090');
```

#### Disconnect from ROS

```javascript
// Disconnects from the rosbridge WebSocket server.
ros.close();
```

#### Publish a topic

```javascript
// ros.Topic provides publish and subscribe support for a ROS topic.
// Creates a geometry_msgs/Twist topic named /cmd_vel.
var cmdVel = new ros.Topic({
  name        : '/cmd_vel'
, messageType : 'geometry_msgs/Twist'
});

// ros.Message contains the data to publish.
var twist = new ros.Message({
  angular: {
    x: 1
  , y: 0
  , z: 0
  }
, linear: {
    x: 0
  , y: 0
  , z: 0
  }
});

// The geometry_msgs/Twist message will be published in ROS.
cmdVel.publish(twist);
```

#### Subscribe to a topic

```javascript
// Create a handle for the topic '/chatter' of type std_msgs/String.
var chatter = new ros.Topic({
  name        : '/chatter'
, messageType : 'std_msgs/String'
});

// Any time a message is published to the /chatter topic,
// the callback will fire.
chatter.subscribe(function(message) {
  // message is an instance of ros.Message.
  console.log('Received message ' + message.data);
});
```

#### Call a service

```javascript
// ros.Service provides an interface to calling ROS services.
// Creates a rospy_tutorials/AddTwoInts service client named /add_two_ints.
var addTwoInts = new ros.Service({
  name        : '/add_two_ints'
, serviceType : 'rospy_tutorials/AddTwoInts'
});

// ros.ServiceRequest contains the data to send in the service call.
var request = new ros.ServiceRequest({ A: 1, B: 2});

// Calls the rospy_tutorials/AddTwoInts service with the result stored in the
// callback.
addTwoInts.callService(request, function(result) {
  console.log('Result for service call on ' + addTwoInts.name + ': ' + result.sum);
});
```

#### Set a param value

```javascript
// ros.Param interfaces with the ROS Parameter Server.
var maxVelX = new ros.Param({
  name: 'max_vel_x'
});

// Sets the ROS param value.
maxVelX.set(0.75);
```

#### Get a param value

```javascript
var maxVelX = new ros.Param({
  name: 'max_vel_x'
});

// Fetches and returns the param value in the callback.
maxVelX.get(function(value) {
  console.log('Value of ' + maxVelX.name + ' is ' + value);
});
```

#### Work with ROS Time

```javascript
// Creates a ROS timestamp, which defaults to 0 seconds and 0 nanoseconds.
var time = new ros.Time();
```

```javascript
// Creates a ROS timestamp with a specified time.
var time = new ros.Time({
  secs  : 1345158610
, nsecs : 25000000
});
```

```javascript
// Creates a ROS timestamp set to the current time of the user.
var time = new ros.Time().now();
```

#### Get ROS system info

```javascript
// Retrieves the current list of topics in ROS.
ros.getTopics(function(topics) {
  console.log('Current topics in ROS: ' + topics);
});
```

```javascript
// Fetches list of all active services in ROS.
ros.getServices(function(services) {
  console.log('Current services in ROS: ' + services);
});
```

```javascript
// Gets list of all param names.
ros.getParams(function(params) {
  console.log('Current params in ROS: ' + params);
});
```

## Understanding Events

Ros.js follows the [Observer
patter](http://answers.oreilly.com/topic/2190-two-examples-of-the-observer-pattern-in-javascript/),
emitting (publishing) and listening (subscribing) to events.

[EventEmitter2](https://github.com/hij1nx/EventEmitter2) provides event support
to ros.js. The ROS, Topic, Service, and even Param objects all extend
EventEmitter2 and emits events. For example, when the ROS object connects to the
server, a 'connection' event is emitted. When a message is received for a topic,
the 'message' event is emitted on that topic object.

To listen for an event, use on() like in the examples below:

```javascript
var ros = new ROS('ws://localhost:9090');
ros.on('connection', function() {
  // This code will only be executed after ROS has connected to the server.
});

ros.on('close', function() {
  // This code will be executed when the connection to ROS disconnects.
});
```

## Handling Errors

As described in the Events section, every ros.js class emits events. Errors are
communicated as 'error' events. For example, the ros object will emit an 'error'
event whenever there's an issue with ROS and a topic object will emit an event
when there's an error publishing or subscribing to that topic.

It is highly recommended to at least listen for errors from the ros object, like so:

```javascript
var ros = new ROS('ws://localhost:9090');
ros.on('error', function(error) {
  console.log('There was an error with ROS: ' + error);
});
```

## Building

[Grunt.js](http://gruntjs.com/) provides JavaScript build utilities to rosjs,
including linting, testing, concatenating, and minimizing. The grunt.js file in
the project's root directory contains the config information, including where to
place the build files (the dist directory).

After grunt.js is installed, you should be able to run `grunt` from the command
line in the root of the project to build. You can verify it worked by checking
out the files in the dist directory.

## Example

A sample web app is provided under the `example/` directory. The example shows
some basic usage of ros.js.

To run, follow the [rosbridge setup](#set-up-rosbridge) first, then open the
`example/index.html` file in a browser and follow the page's instructions.

## License

The code is released under the BSD license. See the LICENSE file for details.

