/**
 * Created by kells4 on 26/11/2015.
 */
/*global module, require */
module.exports = function (grunt) {
    // require it at the top and pass in the grunt instance
    require('time-grunt')(grunt);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            scripts: {
                files: [
                    'views/app.js',
                    'views/admin/*.js',
                    'views/admin/**/*.js',
                    'views/client/*.js',
                    'views/client/**/*.js'
                ],
                tasks: ['concat'],
                options: {
                    debounceDelay: 250,
                }
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [
                    'views/vendor/angular-1.4.7/angular.js',
                    'views/vendor/angular-1.4.7/angular-resource.js',
                    'views/vendor/angular-1.4.7/angular-cookies.js',
                    'views/vendor/bootstrap-3.3.5-dist/js/bootstrap.js',
                    'views/vendor/bootstrap-material-design-master/scripts/material.js',
                    'views/vendor/bootstrap-material-design-master/scripts/ripples.js',
                    'views/vendor/Chart.js-master/Chart.js',
                    'views/vendor/angular-charts/angular-chart.js',
                    'views/vendor/fastclick-master/lib/fastclick.js',
                    'views/app.js',
                    'views/client/*.js',
                    'views/client/**/*.js'
                ],
                dest: 'views/dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - Air New Zealand 2015(All Rights Reserved) %> */\n'
            },
            dist: {
                files: {
                    'views/dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        less: {
            development: {
                options: {
                    compress: true,
                    yuicompress: false,
                    optimization: 2,
                    cleancss:false,
                    paths: ["css"],
                    syncImport: false,
                    strictUnits:false,
                    strictMath: true,
                    strictImports: true,
                    ieCompat: false
                },
                files: {
                    '../@static@/common/js/dist/<%= pkg.name %>.css' : "../../java/nz/co/grabaseat/ui/less/gas/gas-header-footer.less"
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['karma:unit'
    ]);
    grunt.registerTask('packup', ['concat','uglify']);
    grunt.registerTask('concatfiles', ['concat'
    ]);
};