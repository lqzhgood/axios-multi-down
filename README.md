<h1 align="center">axios-multi-down</h1>

<p align="center">Axios plugin, utilizes the <a href='https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range' target='_blank'>Range</a> feature to split <i>large files</i> and initiate multiple concurrent <code>Axios</code> requests to accelerate the download speed of large files.</p>

**English** | [中文](./README.zh-hans.md)

## Demo

[https://lqzhgood.github.io/axios-multi-down](https://lqzhgood.github.io/axios-multi-down)

## Installation

```shell
npm i axios-multi-down
```

```html
<script src="https://unpkg.com/axios-multi-down/lib/AxiosMultiDown.umd.js"></script>
```

## Usage

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

| Name          | Type                     | Default | Description                                                                                                   | remark                                                                                                                         |
| ------------- | ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| max           | `Number`                 | `3`     | The maximum number of simultaneous downloads                                                                  | \*1                                                                                                                            |
| blockSize     | `Number` `K` `B` `G` `T` | `10M`   | The size of individual download blocks                                                                        | unit `byte`                                                                                                                    |
| testMethod    | `head self`              | `head`  | HTTP method used to check if the server supports the `Range` header.， self means `AxiosRequestConfig.method` | \*2 If using `self`, please be aware of idempotence [Idempotent](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent) |
| maxRetries    | `Number`                 | `3`     | block down err, max retry down count                                                                          | 重试将会在所有 block 下载完后进行                                                                                              |
| retryInterval | `Number`                 | `1000`  | block down err, retry interval                                                                                | unit `ms`                                                                                                                      |

```
*1
    > Max will be overwritten, following these rules:

    blockLength = Math.ceil( contentLength / blockSize );
    max = max <= blockLength ? max : blockLength;

    如  contentLength = 10 , max = 5, blockSize = 9;
    max will be overwritten 2 -> [ 0-8 , 9-9 ]

*2
    The browser environment will enforce the use of the HEAD method because 'responseType === 'stream'' is not currently supported.

```

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

The `...axiosResponse` portion will be overwritten twice

-   in first completed `axios` requests.
-   in last completed `axios` requests,
    -   other modify
        -   resp.status = 200;
        -   resp.statusText = 'OK';
        -   resp.headers['content-type'] = totalContentLength;

## Event

```js
const emitter = new AxiosMultiDown.EventEmitter();

emitter.on('preDown', (queue: IBlockData[], config: IDownConfig)=>{})
emitter.on('data', (block: IBlockData, queue: IBlockData[], config: IDownConfig)
emitter.on('end', (queue: IBlockData[], config: IDownConfig)=>{})

axios.down( '/test', {} , { emitter } )

```

## Important

#### Not supported: Range

If the resource doesn't support [Range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range), it will automatically fallback to make 'axios.down === axios' and return the result

#### CORS

If you are accessing a cross-origin server, the server needs to include 'Content-Range' in the 'Access-Control-Expose-Headers' header; otherwise, the 'Content-Range' will not be included in the headers received by the client

docs: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers

> res.setHeader('Access-Control-Expose-Headers', '$OtherHeaders, Content-Range');

## TEST

```
npm run test
```

## TODO

-   [ ] Using `responseType` with `stream` provides better performance.
    -   It requires using `axios` with `fetch` as the `adapter` to make it compatible with browsers
