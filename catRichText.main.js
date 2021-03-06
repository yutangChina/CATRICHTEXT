/**
 * 自定义富文本插件-基于Vue、EmentUI
 * @author Yu Tang
 * @date 2021-10-13
 * @version 0.0.1
 * @mail tangyu_nju@163.com
 * 
 */
Vue.component("cat-rich-text", {
    template: `
        <div>
            <div class="operList">
                <div :class="textState.h1 ? 'operItem HChoose' : 'operItem'" @click="changeH($event , 1)">H1</div>
                <div :class="textState.h2 ? 'operItem HChoose' : 'operItem'" @click="changeH($event , 2)">H2</div>
                <div :class="isEm ? 'operItem HChoose' : 'operItem' " @click="makEm($event)"><em>I</em></div>
                <div :class="isB ? 'operItem HChoose' : 'operItem' " @click="makB($event)">B</div>
                <div class="operItem underline" @click="makUnderline()">U</div>
                <div class="operItem linethrough" @click="makLinethrough()">S</div>
                <div class="operItem" @click="addDivide()">—</div>

                <div class="operItem">
                    <el-popover placement="top" width="240" v-model="AOBJ.linkvisible">
                        <div style="margin-bottom: 12px;">
                            <el-input size="small" v-model="AOBJ.text" placeholder="请输入链接文字">
                                <template slot="prepend">显示</template>
                            </el-input>

                        </div>
                        <div style="margin-bottom: 12px;">
                            <el-input size="small" v-model="AOBJ.href" placeholder="请输入链接"> <template
                                    slot="prepend">地址</template>
                            </el-input>
                        </div>
                        <div style="text-align: right; margin: 0">
                            <el-button size="mini" type="text" @click="cancleLink()">取消</el-button>
                            <el-button type="primary" size="mini" @click="addLink()">确定</el-button>
                        </div>
                        <div slot="reference">A</DIV>
                    </el-popover>
                </div>
                <div class="operItem">
                    <el-upload class="upload-demo" ref="upload" action="" :auto-upload="false" :show-file-list="false"
                        :on-change="handlePreview">
                        <div slot="trigger" size="small" type="primary">IMG</div>
                    </el-upload>
                </div>
            </div>
            <div id="cat"></div>
           
        </div>
   
    `,
    data: function () {
        return {
            contentAsHtml :"",
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
                },
                em: {
                    className: "em"
                },
                strong: {
                    className: "strong"
                },
                underline: {
                    className: "underline"
                },
                linethrough: {
                    className: "linethrough"
                },
                divide: {
                    className: "divide"
                }

            },
            //开始规则
            startRules: {
                text: "<div>",
                h1: "<h1 class=\"H1\">",
                h2: "<h2 class=\"H2\">",
                a: "",
                img: "",
                br: "",
                em: "<em>",
                strong: "<strong>",
                underline: "<u>",
                linethrough: "<s>",
                divide: '<div class="divide">'
            },
            //结束规则
            endRules: {
                text: "</div>",
                h1: "</h1>",
                h2: "</h2>",
                a: "",
                img: "",
                br: "",
                em: "</em>",
                strong: "</strong>",
                underline: "</u>",
                linethrough: "</s>",
                divide: "</div>"
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
            IMGOBJ: {},
            isEm: false,
            isB: false
        }
    },
    methods: {
        //文字改变
        changeH(event, type) {
            let _right = type == 1 ? "h1" : "h2";
            for (let key in this.textState) {
                if (key == _right) {
                    this.textState[key] = !this.textState[key];
                } else {
                    this.textState[key] = false;
                }
                this.editor.removeType(key);
            }
            //存在则是取消
            if (!this.textState[_right]) {
                this.editor.continueEdit();
                event.target.isChoose = false;
            } else {
                this.editor.setType(type == 1 ? "h1" : "h2");
                this.editor.continueEdit();
                event.target.isChoose = true;
            }
        },
        /**
         * 使得字体倾斜
         * @param {*} event 
         */
        makEm(event) {
            if (!this.editor.getIsRange()) {
                this.isEm = !this.isEm;
            }
            let args = {
                boole: this.isEm
            };
            let fn1 = function (args) {
                if (args.boole) {
                    this.setType("em");
                } else {
                    this.removeType("em");
                }
                this.continueEdit();
            }
            //范围
            let fn2 = function (args) {

                args.isEm = false;
                isAll = true;

                let _temp = this.rangeStartNode;
                while (_temp !== this.rangeEndNode) {
                    if (_temp.type.indexOf("em") < 0) {
                        isAll = false;
                        break;
                    }
                    _temp = _temp.next;
                }
                if (_temp.type.indexOf("em") < 0) isAll = false;
                //全有则是取消
                if (isAll) {
                    let _temp = this.rangeStartNode;
                    while (_temp !== this.rangeEndNode) {

                        let _t = [];
                        for (let i = 0; i < _temp.type.length; i++) {
                            if (_temp.type[i] !== "em") _t.push(_temp.type[i]);
                        }
                        let _d = {
                            type: _t
                        }
                        this.resetNodeDataAndEle(_temp, _d);
                        _temp = _temp.next;
                    }
                    let _t = [];
                    for (let i = 0; i < _temp.type.length; i++) {
                        if (_temp.type[i] !== "em") _t.push(_temp.type[i]);
                    }
                    let _d = {
                        type: _t
                    }
                    this.resetNodeDataAndEle(_temp, _d);
                } else {
                    //部分有则是添加
                    let _temp = this.rangeStartNode;
                    while (_temp !== this.rangeEndNode) {
                        if (_temp.type.indexOf("em") < 0) {
                            let _d = {
                                type: _temp.type.concat(["em"])
                            }
                            this.resetNodeDataAndEle(_temp, _d);
                        }
                        _temp = _temp.next;
                    }
                    if (_temp.type.indexOf("em") < 0) {
                        let _d = {
                            type: _temp.type.concat(["em"])
                        }
                        this.resetNodeDataAndEle(_temp, _d);
                    };
                }
                this.continueEdit();
            }
            this.editor.handle(args, fn1, fn2);
            return;
        },
        /**
         * 使得字体加粗
         * @param {*} event 
         */
        makB(event) {
            if (!this.editor.getIsRange()) {
                this.isB = !this.isB;
            }
            let args = {
                boole: this.isB
            };
            let fn1 = function (args) {
                if (args.boole) {
                    this.setType("strong");
                } else {
                    this.removeType("strong");
                }
                this.continueEdit();
            }
            //范围
            let fn2 = function (args) {

                args.isEm = false;
                isAll = true;

                let _temp = this.rangeStartNode;
                while (_temp !== this.rangeEndNode) {
                    if (_temp.type.indexOf("strong") < 0) {
                        isAll = false;
                        break;
                    }
                    _temp = _temp.next;
                }
                if (_temp.type.indexOf("strong") < 0) isAll = false;
                //全有则是取消
                if (isAll) {
                    let _temp = this.rangeStartNode;
                    while (_temp !== this.rangeEndNode) {

                        let _t = [];
                        for (let i = 0; i < _temp.type.length; i++) {
                            if (_temp.type[i] !== "strong") _t.push(_temp.type[i]);
                        }
                        let _d = {
                            type: _t
                        }
                        this.resetNodeDataAndEle(_temp, _d);
                        _temp = _temp.next;
                    }
                    let _t = [];
                    for (let i = 0; i < _temp.type.length; i++) {
                        if (_temp.type[i] !== "strong") _t.push(_temp.type[i]);
                    }
                    let _d = {
                        type: _t
                    }
                    this.resetNodeDataAndEle(_temp, _d);
                } else {
                    //部分有则是添加
                    let _temp = this.rangeStartNode;
                    while (_temp !== this.rangeEndNode) {
                        if (_temp.type.indexOf("strong") < 0) {
                            let _d = {
                                type: _temp.type.concat(["strong"])
                            }
                            this.resetNodeDataAndEle(_temp, _d);
                        }
                        _temp = _temp.next;
                    }
                    if (_temp.type.indexOf("strong") < 0) {
                        let _d = {
                            type: _temp.type.concat(["strong"])
                        }
                        this.resetNodeDataAndEle(_temp, _d);
                    };
                }
                this.continueEdit();
            }
            this.editor.handle(args, fn1, fn2);
            return;
        },
        //添加下划线
        makUnderline() {
            //只有被选中了才可以添加下划线，或者删除下划线
            let args = {};
            let fn1 = function () {
                this.continueEdit();
            };
            //范围
            let fn2 = function (args) {
                args.isEm = false;
                isAll = true;

                let _temp = this.rangeStartNode;
                while (_temp !== this.rangeEndNode) {
                    if (_temp.type.indexOf("underline") < 0) {
                        isAll = false;
                        break;
                    }
                    _temp = _temp.next;
                }
                if (_temp.type.indexOf("underline") < 0) isAll = false;
                //全有则是取消
                if (isAll) {
                    let _temp = this.rangeStartNode;
                    while (_temp !== this.rangeEndNode) {

                        let _t = [];
                        for (let i = 0; i < _temp.type.length; i++) {
                            if (_temp.type[i] !== "underline") _t.push(_temp.type[i]);
                        }
                        let _d = {
                            type: _t
                        }
                        this.resetNodeDataAndEle(_temp, _d);
                        _temp = _temp.next;
                    }
                    let _t = [];
                    for (let i = 0; i < _temp.type.length; i++) {
                        if (_temp.type[i] !== "underline") _t.push(_temp.type[i]);
                    }
                    let _d = {
                        type: _t
                    }
                    this.resetNodeDataAndEle(_temp, _d);
                } else {
                    //部分有则是添加
                    let _temp = this.rangeStartNode;
                    while (_temp !== this.rangeEndNode) {
                        if (_temp.type.indexOf("underline") < 0) {
                            let _d = {
                                type: _temp.type.concat(["underline"])
                            }
                            this.resetNodeDataAndEle(_temp, _d);
                        }
                        _temp = _temp.next;
                    }
                    if (_temp.type.indexOf("underline") < 0) {
                        let _d = {
                            type: _temp.type.concat(["underline"])
                        }
                        this.resetNodeDataAndEle(_temp, _d);
                    };
                }
                this.continueEdit();
            }
            this.editor.handle(args, fn1, fn2);
            return;

        },
        //添加腰线
        makLinethrough: function () {
            //只有被选中了才可以添加下划线，或者删除下划线
            let args = {};
            let fn1 = function () {
                this.continueEdit();
            };
            //范围
            let fn2 = function (args) {
                args.isEm = false;
                isAll = true;

                let _temp = this.rangeStartNode;
                while (_temp !== this.rangeEndNode) {
                    if (_temp.type.indexOf("linethrough") < 0) {
                        isAll = false;
                        break;
                    }
                    _temp = _temp.next;
                }
                if (_temp.type.indexOf("linethrough") < 0) isAll = false;
                //全有则是取消
                if (isAll) {
                    let _temp = this.rangeStartNode;
                    while (_temp !== this.rangeEndNode) {

                        let _t = [];
                        for (let i = 0; i < _temp.type.length; i++) {
                            if (_temp.type[i] !== "linethrough") _t.push(_temp.type[i]);
                        }
                        let _d = {
                            type: _t
                        }
                        this.resetNodeDataAndEle(_temp, _d);
                        _temp = _temp.next;
                    }
                    let _t = [];
                    for (let i = 0; i < _temp.type.length; i++) {
                        if (_temp.type[i] !== "linethrough") _t.push(_temp.type[i]);
                    }
                    let _d = {
                        type: _t
                    }
                    this.resetNodeDataAndEle(_temp, _d);
                } else {
                    //部分有则是添加
                    let _temp = this.rangeStartNode;
                    while (_temp !== this.rangeEndNode) {
                        if (_temp.type.indexOf("linethrough") < 0) {
                            let _d = {
                                type: _temp.type.concat(["linethrough"])
                            }
                            this.resetNodeDataAndEle(_temp, _d);
                        }
                        _temp = _temp.next;
                    }
                    if (_temp.type.indexOf("linethrough") < 0) {
                        let _d = {
                            type: _temp.type.concat(["linethrough"])
                        }
                        this.resetNodeDataAndEle(_temp, _d);
                    };
                }
                this.continueEdit();
            }
            this.editor.handle(args, fn1, fn2);
            return;
        },
        //添加分割线
        addDivide() {
            let args = {
                type: ['divide'],
                data: ''
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
            return;
        },
        //添加链接
        addLink() {
            if (this.AOBJ.text == "" || this.AOBJ.href == "") {
                this.editor.continueEdit();
                this.AOBJ.linkvisible = false;
                return;
            }
            let args = {
                type: ['text', 'a'],
                data: `<a href='${this.AOBJ.href}' target='_blank'>${this.AOBJ.text}></a>`
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
                    type: ['img'],
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
         * TODO  br处理有问题
         */
        getContentAsHtml() {
            let dataList = this.editor.getDataList();
            let _htmlStr = `<div class="normal">`;
            let _item = dataList.headNode;
            while (_item.next) {
                let _current = _item.next;
                let _cType = _current.type;
                //先判断不存在的
                if (_item.type !== "HNode") {
                    let _prevType = _item.type;
                    for (let i = 0; i < _prevType.length; i++) {
                        //当前的type不包含，说明已经去除了
                        if (_cType.indexOf(_prevType[i]) < 0) {
                            _htmlStr += `${this.endRules[_prevType[i]]}`;
                        }
                    }
                    for (let i = 0; i < _cType.length; i++) {
                        //当前的type不包含，说明是新增
                        if (_prevType.indexOf(_cType[i]) < 0) {
                            _htmlStr += `${this.startRules[_cType[i]]}`;

                        }
                    }
                } else {
                    for (let i = 0; i < _cType.length; i++) {
                        _htmlStr += `${this.startRules[_cType[i]]}`;
                    }
                }

                _htmlStr += _current.data ? `${_current.data}` : ``;


                _item = _item.next;
            }


            for (let i = 0; i < _item.type.length; i++) {
                _htmlStr += `${this.endRules[_item.type[i]]}`;
            }
            _htmlStr += `</div>`;
            return _htmlStr;
        },

        initRich(str){

            this.editor.initByJson(str);

        }

    },
    mounted() {
        this.editor = new CatRichText("#cat");
        for (let key in this.styles) {
            this.editor.registerStyle(key, this.styles[key]);
        }
        this.editor.create();
    },
});