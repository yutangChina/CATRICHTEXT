# CAT-RICH-TEXT
#### *灵活的富文本框架*

### 如何使用
#### ·基于ElementUI的富文本组件（开发中）
```HTML
<link href="catRichText.css">
<script src="catRichText.base.js"></script>
<script src="catRichText.tool.js"></script>
<script src="catRichText.main.js"></script>
```
将以上文件引入即可。


<html>
<strong><em style="color:red">注意：富文本组件是依赖ElementUI进行开发的，因此请在使用前引入ElementUI对应的依赖</em></strong>
</html>
<br>
<br>
引入后，使用组件名即可进行使用：

```HTML
<cat-rich-text></cat-rich-text>
```


目前基于ElementUI的富文本组件提供的能力如下：
- H1标题
- H2标题
- 斜体
- 加粗
- 链接
- 图片（图片会以base64的方法存储在前端）

组件方法：
- getContentAsHtml()
    - 该方法将富文本中的内容按照HTML进行组织，并返回对应的HTML字符串

#### ·富文本框架
如何使用：
```HTML
<script src="catRichText.base.js"></script>
```
将以上文件引入即可。

通过`catRichText.base.js`文件的引入，我们将会获得构建富文本组件的基础能力，通过这些能力的组合使用，我们将可以自己来制作属于自己的富文本组件。

在本章节中，我将就着重介绍CATRICHTEXT框架的设计思路，以及`catRichText.base.js`中的方法与属性。
###### 设计思路
在CATRICHTEXT中，我将富文本分为了两个层次结构。
- 展示层
- 编辑层

其中展示层用于最终面向用户的展示，而编辑层则通过DIV的contenteditable属性以获得输入的能力。

通过编辑层，我可以获取到用户的每一个字符的输入，然后我将每个输入的字符作为一个节点进行存储以便以后的操作。

例如用户依次输入了HELLO这五个字符，那么最后在CATRICHTEXT内部将会新增五个节点，每个节点中将分别存储H,E,L,L,O。而在展示层，HELLO将会以成为以下的形式：
``` html
<span>H</span>
<span>E</span>
<span>L</span>
<span>L</span>
<span>O</span>
```


通过如此的设计，我将可以精确地控制用户的输入的任意内容。而富文本的操作无非就是对于节点的删除，新增与修改。

通过如此设计，我将原本对于HTML DOM节点的操作抽象为了对于存储数据的操作，因此本富文本组件框架有如下的优势：
1. 精确控制到每个字
2. 浏览器无关
3. 灵活可扩展
4. 天然支持协作编辑（通过内部数据结构，而非HTML）


当然因此数据节点与展示层的`span`一一对应，因此每当删除修改新增一个节点的时候，我必须立即在展示层新增删除修改`span`（即数据节点与对应的`span`必须同步操作），由此导致了如下缺点：
1. 内存使用很高
1. 应为是节点与元素的实时删除与添加，因此会导致页面的高频率重绘，导致浏览器压力过大

为了获取对于富文本输入的绝对操控，以上的缺点暂无优化思路。

接下来我将详细讲解`catRichText.base.js`

在`catRichText.base.js`中，最为重要的是dataList属性，它存储了所有存在的元素节点，展示层中的每一个`span`显示都必须先在dataList中，其定义结构如下：
```JavaScript
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
                    type: 'HNode',//类型
                    prev: null,//前指针
                    next: null,//后指针
                    data: null//数据
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
```
而在dataList中pointer属性最为重要，对于节点的插入，删除以及在展示层中的光标显示都是通过pointer进行定位的。
在展示层中，光标是用一个span模拟的，它会随着pointer的变化而变化：
```JavaScript
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
```

<html>
<strong style="color:red"><em>其余就没有什么好说的了，特别要注意的是：节点生成后就必须被渲染到展示DIV中，节点被删除后必须将其对应的元素DOM从展示DIV中删除。剩余的东西可以从base源码中获取，我已经提供了在创建过程中的注释。
</em></strong>
</html>


#### 最后

此外：
作为每次都只有三分钟热度的我也没有经过真实场景测试，所以：
- main文件中自定义富文本组件才是最后能被使用的东西，它与业务强绑定，但是我还是没做好
- demo.html只做了一个简单的引用展示

当前未未解决的问题：
- 1.输入法的弹框与隐藏的可以编辑的DIV联动，而不是与展示的DIV联动，导致展示的光标与输入法弹框不匹配。（可能思路：基于光标将编辑DIV实时定位）
- 2.当编辑DIV与展示DIV高度差过大的时候，富文本会有怪异的展示
- 3.当选中展示层的文本，但此时鼠标却移出展示div，展示层DIV绑定的click事件不会触发，导致对应事件不发生
- 4.未测试到的BUG
- 5.未经历的情况
- 6.粘贴文本的解析
- 7.键盘上下键的移动

如果你对该富文本的设计有兴趣，请提出你的想法，建议或遇到的BUG.

如何联系我（注明来意）：
- email : tangyu_nju@163.com
- wx : merlinlock

