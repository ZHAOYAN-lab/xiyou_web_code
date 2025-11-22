const base_station1 = {
  url: /\/ifengniao\/cloud\/server\/xiyou\/user\/loginer/,
  type: 'get',
  response: {
    code: '0000',
    detail: {
      userId: 1,
      userName: 'admin',
      userPass: null,
      userEmail: 'wudong@ifengniao.com',
      userPhone: '',
      mqttUrl: 'wss://m.ifengniao.com:8084/mqtt',
      mqttUsername: 'xiyou_page',
      mqttPassword: 'xiyou_page_123',
      mqttTopicPrefix: '/ifengniao/cloud/mqtt/xiyou/page/beacons/bymap/'
    }
  }
};

module.exports = [base_station1];
