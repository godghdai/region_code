const _request = require('request');
const iconv = require('iconv-lite');
const extend = require("xtend");
const loggers = require("./Loggers");
const loggers_request = loggers.get('request');

const _DefaultOption = {
    tryTime: 3,
    timeout: 2000,
    charset: null
}

class Request {
    constructor(url, option) {
        this.option = extend(_DefaultOption, option);
        this.url = url;
        this.tryTime = this.option["tryTime"];
    }
    _get(resolve, reject) {
        var enc = this.option["charset"];

        function checkEncoding(enc) {
            if (enc && !iconv.encodingExists(enc)) {
                return new Error('encoding not supported by iconv-lite')
            }
        }

        function onResponse(res) {
            const chunks = [];
            res.on('data', function(chunk) {
                chunks.push(chunk);
            })
            res.on('end', function() {
                let text, err = null;
                const buf = Buffer.concat(chunks);
                if (!enc) {
                    if (res.headers['content-type']) {
                        enc = (res.headers['content-type'].match(/charset=(.+)/) || []).pop();
                    }
                    if (!enc) {
                        enc = (buf.toString().match(/<meta.+?charset=['"]?([^"']+)/i) || []).pop();
                    }
                    err = checkEncoding(enc);
                    if (err) return reject(err);
                    if (!enc) {
                        enc = 'utf-8';
                    }
                }
                try {
                    text = iconv.decode(buf, enc);
                    return resolve(text);
                } catch (err) {
                     reject(err);
                }
            })
        }

        _request.get({
                url: this.url,
                timeout: this.option["timeout"]
            })
            .on('response', onResponse)
            .on('error', err => {
                //console.log(err);
                if (this.tryTime > 0) {
                    console.log("retry..................");
                    console.log(this.url);
                    console.log("........................");
                    this.tryTime--;
                    this._get(resolve, reject);
                    return;
                }
                loggers_request.error(this.url);
                reject(err);
            });
    }
    static Get(url, option) {
        return new Promise((resolve, reject) => {
            new Request(url, option)._get(resolve, reject);
        })
    }
}

module.exports = Request;