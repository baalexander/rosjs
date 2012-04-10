// Convenience method to log output to HTML
var log = function(message) {
  var ul = document.getElementById('log');
  var li = document.createElement('li');
  var messageNode = document.createTextNode(message);
  li.appendChild(messageNode);
  ul.appendChild(li);
};

window.onload = function() {

  ros.types([
    'geometry_msgs/Twist'
  , 'people_tracker/ImagePosition'
  ], function(Twist, Pos) {
    log('Created message types ' + Twist.type + ' and ' + Pos.type);

    var node = ros.node('talker');
    node.topics([
      { topic: '/cmd_vel' }
    , { topic: '/person' }
    ], function(cmdVel, person) {
      log('Created topics ' + cmdVel.name + ' and ' + person.name);

      cmdVel.on('error', function(error) {
        log('cmdVel error: ' + error);
      });

      person.publish();

      cmdVel.subscribe(function(message) {
        log('Message on ' + cmdVel.name + ': ' + message);
      });
    });

    ros.services([
      { service: 'add_two_ints' }
    , { service: 'multiply_by_three' }
    ], function(addTwoInts, multiplyByThree) {
      log('Created services ' + addTwoInts.name + ' and ' + multiplyByThree.name);

      addTwoInts.callService(2, 3, function(error, results) {
        log('Result for service call on ' + addTwoInts.name + ': ' + results.sum);
      });
    });

    ros.params([
      { param: 'escape_vel' }
    , { param: 'max_vel_x' }
    ], function(escapeVel, maxVelX) {
      log('Created params ' + escapeVel.name + ' and ' + maxVelX.name);

      var maxX = maxVelX.get();

      maxVelX.on('update', function(value) {
        maxX = value;
      });

      escapeVel.set(0.9);
    });

  });
};
