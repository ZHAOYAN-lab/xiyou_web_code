import axios from '~axios'

export default {
  /**
   * 获取用户简易列表（任务派发用）
   */
  getUserSimpleList() {
    return axios.get(
      '/ifengniao/cloud/server/xiyou/user/simple-list'
    )
  },

  /**
   * 账号管理列表
   */
  getAccountList(params) {
    return axios.get(
      '/ifengniao/cloud/server/xiyou/user/account/list',
      { data: params }
    )
  },

  /**
   * 新增账号
   */
  addAccount(data) {
    return axios.post(
      '/ifengniao/cloud/server/xiyou/user/account/add',
      { data }
    )
  }
}
