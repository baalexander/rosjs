var ros = new ROS('ws://localhost:9090');

ros.on('error', function(error) {
  console.log(error);
});


// Topics
// ------

ros.messageTypes([
  'std_msgs/String'
, 'geometry_msgs/Twist'
], function(String, Twist) {
  console.log('Created message types');

  // Create a new topic, /cmd_vel
  var cmdVel = new ros.topic({
    node        : 'talker'
  , name        : 'cmd_vel'
  , messageType : Twist
  });
  console.log('Created topic ' + cmdVel.name);

  // Listen for errors on /cmd_vel
  cmdVel.on('error', function(error) {
    console.log('cmdVel error: ' + error);
  });

  var twist = new Twist({
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
  cmdVel.publish(twist);
  console.log('Published message on ' + cmdVel.name);

  // Subscribe to messages on the /listener topic
  var listener = new ros.topic({
    node        : 'talker'
  , name        : '/listener'
  , messageType : String
  });
  console.log('Created topic ' + listener.name);
  listener.subscribe(function(message) {
    console.log('Received message on ' + listener.name + ': ' + message.data);
    listener.unregisterSubscriber();
  });

  // Retrieve list of all active topics in ROS
  ros.getTopicList(function(topics) {
    console.log('Current topics in ROS:' + topics);
  });

});


// Services
// --------

ros.serviceTypes([
  'rospy_tutorials/AddTwoInts'
], function(AddTwoInts) {
  console.log('Created service types');

  // Create a new service client
  var addTwoIntsClient = new ros.service({
    name        : '/add_two_ints'
  , serviceType : AddTwoInts
  });

  // Listen for errors when calling /add_two_ints
  addTwoIntsClient.on('error', function(error) {
    console.log('add_two_ints error: ' + error);
  });

  // Call the service with a callback for the results
  var request = new AddTwoInts.request({ A: 1, B: 2});
  addTwoIntsClient.callService(request, function(result) {
    console.log('Result for service call on ' + addTwoIntsClient.name + ': ' + result.sum);
  });

  // Retrieve list of all active services in ROS
  ros.getServiceList(function(services) {
    console.log('Current services in ROS: ' + services);
  });
});


// Params
// ------

ros.on('connection', function() {
  var maxVelX = new ros.param({
    name: 'max_vel_x'
  });

  maxVelX.set('sup world');

  maxVelX.get(function(value) {
    console.log('Value of ' + maxVelX.name + ' is ' + value);
  });

  ros.getParamList(function(params) {
    console.log('Current params in ROS: ' + params);
  });

});

