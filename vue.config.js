const { defineConfig } = require('@vue/cli-service');
const CompressionPlugin = require('compression-webpack-plugin'); // 开启gzip压缩， 按需引用
const FileManagerPlugin = require('filemanager-webpack-plugin'); //压缩打包成品文件
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');
const product = process.env.NODE_ENV !== 'development'; //是否是  build
const outputDir = 'dist';
// const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
console.log('product:', product);

const resolve = (dir) => {
  return path.join(__dirname, dir);
};

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: true,
  publicPath: product ? './' : '/',
  outputDir: outputDir, // 输出文件目录
  // 设为false打包时不生成.map文件
  productionSourceMap: false,
  css: {
    // 是否使用css分离插件 ExtractTextPlugin
    extract: product ? true : false,
    // extract: true,
    // 开启 CSS source maps?
    sourceMap: product ? false : true,
    // css预设器配置项
    loaderOptions: {
      less: {
        // 配置less（其他样式解析用法一致）
        lessOptions: {
          javascriptEnabled: true,
          math: 'always'
        }
      }
    }
  },
  devServer: {
    proxy: {
      //配置多个跨域
      '/api': {
        //要访问的跨域的域名
        target: 'https://xiyou.ifengniao.com',
        pathRewrite: {
          '^/api': ''
        },
        //开启代理：在本地会创建一个虚拟服务端，然后发送请求的数据，并同时接收请求的数据，这样客户端端和服务端进行数据的交互就不会有跨域问题
        changeOrigin: true,
        // 使用的是http协议则设置为false，https协议则设置为true
        secure: true
        //websocket支持
        // ws: true,
      }
    }
  },
  configureWebpack: {
    // plugins: [new NodePolyfillPlugin()],
    module: {
      rules: [
        {
          test: /\.(jpg|png|gif|webp)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10 * 1024
            }
          }
        }
      ]
    }
  },

  chainWebpack: (config) => {
    // 添加别名
    config.resolve.alias
      .set('@', resolve('src'))
      .set('~axios', resolve('src/api/http/axios'))
      .set('~theme', resolve('theme'));

    // 修复热更新失效
    config.resolve.symlinks(true);

    // // 删除预加载
    // Object.keys(pages).forEach(entryName => {
    //     config.plugins.delete(`prefetch-${entryName}`);
    //     config.plugins.delete(`preload-${entryName}`);
    // });

    if (product) {
      // 正式环境下，删除console和debugger
      config.optimization
        .minimize(true)
        .minimizer('terser')
        .tap((args) => {
          let { terserOptions } = args[0];

          terserOptions.compress.drop_console = true;
          terserOptions.compress.drop_debugger = true;
          terserOptions.compress.pure_funcs = ['console.log'];

          // 去除注释
          terserOptions.format = {
            comments: false
          };
          return args;
        });

      // 开启线上压缩
      config
        .plugin('compressionPlugin')
        .use(CompressionPlugin)
        .tap(() => [
          {
            test: new RegExp('\\.(' + ['js', 'css'].join('|') + ')$'),
            threshold: 10240, //超过10k进行压缩
            deleteOriginalAssets: false, //是否删除源文件
            minRatio: 0.8,
            algorithm: 'gzip'
          }
        ]);

      // 打包文件
      config.plugin('compress').use(FileManagerPlugin, [
        {
          events: {
            onEnd: {
              delete: [
                //首先需要删除项目根目录下的.zip
                './*.zip'
              ],
              archive: [
                //然后我们选择dist文件夹将之打包成dist.zip并放在根目录
                {
                  source: `./${outputDir}`,
                  destination: `./${outputDir}-${[
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                    new Date().getDate(),
                    new Date().getHours(),
                    new Date().getMinutes()
                  ].join('')}.zip`
                }
              ]
            }
          }
        }
      ]);

      // config
      //     .plugin('webpack-bundle-analyzer')
      //     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);
    }
  }
});
