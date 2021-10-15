/**
 * 自定义富文本插件-基于Vue、EmentUI
 * @author Yu Tang
 * @date 2021-10-13
 * @version 0.0.1
 * @mail tangyu_nju@163.com
 * 
 */
Vue.component("cat-rich-text", {
    template: "#vue-cat-rich-text",
    data: function () {
        return {
            editor: null,
            styles: {
                text: {
                    className: 'normal'
                },
                h1: {
                    className: 'H1'
                },
                h2: {
                    className: 'H2'
                },
                a: {
                    className: "a"
                },
                img: {
                    className: "img"
                }

            },

            startRules: {
                text: "",
                h1: "<h1>",
                h2: "<h2>",
                a: "",
                img: "",
                br: "</div><div>"
            },
            endRules: {
                text: "",
                h1: "</h1>",
                h2: "</h2>",
                a: "",
                img: "",
                br: ""
            },
            textState: {
                h1: false,
                h2: false
            },
            //链接属性
            AOBJ: {
                linkvisible: false,
                text: "",
                href: ""
            },
            IMGOBJ: {}
        }
    },
    methods: {
        //文字改变
        changeH(event, type) {
            let _right = type == 1 ? "h1" : "h2";
            for (let key in this.textState) {
                if (key == _right) {
                    this.textState[key] = !this.textState[key];
                    continue;
                }
                this.textState[key] = false;
            }

            //存在则是取消
            if (!this.textState[_right]) {
                this.editor.setType();
                this.editor.continueEdit();
                event.target.isChoose = false;
            } else {
                this.editor.setType(type == 1 ? "h1" : "h2");
                this.editor.continueEdit();
                event.target.isChoose = true;
            }
        },
        //添加链接
        addLink() {
            if (this.AOBJ.text == "" || this.AOBJ.href == "") {
                this.editor.continueEdit();
                this.AOBJ.linkvisible = false;
                return;
            }
            let args = {
                type: 'a',
                data: `<a href="${this.AOBJ.href}">${this.AOBJ.text}</a>`
            }
            let fn1 = function (args) {
                this.addExtraNode(args);
                this.continueEdit();
            }
            let fn2 = function (args) {
                this.deleteFromAtoB();
                this.addExtraNode(args);
                this.continueEdit();
            }
            this.editor.handle(args, fn1, fn2);
            this.AOBJ.linkvisible = false;
            return;
        },
        //取消链接
        cancleLink() {
            this.editor.continueEdit();
            this.AOBJ.linkvisible = false;
        },
        /**
         * 图片上传后转为Base64展示
         * @param {*} file 
         */
        handlePreview(file) {
            let _this = this;
            let reader = new FileReader() //新建一个FileReader对象
            reader.readAsDataURL(file.raw) //将读取的文件转换成base64格式
            reader.onload = function (e) {
                let args = {
                    type: 'img',
                    data: `<img src="${e.target.result}"/>`
                }
                let fn1 = function (args) {
                    this.addExtraNode(args);
                    this.continueEdit();
                }
                let fn2 = function (args) {
                    this.deleteFromAtoB();
                    this.addExtraNode(args);
                    this.continueEdit();
                }
                _this.editor.handle(args, fn1, fn2);
                return;
            }
        },
        /**
         * 将富文本中的文件作为HTML片段范围输出
         */
        getContentAsHtml() {
            let dataList = this.editor.getDataList();
            let _htmlStr = '<div>';
            let _item = dataList.headNode;
            let _lastType = "text";
            while (_item.next) {
                let _current = _item.next;
                let _cType = _current.type;
                //与上一个type不同，表示为新的type
                if (_cType != _lastType) {
                    _htmlStr += this.endRules[_lastType] + this.startRules[_cType] + _current.data;
                    _lastType = _cType;
                }else{
                    _htmlStr += _current.data;
                }
                _item = _current;
            }
            _htmlStr += this.endRules[_lastType] + "</div>";
            return _htmlStr;
        }

    },
    mounted() {
        this.editor = new CatRichText("#cat");
        for (let key in this.styles) {
            this.editor.registerStyle(key, this.styles[key]);
        }
        this.editor.create();
        window.editor = this.editor;
        window.vueCom = this;
    },
});



let vue = new Vue({
    el: '#app',
    data: {

    }
});