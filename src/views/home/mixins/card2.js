export default {
  data() {
    return {
      card2: {
        title: '',
        carouselShow: false,
        data: [
          {
            key: 'a',
            type: 1,
            title: '',
            user: '',
            online: 0,
            outline: 0,
            total: 0
          },
          {
            key: 'b',
            type: 2,
            title: '',
            user: '',
            online: 0,
            outline: 0,
            total: 0
          },
          {
            key: 'c',
            type: 3,
            title: '',
            user: '',
            online: 0,
            outline: 0,
            total: 0
          },
          {
            key: 'd',
            type: 4,
            title: '',
            user: '',
            online: 0,
            outline: 0,
            total: 0
          }
        ]
      }
    };
  },
  computed: {},
  beforeDestroy() {},
  mounted() {
    this.$nextTick(() => {
      this.card2Init();
    });
  },
  methods: {
    card2Init() {
      let card2 = this.card2;
      card2.data.forEach((ele) => {
        ele.title = this.$t(`home.card2.${ele.key}`);
      });

      card2.title = card2.data[0].title;
    },
    card2SetData(data) {
      let card2 = this.card2;
      card2.carouselShow = false;
      let card2Data = this.card2.data;

      card2Data.forEach((ele) => {
        ele.online = 0;
        ele.outline = 0;
        ele.total = 0;
      });

      data.forEach((ele) => {
        card2Data.forEach((item) => {
          if (ele.type === item.type) {
            item.total += ele.count;
            if (ele.online) {
              item.online = ele.count;
            } else {
              item.outline = ele.count;
            }
          }
        });
      });

      this.$nextTick(() => {
        card2.carouselShow = true;
      });

      // this.$forceUpdate();
    },
    card2CarouselOnChange(oldValue, value) {
      let card2 = this.card2;

      card2.title = card2.data[value].title;
    }
  }
};
