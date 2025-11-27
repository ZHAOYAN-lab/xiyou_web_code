/*
 * @Author: shenlan
 * @Description: 全部路由
 */
import Layout from '@/components/SlLayoutIview';
import i18n from '@/language'; // 国际化
console.log(i18n.locale);
console.log(i18n.messages);
console.log(i18n.messages[i18n.locale]);

export default [
  {
    path: '/login',
    name: 'login',
    meta: {
      title: i18n.messages[i18n.locale].sideBarMenu.login,
      hideInMenu: true
    },
    component: () => import('@/views/login/index')
  },

  {
    path: '/h5_location',
    name: 'h5_location',
    meta: {
      title: '定位信息',
      hideInMenu: true
    },
    component: () => import('@/views/location-manage/h5-location/index')
  },

  {
    path: '/',
    name: '_home',
    redirect: '/home',
    component: Layout,
    meta: {
      hideInMenu: false,
      notCache: true
    },
    children: [
      {
        path: '/home',
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
        meta: {
          title: i18n.messages[i18n.locale].sideBarMenu.realtimeLocation
        },
        component: () => import('@/views/location-manage/realtime-location')
      },
      {
        path: 'tracking_manage',
        name: 'tracking_manage',
        meta: {
          title: i18n.messages[i18n.locale].sideBarMenu.trackingManage
        },
        component: () => import('@/views/location-manage/tracking-manage')
      }
    ]
  },

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
        meta: {
          title: i18n.messages[i18n.locale].sideBarMenu.baseStation
        },
        component: () => import('@/views/device-manage/base-station')
      },
      {
        path: 'beacon_manage',
        name: 'beacon_manage',
        meta: {
          title: i18n.messages[i18n.locale].sideBarMenu.beaconManage
        },
        component: () => import('@/views/device-manage/beacon-manage')
      },
      {
        path: 'object_manage',
        name: 'object_manage',
        meta: {
          title: i18n.messages[i18n.locale].sideBarMenu.objectManage
        },
        component: () => import('@/views/device-manage/object-manage')
      }
    ]
  },

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
        meta: {
          title: i18n.messages[i18n.locale].sideBarMenu.fenceManage
        },
        component: () => import('@/views/system-set/fence-manage')
      },
      {
        path: 'building_set',
        name: 'building_set',
        meta: {
          title: i18n.messages[i18n.locale].sideBarMenu.buildingSet
        },
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
        meta: {
          title: i18n.messages[i18n.locale].sideBarMenu.serviceSet
        },
        component: () => import('@/views/system-set/service-set')
      },
      {
        path: 'task_manage',
        name: 'TaskManage',
        meta: {
          title: '任务管理',
          icon: 'md-list-box'
        },
        component: () => import('@/views/system-set/TaskManage.vue')
      },

      // ⭐⭐⭐ 新增：商品区域设置 ⭐⭐⭐
      {
        path: 'product_area',
        name: 'product_area',
        meta: {
          title: '商品区域设置',
          icon: 'md-apps'
        },
        component: () => import('@/views/system-set/product-area/index.vue')
      }
    ]
  }
];
