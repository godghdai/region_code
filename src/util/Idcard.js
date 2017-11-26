const { Request, Spider } = require("../lib");
const { dateFormat, promisify } = require("./Helper");
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const baseUrl = "http://www.stats.gov.cn/tjsj/tjbz/xzqhdm/";
const { STORE_PATH } = require("../../config");

//获取 最新县及县以上行政区划代码
async function getXZQHDM() {
    var res, $, url;
    //获取 最新县及县以上行政区划代码 链接
    res = await Request.Get(baseUrl, { tryTime: 3 });
    $ = cheerio.load(res);
    url = $(".center_list_contlist li").first().children("a").attr("href");
    res = await Request.Get(baseUrl + url, { tryTime: 3 });
    $ = cheerio.load(res);

    var result = [],
        ps, childs, code, title;
    ps = $(".TRS_PreAppend p");
    for (var i = 0; i < ps.length; i++) {
        childs = $(ps[i]).children().not((i, el) => $(el).text().trim() == "");
        code = childs.eq(0).text().trim();
        title = childs.eq(1).text().trim();
        result.push({ code: code, title: title, lev: 3 });

        if (code.substr(-4) == "0000") {
            result[result.length - 1].lev = 1;
            continue;
        }

        if (code.substr(2, 2) != "00" && code.substr(-2) == "00") {
            result[result.length - 1].lev = 2;
        }
    }
    return result;
}

const writeFilePromise = promisify(fs.writeFile);
//更新最新行政区划代码
async function updateData() {
    var result = (await getXZQHDM()).reduce((res, item) => {
        res[item["code"]] = item["title"];
        return res;
    }, {});
    await writeFilePromise(STORE_PATH, JSON.stringify(result, null, ""));
    loadData(true);
}

var _ID_CARD_DIC = null;

function loadData(reload = false) {
    if (!fs.existsSync(STORE_PATH)) throw new Error(`${STORE_PATH} 文件不存在！！`);
    if (reload || _ID_CARD_DIC == null) {
        _ID_CARD_DIC = JSON.parse(fs.readFileSync(STORE_PATH));
    }
}

function getAddress(code) {
    const getTitle = code => (_ID_CARD_DIC[code] || "");
    if (!/\d{6}/.test(code)) return [];
    let buffer = [];
    return code.split("").reduce((res, item, index) => {
        buffer.push(item);
        if (index % 2) {
            let code = buffer.join("");
            code = code + "000000".substr(0, 6 - code.length);
            res.push(getTitle(code));
        }
        return res;
    }, []);
}

function getBirthday(idcard) {
    //"19870222"
    let birthday = idcard.substr(6, 8),
        year = birthday.substr(0, 4),
        mouth = birthday.substr(4, 2) - 1,
        day = birthday.substr(-2);
    return dateFormat(new Date(year, mouth, day), "YYYY年MM月DD日");
}

function getCheckCode(str) {
    // ISO 7064:1983.MOD 11-2
    var weight_factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    var check_code = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    // the last no
    var arr = str.split("");
    var len = arr.length;
    var num = 0;
    for (var i = 0; i < len; i++) {
        num = num + arr[i] * weight_factor[i];
    }
    var resisue = num % 11;
    var last_no = check_code[resisue];
    return last_no;
}

function idcardValidate(idcard) {
    if (idcard.length != 18) return "身份证位数有误";
    if (!/^\d{17}[\dXx]$/.test(idcard)) return "身份证格式有误";
    if (getCheckCode(idcard.substr(0, 17)) != idcard.substr(-1)) return "身份证有误";
    return "";
}

/*
“身份证号码分为五部分，比如：512501197203035172”。
1-6位：[512501]，表示行政区划的代码。
1、2位，所在省（直辖市，自治区）代码；
3、4位，所在地级市（自治州）代码；
5、6位，所在区（县，自治县，县级市）的代码；
7-14位：[19720303],表示出生年、月、日
15-16位：[51]，所在地派出所代码
17位：[7]，性别。奇数（1、3、5、7、9）男性。偶数（2、4、6、8、0）表示异性，女滴
18位：[2]，校验位，存在十一个值：0,1,2,3,4,5,6,7,8,9,X，其值是用固定公式根据前面十七位计算出来的。
*/
function idcardParse(idcard) {
    let check = idcardValidate(idcard);
    if (check != "") return {
        "success": false,
        "msg": check
    }
    const getTitle = (address, index) => (address[index] || "");
    let address = getAddress(idcard);
    return {
        "success": true,
        "province": getTitle(address, 0),
        "city": getTitle(address, 1),
        "county": getTitle(address, 2),
        "birthday": getBirthday(idcard),
        "policeCode": parseInt(idcard.substr(14, 2)),
        "sex": ["女", "男"][idcard.substr(-2, 1) % 2],
        "checkCode": idcard.substr(-1)
    }
}
loadData();
module.exports = {
    idcardParse,
    idcardValidate,
    getAddress,
    getBirthday,
    getCheckCode,
    updateData
};