/**
 * CatRichText工具
 */
/**
 * 在不同的范围下做不同的事情
 * 1.光标范围
 * 2.选中范围（即选中了多个属性）
 * @param {*} ARG - 传入的参数，需要是Object形式
 * @param {*} FN1 - 光标下的方法
 * @param {*} FN2 - 范围内的方法
 * @param {*} OBJ - 作用域，默认为CatRichText实例本身
 */
CatRichText.prototype.handle = function (ARG, FN1, FN2, OBJ) {
    //是否是范围
    let _bool = this.getIsRange();
    if (_bool && FN1) {
        FN2.call(OBJ ? OBJ : this, ARG);
    } else if (!_bool && FN2) {
        //不是范围
        FN1.call(OBJ ? OBJ : this, ARG);
    }
}


/**
 * 将数据组织称HTML字符串的形式输出
 * 
 * 不应该放在这里，应该放在main中
 */
CatRichText.prototype.getContentAsHtml = function () {
    let _htmlStr = '<div>';
    let _item = this.dataList.headNode;
    let _type = "text";
    while (_item.next) {



    }



    _htmlStr += "</div>";

}