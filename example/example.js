
// Connecting to ROS
// -----------------
var ros = new ROS();

// If there is an error on the backend, an 'error' emit will be emitted.
ros.on('error', function(error) {
  console.log(error);
});

// Create a connection to the rosbridge WebSocket server.
ros.connect('ws://localhost:9090');


// Publishing a Topic
// ------------------

// First, we create a Topic object with details of the topic's node, name, and
// message type.
var robotPose = new ros.Topic({
  name        : '/robot_pose'
, messageType : 'geometry_msgs/PoseStamped'
});

// Then we create the payload to be published. The object we pass in to
// ros.Message matches the fields defined in the geometry_msgs/PoseStamped.msg
// definition.
var poseStamped = new ros.Message({
  header: {
    seq      : 0
  , stamp    : 0
  , frame_id : ''
  }
, pose: {
    position: {
      x : 36
    , y : 42
    , z : 0
    }
  , orientation: {
      x : 0
    , y : 0
    , z : 0
    , w : 0
    }
  }
});

// And finally, publish.
robotPose.publish(poseStamped);


// Subscribing to a Topic
// ----------------------

// Like when publishing a topic, we first create a Topic object with details of
// the topic's node, name, and message type. Note that we can call publish or
// subscribe on the same topic object.
var listener = new ros.Topic({
  name        : '/listener'
, messageType : 'std_msgs/String'
});

// Then we add a callback to be called every time a message is published on this
// topic.
listener.subscribe(function(message) {
  console.log('Received message on ' + listener.name + ': ' + message.data);

  // If desired, we can unsubscribe from the topic as well.
  listener.unsubscribe();
});


// Calling a service
// -----------------

// First, we create a Service client with details of the service's name and
// service type.
var addTwoIntsClient = new ros.Service({
  name        : '/add_two_ints'
, serviceType : 'rospy_tutorials/AddTwoInts'
});

// Then we create a Service Request. The object we pass in to
// ros.ServiceRequest matches the fields defined in the rospy_tutorials'
// AddTwoInts.srv file.
var request = new ros.ServiceRequest({ A: 1, B: 2});

// Finally, we call the /add_two_ints service and get back the results in the
// callback. The result is a ros.ServiceResponse object.
addTwoIntsClient.callService(request, function(result) {
  console.log('Result for service call on ' + addTwoIntsClient.name + ': ' + result.sum);
});


// Setting a param value
// ---------------------

ros.getParams(function(params) {
  console.log(params);
});

// First, we create a Param object with the name of the param.
var maxVelX = new ros.Param({
  name: 'max_vel_y'
});

// Then we set the value of the param, which is sent to the ROS Parameter
// Server.
maxVelX.set(0.8);
maxVelX.get(function(value) {
  console.log('MAX VAL: ' + value);
});


// Getting a param value
// ---------------------

var favoriteColor = new ros.Param({
  name: 'favorite_color'
});

favoriteColor.set('red');

favoriteColor.get(function(value) {
  console.log('My robot\'s favorite color is ' + value);
});

