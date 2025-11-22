# SlToast 组件

## 使用方式

```js
import slToast from '@/components/slToast/index.js';

// 直接使用
slToast.msg({});
slToast.success({});
slToast.fail({});
slToast.loading();
slToast.close();

// vue 全局挂载
Vue.prototype.$slToast = slToast;
```
