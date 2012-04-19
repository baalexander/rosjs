var ros = new ROS('http://localhost:8000');
ros.types([
  'geometry_msgs/Twist'
, 'people_tracker/ImagePosition'
], function(Twist, Pos) {
  console.log('Created message types');

  // Pub / Sub
  // ---------

  // Create a new topic, /cmd_vel
  var cmdVel = new ros.topic({
    node        : 'talker'
  , topic       : 'cmd_vel'
  , messageType : Twist
  });
  console.log('Created topic ' + cmdVel.topic);

  // Listen for errors on /cmd_vel
  cmdVel.on('error', function(error) {
    console.log('cmdVel error: ' + error);
  });

  // Subscribe to messages on the /cmd_vel topic
  cmdVel.subscribe(function(message) {
    console.log('Message on ' + cmdVel.topic + ': ' + message);
  });


  // Services
  // --------

  // Create a new service, add_two_ints
  var addTwoInts = new ros.service({
    service : 'add_two_ints'
  });

  // Call the service and with a callback for the results
  addTwoInts.callService(2, 3, function(results) {
    console.log('Result for service call on ' + addTwoInts.service + ': ' + results.sum);
  });


  // Params
  // ------

  // Create a new param socket
  var maxVelX = new ros.param({
    param: 'max_vel_x'
  });

  // Get the current value
  var maxX = maxVelX.get();

  // Receive notifications when the param is updated
  maxVelX.on('update', function(value) {
    maxX = value;
  });

  // Set the param to a value.
  maxVelX.set(1.0);

});

