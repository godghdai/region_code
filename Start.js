const fs = require('mz/fs');
const { Zip, Convert, Spider } = require("./src/lib");
const path = require('path');
const { SAVE_BASE_PATH } = require("./config");

async function start(provincesStr) {
    var provinces = await Spider.filterProvince(provincesStr);
    for (var index = 0; index < provinces.length; index++) {
        var province = provinces[index];
        Convert.SET_PROVINCE_TITLE(province[Convert.NAME]);
        var url = province.url;
        delete province.url;
        await Spider.getChild(url, province, 0);
        await fs.writeFile(path.resolve(SAVE_BASE_PATH, `${province[Convert.NAME]}.json`), JSON.stringify(province, (key, value) => {
            if (key == "_parent") return undefined;
            return value;
        }, 4));
    }
    //await Zip.packSingeJson();
    //await Zip.packAllJson("行政区划代码.zip");
    return "finished...."
}

start("北京,天津,河北,山西,内蒙古,辽宁,吉林,黑龙江,上海,江苏,浙江,安徽,福建,江西,山东,河南,湖北,湖南,广东,广西,海南,重庆,四川,贵州,云南,西藏,陕西,甘肃,青海,宁夏,新疆").then(result => {
    console.log(result);
});