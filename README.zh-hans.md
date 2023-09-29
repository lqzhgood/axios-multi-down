# building... not finish

<h1 align="center">axios-multi-down</h1>

<p align="center">Axios插件，通过 <a href='https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range' target='_blank'>Range</a> 特性， 将 __大文件__ 分割，并发多个 “Axios” 请求加快大文件下载速度。</p>

**中文** | [English](./README.md)

## 安装

```
npm i axios-multi-down
```

## 使用

```js
import axiosBase from 'axios';
import AxiosMultiDown from 'axios-multi-down';

const axios = axiosBase.create({});

AxiosMultiDown(axios);

axios.down('http://example.com/test')
	.then(result => {})
	.catch(err => {});

axios.down('http://example.com/test', {
		method: 'get',
		headers: { 'X-Requested-With': 'XMLHttpRequest' },
		// ...AxiosRequestConfig
	})
	.then(result => {})
	.catch(err => {});

axios.down({
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

> AxiosMultiDown

```
AxiosMultiDown( axios )
AxiosMultiDown( axios [ , DownOptions ] ) // Global DownOptions
```

> axios.down

```
axios.down( url )
axios.down( AxiosRequestConfig )
axios.down( url [ , AxiosRequestConfig ] )
```

> DownOptions

| Name       | Type        | Default            | Description                                                                       | remark                                                                                    |
| ---------- | ----------- | ------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| max        | `Number`    | `3`                | 最大同时进行的下载数量                                                            | \*1                                                                                       |
| blockSize  | `Number`    | `10 * 1024 * 1024` | 单个下载块的大小                                                                  | 单位 byte                                                                                 |
| testMethod | `head self` | `head`             | 用于探测服务器是否支持 `Range` 的方法， self 代表使用 `AxiosRequestConfig.method` | 如果使用 self 注意 [幂等性](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent) |

```
*1
> max 会被改写，规则如下

blockLength = Math.ceil( contentLength / blockSize );
max = max <= blockLength ? max : blockLength;

如  contentLength = 10 , max = 5, blockSize = 9;
max 会被改写为 2 -> [ 0-8 , 9-9 ]

```

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
