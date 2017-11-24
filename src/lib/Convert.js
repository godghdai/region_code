const HEAD_TITLE_MAP_DIC = {
    "统计用区划代码": "code",
    "名称": "name",
    "城乡分类代码": "type",
    "子节点": "childs"
}
const TYPE_DIC = {
    "111": "主城区",
    "112": "城乡结合区",
    "121": "镇中心区",
    "122": "镇乡结合区",
    "123": "特殊区域",
    "210": "乡中心区",
    "220": "村庄"
}
module.exports = {
    NAME: HEAD_TITLE_MAP_DIC["名称"],
    CODE: HEAD_TITLE_MAP_DIC["统计用区划代码"],
    CHILDRENS: HEAD_TITLE_MAP_DIC["子节点"],
    IS_SHOW_TYPE: true,
    IS_SHOW_CODE: true,
    _TITLE: "",
    HEAD_MAP: function(head) {
        return HEAD_TITLE_MAP_DIC[head] || head;
    },
    TITLE_FORMAT: function(parentNode, level) {
        var parent = parentNode;
        var result = [];
        while (parent._parent) {
            result.push(parent[this.NAME]);
            parent = parent._parent;
        }
        result.push(this._TITLE);
        return result.reverse().join(" -> ");
    },
    SET_PROVINCE_TITLE: (function(title) {
        this._TITLE = title;
    }),
    ROOT_URL: "http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/"
}

/*
1、2位表示省级码段
3、4位表示地级码段
5、6位表示县级码段
7～9位表示乡级码段
10～12位表示村级码段          
*/