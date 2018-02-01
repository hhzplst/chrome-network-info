const express = require('express');
const port = process.env.PORT || 8000;
const CDP = require('chrome-remote-interface');

async function getData(url) {
    let tab;
    let total_size = 0;
    try {
        tab = await CDP.New();
        const client = await CDP({tab});
        const {Page, Emulation, Network} = client;
        Network.responseReceived(({type, response}) => {
            if(type == 'Image') {
              let contentLength = (typeof response.headers['Content-Length'] === 'undefined')? 0 : Number.parseInt(response.headers['Content-Length']);
              let encodedLength = response.encodedDataLength;
              let curSize = Math.round((contentLength + encodedLength) / 1024 * 10) / 10;

              total_size += curSize;
            }
        });
        await Page.enable();
        await Network.enable();
        await Network.setCacheDisabled({cacheDisabled: true});
        //Laptop MDPI screen
        await Emulation.setDeviceMetricsOverride({
          'width': 1280,
          'height': 800,
          'deviceScaleFactor': 1,
          'mobile': false
        });
        await Network.setUserAgentOverride({userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'});
        await Promise.all([
            Page.navigate({url}),
            Page.loadEventFired()
        ]);
        console.log(`Done with ${url}`);
        return Promise.resolve({url, total_size});
    } catch (err) {
        throw err;
    } finally {
        if (tab) {
            CDP.Close({id: tab.id});
        }
    }
}

const app = express();

app.get('/', async function (req, res) {

    const urls = ['http://athleta.gap.com',
                  'http://oldnavy.gap.com',
                  'http://www.gap.com',
                  'http://bananarepublic.gap.com'];

    try {
        const handlers = await Promise.all(urls.map(setInterval(getData, 6000)));
        handlers.forEach(function(item, i) {
            res.write('<html><head></head><body>');
            res.write('<p>' + item.url + " : " + Math.round(item.total_size * 10) / 10 + '</p>' );
            res.write('<br>');
        });
    } catch (err) {
        console.error(err);
    } finally {
        res.end('</body></html>');
    }
});

app.listen(port, function () {
    console.log("server's running on port " + port);
});