const tracking_1 = {
  url: /\/getObjectById/,
  type: 'get',
  response: {
    code: '0000',
    detail: [
      {
        value: 'a-c-1',
        label: 'object-1'
      },
      {
        value: 'a-c-2',
        label: 'object-2'
      }
    ]
  }
};

const tracking_2 = {
  url: /\/getTracking/,
  type: 'get',
  response: {
    code: '0000',
    detail: {
      image: {
        width: '',
        heght: '',
        src: ''
      },
      layer: [
        {
          gateway: '10030240',
          mapId: '1645334018633216001',
          groupId: '3',
          name: '中心',
          productName: 'gateway',
          systemId: '10990145',
          type: 'Gateway',
          status: 'Online',
          ip: '61.194.146.44',
          fenceIds: null,
          posX: 3.5,
          posY: 1.9,
          setZ: 2.5,
          angle: 90.0,
          hisX: 0.306456,
          hisY: -0.306456,
          hisZ: -9.65336,
          updateTime: 1687752916,
          extraInfo: null
        },
        {
          gateway: '10030240',
          mapId: '1645334018633216001',
          groupId: '3',
          name: '中心',
          productName: 'gateway',
          systemId: '10990145',
          type: 'Gateway',
          status: 'Online',
          ip: '61.194.146.44',
          fenceIds: null,
          posX: 3.62,
          posY: 1.9,
          setZ: 2.5,
          angle: 90.0,
          hisX: 0.306456,
          hisY: -0.306456,
          hisZ: -9.65336,
          updateTime: 1687752916,
          extraInfo: null
        },
        {
          gateway: '10030240',
          mapId: '1645334018633216001',
          groupId: '3',
          name: '中心',
          productName: 'gateway',
          systemId: '10990145',
          type: 'Gateway',
          status: 'Online',
          ip: '61.194.146.44',
          fenceIds: null,
          posX: 3.73,
          posY: 2.0,
          setZ: 2.5,
          angle: 90.0,
          hisX: 0.306456,
          hisY: -0.306456,
          hisZ: -9.65336,
          updateTime: 1687752916,
          extraInfo: null
        }
      ]
    }
  }
};

module.exports = [tracking_1, tracking_2];
