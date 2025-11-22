/*
 * @Author: shenlan
 * @Description: axios相关处理
 */
import qs from 'qs';
import { catchToken } from '@/lib/js/cache';
import { Message } from 'view-design';
import slToast from '@/components/SlToast/index.js';
import i18n from '@/language'; // 国际化

// 提示框
export const handleToast = (msg) => {
  Message.destroy();
  Message.error({
    content: msg,
    duration: 2
  });
};

//loading
export const handleLoading = {
  show: (params) => {
    if (
      params &&
      Object.prototype.toString.call(params.loading) === '[object Boolean]' &&
      !params.loading
      // eslint-disable-next-line no-empty
    ) {
    } else {
      slToast.loading();
    }
  },
  hide: () => {
    slToast.close();
  }
};

//设置请求头
export const handleChangeRequestHeader = (config) => {
  let contenTypeKey = 'Content-Type';
  let contenTypeVal = 'application/json;charset=utf-8';

  config.headers['Client'] = true;
  config.timeout = 100000;

  switch (config.method) {
    case 'get':
      config.paramsSerializer = {
        serialize: (params) => {
          return qs.stringify(params, { arrayFormat: 'repeat' });
        }
      };

      break;
    default:
      config.headers[contenTypeKey] = contenTypeVal;
  }

  return config;
};

//设置请求携带标志
export const handleConfigureAuth = (config) => {
  let token = catchToken.get();

  config.headers['Authorization'] = token;

  return config;
};

//网络请求异常
export const handleNetworkError = (error) => {
  let errorMsg = i18n.messages[i18n.locale].base.httpCode.error;
  let httpStatus = 500;
  if (error.response.status) {
    httpStatus = error.response.status;
    let networkErrMap = {
      400: i18n.messages[i18n.locale].base.httpCode.error400,
      401: i18n.messages[i18n.locale].base.httpCode.error401,
      403: i18n.messages[i18n.locale].base.httpCode.error403,
      404: i18n.messages[i18n.locale].base.httpCode.error404,
      405: i18n.messages[i18n.locale].base.httpCode.error405,
      408: i18n.messages[i18n.locale].base.httpCode.error408,
      500: i18n.messages[i18n.locale].base.httpCode.error500,
      501: i18n.messages[i18n.locale].base.httpCode.error501,
      502: i18n.messages[i18n.locale].base.httpCode.error502,
      503: i18n.messages[i18n.locale].base.httpCode.error503,
      504: i18n.messages[i18n.locale].base.httpCode.error504,
      505: i18n.messages[i18n.locale].base.httpCode.error505
    };

    errorMsg = networkErrMap[httpStatus];
  }
  handleLoading.hide();
  handleToast(errorMsg);

  return { status: httpStatus, msg: errorMsg };
};
