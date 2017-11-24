const cheerio = require('cheerio');
const URL = require('url');
const Request = require('./Request');
const Convert = require('./Convert');

async function getChild(url, parentNode, level) {
    console.log(Convert.TITLE_FORMAT(parentNode, level));
    //为了尽量保证下载数据成功，最多重试５次
    var res = await Request.Get(url, { charset: "GBK", tryTime: 5 });
    level++;
    var $ = cheerio.load(res);
    var type = null;

    ["city", "county", "town", "village"].some((str) => {
        type = str;
        return $(`.${str}table`).length > 0;
    });

    var heads = $(`.${type}head td`).map((index, el) => $(el).text()).toArray();
    var rows = $(`.${type}tr`);
    var rowData, a_tags, td_tags, isLink, link_url;
    for (var row = 0; row < rows.length; row++) {
        rowData = {};
        a_tags = $(rows[row]).find("a");
        td_tags = $(rows[row]).find("td");
        isLink = a_tags.length > 0 ? true : false;
        for (var col = 0; col < heads.length; col++) {
            //过滤　城乡分类代码
            if (!Convert.IS_SHOW_TYPE) {
                if (heads[col].trim() == "城乡分类代码") continue;
            }
            //过滤 统计用区划代码
            if (!Convert.IS_SHOW_CODE) {
                if (heads[col].trim() == "统计用区划代码") continue;
            }
            rowData[Convert.HEAD_MAP(heads[col])] = isLink ? a_tags.eq(col).text() : td_tags.eq(col).text();
        }
        if (parentNode[Convert.CHILDRENS] == undefined) parentNode[Convert.CHILDRENS] = [];
        rowData["_parent"] = parentNode;
        parentNode[Convert.CHILDRENS].push(rowData);
        if (isLink) {
            link_url = URL.resolve(url, a_tags.eq(0).attr("href"));
            await getChild(link_url, rowData, level);
        }
    }
}


async function getProvince(url) {
    var res = await Request.Get(url, { charset: "GBK", tryTime: 3 });
    var $ = cheerio.load(res);
    var result = [];
    $(".provincetable a").each((index, el) => {
        var el = $(el),
            href = "";
        href = el.attr("href");
        /([^/]*)\.html$/.test(href);
        result.push({
            [Convert.CODE]: RegExp.$1 + "0000000000",
            [Convert.NAME]: el.text(),
            url: URL.resolve(url, href),
            [Convert.CHILDRENS]: [],
            _parent: null
        });
    });
    return result;
}


async function filterProvince(provincesStr) {
    var html = await Request.Get(Convert.ROOT_URL, { charset: "GBK", tryTime: 3 });
    var lastUrl = cheerio.load(html)(".center_list_contlist a").first().attr("href");
    var provinces = await getProvince(lastUrl);
    var regs = provincesStr.split(",").map((p, index) => ({
        reg: new RegExp(p),
        sort: index
    }));
    return provinces.filter(p => {
        return regs.some((reg, index) => {
            let flag = reg["reg"].test(p[Convert.NAME]);
            if (flag) p["_sort"] = reg["sort"];
            return flag;
        })
    }).sort((a, b) => a._sort - b._sort);
}

module.exports = {
    getChild,
    getProvince,
    filterProvince,
}