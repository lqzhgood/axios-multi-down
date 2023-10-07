var b = /* @__PURE__ */ ((t) => (t.RETURN = "RETURN", t.WAIT = "WAIT", t))(b || {}), d = /* @__PURE__ */ ((t) => (t.HEAD = "HEAD", t.SELF = "SELF", t))(d || {}), w = /* @__PURE__ */ ((t) => (t[t.NODE = 0] = "NODE", t[t.Browser = 1] = "Browser", t))(w || {});
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
function x(t, n) {
  if (t <= 0 || n <= 0)
    throw console.log("contentLength", t), console.log("blockSize", n), new Error("参数错误");
  const e = [], r = Math.ceil(t / n);
  for (let s = 0; s < r; s++)
    s !== r - 1 ? e.push({ s: n * s, e: n * (s + 1) - 1, i: s, retryCount: 0 }) : e.push({ s: n * s, e: t - 1, i: s, retryCount: 0 });
  return e;
}
function H(t) {
  const n = t.reduce((s, o) => s + o.length, 0), e = new Uint8Array(n);
  let r = 0;
  return t.forEach((s) => {
    e.set(s, r), r += s.length;
  }), e;
}
function $(t) {
  if (typeof t.max != "number")
    throw new Error(`downConfig.max must be number, got ${t.max}`);
  if (t.blockSize = v(t.blockSize), ![d.HEAD, d.SELF].includes(t.testMethod))
    throw new Error(`downConfig.testMethod must be head | self , got ${t.testMethod}`);
  return t;
}
function v(t) {
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
class B {
  constructor() {
    this.events = {};
  }
  // 添加事件监听器
  on(n, e) {
    this.events[n] || (this.events[n] = []), this.events[n].push(e);
  }
  once(n, e) {
    const r = (...s) => {
      this.off(n, r), e(...s);
    };
    this.on(n, r);
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
function E(t, n = A) {
  return t.down = async function(e, r, s) {
    let o = {}, c = { ...A, ...n };
    arguments.length === 1 && (typeof e == "string" ? o = { url: e } : o = e), arguments.length === 2 && (typeof e == "string" ? o = { ...r, url: e } : (o = e, c = { ...c, ...r })), arguments.length === 3 && (o = { ...r, url: e }, c = { ...c, ...s });
    const a = $(c), [p, u] = await I(t, a, o);
    if (!p || !u)
      return await N(t, o, a);
    {
      const l = x(u, a.blockSize);
      a.max = a.max <= l.length ? a.max : l.length;
      let i;
      return a.max === 1 ? i = await N(t, o, a) : i = await L(t, o, a, l, u), i;
    }
  }, t;
}
async function I(t, n, e) {
  const { testMethod: r } = n, s = {
    ...e.headers,
    Range: "bytes=0-0"
  }, o = {
    ...e,
    headers: s
  };
  let c;
  return r === d.HEAD || k === w.Browser ? c = await j(t, o) : c = await W(t, o), c ? g(c.headers) : [!1, null];
}
function g(t) {
  const n = t["accept-ranges"] === "bytes", e = t["content-range"], r = Number(t["content-length"]), s = n || !!e || r === 1, o = e ? Number(e.split("/")[1]) : r;
  return [s, o];
}
function j(t, n) {
  return new Promise((e) => {
    t({ ...n, method: d.HEAD }).then((r) => {
      e(r);
    }).catch((r) => {
      e(r.response || null);
    });
  });
}
function W(t, n) {
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
function N(t, n, e) {
  const r = {
    s: 0,
    e: 0,
    i: 0,
    retryCount: 0
  }, s = [r];
  let o = { isMulti: !1, downConfig: e, queue: s };
  return f(e, "preDown", s, e), new Promise((c, a) => {
    function p() {
      return t(n).then((u) => (r.isDown = !0, r.e = u.headers["content-length"] - 1, r.resp = u, f(e, "data", r, s, e), f(e, "end", s, e), o = { ...u, ...o }, c(o), o)).catch((u) => (r.isDown = !1, f(e, "blockError", r, s, e), r.retryCount < e.maxRetries ? (r.retryCount++, setTimeout(() => {
        p();
      }, e.retryInterval)) : (u.response && (o = { ...u.response, downResponse: o }), u.downResponse = o, e.errMode !== b.WAIT && a(u), f(
        e,
        "finishErr",
        s.filter((l) => !l.resp),
        s,
        e
      )), o));
    }
    r.down = p, p();
  });
}
function L(t, n, e, r, s) {
  return f(e, "preDown", r, e), new Promise((o, c) => {
    let a;
    const p = n.responseType || "json";
    let u = 0, l = 0;
    r.forEach((i) => {
      const M = (R = !1) => new Promise((D) => {
        R || (u++, l++), i.isDown = !0;
        const T = {
          ...(n == null ? void 0 : n.headers) || {},
          Range: `bytes=${i.s}-${i.e}`
        };
        t({ ...n, headers: T, responseType: "arraybuffer" }).then((h) => {
          h.data = h.data instanceof ArrayBuffer ? new Uint8Array(h.data) : h.data, i.resp = h, a || (a = {
            ...h,
            isMulti: !0,
            downConfig: e,
            queue: r
          }), i.i === r.length - 1 && (a = {
            ...h,
            isMulti: !0,
            downConfig: e,
            queue: r
          }), f(e, "data", i, r, e), D(a);
        }).catch((h) => (f(e, "blockError", i, r, e), D(a), h)).then((h) => {
          if (l--, i.isDown = !1, l >= e.max)
            return;
          if (u < r.length) {
            r[u].down();
            return;
          }
          const y = r.find((m) => !m.resp && !m.isDown && m.retryCount < e.maxRetries);
          if (y) {
            l++, y.retryCount++, y.isDown = !0, setTimeout(() => {
              y.down(!0);
            }, e.retryInterval);
            return;
          }
          if (l === 0) {
            if (r.filter((m) => !m.resp).length !== 0) {
              e.errMode !== b.WAIT && (h.downResponse = a, c(h)), f(
                e,
                "finishErr",
                r.filter((m) => !m.resp),
                r,
                e
              );
              return;
            }
            f(e, "end", r, e), a.data = H(
              r.map((m) => m.resp.data)
            ), F(a, p), a.status = 200, a.statusText = "OK", a.headers["content-type"] = s, o(a);
          }
        });
      });
      i.down = M;
    });
    for (let i = 0; i < e.max; i++)
      r[i].down();
  });
}
function f(t, n, ...e) {
  var a;
  (a = t.emitter) == null || a.emit(n, ...e);
  const r = "on" + S(n), s = t[r];
  s && s(...e);
  const o = "once" + S(n), c = t[o];
  c && c(...e), t[o] = void 0;
}
function F(t, n) {
  switch (n) {
    case "json":
      try {
        t.data = new TextDecoder("utf-8").decode(t.data), t.data = JSON.parse(t.data), t.config.responseType = n;
      } catch {
      }
      break;
    case "text":
      t.data = new TextDecoder("utf-8").decode(t.data), t.config.responseType = n;
  }
  return t;
}
function K(t, n) {
  t = t.filter((e) => !e.resp);
  for (let e = 0; e < t.length; e++) {
    const r = t[e];
    r.retryCount = 0;
  }
  for (let e = 0; e < Math.min(n.max, t.length); e++)
    t[e].down();
}
E.EventEmitter = B;
E.RetryQueue = K;
E.const = {
  ERROR_MODE: b,
  TEST_METHOD: d
};
export {
  E as default
};
