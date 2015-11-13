#!/usr/bin/env node

var transform = require('./transform');
var recast = require('recast');

//var res = transform('function a() { return 3.14; } while(1) { var x = 0; x += a(1); }');
//var res = transform('function a() {}', true);
var res = transform('1;function a() {};', false, true);

//var code = recast.print(res).code;

console.log(res.code);
//console.log(code);
