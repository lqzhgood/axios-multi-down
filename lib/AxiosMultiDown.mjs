var b = /* @__PURE__ */ ((t) => (t.RETURN = "RETURN", t.WAIT = "WAIT", t))(b || {}), p = /* @__PURE__ */ ((t) => (t.HEAD = "HEAD", t.SELF = "SELF", t))(p || {}), w = /* @__PURE__ */ ((t) => (t[t.NODE = 0] = "NODE", t[t.Browser = 1] = "Browser", t))(w || {});
const A = {
  max: 3,
  blockSize: "10M",
  // 10 * 1024 * 1024
  testMethod: "HEAD",
  maxRetries: 3,
  retryInterval: 1e3,
  errMode: "RETURN"
  /* RETURN */
}, k = (() => {
  if (typeof window == "object")
    return w.Browser;
  if (Object.prototype.toString.call(process) === "[object process]")
    return w.NODE;
})();
function x(t, r) {
  if (t <= 0 || r <= 0)
    throw console.log("contentLength", t), console.log("blockSize", r), new Error("参数错误");
  const e = [], n = Math.ceil(t / r);
  for (let s = 0; s < n; s++)
    s !== n - 1 ? e.push({ s: r * s, e: r * (s + 1) - 1, i: s, retryCount: 0 }) : e.push({ s: r * s, e: t - 1, i: s, retryCount: 0 });
  return e;
}
function H(t) {
  const r = t.reduce((s, o) => s + o.length, 0), e = new Uint8Array(r);
  let n = 0;
  return t.forEach((s) => {
    e.set(s, n), n += s.length;
  }), e;
}
function $(t) {
  if (typeof t.max != "number")
    throw new Error(`downConfig.max must be number, got ${t.max}`);
  if (t.blockSize = g(t.blockSize), ![p.HEAD, p.SELF].includes(t.testMethod))
    throw new Error(`downConfig.testMethod must be head | self , got ${t.testMethod}`);
  return t;
}
function g(t) {
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
function S(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
class v {
  constructor() {
    this.events = {};
  }
  // 添加事件监听器
  on(r, e) {
    this.events[r] || (this.events[r] = []), this.events[r].push(e);
  }
  once(r, e) {
    const n = (...s) => {
      this.off(r, n), e(...s);
    };
    this.on(r, n);
  }
  // 移除事件监听器
  off(r, e) {
    if (this.events[r]) {
      const n = this.events[r].indexOf(e);
      n !== -1 && this.events[r].splice(n, 1);
    }
  }
  // 触发事件
  emit(r, ...e) {
    if (this.events[r])
      for (const n of this.events[r])
        n(...e);
  }
}
function E(t, r = A) {
  return t.down = async function(e, n, s) {
    let o = {}, c = { ...A, ...r };
    arguments.length === 1 && (typeof e == "string" ? o = { url: e } : o = e), arguments.length === 2 && (typeof e == "string" ? o = { ...n, url: e } : (o = e, c = { ...c, ...n })), arguments.length === 3 && (o = { ...n, url: e }, c = { ...c, ...s });
    const a = $(c), [d, l] = await B(t, a, o);
    if (!d || !l)
      return await N(t, o, a);
    {
      const u = x(l, a.blockSize);
      a.max = a.max <= u.length ? a.max : u.length, m(a, "preDown", u, a);
      let i;
      return a.max === 1 ? i = await N(t, o, a) : i = await L(t, o, a, u, l), i;
    }
  }, t;
}
async function B(t, r, e) {
  const { testMethod: n } = r, s = {
    ...e.headers,
    Range: "bytes=0-0"
  }, o = {
    ...e,
    headers: s
  };
  let c;
  return n === p.HEAD || k === w.Browser ? c = await j(t, o) : c = await W(t, o), c ? I(c.headers) : [!1, null];
}
function I(t) {
  const r = t["accept-ranges"] === "bytes", e = t["content-range"], n = Number(t["content-length"]), s = r || !!e || n === 1, o = e ? Number(e.split("/")[1]) : n;
  return [s, o];
}
function j(t, r) {
  return new Promise((e) => {
    t({ ...r, method: p.HEAD }).then((n) => {
      e(n);
    }).catch((n) => {
      e(n.response || null);
    });
  });
}
function W(t, r) {
  return new Promise((e) => {
    const n = new AbortController();
    t({ ...r, signal: n.signal, responseType: "stream" }).then((s) => {
      s.data.on("data", (o) => {
        e(s), n.abort();
      });
    }).catch((s) => {
      e(s.response || null);
    });
  });
}
function N(t, r, e) {
  const n = {
    s: 0,
    e: 0,
    i: 0,
    retryCount: 0
  }, s = [n];
  let o = { isMulti: !1, downConfig: e, queue: s };
  return new Promise((c, a) => {
    function d() {
      return t(r).then((l) => (n.isDown = !0, n.e = l.headers["content-length"] - 1, n.resp = l, m(e, "data", n, s, e), m(e, "end", s, e), o = { ...l, ...o }, c(o), o)).catch((l) => (n.isDown = !1, m(e, "blockError", n, s, e), n.retryCount < e.maxRetries ? (n.retryCount++, setTimeout(() => {
        d();
      }, e.retryInterval)) : (l.response && (o = { ...l.response, downResponse: o }), l.downResponse = o, e.errMode !== b.WAIT && a(l), m(
        e,
        "finishErr",
        s.filter((u) => !u.resp),
        s,
        e
      )), o));
    }
    n.down = d, d();
  });
}
function L(t, r, e, n, s) {
  return new Promise((o, c) => {
    let a;
    const d = r.responseType || "json";
    let l = 0, u = 0;
    n.forEach((i) => {
      const M = (R = !1) => new Promise((D) => {
        R || (l++, u++), i.isDown = !0;
        const T = {
          ...(r == null ? void 0 : r.headers) || {},
          Range: `bytes=${i.s}-${i.e}`
        };
        t({ ...r, headers: T, responseType: "arraybuffer" }).then((h) => {
          h.data = h.data instanceof ArrayBuffer ? new Uint8Array(h.data) : h.data, i.resp = h, a || (a = {
            ...h,
            isMulti: !0,
            downConfig: e,
            queue: n
          }), i.i === n.length - 1 && (a = {
            ...h,
            isMulti: !0,
            downConfig: e,
            queue: n
          }), m(e, "data", i, n, e), D(a);
        }).catch((h) => (m(e, "blockError", i, n, e), D(a), h)).then((h) => {
          if (u--, i.isDown = !1, u >= e.max)
            return;
          if (l < n.length) {
            n[l].down();
            return;
          }
          const y = n.find((f) => !f.resp && !f.isDown && f.retryCount < e.maxRetries);
          if (y)
            u++, y.retryCount++, y.isDown = !0, setTimeout(() => {
              y.down(!0);
            }, e.retryInterval);
          else {
            if (u !== 0)
              return;
            n.filter((f) => !f.resp).length !== 0 ? (e.errMode !== b.WAIT && (h.downResponse = a, c(h)), m(
              e,
              "finishErr",
              n.filter((f) => !f.resp),
              n,
              e
            )) : (m(e, "end", n, e), a.data = H(
              n.map((f) => f.resp.data)
            ), F(a, d), a.status = 200, a.statusText = "OK", a.headers["content-type"] = s, o(a));
          }
        });
      });
      i.down = M;
    });
    for (let i = 0; i < e.max; i++)
      n[i].down();
  });
}
function m(t, r, ...e) {
  var a;
  (a = t.emitter) == null || a.emit(r, ...e);
  const n = "on" + S(r), s = t[n];
  s && s(...e);
  const o = "once" + S(r), c = t[o];
  c && c(...e), t[o] = void 0;
}
function F(t, r) {
  switch (r) {
    case "json":
      try {
        t.data = new TextDecoder("utf-8").decode(t.data), t.data = JSON.parse(t.data), t.config.responseType = r;
      } catch {
      }
      break;
    case "text":
      t.data = new TextDecoder("utf-8").decode(t.data), t.config.responseType = r;
  }
  return t;
}
function K(t, r) {
  t = t.filter((e) => !e.resp);
  for (let e = 0; e < t.length; e++) {
    const n = t[e];
    n.retryCount = 0;
  }
  for (let e = 0; e < Math.min(r.max, t.length); e++)
    t[e].down();
}
E.EventEmitter = v;
E.RetryQueue = K;
E.const = {
  ERROR_MODE: b,
  TEST_METHOD: p
};
export {
  E as default
};
