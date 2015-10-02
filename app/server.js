'use strict';

var express = require('express');
var app     = express();

app.use(express.static('app'));
app.use(express.static('.tmp'));

app.get('/*', function(req,res) {
  res.sendFile('index.html', { root: __dirname });
});

var server = app.listen(9000, function() {
  console.log('Express sever started');
});
