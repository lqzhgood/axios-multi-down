var f = /* @__PURE__ */ ((t) => (t.HEAD = "head", t.SELF = "self", t))(f || {}), w = /* @__PURE__ */ ((t) => (t[t.NODE = 0] = "NODE", t[t.Browser = 1] = "Browser", t))(w || {});
const g = {
  max: 3,
  blockSize: "10M",
  // 10 * 1024 * 1024
  testMethod: "head"
  /* HEAD */
}, k = (() => {
  if (typeof window == "object")
    return w.Browser;
  if (Object.prototype.toString.call(process) === "[object process]")
    return w.NODE;
})();
function A(t, n) {
  if (t <= 0 || n <= 0)
    throw new Error("参数错误");
  const e = [], r = Math.ceil(t / n);
  for (let a = 0; a < r; a++)
    a !== r - 1 ? e.push({ s: n * a, e: n * (a + 1) - 1, i: a }) : e.push({ s: n * a, e: t - 1, i: a });
  return e;
}
function M(t) {
  const n = t.reduce((a, s) => a + s.length, 0);
  let e = new Uint8Array(n), r = 0;
  return t.forEach((a) => {
    e.set(a, r), r += a.length;
  }), e;
}
function N(t) {
  if (typeof t.max != "number")
    throw new Error(`downConfig.max must be number, got ${t.max}`);
  if (t.blockSize = $(t.blockSize), ![f.HEAD, f.SELF].includes(t.testMethod))
    throw new Error(`downConfig.testMethod must be head | self , got ${t.testMethod}`);
  return t;
}
function $(t) {
  if (typeof t == "number") {
    if (t <= 0)
      throw new Error(`downConfig.blockSize number must be > 0 , got ${t}`);
    return t;
  }
  if (/^\d+K$/.test(t))
    return Number(t.match(/\d+/)[0]) * 1024;
  if (/^\d+M$/.test(t))
    return Number(t.match(/\d+/)[0]) * 1024 * 1024;
  if (/^\d+G$/.test(t))
    return Number(t.match(/\d+/)[0]) * 1024 * 1024 * 1024;
  if (/^\d+T$/.test(t))
    return Number(t.match(/\d+/)[0]) * 1024 * 1024 * 1024 * 1024;
  throw new Error(`downConfig.blockSize string only supported K,M,G,T, got ${t}`);
}
class B {
  constructor() {
    this.events = {};
  }
  // 添加事件监听器
  on(n, e) {
    this.events[n] || (this.events[n] = []), this.events[n].push(e);
  }
  // 移除事件监听器
  off(n, e) {
    if (this.events[n]) {
      const r = this.events[n].indexOf(e);
      r !== -1 && this.events[n].splice(r, 1);
    }
  }
  // 触发事件
  emit(n, ...e) {
    if (this.events[n])
      for (const r of this.events[n])
        r(...e);
  }
}
function x(t, n = g) {
  return t.down = async function(e, r, a) {
    let s = {}, u = { ...g, ...n };
    arguments.length === 1 && (typeof e == "string" ? s = { url: e } : s = e), arguments.length === 2 && (typeof e == "string" ? s = { ...r, url: e } : (s = e, u = { ...u, ...r })), arguments.length === 3 && (s = { ...r, url: e }, u = { ...u, ...a });
    const o = N(u), i = await j(t, o, s);
    if (i) {
      const l = A(i, o.blockSize);
      o.max = o.max <= l.length ? o.max : l.length;
      let h;
      return o.max === 1 ? h = await E(t, s, o) : h = await H(t, s, o, l, i), h;
    } else
      return await E(t, s, o);
  }, t;
}
async function j(t, n, e) {
  const { testMethod: r } = n, a = {
    ...e.headers,
    Range: "bytes=0-0"
  }, s = {
    ...e,
    headers: a
  };
  let u = null;
  return r === f.HEAD || k === w.Browser ? u = await v(t, s) : u = await T(t, s), u;
}
function v(t, n) {
  return new Promise((e) => {
    t({ ...n, method: f.HEAD }).then((r) => {
      const a = r.headers["accept-ranges"] === "bytes", s = r.headers["content-range"];
      e(a && s ? Number(s.split("/")[1]) : null);
    }).catch(() => {
      e(null);
    });
  });
}
function T(t, n) {
  return new Promise((e) => {
    const r = new AbortController();
    t({ ...n, signal: r.signal, responseType: "stream" }).then((a) => {
      a.data.on("data", (s) => {
        const u = a.headers["content-range"];
        a.headers["content-length"] == 1 && u ? e(Number(u.split("/")[1])) : e(null), r.abort();
      });
    }).catch(() => {
      e(null);
    });
  });
}
async function E(t, n, e) {
  var o, i;
  const r = await t(n), a = { s: 0, e: r.headers["content-length"] - 1, i: 0, resp: r }, s = [a];
  return (o = e.emitter) == null || o.emit("data", a, s), (i = e.emitter) == null || i.emit("end"), { ...r, isMulti: !1, downConfig: e, queue: s };
}
function H(t, n, e, r, a) {
  return new Promise((s, u) => {
    let o;
    const i = n.responseType || "json";
    let l = 0, h = 0;
    const m = r.map((d) => () => new Promise((D, K) => {
      l++, h++;
      const S = {
        ...(n == null ? void 0 : n.headers) || {},
        Range: `bytes=${d.s}-${d.e}`
      };
      t({ ...n, headers: S, responseType: "arraybuffer" }).then((c) => {
        var y, b;
        if (c.data = c.data instanceof ArrayBuffer ? new Uint8Array(c.data) : c.data, d.resp = c, (y = e.emitter) == null || y.emit("data", d, r), o || (o = {
          ...c,
          isMulti: !0,
          downConfig: e,
          queue: r
        }), l === m.length && h === 1) {
          switch ((b = e.emitter) == null || b.emit("end"), c.data = M(
            r.map((p) => p.resp.data)
          ), i) {
            case "json":
              try {
                c.data = new TextDecoder("utf-8").decode(c.data), c.data = JSON.parse(c.data), c.config.responseType = i;
              } catch {
              }
              break;
            case "text":
              c.data = new TextDecoder("utf-8").decode(c.data), c.config.responseType = i;
          }
          o = {
            ...c,
            isMulti: !0,
            downConfig: e,
            queue: r
          }, o.status = 200, o.statusText = "OK", o.headers["content-type"] = a, s(o);
        }
        D(o);
      }).catch((c) => {
        u(c);
      }).finally(() => {
        h--, l < m.length && (h < e.max || e.max === 1) && m[l]();
      });
    }));
    for (let d = 0; d < e.max; d++)
      m[d]();
  });
}
x.EventEmitter = B;
export {
  x as default
};
