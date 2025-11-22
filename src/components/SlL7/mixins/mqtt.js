// import * as mqtt from 'mqtt';
import mqtt from 'mqtt/dist/mqtt';

export default {
  data() {
    return {
      connection: {
        url: '',
        username: '',
        password: '',
        clean: true,
        connectTimeout: 30 * 1000, // ms
        reconnectPeriod: 4000 // ms
      },
      subscription: {
        topic: '',
        qos: 0
      },
      publish: {
        topic: 'topic/browser',
        qos: 0,
        payload: '{ "msg": "Hello, I am browser." }'
      },
      receiveNews: '',
      qosList: [0, 1, 2],
      client: {
        connected: false
      },
      subscribeSuccess: false,
      connecting: false,
      retryTimes: 0 //重新连接次数
    };
  },
  computed: {
    userInfo() {
      return this.$store.state.userInfo.userMsg;
    }
  },

  beforeDestroy() {
    this.destroyConnection();
  },
  mounted() {},

  methods: {
    createConnection() {
      try {
        console.log('创建连接');
        // console.log(this.userInfo);

        this.connecting = true;

        let userInfo = this.userInfo;

        const connectUrl = userInfo.mqttUrl;
        this.client = mqtt.connect(connectUrl, {
          username: userInfo.mqttUsername,
          password: userInfo.mqttPassword
        });
        if (this.client.on) {
          this.client.on('connect', () => {
            this.connecting = false;
            console.log('连接成功！！！');
          });
          this.client.on('reconnect', this.handleOnReConnect);
          this.client.on('error', () => {
            // console.log('失败', error);
          });
          this.client.on('message', (topic, message) => {
            let decodedString = String.fromCharCode.apply(null, message);
            let data = JSON.parse(decodedString);

            if (this.mqttOnMessage) {
              this.mqttOnMessage(data);
            } else {
              // console.log('不存在');
              this.mqttOnMessage = this.$pub.slThrottle((data) => {
                console.log('mqtt 数据使用');
                this.xinbiaoSetData(data);
              }, 1000);
              this.mqttOnMessage(data);
            }
          });
        }
      } catch (error) {
        this.connecting = false;
        // console.log('mqtt.连接失败', error);
      }
    },
    handleOnReConnect() {
      // console.log('重新连接');
      this.retryTimes += 1;
      if (this.retryTimes > 5) {
        try {
          this.client.end();
          this.resetData();
        } catch (error) {
          // console.log(error);
        }
      }
    },
    resetData() {
      this.client = {
        connected: false
      };
      this.retryTimes = 0;
      this.connecting = false;
      this.subscribeSuccess = false;
    },

    handleSubscribe(mapId) {
      if (this.subscription.topic !== '') {
        this.doUnSubscribe();
      }

      this.doSubscribe(mapId);
    },
    // 订阅主题
    doSubscribe(mapId) {
      console.log('发起订阅');

      this.subscription.topic = `${this.userInfo.mqttTopicPrefix}${mapId}`;
      const { topic, qos } = this.subscription;

      this.client.subscribe(topic, { qos }, (error) => {
        if (error) {
          // console.log('Subscribe to topics error', error);
          return;
        }
        this.subscribeSuccess = true;
        // console.log('Subscribe to topics res', res);
      });
    },
    // 取消订阅
    doUnSubscribe() {
      const { topic } = this.subscription;

      console.log('取消订阅～:', topic);
      this.client.unsubscribe(topic, (error) => {
        if (error) {
          // console.log('Unsubscribe error', error);
        }
      });
    },
    // 消息发布
    doPublish() {
      const { topic, qos, payload } = this.publish;
      this.client.publish(topic, payload, { qos }, (error) => {
        if (error) {
          // console.log('Publish error', error);
        }
      });
    },
    //断开连接
    destroyConnection() {
      if (this.client.connected) {
        try {
          this.client.end(false, () => {
            this.resetData();
            console.log('MQTT 断开连接');
          });
        } catch (error) {
          // console.log('MQTT 断开连接失败', error.toString());
        }
      }
    }
  }
};
