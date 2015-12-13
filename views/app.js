/**
 * Created by kells4 on 2/11/2015.
 */
var app = angular.module('app',['chart.js','ngCookies']);

var dev_only = true;
var serverUrl = dev_only ? 'https://localhost' : 'https://promo.grabaseat.co.nz';

Chart.defaults.global.colours = [
    '#00B8D4', // blue
    '#5D4037', // light grey
    '#F7464A', // red
    '#388E3C', // green
    '#FF6D00', // yellow
    '#949FB1', // grey
    '#4D5360'  // dark grey
];

// initialiser for FastClick which removes the 300ms delay from mobile browsers on click events
if(window.addEventListener){
    window.addEventListener('load', function () {
        if(typeof FastClick !== 'undefined'){
            FastClick.attach(document.body);
        }
    }, false);
}