<h1 align="center">axios-multi-down</h1>

<p align="center"><code>Axios</code> 插件，通过 <a href='https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range' target='_blank'>Range</a> 特性， 将 <i>大文件</i> 分割，并发多个 <code>Axios</code> 请求加快大文件下载速度。</p>

**中文** | [English](./README.md)

## Demo

[https://lqzhgood.github.io/axios-multi-down](https://lqzhgood.github.io/axios-multi-down)

## 安装

```shell
npm i axios-multi-down
```

```html
<script src="https://unpkg.com/axios-multi-down/lib/AxiosMultiDown.umd.js"></script>
```

## 使用

```js
import axiosBase from 'axios';
import AxiosMultiDown from 'axios-multi-down';

const axios = axiosBase.create({});

AxiosMultiDown(axios);

axios
    .down('http://example.com/test')
    .then(result => {})
    .catch(err => {});

axios
    .down('http://example.com/test', {
        method: 'get',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        // ...AxiosRequestConfig
    })
    .then(result => {})
    .catch(err => {});

axios
    .down({
        url: 'http://example.com/test',
        method: 'post',
        data: {
            firstName: 'Fred',
        },
        // ...AxiosRequestConfig
    })
    .then(result => {})
    .catch(err => {});
```

## Api

#### AxiosMultiDown

```
AxiosMultiDown( axios )
AxiosMultiDown( axios [ , DownConfig ] ) // Global DownConfig
```

#### axios.down

```
axios.down( url )
axios.down( AxiosRequestConfig )

axios.down( url, AxiosRequestConfig )
axios.down( AxiosRequestConfig , DownConfig )

axios.down( url , AxiosRequestConfig, DownConfig )
```

#### DownConfig

> defaultDownConfig => /src/const.ts

| Name          | Type                     | Default             | Description                                                                           | remark                                                                                             |
| ------------- | ------------------------ | ------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| max           | `Number`                 | `3`                 | 最大同时进行下载的数量                                                                | \*1                                                                                                |
| blockSize     | `Number` `K` `B` `G` `T` | `10M`               | 单个下载的块大小                                                                      | 单位 `byte`                                                                                        |
| testMethod    | `TEST_METHOD`            | `TEST_METHOD.HEAD`  | 用于探测服务器是否支持 `Range` 的HTTP方法， self 代表使用 `AxiosRequestConfig.method` | \*2 如果使用 `self`, 请注意 [幂等性](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent) |
| maxRetries    | `Number`                 | `3`                 | block 下载错误，最大重试次数                                                          | 重试将会在所有 block 下载完后进行                                                                  |
| retryInterval | `Number`                 | `1000`              | block 下载错误，重试间隔                                                              | 单位 `ms`                                                                                          |
| errMode       | `ERROR_MODE`             | `ERROR_MODE.RETURN` | 当所有block部分下载失败时的处理方式                                                   | \*3 如果设置为 `WAIT`，可通过 `onFinishErr` 手动重试                                               |
| $Hook         | `Function`               | -                   | 与 `Event` 类似，如 `on('data',fn)` -> onData(fn), onceData(fn)                       | `Hook` 是同步的， `Event` 是异步的                                                                 |

```
*1
    > max 会被改写，规则如下

    blockLength = Math.ceil( contentLength / blockSize );
    max = max <= blockLength ? max : blockLength;

    如  contentLength = 10 , max = 5, blockSize = 9;
    max 会被改写为 2 -> [ 0-8 , 9-9 ]

*2
    浏览器环境将强制使用 HEAD 方法，因为当前不支持 responseType === 'steam'

*3
    let retry = 0
    const resp = await axios.down( url , {
            maxRetries: 10,
            errMode: AxiosMultiDown.const.ERROR_MODE.WAIT // 重点
            onFinishErr(errorQueue, queue, downConfig) {
                // 这将下载所有Block，且每个Block都重试10次以后，手动再重试3次
                while( retry++ < 3){
                    axiosMultiDown.RetryQueue(eQ, downConfig);
                }
            },
        },
    );

    // 如果成功，将得到 resp， 如果下载失败，将永远不会到这里
    console.log(resp);
```

##### CONST

###### TEST_METHOD

> DownConfig.testMethod = AxiosMultiDown.const.TEST_METHOD

| Name | Description |
| ---- | ----------- |
| HEAD |             |
| SELF |             |

> DownConfig.errMode = AxiosMultiDown.const.ERROR_MODE

| Name   | Description                                 |
| ------ | ------------------------------------------- |
| RETURN | 立即返回错误，下载中止                      |
| WAIT   | 等待手动处理，可和 onFinishErr 配合手动重试 |

#### IBlockData

```js
interface IBlockData {
    s: number; // block start position
    e: number; // block end position
    i: number; // block index
    resp?: AxiosResponse;
        resp.data: Uint8Array; // block data, in multi down, type is Uint8Array
}
```

#### IAxiosDownResponse

> axios.down(url).then(( resp: IAxiosDownResponse extends AxiosResponse )=>{})

```js
resp = {
    ...axiosResponse,
    isMulti: boolean; // Is it downloaded through multiple requests?
    queue: IBlockData[];
    downConfig: IDownConfig;
}

```

`...axiosResponse` 部分将被覆写两次

-   第一次完成 `axios` 请求.
-   最后一次完成 `axios` 请求,
    -   其他修改
        -   resp.status = 200;
        -   resp.statusText = 'OK';
        -   resp.headers['content-type'] = totalContentLength;

## 事件

```js
const emitter = new AxiosMultiDown.EventEmitter();

emitter.on('preDown', (queue: IBlockData[], config: IDownConfig) => void)
emitter.on('data', (block: IBlockData, queue: IBlockData[], config: IDownConfig) => void)
emitter.on('blockError', (block: IBlockData, queue: IBlockData[], config: IDownConfig) => void)
emitter.on('end', (queue: IBlockData[], config: IDownConfig) => void)
emitter.on('finishErr', (errQueue: IBlockData[], queue: IBlockData[], config: IDownConfig) => void)

axios.down( '/test', {} , { emitter } )

```

> `emitter.once` 与 `emitter.on` 参数相同，但仅执行一次

## 注意事项

#### 不支持 Range

如果资源不支持 [Range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range)，将自动回退使 `axios.down === axios` 并返回结果

#### 跨域 CORS

如果你访问一个跨域的服务器，需要服务器在 `Access-Control-Expose-Headers` 中包含 `Content-Range`，否则客户端获取的 `headers` 中不包含 `Content-Range`

docs: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers

> res.setHeader('Access-Control-Expose-Headers', '$OtherHeaders, Content-Range');

## 测试

```
npm run test
```

## TODO

-   [ ] `responseType` 使用 `steam` 获取更好的性能
    -   需要 `axios` 使用 `fetch` 作为 `adapter` 才可让浏览器支持
