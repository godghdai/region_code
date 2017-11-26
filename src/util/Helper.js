const fs = require('fs');
const path = require('path');

function dateFormat(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
    const fn = d => {
        return ('0' + d).slice(-2);
    };

    const d = new Date(date);
    const formats = {
        YYYY: d.getFullYear(),
        MM: fn(d.getMonth() + 1),
        DD: fn(d.getDate()),
        HH: fn(d.getHours()),
        mm: fn(d.getMinutes()),
        ss: fn(d.getSeconds())
    };

    return format.replace(/([a-z])\1+/ig, a => {
        return formats[a] || a;
    });
}

/**
 * make callback function to promise
 * @param  {Function} fn       []
 * @param  {Object}   receiver []
 * @return {Promise}            []
 */
function promisify(fn, receiver) {
    return (...args) => {
        return new Promise((resolve, reject) => {
            fn.apply(receiver, [...args, (err, res) => {
                return err ? reject(err) : resolve(res);
            }]);
        });
    };
}

/**
 * check path is exist
 */
function isExist(dir) {
    dir = path.normalize(dir);
    try {
        fs.accessSync(dir, fs.R_OK);
        return true;
    } catch (e) {
        return false;
    }
}


/**
 * get files in path
 * @param  {} dir    []
 * @param  {} prefix []
 * @return {}        []
 */
function getdirFiles(dir, prefix = '') {
    dir = path.normalize(dir);
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    let result = [];
    files.forEach(item => {
        const currentDir = path.join(dir, item);
        const stat = fs.statSync(currentDir);
        if (stat.isFile()) {
            result.push(path.join(prefix, item));
        } else if (stat.isDirectory()) {
            const cFiles = getdirFiles(currentDir, path.join(prefix, item));
            result = result.concat(cFiles);
        }
    });
    return result;
};

module.exports = {
    dateFormat,
    promisify,
    isExist,
    getdirFiles
}