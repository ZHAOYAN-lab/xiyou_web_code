<template>
  <div class="login-content">
    <div class="lan-fixed">
      <sl-language />
    </div>
    <div class="page-account-container">
      <div class="header">
        <div>
          <span class="logo" />
          <span class="title">{{ $t('base.systemName') }}</span>
        </div>
      </div>

      <div class="form">
        <div class="title">
          <span>{{ $t('login.tab') }}</span>
        </div>
        <div class="acc-pwd">
          <Form ref="formInline" :model="formInline" :rules="ruleInline">
            <FormItem prop="username">
              <Input
                v-model="formInline.username"
                size="large"
                prefix="ios-contact-outline"
                :placeholder="$t('login.user')"
                style="width: 100%"
              />
            </FormItem>
            <FormItem prop="password">
              <Input
                v-model="formInline.password"
                size="large"
                type="password"
                password
                prefix="ios-lock-outline"
                :placeholder="$t('login.password')"
                style="width: 100%"
              />
            </FormItem>
          </Form>
        </div>

        <div>
          <Button size="large" class="submit" type="primary" long @click="handleSubmit()">{{
            $t('login.submit')
          }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import i18n from '@/language'; // 国际化
import { catchToken } from '@/lib/js/cache';

export default {
  components: {},
  data() {
    return {
      formInline: {
        username: '',
        password: ''
      },
      ruleInline: {
        username: [
          {
            required: true,
            message: i18n.messages[i18n.locale].login.userNotEmpty,
            trigger: 'blur'
          }
        ],
        password: [
          {
            required: true,
            message: i18n.messages[i18n.locale].login.passwordNotEmpty,
            trigger: 'blur'
          }
        ]
      }
    };
  },
  computed: {},
  created() {},
  beforeDestroy() {
    window.removeEventListener('keydown', this.enterKeyDown);
  },
  mounted() {
    this.$nextTick(() => {
      catchToken.remove();

      window.addEventListener('keydown', this.enterKeyDown);
    });
  },
  methods: {
    // 登录
    handleSubmit() {
      this.$refs.formInline.validate((valid) => {
        if (valid) {
          this.$api
            .loginMethod({
              data: this.formInline
            })
            .then((res) => {
              catchToken.set(res);
              this.$router.push(this.$pub.slBrowserDevice().mobile ? 'h5_location' : '/home');
            });
          // this.$router.push(this.$pub.slBrowserDevice().mobile ? 'h5_location' : '/home');
        } else {
          // this.$Message.error('Fail!');
        }
      });
    },

    enterKeyDown(e) {
      switch (e.keyCode) {
        case 13:
          this.handleSubmit();
          break;
      }
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>
