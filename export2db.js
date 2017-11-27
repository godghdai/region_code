const { SQLITE_CONFIG } = require("./config");
const _ = require('lodash');
const knex = require('knex')(SQLITE_CONFIG);
const fs = require('fs');
const path = require('path');
const util = require('util');

async function createTable() {
    await knex.schema.dropTableIfExists('region');
    await knex.schema.createTableIfNotExists('region', table => {
        table.string('id');
        table.string('code');
        table.string('name');
        table.integer("type");
        table.integer("level");
        table.integer("parentId");
    });
}

const getNewID = (function() {
    var id = 0;
    return function() {
        return id++;
    }
})();

function getSortFileNames(dir) {
    const files = fs.readdirSync(dir);
    var result = [],
        filepath = "";
    for (var index = 0; index < files.length; index++) {
        filepath = path.join(dir, files[index]);
        let json = JSON.parse(fs.readFileSync(filepath));
        result.push({
            "name": path.basename(files[index], '.json'),
            "path": filepath,
            "code": parseInt(Object.values(json)[0].substr(0, 2))
        });
    }
    return result.sort((a, b) => a.code - b.code);
}


function getProvinceData(filepath) {
    let json = JSON.parse(fs.readFileSync(filepath));
    let result = [];

    function getChilds(parent, level) {
        level++;
        var node = {
            "id": getNewID(),
            "name": parent.name,
            "code": parent.code,
            "type": parseInt(parent["type"] || "-1"),
            "parentId": parent._parent["id"],
            level
        }
        result.push(node);
        if (parent.childs && parent.childs.length > 0) {
            parent.childs.forEach(function(child) {
                child["_parent"] = node;
                getChilds(child, level);
            });
        }
    }

    json["id"] = getNewID();
    json["_parent"] = { id: -1 };
    getChilds(json, 0);
    return result;
}

async function batchInsert(provinceName, provinceData, LIMIT = 100) {
    var bufferRows = [],
        total_page = Math.ceil(provinceData.length / LIMIT),
        count = 0;
    for (var page = 0; page < total_page; page++) {
        bufferRows = provinceData.slice(page * LIMIT, page * LIMIT + LIMIT);
        await knex.batchInsert('region', bufferRows)
            .then(ids => {
                return Promise.resolve(ids);
            }).catch(error => {
                console.log(error);
                return Promise.resolve([]);
            });
        count += bufferRows.length;
        console.log(provinceName + "[" + provinceData.length + "/" + count + "]");
    }
    return true;
}

async function start() {
    ///  await createTable();
    var sortFileList = getSortFileNames("f:\\tjcode\\store\\行政区划代码");
    for (var index = 0; index < sortFileList.length; index++) {
        var provinceData = getProvinceData(sortFileList[index]["path"]);
        console.log(provinceData.length);
        // await batchInsert(sortFileList[index]["name"], provinceData);
    }

}

start().then(result => {
    console.log(result);
}).catch(err => {
    console.log(err);
});

/*
function mapLimitPromise(dir, limit) {
    async.auto({
            fileNames: function(callback) {
                _fs.readdir(dir, (err, files) => {
                    if (err) return callback(err);
                    callback(null, files);
                });
            },
            provinceCode: ["fileNames", function(results, nextCallback) {
                async.mapLimit(results.fileNames, limit, function(fileName, callback) {
                    _fs.readFile(path.join(dir, fileName), function(err, content) {
                        if (err) return callback(err);
                        let json = JSON.parse(content);
                        callback(null, {
                            "name": fileName,
                            "code": Object.values(json)[0].substr(0, 2)
                        });
                    })
                }, function(err, results) {
                    if (err) return nextCallback(err);
                    nextCallback(null, results);
                });
            }]
        },
        function(err, results) {
            console.log(err);
            console.log('results = ', results);
        });

}
mapLimitPromise("f:\\tjcode\\store\\行政区划代码", 5);
return;
*/