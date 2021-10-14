/**
 * 自定义富文本插件
 * @author Yu Tang
 * @date 2021-10-13
 * @version 0.0.1
 * @mail tangyu_nju@163.com
 * 
 */

/**
 * 当前实现：
 * 1.标题 H1
 * 2.标题 H2
 */

var CATEditor = window.CATEditor || {};
/**
 * 编辑器的创建
 * @param {*} selector 
 */
CATEditor.create = function (selector) {
    var _this = this;
    let _div = document.createElement("div");
    _div.innerHTML = `<div class="operList">
        <div id="_h1" class="operItem">H1</div>
        <div id="_h2" class="operItem">H2</div>
        <div id="_a" class="operItem">A</div>
        <div id="_img" class="operItem">IMG</div>
        <div id="_list" class="operItem">OL</div>
    </div>
    <div id="realDiv"></div>`;
    document.querySelector(selector).appendChild(_div);
    let _catEditor = new CatRichText("#realDiv");
    //注册样式链表
    //注册的时候需要考虑展示样式，同时生成的时候需要掌握展示结构
    _catEditor.registerStyle("text", {
        className: 'normal'
    });
    _catEditor.registerStyle("h1", {
        className: 'H1'
    });
    _catEditor.registerStyle("h2", {
        className: 'H2'
    });
    _catEditor.create();
    this.editor = _catEditor;
    this.eventListeners();
}
//进行事件的添加
CATEditor.eventListeners = function (el) {
    let _this = this;
    let clearAll = function () {
        let _eles = document.querySelectorAll(".operItem");
        for (let i = 0; i < _eles.length; i++) {
            _eles[i].className = "operItem";
            if(_eles[i] == el) continue;
            _eles[i].isChoose = false;
        }
    }
    /**
     * 标题1
     */
    document.querySelector("#_h1").addEventListener("click", function (e) {
        let _isChoose = e.target.isChoose;
        let _ele = e.target;
        clearAll(_ele);
        //如果已经被选中过
        if (_isChoose) {
            _ele.className = "operItem";
            _ele.isChoose = false;
        } else {
            _ele.className = "operItem HChoose";
            _ele.isChoose = true;
        }
        let arg = {
            isChoose: _ele.isChoose
        };
        let fn1 = function (arg) {
            //被选中
            if (arg.isChoose) {
                this.setType("h1");
                this.continueEdit();
            } else {
                this.setType();
                this.continueEdit();
            }

        }
        _this.editor.handle(arg, fn1, fn1)
    });

    /**
     * 标题2
     */
    document.querySelector("#_h2").addEventListener("click", function (e) {
        let _ele = e.target;
        let _isChoose = e.target.isChoose;
        clearAll(_ele);
        //如果已经被选中过
        if (_isChoose) {
            _ele.className = "operItem";
            _ele.isChoose = false;
        } else {
            _ele.className = "operItem HChoose";
            _ele.isChoose = true;
        }
        let arg = {
            isChoose: _ele.isChoose
        };
        let fn1 = function (arg) {
            //被选中
            if (arg.isChoose) {
                this.setType("h2");
                this.continueEdit();
            } else {
                this.setType();
                this.continueEdit();
            }

        }
        _this.editor.handle(arg, fn1, fn1)
    });

    /**
     * 链接
     */
    document.querySelector("#_a").addEventListener("click", function (e) {



    });

    /**
     * 图片插入
     */
    document.querySelector("#_img").addEventListener("click", function (e) {



    });

    /**
     * 有序列表
     */
    document.querySelector("#_list").addEventListener("click", function (e) {

        let _isChoose = e.target.isChoose;
        let _ele = e.target;
        clearAll(_ele);
        //如果已经被选中过
        if (_isChoose) {
            _ele.className = "operItem";
            _ele.isChoose = false;
        } else {
            _ele.className = "operItem HChoose";
            _ele.isChoose = true;
        }
        let arg = {
            isChoose: _ele.isChoose
        };
        
    });

}