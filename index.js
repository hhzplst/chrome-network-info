var express = require('express');
var app = express();
var port = process.env.PORT || 8000;

const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');

app.get('/', function(req, res) {
  (async function() {
    async function launchChrome() {
      return await chromeLauncher.launch({
        chromeFlags: [
          // '--headless'
        ]
      });
    }
    const chrome = await launchChrome();
    const protocol = await CDP({
      port: chrome.port
    });

    const {
      DOM,
      Page,
      Emulation,
      Network,
      Runtime
    } = protocol;
    await Promise.all([DOM.enable(), Page.enable(), Network.enable(), Runtime.enable()]);

    await Network.setCacheDisabled({cacheDisabled: true});
    //getting the user agent for Nexus 6p
    await Network.setUserAgentOverride({userAgent: 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Mobile Safari/537.36'});

    await Emulation.setDeviceMetricsOverride({
      'width': 412,
      'height': 732,
      'deviceScaleFactor': 1,
      'mobile': true
    });

    Page.navigate({
      url: 'http://athleta.gap.com/'
    });

    var total_size = 0;

    Network.responseReceived(({type, response}) => {
      if(type == 'Image') {
        let contentLength = Number.parseInt(response.headers['Content-Length']);
        total_size += (isNaN(contentLength)? 0 : contentLength);
      }
    });

    Page.loadEventFired(params => {
      console.log("in loadEventFired, total_size is, ", total_size);
    });
  })();
});

app.listen(port, function() {
  console.log("server's running on port " + port);
});