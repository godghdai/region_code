const fs = require('fs');
const path = require('path');
const { ROOT_PATH, SAVE_BASE_PATH } = require("../../config");
const glob = require("glob");

async function getJsonFiles() {
    return new Promise((resolve, reject) => {
        glob("**/*.json", {
            cwd: ROOT_PATH,
            "ignore": ["node_modules/**", "package.json"]
        }, function(err, files) {
            if (err) return reject(err);
            resolve(files);
        })
    })
}

async function packAllJson(filename) {
    var files = await getJsonFiles();
    var zip = new require('node-zip')();
    files.forEach(file => {
        zip.file(path.basename(file), fs.readFileSync(path.join(ROOT_PATH, file)));
    });
    var data = zip.generate({ base64: false, compression: 'DEFLATE' });
    fs.writeFileSync(path.join(SAVE_BASE_PATH, filename), data, 'binary');
    return true;
}

async function packSingeJson() {
    var files = await getJsonFiles();
    files.forEach(file => {
        var zip = new require('node-zip')();
        zip.file(path.basename(file), fs.readFileSync(path.join(ROOT_PATH, file)));
        var data = zip.generate({ base64: false, compression: 'DEFLATE' });
        fs.writeFileSync(path.join(SAVE_BASE_PATH, path.basename(file, '.json') + ".zip"), data, 'binary');
    });
    return true;
}
module.exports = {
    packAllJson,
    packSingeJson
};