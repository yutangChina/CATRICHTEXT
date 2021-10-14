```
TITLE :  CATRIHTEXT
DESC  :  一个灵活的富文本编辑器

文件结构：

1.catRichText.base.js 
-富文本编辑的基础，提供了富文本最为基础的能力

2.catRichText.tool.js
-基于base的工具方法提供者

3.catRichText.main.js
-基于base，tool的真正的自定义的富文本组件

4.catRichText.css
-自定义富文本组件的样式库

5.demo.html
-调试页面


内部依赖结构：
main(top) -> tool(middle) -> base(bottom)

设计思路：
富文本分为两层：
1.展示层 
2.编辑层，其中编辑层使用的DIV的contenteditable属性

每一个输入的字符（或自己创建的node）都会成为一个单独的节点，根据节点来进行一个个展示

例如字符串"HELLO",在富文本内部将会形成5个对应的相连链表节点，而在展示层，他们的最终展示的样子如下：

* <span>H</span>
* <span>E</span>
* <span>L</span>
* <span>L</span>
* <span>O</span>

通过节点，我们来处理对应逻辑

例如：删除HELLO中的HELL
在富文本的内部，其实是删除H,E,L,L四个元素对应的Node.
该内部方法为(需要循环调用4次):
```
    deleteNodeAndEle(node) {
        //从链表中删除
        this.dataList.delete(node);
        //从页面中删除
        let _divContiner = this.getShowEle();
        _divContiner.removeChild(node.linkEle);
    }
```

其中：
```
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
    }
```

该富文本的优劣得失：
劣势：
1.内存使用很高
2.应为是节点与元素的实时删除与添加，因此会导致页面的高频率重绘，导致浏览器压力过大

优势：
1.精确控制到每个字
2.浏览器无关
3.灵活可扩展



基础base内容简述:
catRichText.base.js是整个富文本的基础，所有的基础能力都是由它提供了，其余例如tool文件不过是base提供的方法的组合；而main文件则是自定义富文本组件,其内部只有业务逻辑。
由于目前我还没有想清楚base文件提供的能力到底应该是怎么样的，因此base中的方法可能会提取到tool中。

1.dataList(一切的基础)
在base文件中，最为重要的是名为dataList的有头节点双向链表数据结构，该结构设计原则为：链表中的属性只能在链表方法内被改变，不可以通过其属性来改变，且链表中修改的只能是链表自己的东西与外界不做任何关联
该结构有如下属性：
·pointer:当前所在指针
·tailNode:尾指针
·headNode:头指针
·_pointer:当前所在指针的复刻指针，用于存放真实的值，作为中间值
·length:链表长度

其中最为重要的属性是pointer,它表示当前选中的Node是什么，该Node将会作为操作的定位
另外其中_pointer作为中间值，用于为poniter提供真实值，为什么这样？是因为我的光标是依据pointer定位的，当pointer改变的时候，光标位置也应该随之改变，其最后实现结构如下：
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
                _this.showEle.insertBefore(_this.cursorEle,     _dThis._pointer.next.linkEle);
                _this.cursorEle.isRemove = false;
            }
        });
    }
});
该结构有如下方法：
·insert:新增Node，同时使pointer指向新增节点
·delete:删除Node，同时是pointer指向删除元素的前面一个
·setPointer:设置当前指向指针,即pointer属性

其余就没有什么好说的了，特别要注意的是：节点生成后就必须被渲染到展示DIV中，节点被删除后必须从展示DIV中删除。
剩余的东西可以从base源码中获取，我已经提供了在创建过程中的注释。



此外：
因为懒！！！
每次都只有三分钟热度的我并没有做出一个真实的可用的例子！也没有经过真实场景测试，所以：
tool文件中东西目前很少，且不完善，因为我还没做。
main文件中自定义富文本组件才是最后能被使用的东西，它与业务强绑定，但是我还是没做好
demo.html只做了一个简单的H1,H2标题的输入（应该有BUG，但是我没细测）


当前未未解决的问题：
1.输入法的弹框与隐藏的可以编辑的DIV联动，而不是与展示的DIV联动，导致展示的光标与输入法弹框不匹配。（可能思路：基于光标将编辑DIV实时定位）
2.当编辑DIV与展示DIV高度差过大的时候，富文本会有怪异的展示
3.当选中展示层的文本，但此时鼠标却移出展示div，展示层DIV绑定的click事件不会触发，导致对应事件不发生
4.未测试到的BUG
5.未经历的情况
6.粘贴文本的解析

如果你对该富文本的设计有兴趣，请提出你的想法，建议或遇到的BUG.

如何联系我：
email : tangyu_nju@163.com
wx : merlinlock
```
