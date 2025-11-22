const demoDemo = {
  url: /\/demo/,
  type: 'get',
  response: {
    code: '0000',
    detail: {
      'page|1-10': 1,
      total: 100,
      'content|10': [
        {
          'projectAbbr|+1': 1,
          'projectCode|1-5': '*',
          'projectName|1-5': '测试'
        }
      ]
    }
  }
};

module.exports = [demoDemo];
