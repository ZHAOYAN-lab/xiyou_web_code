import axios from '~axios'

export default {
  /**
   * 获取用户简易列表（任务派发用）
   */
  getUserSimpleList() {
    return axios.get(
      '/ifengniao/cloud/server/xiyou/user/simple-list'
    )
  }
}
