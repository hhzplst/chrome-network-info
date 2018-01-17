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
          '--headless'
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

    await Emulation.setDeviceMetricsOverride({
      'width': 412,
      'height': 732,
      'deviceScaleFactor': 0,
      'mobile': true
    });

    Page.navigate({
      url: 'http://athleta.gap.com/'
    });

    var total_size = 0;
    var count = 0;

    Network.responseReceived(({type, response}) => {
      if(type == 'Image') {
        console.log(response.headers['Content-Length']);
        console.log(response.encodedDataLength);
        let contentLength = Number.parseInt(response.headers['Content-Length']);
        let encodedLength = Number.parseInt(response.encodedDataLength);

        total_size += ((isNaN(contentLength)? 0 : contentLength) + (isNaN(encodedLength)? 0 : encodedLength));
      }
    });

    Page.frameStoppedLoading(({}) => {
      console.log("total size", total_size);
    });
    
  })();
});

app.listen(port, function() {
  console.log("server's running on port " + port);
});