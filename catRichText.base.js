/**
 * CatRichText富文本编辑器
 * 基础文件
 */

/**
 * 思路：
 * 
 * 文本都是链表，一个字符一个链表结构，用户的插入用用户的东西
 * 
 * 文本中的选中无非是选中单个或者选中多个
 * 
 * 链表中的当前指向指针作为唯一确定操作位置的指针，即删除，新增操作都会通过该指针进行定位
 * 光标元素应该跟随链表指针的改变而改变，同时受到rangeType的约束
 * 节点生成后就必须被渲染到页面上
 * 
 * 输入：
 * 定位(键盘无法跟随显示DIV走，而是跟随了编辑DIV)
 * 图片
 * 粘贴
 */
//TODO 
/**
 * 1.当选择后的鼠标移出展示div，click事件不会触发
 * 
 * 
 * 
 */
class CatRichText {
    //构造函数，获取作用在哪个元素内部
    constructor(selector) {
        this.ele = document.querySelector(selector);
        this.editEle = null; //编辑div
        this.showEle = null; //展示div
        this.cursorEle = null; //光标
        // this.type = "text"; //默认为text格式

        this.type = ["text"]; //一个Node可以有多个type , 默认为text格式,

        this.rangeStartNode = null; //选中范围的时候，处于靠前位置的链表节点
        this.rangeEndNode = null; //选中范围的时候，处于靠后位置的链表节点
        this.rangeType = -2; //-2表示啥也不是 -1只是光标移动 0单个选中  1多个选中 对范围进行操作后，需要自己手动修改
        this.styles = {}; //样式列表
        /**
         * 链表：
         * 注意事项：链表中的属性只能在链表方法内被改变，不可以通过其属性来改变
         */
        this.dataList = new class {
            constructor() {
                /**
                 * pointer:当前所在指针
                 * tailNode:尾指针
                 * headNode:头指针
                 * _pointer:当前所在指针的复刻指针，用于存放真实的值，作为中间值
                 */
                this._pointer = this.pointer = this.tailNode = this.headNode = {
                    type: 'HNode',
                    prev: null,
                    next: null,
                    data: null,
                };
                this.length = 0;
            }
            //在foucusNode之后插入,foucusNode没有则默认在末尾插入
            insert(node, foucusNode) {
                this.length++;
                node.next = foucusNode.next;
                node.prev = foucusNode;
                foucusNode.next = node;
                //如果next存在，则其prev应该修改指向新增节点本身
                if (node.next) {
                    node.next.prev = node
                } else {
                    //不存在表示node成为尾巴
                    this.tailNode = node;
                }
                //插入后修改当前指向指针，当前指向指针应该指向新加入的元素
                this.pointer = node;
            }
            //删除该node  TODO有问题
            delete(node) {
                if (this.length === 0) return;
                node.isDel = true;
                //删除时候应该修改当前指向指针，删除后当前指向指针应该指向删除元素的前面一个
                this.pointer = node.prev;
                //删除操作
                node.prev.next = node.next;
                if (node.next) node.next.prev = node.prev;
                //假如是尾部元素删除，应该将指向尾部的指针往前移动
                if (node === this.tailNode) this.tailNode = node.prev;
                //减小长度
                this.length--;
            }
            //设置当前指向指针
            setPointer(node) {
                this.pointer = node;
            }
        }();
    }
    //创建富文本域
    create() {
        //是否正在输入中文字符
        let _isCN = false;

        //event内部使用的实例指向
        let _this = this;

        //查找与链表节点绑定的元素,返回与之绑定的连接节点
        let _findLinkNode = function (ele) {
            while (ele) {
                if (ele.linkNode) {
                    return ele.linkNode;
                }
                ele = ele.parentElement;
            }
            return null;
        }

        //构建内部可编辑Div
        let _div = this.createEditDiv();
        this.editEle = _div;

        //创建展示DIV
        this.showEle = this.createShowDiv();

        //创建光标
        this.cursorEle = this.createCursor();

        //输入中文前触发（英文不触发）compositionstart->input->compositionend
        _div.addEventListener("compositionstart", function (e) {
            _isCN = true;
        });
        //根据选择的范围进行操作
        let _addNodeAndEle = function (node) {
            if (_this.rangeType === -2) {} else if (_this.rangeType === -1) {} else if (_this.rangeType === 0 || _this.rangeType === 1) {
                _this.deleteElesInRange();

            }
            _this.rangeType = -2; //恢复啥也不是的状态
            _this.addNodeAndEle(node);
        }

        //任何输入都触发，当输入中文时候在compositionstart后触发
        _div.addEventListener("input", function (e) {
            if (_isCN) return;
            let node = null;
            switch (e.inputType) {
                //输入英文
                case "insertText":
                    if (e.data !== null) {
                        node = {
                            type: _this.type.concat([]),
                            prev: null,
                            next: null,
                            data: e.data === " " ? "&nbsp;" : e.data,
                            isDel: false,
                        }
                        _addNodeAndEle(node);
                        break;
                    }
                    //输入换行换行
                    case "insertParagraph":
                        node = {
                            type: ["br"],
                            prev: null,
                            next: null,
                            data: null,
                            isDel: false,
                        }
                        _addNodeAndEle(node);
                        break;
                        //删除
                    case "deleteContentBackward":
                        //判断当前节点，删除当前节点
                        if (_this.rangeType === -2) {
                            if (_this.dataList.pointer.type === 'HNode') return;
                            _this.deleteNodeAndEle(_this.dataList.pointer);
                        } else if (_this.rangeType === -1) {
                            _this.rangeType = -2;
                            _this.dataList.setPointer(_this.rangeStartNode);
                            if (_this.dataList.pointer.type === 'HNode') return;
                            _this.deleteNodeAndEle(_this.dataList.pointer);

                        } else {
                            _this.deleteElesInRange();
                        }
                        break;
            }
        });

        //输入中文结束后触发，不包含英文
        _div.addEventListener("compositionend", function (e) {
            //将汉字一个字一个字插入链表
            let node;
            for (let i = 0; i < e.data.length; i++) {
                node = {
                    type: _this.type.concat([]),
                    prev: null,
                    next: null,
                    data: e.data[i],
                    isDel: false,
                }
                _addNodeAndEle(node);
            }
            _isCN = false;
        });


        //解决当其失去焦点的时候该怎么做

        _div.addEventListener("blur", function (e) {

            // console.log(document.activeElement);

        });

        //加入页面
        //1.创建统一父元素
        let _continerDiv = this.createCon();
        //2.加入编辑DIV
        _continerDiv.appendChild(_div);
        //3.展示DIV内部加入光标展示
        this.showEle.appendChild(this.cursorEle);
        //4.加入展示DIV
        _continerDiv.appendChild(this.showEle);
        //5.加入到页面
        this.ele.appendChild(_continerDiv);


        //进入后，富文本编辑默认选中
        _div.focus();

        //给显示元素添加事件
        let _divContiner = this.getShowEle();


        //富文本的元素的选中状态无非就是单个选中与多个选中
        //在展示DIV中，暂时只有click事件进行触发
        _divContiner.addEventListener("click", function (e) {
            console.log(1);
            _this.setRangeElesBgColor(false);
            //获取用户的选择范围
            let userSelection = _this.getSelection();
            //进行判断
            //获取用户选中后的元素范围
            //开始节点
            let _startNode = _findLinkNode(userSelection.anchorNode);
            //结束节点
            let _endNode = _findLinkNode(userSelection.focusNode);
            //如果有不存在的
            if (_startNode === null || _endNode === null) {
                //默认此时光标移动到末尾
                _this.dataList.setPointer(_this.dataList.tailNode);
                _this.continueEdit();
                _this.rangeType = -2;
                return;
            }

            let _nodesBySort = _this.sortTwoNodesByPos(_startNode, _endNode);
            if (_nodesBySort === null) return;
            _this.rangeStartNode = _nodesBySort[0];
            _this.rangeEndNode = _nodesBySort[1];
            //当时范围的时候，需要考虑接下来的操作
            //项目节点的情况下，anchorOffset == 1  表示在该节点后面输入光标
            // anchorOffset == 0 表示第一个节点被选中 isCollapsed== true 表示只是单选了一下 isCollapsed== false表示是包裹了
            //在展示DIV被选择后，应该随即改变对应的pointer，以便改变光标位置
            if (_this.rangeStartNode === _this.rangeEndNode) {
                // None: 当前没有选择。
                // Caret: 选区已折叠（即 光标在字符之间，并未处于选中状态）。
                // Range: 选择的是一个范围。
                if (userSelection.type === "Caret") {
                    _this.rangeType = -1; //只是光标移动
                    //单点后更新当前指向指针
                    _this.dataList.setPointer(_this.rangeStartNode);
                } else {
                    if (userSelection.isCollapsed) {
                        //在该元素之前加入光标，且指针移动
                        _this.rangeType = -1; //只是光标移动
                        _this.dataList.setPointer(_this.rangeStartNode.prev);

                    } else {
                        //选中了第一个元素
                        _this.rangeType = 0; //第一个元素被选中
                        _this.setCursorHide(); //光标隐藏
                        _this.setRangeElesBgColor(true);
                    }
                }
            } else {
                _this.rangeType = 1; //多个元素被选中
                _this.setCursorHide(); //光标隐藏
                _this.setRangeElesBgColor(true);
            }
            _this.continueEdit(); //编辑DIV重新被选中
        });


        //3.添加光标监听
        Object.defineProperty(this.dataList, "pointer", {
            get() {
                return this._pointer;
            },
            set(value) {
                let _dThis = this;
                //加入异步，先让节点插入到真实的文档中，再将光标插入
                new Promise(function (resolve, reject) {
                    _dThis._pointer = value;
                    resolve();
                }).then(function () {
                    //进行光标的修改
                    if (_dThis._pointer.next === null) {
                        _this.showEle.appendChild(_this.cursorEle);
                        _this.cursorEle.isRemove = false;
                    } else {
                        _this.showEle.insertBefore(_this.cursorEle, _dThis._pointer.next.linkEle);
                        _this.cursorEle.isRemove = false;
                    }
                });

            }
        });
    }
    /**
     * 删除范围内节点,节点已经被删除
     */
    deleteElesInRange() {
        this.rangeType = -2; //恢复啥也不是的状态
        let _tempNode = this.rangeStartNode;
        while (_tempNode !== this.rangeEndNode) {
            let _nextNode = _tempNode.next;
            this.deleteNodeAndEle(_tempNode);
            _tempNode = _nextNode;
        }
        this.deleteNodeAndEle(_tempNode);
        //删除之后，范围消失
        this.rangeStartNode = this.rangeEndNode = null;
    }


    /**
     * 设置已经被选中范围内的元素的背景色
     */
    setRangeElesBgColor(type) {
        if (this.rangeStartNode === null || this.rangeEndNode === null) return;
        let _tempNode = this.rangeStartNode;
        while (_tempNode !== this.rangeEndNode) {
            _tempNode.linkEle.style.backgroundColor = type === true ? "rgba(0,102,255,.4)" : "";
            let _nextNode = _tempNode.next;
            _tempNode = _nextNode;
        }
        _tempNode.linkEle.style.backgroundColor = type === true ? "rgba(0,102,255,.4)" : "";
    }

    /**
     * 获取展示元素DIV
     * @returns 
     */
    getShowEle() {
        return this.showEle;
    }

    /**
     * 获取页面当前选中范围
     * @returns 
     */
    getSelection() {
        if (window.getSelection) {
            return window.getSelection();
        } else if (document.selection) {
            return document.selection.createRange();
        }
    }
    /*************/
    /*************/
    /**实例方法区***/
    /*************/
    /*************/
    /**
     * 
     * 节点操作总览：
     * 节点的操作必须与渲染同步
     * 1.即生成新节点则必须实时渲染
     * 2.即删除节点必须实时从页面中删除
     * 
     */
    /**
     * 从链表中删除该节点，同时在页面中进行对应的删除
     * @param {*} node 
     */
    deleteNodeAndEle(node) {
        //从链表中删除
        this.dataList.delete(node);
        //从页面中删除
        let _divContiner = this.getShowEle();
        _divContiner.removeChild(node.linkEle);
    }

    /**
     * 将节点新增到链表中，且渲染到页面上
     * 节点的新增必须通过当前所在
     * @param {*} node 
     */
    addNodeAndEle(node) {
        //向链表中加入数据，新增数据后，当前指向指针会指向新增的节点
        this.dataList.insert(node, this.dataList.pointer);
        //加入页面中
        let _divContiner = this.getShowEle();
        //创建节点元素
        let _nodeEle;
        if (node.type.length === 1 && node.type[0] === "br") {
            _nodeEle = document.createElement("span");
            _nodeEle.appendChild(document.createElement("br"));
        } else {
            _nodeEle = document.createElement("span");
            //判断是否存在该样式属性，如果存在将其赋值给span
            for (let i = 0; i < node.type.length; i++) {
                if (this.styles[node.type[i]]) {
                    let _item = this.styles[node.type[i]];
                    for (let _key in _item) {
                        if (_key === "className") {
                            _nodeEle[_key] += " " + _item[_key];
                        } else {
                            _nodeEle[_key] = _item[_key];
                        }
                    }
                }
            }
            _nodeEle.innerHTML = node.data;
        }
        node.linkEle = _nodeEle; //节点与元素绑定
        _nodeEle.linkNode = node; //元素与节点绑定
        //当前指向指针(即新增节点)的下一个节点为null，表示其为最后的节点
        if (this.dataList.pointer.next === null) {
            _divContiner.appendChild(_nodeEle);
        } else {
            _divContiner.insertBefore(_nodeEle, this.dataList.pointer.next.linkEle);
        }
    }

    /**
     * 将传入的两个node，按照其所在位置顺序从低到高进行排序
     */
    sortTwoNodesByPos(node1, node2) {
        //循环判断寻找所在位置
        let _temp = this.dataList.headNode;
        while (_temp.next) {
            if (_temp.next === node1) {
                return [node1, node2];
            }
            if (_temp.next === node2) {
                return [node2, node1];
            }
            _temp = _temp.next;
        }
        return null;
    }



    /**
     * 
     * 
     * 基础元素创建方法总览
     * 
     */

    /**
     * 创建统一的父元素
     * @returns 
     */
    createCon() {
        let _div = document.createElement("div");
        _div.style.position = "relative";
        _div.style.width = "100%";
        // _div.style.height = "100%";
        // _div.style.overflow = "auto";
        return _div;
    }
    /**
     * 创建编辑div
     */
    createEditDiv() {
        //构建内部可编辑Div
        let _div = document.createElement("div");
        _div.contentEditable = true;
        //样式添加
        _div.style.outline = "none";
        _div.style.opacity = "0";
        _div.style.zIndex = "-1";
        _div.style.float = "left";
        _div.style.position = "fixed";
        _div.style.top = "0px";
        _div.style.left = "0px";
        _div.style.width = "100%";
        _div.style.height = "20px";
        _div.style.overflow = "auto";
        return _div;
    }
    /**
     * 创建展示DIV
     */
    createShowDiv() {
        let _div = document.createElement("div");
        _div.tabIndex = -1;
        _div.style.outline = "none";
        _div.style.minHeight = "16px";
        _div.style.padding = "0px 1px";
        _div.style.width = "100%";
        // _div.style.height = "100%";
        // _div.style.overflowY = "auto";
        return _div;
    }

    /**
     * 创建光标
     * @return 
     */
    createCursor() {
        let _ele = document.createElement("span");
        _ele.style.margin = "0px 1px";
        _ele.style.position = "relative"
        //创建动画效果
        let _style = document.createElement("style");
        _style.appendChild(document.createTextNode(`@keyframes CatRichTextCursor{
            0% {
                opacity:1;

            }
            75%{
                opacity:0;
            }
            100%{
                opacity:0;
            }
        }
        `));
        _ele.appendChild(_style);
        //创建光标显示元素
        let _line = document.createElement("div");
        _line.style.height = "22px";
        _line.style.width = "1px";
        _line.style.position = "absolute";
        _line.style.top = "0px";
        _line.style.left = "0px";
        _line.style.backgroundColor = "#000";
        //设置动画属性
        _line.style.animationTimingFunction = "linear";
        _line.style.animationDuration = "0.9s";
        _line.style.animationIterationCount = "infinite";
        _line.style.animationName = "CatRichTextCursor";
        //将光标显示元素加入
        _ele.appendChild(_line);
        return _ele;
    }
    /**
     * 暂时将鼠标隐藏，用于对范围选中时候光标的隐藏
     * 本身就不存在的时候就不需要删除
     */
    setCursorHide() {
        if (this.cursorEle.isRemove) return;
        this.cursorEle.isRemove = true;
        this.showEle.removeChild(this.cursorEle);
    }

    /**
     * 接口方法
     */

    /**
     * 注册可使用样式列表
     * @param {*} name 样式名称唯一标识
     * @param {*} desc 样式内部具体样子
     */
    registerStyle(name, desc) {
        this.styles[name] = desc;
    }

    //设置当前样式格式
    setType(type) {
        if (type === null || type === undefined) {
            return;
        } else {
            this.type.push(type);
        }
    }
    /**
     * 去除统一作用的整体样式
     * @param {*} type 
     * @returns 
     */
    removeType(type) {
        if (type === null || type === undefined) {
            return;
        } else {
            let _index = this.type.indexOf(type);
            if (_index < 0) return;
            this.type.splice(_index, 1);
        }
    }
    /**
     * 使其继续可以输入
     * 在对showEle进行操作后，在接下来的情况不明确的时候，都需要使用该方法，以防止用户期望继续输入
     * 或当点击了对应附加操作的时候
     */
    continueEdit() {
        this.editEle.focus();
        let userSelection = this.getSelection();
        userSelection.selectAllChildren(this.editEle) // range 选择obj下所有子内容
        userSelection.collapseToEnd() // 光标移至最后
    }


    /**
     * 获取当前链表数据
     * @return
     */
    getDataList() {
        return this.dataList;
    }

    /**
     * 获取是否是框选(即选中元素，元素有背景色)
     */
    getIsRange() {
        if (this.rangeType === 0 || this.rangeType === 1) return true;
        return false;
    }

    /**
     * 设置额外的节点
     * @param {*} node 
     */
    addExtraNode(node) {
        //该节点必须存在type 与 data
        let _node = {
            type: node.type,
            prev: null,
            next: null,
            data: node.data,
            isDel: false
        }
        this.addNodeAndEle(_node);
        //此时需要一个匹配服装放入到编辑div里面，当前默认为*字符
        let _textEle = document.createTextNode("*");
        //目前导致，光标无法选取到添加节点对应元素的末尾
        this.editEle.appendChild(_textEle);
    }

    /**
     * 修改单个节点中某些属性与此同时一同修改对应的属性节点
     * @param {*} node - 要修改的节点
     * @param {*} data - 修改的值
     */
    resetNodeDataAndEle(node, data) {
        //node中type与data可以修改
        //1.判断是否删除，删除的Node就不需要修改了
        if (node.isDel) return;
        //2.进行修改
        let _ele = node.linkEle;
        //1.如果存在type，则需要进行修改
        if (data.type !== null && data.type !== undefined) {
            let _oldTypes = node.type; //老的type
            for (let i = 0; i < _oldTypes.length; i++) {
                let _oT = _oldTypes[i];
                if (this.styles[_oT]) {
                    let _style = this.styles[_oT]
                    for (let _key in _style) {
                        //样式值特殊处理
                        if (_key === "className") {
                            _ele.className = _ele.className.replace(_style[_key], "");
                            continue;
                        }
                        _ele[_key] = "";
                    }
                }

            }
            //赋值新的type
            node.type = data.type;
            //同时需要修改ele的展示
            //只有type在styles存在的时候才会进行修改
            for (let i = 0; i < node.type.length; i++) {
                let _nT = node.type[i];
                if (this.styles[_nT]) {
                    let _style = this.styles[_nT]
                    for (let _key in _style) {
                        //样式值特殊处理
                        if (_key === "className") {
                            _ele.className = _ele.className + " " + _style[_key];
                            continue;
                        }
                        _ele[_key] = _style[_key];
                    }

                }

            }

        }
        //如果存在
        if (data.data !== null && data.data !== undefined) {
            node.data = data.data;
            node.linkEle.innerHTML = node.data;
        }
    }
    /**
     * 默认删除选中范围内的节点
     * @returns 
     */
    deleteFromAtoB() {
        if (this.rangeStartNode === null || this.rangeEndNode === null) return;
        //删除范围内节点
        this.deleteElesInRange();
    }
}