import { catchToken } from '@/lib/js/cache';

/**
 * 从本地缓存中获取当前登录用户
 * 刷新页面也能拿到
 */
export function getCurrentUser() {
  const token = catchToken.get();
  if (!token) return null;

  // 兼容你现在的登录返回结构
  if (token.userName) {
    return token;
  }

  if (token.detail && token.detail.userName) {
    return token.detail;
  }

  return null;
}
