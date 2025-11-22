# 使用方法

-   要求父元素有设置高度

```
<sl-com-table
    ref="slComTable"
    :t-id="'demo-table'"
    :t-columns="tColumns">
</sl-com-table>
```

```js
<script>
export default {
    data() {
        // 这里存放数据
        return {

            tColumns: [

                {
                    title: '项目名称',
                    key: 'projectName'
                },
                {
                    title: '操作',
                    fixed: 'right',
                    width: 120,
                    align: 'center',
                    render: (h, params) => {
                        let item = params.row;

                        return h(
                            'Button',
                            {
                                nativeOn: {
                                    click: () => {
                                        this.demo(item);
                                    }
                                }
                            },
                            '查看'
                        );
                    }
                }
            ]
        };
    },

    mounted() {
        this.$nextTick(() => {
           this.$refs.slComTable.init({
                query: {
                    name: '',
                    age: '',
                    page: 0,
                    size: 10
                },
                func: (params) => {
                    return new Promise((resolve) => {
                        this.$api
                            .homeDemo({
                                data: params
                                // loading: false
                            })
                            .then((res) => {
                                // console.log(JSON.stringify(res, null, 2));
                                resolve(res);
                            });
                    });
                }
            });
        });
    }
};
</script>
```
