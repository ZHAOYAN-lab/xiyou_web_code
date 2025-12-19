/*
 * @Author: shenlan
 * @Description: 全部路由（修复根路径 redirect 与权限守卫冲突）
 */
import Layout from '@/components/SlLayoutIview';
import MobileLayout from '@/components/MobileLayout.vue';
import i18n from '@/language'; // 国际化

export default [
  /* ======================================
   * 登录页
   * ====================================== */
  {
    path: '/login',
    name: 'login',
    meta: {
      title: i18n.messages[i18n.locale].sideBarMenu.login,
      hideInMenu: true
    },
    component: () => import('@/views/login/index')
  },

  /* ======================================
   * 手机 H5 实时定位页面
   * ====================================== */
  {
    path: '/h5_location',
    name: 'h5_location',
    meta: {
      title: '定位信息',
      hideInMenu: true
    },
    component: () => import('@/views/location-manage/h5-location/index')
  },

  /* ======================================
   * PC 首页 Layout（⚠️ 注意：不再使用 redirect）
   * ====================================== */
  {
    path: '/',
    name: '_home',
    component: Layout,
    meta: { hideInMenu: false, notCache: true },
    children: [
      {
        path: 'home',          // ← 这里用相对路径
        name: 'home',
        meta: {
          hideInMenu: false,
          title: i18n.messages[i18n.locale].sideBarMenu.home,
          notCache: true,
          icon: 'ios-apps-outline'
        },
        component: () => import('@/views/home')
      }
    ]
  },

  /* ======================================
   * 定位管理
   * ====================================== */
  {
    path: '/location',
    name: 'location',
    meta: {
      icon: 'ios-compass-outline',
      title: i18n.messages[i18n.locale].sideBarMenu.location
    },
    component: Layout,
    children: [
      {
        path: 'realtime_location',
        name: 'realtime_location',
        meta: { title: i18n.messages[i18n.locale].sideBarMenu.realtimeLocation },
        component: () => import('@/views/location-manage/realtime-location')
      },
      {
        path: 'tracking_manage',
        name: 'tracking_manage',
        meta: { title: i18n.messages[i18n.locale].sideBarMenu.trackingManage },
        component: () => import('@/views/location-manage/tracking-manage')
      }
    ]
  },

  /* ======================================
   * 设备管理
   * ====================================== */
  {
    path: '/device',
    name: 'device',
    meta: {
      icon: 'ios-paper-outline',
      title: i18n.messages[i18n.locale].sideBarMenu.device
    },
    component: Layout,
    children: [
      {
        path: 'base_station',
        name: 'base_station',
        meta: { title: i18n.messages[i18n.locale].sideBarMenu.baseStation },
        component: () => import('@/views/device-manage/base-station')
      },
      {
        path: 'beacon_manage',
        name: 'beacon_manage',
        meta: { title: i18n.messages[i18n.locale].sideBarMenu.beaconManage },
        component: () => import('@/views/device-manage/beacon-manage')
      },
      {
        path: 'object_manage',
        name: 'object_manage',
        meta: { title: i18n.messages[i18n.locale].sideBarMenu.objectManage },
        component: () => import('@/views/device-manage/object-manage')
      }
    ]
  },

  /* ======================================
   * 预警管理
   * ====================================== */
  {
    path: '/warning',
    name: 'warning',
    meta: {
      icon: 'ios-compass-outline',
      title: i18n.messages[i18n.locale].sideBarMenu.warning
    },
    component: Layout,
    children: [
      {
        path: 'warining_info',
        name: 'warining_info',
        meta: {
          icon: 'ios-warning-outline',
          title: i18n.messages[i18n.locale].sideBarMenu.wariningInfo
        },
        component: () => import('@/views/intelligence-warning/info')
      },
      {
        path: 'warining_info-2',
        name: 'warining_info-2',
        meta: {
          hide: true,
          icon: 'ios-warning-outline',
          title: i18n.messages[i18n.locale].sideBarMenu.wariningInfo
        },
        component: () => import('@/views/intelligence-warning/info')
      }
    ]
  },

  /* ======================================
   * 系统设置（PC）
   * ====================================== */
  {
    path: '/system',
    name: 'system',
    meta: {
      icon: 'ios-cog-outline',
      title: i18n.messages[i18n.locale].sideBarMenu.system
    },
    component: Layout,
    children: [
      {
        path: 'fence_manage',
        name: 'fence_manage',
        meta: { title: i18n.messages[i18n.locale].sideBarMenu.fenceManage },
        component: () => import('@/views/system-set/fence-manage')
      },
      {
        path: 'building_set',
        name: 'building_set',
        meta: { title: i18n.messages[i18n.locale].sideBarMenu.buildingSet },
        component: () => import('@/views/system-set/building-set')
      },
      {
        path: 'floor_set',
        name: 'floor_set',
        meta: {
          hide: true,
          title: i18n.messages[i18n.locale].sideBarMenu.floorSet
        },
        component: () => import('@/views/system-set/floor-set')
      },
      {
        path: 'service_set',
        name: 'service_set',
        meta: { title: i18n.messages[i18n.locale].sideBarMenu.serviceSet },
        component: () => import('@/views/system-set/service-set')
      },
      {
        path: 'task_manage',
        name: 'TaskManage',
        meta: { title: '任务管理', icon: 'md-list-box' },
        component: () => import('@/views/system-set/TaskManage.vue')
      },
      {
        path: 'product_area',
        name: 'product_area',
        meta: { title: '商品区域设置', icon: 'md-apps' },
        component: () => import('@/views/system-set/product-area/index.vue')
      }
    ]
  },

  /* =============================================================
   * 独立手机导航页面（无侧边栏）
   * ============================================================= */
  {
    path: '/system/mobile_navigation',
    component: MobileLayout,
    meta: {
      hideInMenu: true
    },
    children: [
      {
        path: '',
        name: 'mobile_navigation',
        component: () => import('@/views/system-set/mobile-navigation/index.vue')
      }
    ]
  }
];
