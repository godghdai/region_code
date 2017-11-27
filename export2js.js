const {
    SQLITE_CONFIG
} = require("./config");
const _ = require('lodash');
const knex = require('knex')(SQLITE_CONFIG);
const fs = require('fs');
const path = require('path');
const util = require('util');

var LevelEnum = {
    "province": 1,
    "city": 2,
    "county": 3,
    "town": 4,
    "village": 5
}

/*
async function getLevel(level) {
    var dataDic = _.keyBy(await knex.select().from('region').where("level", "<=", level), row => row["id"]);
    var dataGroupRows = await knex.raw(`select parentId,printf("'%s'",group_concat(name,"','")) as names from "region" where level<=? group by parentId`, level);
    return {
        dataDic,
        dataGroupRows
    };
}*/

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

function getLevelPath(parentNode) {
    var parent = parentNode;
    var result = [];
    while (parent._parent) {
        result.push(parent["_order"]);
        parent = parent._parent;
    }
    return result.reverse().join("_");
}

function getLevelData(json, _level) {
    var result = {};

    function getChilds(parent, level) {
        level++;
        if (level > _level) return;
        if (parent.childs && parent.childs.length > 0) {
            result[getLevelPath(parent)] = parent.childs.map(a => a["name"]);
            parent.childs.forEach(function(child, index) {
                child["_parent"] = parent;
                child["_order"] = index;
                getChilds(child, level);
            });
        }
    }
    getChilds(json, 0);
    return result;
}

async function start(level) {
    var sortFileList = getSortFileNames("f:\\tjcode\\store\\行政区划代码");
    var result = {
        "code": "000000000000",
        "name": "中国",
        "childs": [],
        "_order": 0,
        "_parent": {
            "_order": 0,
            "_parent": null
        }
    };
    for (var index = 0; index < sortFileList.length; index++) {
        let json = JSON.parse(fs.readFileSync(sortFileList[index]["path"]));
        json["_order"] = index;
        json["_parent"] = result;
        result["childs"].push(json);
    }
    return getLevelData(result, level);
}

start(LevelEnum.town).then(result => {
    var jstpl = `var __data=${JSON.stringify(result, null, "")};
    console.log(__data[1])
    `;
    fs.writeFileSync(`region.js`, jstpl);
    console.log("result");
}).catch(err => {
    console.log(err);
});