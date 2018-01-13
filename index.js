var express = require('express');
var app = express();
var port = process.env.PORT || 8000;

const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');

app.get('/', function(req, res) {
  chromeLauncher.launch({
    startingUrl: 'http://gap.com',
    chromeFlags: ['--headless']
  }).then(chrome => {
    res.send(`Chrome debugging port running on ${chrome.port}`);
  });
});

app.listen(port, function() {
  console.log("server's running on port " + port);
});