const base_station1 = {
  url: /\/ifengniao\/cloud\/server\/xiyou\/baseStation\/page/,
  type: 'get',
  response: {
    code: '0000',
    detail: {
      'page|1-10': 1,
      total: 100,
      'content|10': [
        {
          'baseStationMac|+1': 10000,
          'baseStationProduct|1': ['Gateway', 'Gateway1', 'Gateway2'],
          'baseStationIp|1-5': '测试',
          baseStationX: '1',
          baseStationY: '2',
          // dateTime: '@datetime()',
          'baseStationOnline|1-2': true
        }
      ]
    }
  }
};

module.exports = [base_station1];
