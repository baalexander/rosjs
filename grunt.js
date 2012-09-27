/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    concat: {
      bundle: {
        src: ['dist/eventemitter2.js', 'ros.js'],
        dest: 'dist/ros_bundle.js'
      }
    },
    min: {
      bundle: {
        src: ['<config:concat.bundle.dest>'],
        dest: 'dist/ros_bundle.min.js'
      },
      dest: {
        src: ['ros.js'],
        dest: 'dist/ros.min.js'
      }
    },
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'concat min');

};
