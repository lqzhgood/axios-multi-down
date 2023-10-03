var m = /* @__PURE__ */ ((t) => (t.HEAD = "head", t.SELF = "self", t))(m || {}), p = /* @__PURE__ */ ((t) => (t[t.NODE = 0] = "NODE", t[t.Browser = 1] = "Browser", t))(p || {});
const g = {
  max: 3,
  blockSize: "10M",
  // 10 * 1024 * 1024
  testMethod: "head"
  /* HEAD */
}, k = (() => {
  if (typeof window == "object")
    return p.Browser;
  if (Object.prototype.toString.call(process) === "[object process]")
    return p.NODE;
})();
function A(t, n) {
  if (t <= 0 || n <= 0)
    throw console.log("contentLength", t), console.log("blockSize", n), new Error("参数错误");
  const e = [], r = Math.ceil(t / n);
  for (let s = 0; s < r; s++)
    s !== r - 1 ? e.push({ s: n * s, e: n * (s + 1) - 1, i: s }) : e.push({ s: n * s, e: t - 1, i: s });
  return e;
}
function M(t) {
  const n = t.reduce((s, o) => s + o.length, 0);
  let e = new Uint8Array(n), r = 0;
  return t.forEach((s) => {
    e.set(s, r), r += s.length;
  }), e;
}
function N(t) {
  if (typeof t.max != "number")
    throw new Error(`downConfig.max must be number, got ${t.max}`);
  if (t.blockSize = $(t.blockSize), ![m.HEAD, m.SELF].includes(t.testMethod))
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
  return t.down = async function(e, r, s) {
    var d;
    let o = {}, u = { ...g, ...n };
    arguments.length === 1 && (typeof e == "string" ? o = { url: e } : o = e), arguments.length === 2 && (typeof e == "string" ? o = { ...r, url: e } : (o = e, u = { ...u, ...r })), arguments.length === 3 && (o = { ...r, url: e }, u = { ...u, ...s });
    const a = N(u), [h, f] = await j(t, a, o);
    if (!h || !f)
      return await E(t, o, a);
    {
      const i = A(f, a.blockSize);
      a.max = a.max <= i.length ? a.max : i.length, (d = a.emitter) == null || d.emit("preDown", i, a);
      let l;
      return a.max === 1 ? l = await E(t, o, a) : l = await K(t, o, a, i, f), l;
    }
  }, t;
}
async function j(t, n, e) {
  const { testMethod: r } = n, s = {
    ...e.headers,
    Range: "bytes=0-0"
  }, o = {
    ...e,
    headers: s
  };
  let u;
  return r === m.HEAD || k === p.Browser ? u = await T(t, o) : u = await H(t, o), u ? v(u.headers) : [!1, null];
}
function v(t) {
  const n = t["accept-ranges"] === "bytes", e = t["content-range"], r = Number(t["content-length"]);
  let s = n || !!e || r === 1, o = e ? Number(e.split("/")[1]) : r;
  return [s, o];
}
function T(t, n) {
  return new Promise((e) => {
    t({ ...n, method: m.HEAD }).then((r) => {
      e(r);
    }).catch((r) => {
      e(r.response || null);
    });
  });
}
function H(t, n) {
  return new Promise((e) => {
    const r = new AbortController();
    t({ ...n, signal: r.signal, responseType: "stream" }).then((s) => {
      s.data.on("data", (o) => {
        e(s), r.abort();
      });
    }).catch((s) => {
      e(s.response || null);
    });
  });
}
async function E(t, n, e) {
  var a, h;
  const r = await t(n), s = { s: 0, e: r.headers["content-length"] - 1, i: 0, resp: r }, o = [s];
  return (a = e.emitter) == null || a.emit("data", s, o, e), (h = e.emitter) == null || h.emit("end", o, e), { ...r, isMulti: !1, downConfig: e, queue: o };
}
function K(t, n, e, r, s) {
  return new Promise((o, u) => {
    let a;
    const h = n.responseType || "json";
    let f = 0, d = 0;
    const i = r.map((l) => () => new Promise((S, L) => {
      f++, d++;
      const D = {
        ...(n == null ? void 0 : n.headers) || {},
        Range: `bytes=${l.s}-${l.e}`
      };
      t({ ...n, headers: D, responseType: "arraybuffer" }).then((c) => {
        var w, b;
        if (c.data = c.data instanceof ArrayBuffer ? new Uint8Array(c.data) : c.data, l.resp = c, (w = e.emitter) == null || w.emit("data", l, r, e), a || (a = {
          ...c,
          isMulti: !0,
          downConfig: e,
          queue: r
        }), f === i.length && d === 1) {
          switch ((b = e.emitter) == null || b.emit("end", r, e), c.data = M(
            r.map((y) => y.resp.data)
          ), h) {
            case "json":
              try {
                c.data = new TextDecoder("utf-8").decode(c.data), c.data = JSON.parse(c.data), c.config.responseType = h;
              } catch {
              }
              break;
            case "text":
              c.data = new TextDecoder("utf-8").decode(c.data), c.config.responseType = h;
          }
          a = {
            ...c,
            isMulti: !0,
            downConfig: e,
            queue: r
          }, a.status = 200, a.statusText = "OK", a.headers["content-type"] = s, o(a);
        }
        S(a);
      }).catch((c) => {
        u(c);
      }).finally(() => {
        d--, f < i.length && (d < e.max || e.max === 1) && i[f]();
      });
    }));
    for (let l = 0; l < e.max; l++)
      i[l]();
  });
}
x.EventEmitter = B;
export {
  x as default
};
