# building... not finish

<h1 align="center">axios-multi-down</h1>

<p align="center">Axios plugin, Speed up the download process by using multiple `Axios` requests to fetch a single file.</p>

**中文** | [English](./README.md)

## 测试

```
npm run test
```

## 注意事项

#### 跨域 CORS

如果你访问一个跨域的服务器，需要服务器在 `Access-Control-Expose-Headers` 中包含 `Content-Range`，否则客户端获取的 `headers` 中不包含 `Content-Range`

docs: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers

> res.setHeader('Access-Control-Expose-Headers', 'Authorization, Content-Range');
