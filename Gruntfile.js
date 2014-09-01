module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        connect: {
            server: {
              options: {
                    port: 9001,
                    hostname: 'localhost',
                    base: '.',
                    keepalive: true
                }
            }
        },

        karma : {
           unit: {
            configFile: 'js/tests/karma.conf.js'
            // keepalive: true
            // autoWatch: true
           }
        },

        jasmine: {
            src: [],
            options: {
                vendor: []
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-karma');
    grunt.registerTask('default', []);
};






