const pubGetMapData = {
  url: /\/map123/,
  type: 'get',
  response: {
    code: '0000',
    detail: [
      {
        value: 'a',
        label: '帝国大厦',
        children: [
          {
            value: 'a-b',
            label: '3F',
            children: [
              {
                value: 1,
                label: 'room-1',
                code: 10
              }
            ]
          },
          {
            value: 'a-c',
            label: '4F',
            children: [
              {
                value: 2,
                label: 'room-1',
                code: 11
              },
              {
                value: 3,
                label: 'room-2',
                code: 12
              }
            ]
          }
        ]
      }
    ]
  }
};

module.exports = [pubGetMapData];
