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
 * 将dataList作为JSON格式返回，以此可以存储到后端
 */
CatRichText.prototype.getDataAsJson = function () {
    let jsonArray = [];
    let temp = this.dataList.headNode;
    while (temp.next) {
        let o = {
            type: temp.next.type,
            data: temp.next.data
        }

        jsonArray.push(o);
        temp = temp.next;
    }
    return JSON.stringify(jsonArray);
}
/**
 * 根据json字符串进行富文本初始化
 * @param {*} json 
 */
CatRichText.prototype.initByJson = function(json){
    let array = JSON.parse(json);
    for(let i = 0 ; i < array.length ; i++){
        let args = {
            type : array[i]["type"],
            data : array[i]["data"]
        }
        this.addExtraNode(args);
    }
}