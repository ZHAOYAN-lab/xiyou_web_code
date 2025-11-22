/*
 * @Author: shenlan
 * @Description:网络请求
 */
import axios from 'axios';
import config from '@/config';
import { catchToken } from '@/lib/js/cache';
import router from '@/router';
import {
  handleChangeRequestHeader,
  handleConfigureAuth,
  handleLoading,
  handleToast,
  handleNetworkError
} from './tools';
import i18n from '@/language'; // 国际化

const { baseUrl } = config;

// // 用于存储pending的请求（处理多条相同请求）
// const pendingRequest = new Map();

// // 生成request的唯一key
// const generateRequestKey = (config = {}) => {
//     // 通过url，method，params，data生成唯一key，用于判断是否重复请求
//     // params为get请求参数，data为post请求参数
//     const { url, method, params, data } = config;
//     return [url, method, qs.stringify(params), qs.stringify(data)].join('&');
// };

// // 将重复请求添加到pendingRequest中
// const addPendingRequest = (config) => {
//     const key = generateRequestKey(config);
//     if (!pendingRequest.has(key)) {
//         config.cancelToken = new axios.CancelToken((cancel) => {
//             pendingRequest.set(key, cancel);
//         });
//     }
// };

// // 取消重复请求
// const removePendingRequest = (config) => {
//     const key = generateRequestKey(config);
//     if (pendingRequest.has(key)) {
//         const cancelToken = pendingRequest.get(key);
//         cancelToken(key); // 取消之前发送的请求
//         pendingRequest.delete(key); // 请求对象中删除requestKey
//     }
// };

// 开始设置请求 发起的拦截处理
axios.defaults.baseURL = baseUrl;

// config 代表发起请求的参数的实体
axios.interceptors.request.use(
  (config) => {
    config = handleChangeRequestHeader(config);
    config = handleConfigureAuth(config);
    // console.log(JSON.stringify(config, null, 2));
    // console.log('发起请求');

    // // 处理重复请求
    // removePendingRequest(config);
    // addPendingRequest(config);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 请求到结果的拦截处理
axios.interceptors.response.use(
  (config) => {
    // // 移除重复请求
    // removePendingRequest(response.config);
    // console.log('请求结束');

    handleLoading.hide();

    let data = config.data;
    let res = {
      status: true,
      data: data.detail
    };

    let code = data.code;
    if (code !== '0000') {
      res.status = false;

      setTimeout(() => {
        handleToast(
          data.msg ? i18n.messages[i18n.locale].base.httpCode.errorCodeMsg[data.code] : data.code
        );
      }, 0);

      let rlArray = ['RL0001', 'RL0002', 'RL0003']; //需要重新登录的标志
      if (rlArray.indexOf(code) > -1) {
        catchToken.set('');
        setTimeout(() => {
          catchToken.remove();
          router.replace('/login');
        }, 1000);
      }
    }
    // 返回请求正确的结果
    return res;
  },
  (error) => {
    // console.log(error);

    //   // 移除重复请求
    //   removePendingRequest(error.config || {});
    let handlerError = handleNetworkError(error);

    if (handlerError.status === 401) {
      catchToken.remove();

      setTimeout(() => {
        // console.log('去登录页面');
        router.replace('/login');
      }, 200);
    }

    return Promise.reject(handlerError);
  }
);

/**
 * @param {String} type [请求类型]
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
const httpMethod = (type, url, params) => {
  return new Promise((resolve, reject) => {
    let urls = params && params.url ? params.url : url;
    let paramsData = params && params.data ? params.data : {};
    handleLoading.show(params);

    let config = {
      method: type,
      url: urls
    };

    switch (type) {
      case 'get':
        config.params = paramsData;
        break;
      default:
        config.data = paramsData;
        break;
    }

    axios(config)
      .then((res) => {
        if (res.status) {
          resolve(res.data);
        } else {
          // if (type === 'delete') {
          //   resolve({
          //     status: res.status,
          //     data: res.data
          //   });
          // }
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const get = (url, params) => {
  return httpMethod('get', url, params);
};

export const post = (url, params) => {
  return httpMethod('post', url, params);
};

export const put = (url, params) => {
  return httpMethod('put', url, params);
};

export const patch = (url, params) => {
  return httpMethod('patch', url, params);
};

export const deletes = (url, params) => {
  return httpMethod('delete', url, params);
};

export default {
  get,
  post,
  put,
  patch,
  deletes
};
