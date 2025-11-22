import Vue from 'vue';
import SlToast from './index.vue';

let MessageConstructor = Vue.extend(SlToast);

let instance;
let rootNode = null;
let app = null;
const slToast = function (options) {
  const params =
    Object.prototype.toString.call(options).replace(/^$/, '').toLowerCase() === '[object object]'
      ? options
      : { message: options };

  instance = new MessageConstructor({
    data: {
      ...params,
      hide() {
        if (rootNode) {
          document.body.removeChild(rootNode);
          rootNode = null;
        }
      }
    }
  });

  instance.$mount();

  const pClass = 'sl-com-toast';
  const dom = document.body.querySelector(`.${pClass}`);
  if (!dom) {
    rootNode = document.createElement('div');
    // 给创建的元素设置 class 属性值
    rootNode.className = pClass;

    rootNode.appendChild(instance.$el);
    document.body.appendChild(rootNode);
  } else {
    app.$destroy();
    dom.innerHTML = '';
    rootNode.appendChild(instance.$el);
  }

  app = instance;

  return instance;
};

slToast.msg = (options) => slToast(options).msg();
slToast.success = (options) => slToast(options).success();
slToast.fail = (options) => slToast(options).fail();
slToast.loading = (options) => slToast(options).loading();
slToast.close = (options) => slToast(options).close();

export default slToast;
