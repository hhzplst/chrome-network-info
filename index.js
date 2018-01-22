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

    // Network.requestWillBeSent(params => {
    //   const type = params.type;
    //   if(type != 'Image')
    //     return;
    // });

    var total_size = 0;

    Network.responseReceived(({type, response}) => {
      if(type == 'Image') {
        let contentLength = (typeof response.headers['Content-Length'] === 'undefined')? 0 : Number.parseInt(response.headers['Content-Length']);
        let encodedLength = response.encodedDataLength;
        let curSize = Math.round((contentLength + encodedLength) / 1024 * 10) / 10;

        total_size += curSize;
      }
    });

    Page.loadEventFired(params => {
      console.log("in loadEventFired, total_size is, ", Math.round(total_size * 10) / 10);
    });
    
    //Laptop MDPI screen
    await Emulation.setDeviceMetricsOverride({
      'width': 1280,
      'height': 800,
      'deviceScaleFactor': 1,
      'mobile': false
    });
    await Network.setUserAgentOverride({userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'});
    Page.navigate({
        url: 'http://athleta.gap.com/'
    });

    //Nexus 6p
    // await Emulation.setDeviceMetricsOverride({
    //   'width': 412,
    //   'height': 731,
    //   'deviceScaleFactor': 1,
    //   mobile: true
    // });
    // await Network.setUserAgentOverride({userAgent: 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Mobile Safari/537.36'});
  })();
});

app.listen(port, function() {
  console.log("server's running on port " + port);
});