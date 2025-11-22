/*
 * @Author: shenlan
 * @Description: 全局公用函数
 */

// import config from '@/config';

import {
  slGetQuery,
  slSetQuery,
  slTimeFormat,
  slDebounce,
  slThrottle,
  slDeepClone,
  slHandleNumber,
  slIsEmpty,
  slDeleteEmptyField,
  slMontageString,
  slBrowserCopyToClipboard,
  slBrowserDevice
} from 'shenlan-util';

// 转换成时间戳
const slConvertTimestamp = (date) => {
  return new Date(date).getTime();
};

//检测空并返回提示
const slIsEmptyMsg = (obj, checkKey) => {
  let warning = '';

  try {
    checkKey.forEach((item) => {
      if (slIsEmpty(obj[item.key])) {
        warning = item.msg;
        throw '';
      }
    });
  } catch (error) {
    // console.log(error);
  }

  return warning;
};

// 检测是否包含中文
const slHasChinese = (text) => {
  var pattern = /[\u4e00-\u9fa5]/;
  return pattern.test(text);
};

// 校验IP
const slIsIP = (ip) => {
  var pattern =
    /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return pattern.test(ip);
};
// 下载文件
const slDownloadFile = (url, fileName = 'download') => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export { slDownloadFile };

export default {
  slGetQuery,
  slSetQuery,
  slTimeFormat,
  slDebounce,
  slDeepClone,
  slThrottle,
  slHandleNumber,
  slIsEmpty,
  slIsEmptyMsg,
  slDeleteEmptyField,
  slDownloadFile,
  slMontageString,
  slBrowserCopyToClipboard,
  slBrowserDevice,
  slConvertTimestamp,
  slHasChinese,
  slIsIP
};
