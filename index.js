const express = require('express');
const port = process.env.PORT || 8000;
const CDP = require('chrome-remote-interface');
const app = express();

app.get('/', async function (req, res) {
    const urls = ['http://athleta.gap.com',
                  'http://oldnavy.gap.com',
                  'http://www.gap.com',
                  'http://bananarepublic.gap.com'];

    const devices = [{
                        name: 'Laptop MDPI',
                        width: 1280,
                        height: 800,
                        mobile: false,
                        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36'}, 
                     {
                        name: 'Nexus 6P',
                        width: 412,
                        height: 731,
                        mobile: true,
                        userAgent: 'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Mobile Safari/537.36'}
                    ];
    try {
        res.write('<html><head></head><body>');
        res.write('<h1>Headless Chrome App</h1>');
        res.write('<h3>Getting Data for Laptop MDPI...</h3>');
        await Promise.all(urls.map(getData, devices[0]));
        res.write('<br>');
        res.write('<h3>Getting Data for Nexus 6P...</h3>')
        await Promise.all(urls.map(getData, devices[1]));
    } catch (err) {
        console.error(err);
    } finally {
        res.end('</body></html>');
    }

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
              'width': this.width,
              'height': this.height,
              'deviceScaleFactor': 1,
              'mobile': this.mobile
            });
            await Network.setUserAgentOverride({userAgent: this.userAgent});
            await Promise.all([
                Page.navigate({url}),
                Page.loadEventFired()
            ]);
            res.write('<p>' + url + " : " + Math.round(total_size * 10) / 10 + '</p>' );
        } catch (err) {
            throw err;
        } finally {
            if (tab) {
                CDP.Close({id: tab.id});
            }
        }
    }
});

app.listen(port, function () {
    console.log("server's running on port " + port);
});