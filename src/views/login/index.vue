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
          <Button
            size="large"
            class="submit"
            type="primary"
            long
            @click="handleSubmit"
          >
            {{ $t('login.submit') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import i18n from '@/language';
import { catchToken } from '@/lib/js/cache';

export default {
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

  mounted() {
    catchToken.remove();
    window.addEventListener('keydown', this.enterKeyDown);
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.enterKeyDown);
  },

  methods: {
    handleSubmit() {
      this.$refs.formInline.validate((valid) => {
        if (!valid) return;

        this.$api
          .loginMethod({
            data: this.formInline
          })
          .then((res) => {
            catchToken.set(res);

            // ★★★ worker1 强制跳 h5
            if (this.formInline.username === 'worker1') {
              this.$router.replace({ name: 'h5_location' });
            } else {
              this.$router.replace(
                this.$pub.slBrowserDevice().mobile
                  ? { name: 'h5_location' }
                  : { path: '/home' }
              );
            }
          });
      });
    },

    enterKeyDown(e) {
      if (e.keyCode === 13) {
        this.handleSubmit();
      }
    }
  }
};
</script>

<style lang="less" scoped>
@import url('./index.less');
</style>
