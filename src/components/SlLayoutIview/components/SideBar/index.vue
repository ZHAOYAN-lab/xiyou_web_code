<template>
  <div id="main-side-bar" class="main-side-bar" :class="{ 'min-width': collapsed }">
    <div class="option-sidebar" @click="handleCollpasedChange">
      <span :class="{ close: collapsed }"></span>
    </div>

    <div class="side-bar-menu">
      <div v-show="!collapsed" class="menu-un-collapsed">
        <Menu
          ref="menu"
          class="side-bar-menu-iview"
          :width="'200'"
          :active-name="activeName"
          :open-names="openedNames"
          @on-select="handleDropDownSelect"
        >
          <template v-for="item in menuList">
            <template v-if="item.children && item.children.length === 1">
              <MenuItem :key="`${item.children[0].name}`" :name="`${item.children[0].name}`">
                <p class="menu-p">
                  <span class="icon-menu" :class="item.children[0].name"></span>
                  <span class="title-span">
                    {{ handlePageTitle(item.children[0]) }}
                  </span>
                </p>
              </MenuItem>
            </template>

            <template v-else>
              <Submenu :key="`${item.name}`" :name="`${item.name}`">
                <template slot="title">
                  <div>
                    <p class="menu-p">
                      <span class="icon-menu" :class="item.name"></span>
                      <span class="title-span">
                        {{ handlePageTitle(item) }}
                      </span>
                    </p>
                  </div>
                </template>

                <template v-for="child in item.children">
                  <MenuItem v-if="!child.meta.hide" :key="`${child.name}`" :name="`${child.name}`">
                    <p class="menu-p">
                      <span class="title-span title-span-son">
                        {{ handlePageTitle(child) }}
                      </span>
                    </p>
                  </MenuItem>
                </template>
              </Submenu>
            </template>
          </template>
        </Menu>
      </div>
      <div v-show="collapsed" class="menu-collapsed">
        <template v-for="item in menuList">
          <template v-if="item.children && item.children.length > 1">
            <Dropdown
              :key="`drop-menu-${item.name}`"
              ref="dropdown"
              transfer
              :placement="placement"
              @on-click="handleDropDownSelect"
            >
              <p
                class="dropdown-p menu-p"
                :class="{
                  'dropdown-p-selected': collapsedSelected(item, true)
                }"
              >
                <span class="icon-menu" :class="item.name"></span>
              </p>

              <DropdownMenu ref="dropdown" slot="list">
                <template v-for="child in item.children">
                  <DropdownItem
                    v-if="!child.meta.hide"
                    :key="`drop-${child.name}`"
                    :name="child.name"
                    :selected="collapsedSelected(child)"
                  >
                    <div class="flex">
                      <!-- <main-icon :type="child.icon" /> -->
                      <span class="menu-title">{{ handlePageTitle(child) }}</span>
                    </div>
                  </DropdownItem>
                </template>
              </DropdownMenu>
            </Dropdown>
          </template>
          <template v-else>
            <div :key="`drop-menu-${item.name}`">
              <Tooltip
                transfer
                :content="
                  handlePageTitle(item.children && item.children[0] ? item.children[0] : item)
                "
                placement="right"
              >
                <p
                  class="tooltip-p menu-p"
                  :class="{
                    'tooltip-p-selected': collapsedSelected(item)
                  }"
                  @click="handleSelect(item, true)"
                >
                  <span class="icon-menu" :class="item.children[0].name"></span>
                </p>
              </Tooltip>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  components: {},
  mixins: [],
  props: {
    collapsed: Boolean
  },
  data() {
    return {
      placement: 'right-end',
      openedNames: [],
      icon: 'md-menu',
      size: 26
    };
  },
  computed: {
    menuList() {
      return this.$store.getters.menuList;
    },
    activeName() {
      return this.$route.name;
    }
  },
  watch: {
    openedNames() {
      this.$nextTick(() => {
        this.$refs.menu.updateOpened();
      });
    },
    activeName() {
      this.handleOpenedNames();
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.handleOpenedNames();
    });
  },
  methods: {
    handleCollpasedChange() {
      this.$emit('on-collapsed-change', !this.collapsed);
    },
    handleMousemove(event, children) {
      const { pageY } = event;
      const height = children.length * 38;
      const isOverflow = pageY + height < window.innerHeight;
      this.placement = isOverflow ? 'right-start' : 'right-end';
    },

    handleDropDownSelect(name) {
      // console.log(name);

      this.handleSelect({ name: name });
    },

    // 被选中跳转页面
    handleSelect(item, flag) {
      let name = flag ? item.children[0].name : item.name;

      this.$router.push({
        name
      });
    },
    //计算页面名称
    handlePageTitle(item) {
      let { title } = item.meta;

      if (!title) {
        return;
      }

      title = (item.meta && item.meta.title) || item.name;

      return title;
    },
    //侧边栏关闭时 计算是否被选中
    collapsedSelected(item, isDropdown) {
      let name = this.$route.name;

      if (item.children && item.children.length > 0) {
        if (isDropdown) {
          let arr = item.children.reduce((arr, ele) => {
            arr.push(ele.name);
            return arr;
          }, []);

          if (arr.indexOf(name) > -1) {
            return true;
          }
        } else {
          if (item.children[0].name === name) {
            return true;
          }
        }
      } else {
        if (item.name === name) {
          return true;
        }
      }

      return false;
    },
    // 计算打开的 menu
    handleOpenedNames() {
      // console.log(this.$route.matched);

      this.openedNames = this.$route.matched
        .map((item) => item.name)
        .filter((item) => item !== this.$route.name);

      // console.log(JSON.stringify(this.openedNames, null, 2));
    }
  }
};
</script>
<style lang="less" scoped>
@import url('./index.less');
</style>
