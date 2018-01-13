var express = require('express');
var app = express();
var port = process.env.PORT || 8000;

const CDP = require('chrome-remote-interface');

app.get('/', function(req, res) {
  res.send("psss");
});

app.listen(port, function() {
  console.log("server's running on port " + port);
});