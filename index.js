var express = require('express');
var app = express();

app.get('/', function(req, res) {

});

app.listen(8000, function() {
  console.log("server's running on port 8000");
});