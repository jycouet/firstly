import {
  A as $,
  u as $n,
  E as Ar,
  G as Bn,
  L as C,
  O as ce,
  y as di,
  g as Dn,
  o as Er,
  x as fi,
  s as Fn,
  V as fr,
  M as ge,
  I as H,
  P as he,
  n as ie,
  D as Ie,
  S as Je,
  b as je,
  r as Ke,
  v as li,
  p as Ln,
  T as lr,
  j as Mn,
  C as Mt,
  m as Nn,
  N as Nt,
  c as oi,
  e as or,
  Q as pe,
  i as Pn,
  F as qn,
  K as Re,
  f as Rn,
  B as Sr,
  q as Tr,
  J as U,
  w as ui,
  U as ur,
  k as V,
  d as W,
  a as Xe,
  l as xe,
  z as Xt,
  H as Y,
  R as ye,
  t as z,
  h as Z,
} from './index-czJ1PA1n.js'

var Sn = Object.defineProperty
var An = (n, e, t) =>
  e in n ? Sn(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : (n[e] = t)
var c = (n, e, t) => An(n, typeof e != 'symbol' ? e + '' : e, t)
function Jn(n, e) {
  const t = {},
    r = {},
    i = { $$scope: 1 }
  let s = n.length
  for (; s--; ) {
    const a = n[s],
      o = e[s]
    if (o) {
      for (const l in a) l in o || (r[l] = 1)
      for (const l in o) i[l] || ((t[l] = o[l]), (i[l] = 1))
      n[s] = o
    } else for (const l in a) i[l] = 1
  }
  for (const a in r) a in t || (t[a] = void 0)
  return t
}
const We = []
function dr(n, e) {
  return { subscribe: Lt(n, e).subscribe }
}
function Lt(n, e = ie) {
  let t
  const r = new Set()
  function i(o) {
    if (Xe(n, o) && ((n = o), t)) {
      const l = !We.length
      for (const u of r) u[1](), We.push(u, n)
      if (l) {
        for (let u = 0; u < We.length; u += 2) We[u][0](We[u + 1])
        We.length = 0
      }
    }
  }
  function s(o) {
    i(o(n))
  }
  function a(o, l = ie) {
    const u = [o, l]
    return (
      r.add(u),
      r.size === 1 && (t = e(i, s) || ie),
      o(n),
      () => {
        r.delete(u), r.size === 0 && t && (t(), (t = null))
      }
    )
  }
  return { set: i, update: s, subscribe: a }
}
function $t(n, e, t) {
  const r = !Array.isArray(n),
    i = r ? [n] : n
  if (!i.every(Boolean)) throw new Error('derived() expects stores as input, got a falsy value')
  const s = e.length < 2
  return dr(t, (a, o) => {
    let l = !1
    const u = []
    let f = 0,
      d = ie
    const h = () => {
        if (f) return
        d()
        const m = e(r ? u[0] : u, a, o)
        s ? a(m) : (d = Pn(m) ? m : ie)
      },
      p = i.map((m, b) =>
        Fn(
          m,
          (k) => {
            ;(u[b] = k), (f &= ~(1 << b)), l && h()
          },
          () => {
            f |= 1 << b
          },
        ),
      )
    return (
      (l = !0),
      h(),
      function () {
        Ke(p), d(), (l = !1)
      }
    )
  })
}
const jn = (n) => {
    const { subscribe: e, update: t } = Lt(n)
    return {
      subscribe: e,
      set: (r = {}) => {
        t((i) => Object.assign(i, r))
      },
    }
  },
  qt = jn({ mode: 'window', basePath: null }),
  Vt = (n = Dn(qt).mode) => {
    let e = 'popstate'
    n === 'window' && (e = 'popstate'),
      n === 'hash' && (e = 'hashchange'),
      window.dispatchEvent(new Event(e))
  },
  Fr = {
    go: (n = 0) => {
      history.go(n), Vt()
    },
    push: (n, e = null) => {
      history.pushState(e, '', n), Vt()
    },
    replace: (n, e = null) => {
      history.replaceState(e, '', n), Vt()
    },
  },
  Un = (n) => {
    const e = n.match(/^(\/[^?#]*)?/),
      t = n.match(/\?([^#]*)?/),
      r = n.match(/#(.*)?/)
    return {
      path: (e == null ? void 0 : e[1]) || '/',
      query: t != null && t[1] ? `?${t == null ? void 0 : t[1]}` : '',
      hash: r != null && r[1] ? `#${r == null ? void 0 : r[1]}` : '',
    }
  },
  Pr = () => {
    const { pathname: n, search: e, hash: t } = document.location
    return { path: n, query: e, hash: t }
  },
  Dr = () => {
    let n = document.location.hash.substring(1)
    return n[0] !== '/' && (n = '/' + n), Un(n)
  },
  Wn = dr(Pr(), (n) => {
    const e = () => n(Pr())
    return window.addEventListener('popstate', e), () => window.removeEventListener('popstate', e)
  }),
  Vn = dr(Dr(), (n) => {
    const e = () => n(Dr())
    return (
      window.addEventListener('hashchange', e), () => window.removeEventListener('hashchange', e)
    )
  }),
  cr = $t([qt, Wn, Vn], ([n, e, t], r) => {
    n.mode === 'window' && r(e), n.mode === 'hash' && r(t)
  }),
  Hn = $t(cr, (n) => n.path)
$t(cr, (n) => n.query)
$t(cr, (n) => n.hash)
const vt = (n) => n.split(/(?=\/)/),
  xn = () => {
    let n = 0
    return () => n++
  },
  Rr = (n, e) => (e === null ? n : n.startsWith(e) ? n.slice(e.length) : n)
function Mr(n) {
  let e
  const t = n[11].default,
    r = li(t, n, n[10], null)
  return {
    c() {
      r && r.c()
    },
    m(i, s) {
      r && r.m(i, s), (e = !0)
    },
    p(i, s) {
      r &&
        r.p &&
        (!e || s & 1024) &&
        ui(r, t, i, i[10], e ? di(t, i[10], s, null) : fi(i[10]), null)
    },
    i(i) {
      e || (z(r, i), (e = !0))
    },
    o(i) {
      Z(r, i), (e = !1)
    },
    d(i) {
      r && r.d(i)
    },
  }
}
function Qn(n) {
  let e = Nr(Rr(n[1], n[2].basePath), n[0], n[3]),
    t,
    r,
    i = e && Mr(n)
  return {
    c() {
      i && i.c(), (t = or())
    },
    m(s, a) {
      i && i.m(s, a), W(s, t, a), (r = !0)
    },
    p(s, [a]) {
      a & 15 && (e = Nr(Rr(s[1], s[2].basePath), s[0], s[3])),
        e
          ? i
            ? (i.p(s, a), a & 15 && z(i, 1))
            : ((i = Mr(s)), i.c(), z(i, 1), i.m(t.parentNode, t))
          : i &&
            (Rn(),
            Z(i, 1, 1, () => {
              i = null
            }),
            Mn())
    },
    i(s) {
      r || (z(i), (r = !0))
    },
    o(s) {
      Z(i), (r = !1)
    },
    d(s) {
      s && V(t), i && i.d(s)
    },
  }
}
const Gn = (n, e, t, r, i) => {
    const s = (u, f, d) => {
        const h = vt(f).filter((p) => p !== '/').length
        return (d ?? 0) + (u ? 1 : h)
      },
      a = (u, f) => {
        const d = {
          invalidPath: `<Route path="${u == null ? void 0 : u.path}" /> has invalid path. Path must start with '/'`,
          fallbackOutsideRoot: '<Route fallback /> cannot be outside root <Route />',
          pathOutsideRoot: `<Route path="${u == null ? void 0 : u.path}" /> cannot be outside root <Route />`,
          fallbackInsideFallback: '<Route fallback /> cannot be inside <Route fallback>',
          pathInsideFallback: `<Route path="${u == null ? void 0 : u.path}" /> cannot be inside <Route fallback>`,
        }
        if (u.path[0] !== '/') throw new Error(d.invalidPath)
        if (u.root && u.fallback) throw new Error(d.fallbackOutsideRoot)
        if (u.root && u.path !== '/') throw new Error(d.pathOutsideRoot)
        if (f != null && f.fallback && u.fallback) throw new Error(d.fallbackInsideFallback)
        if (f != null && f.fallback && !u.fallback) throw new Error(d.pathInsideFallback)
      },
      o = s(t, r, i == null ? void 0 : i.depth),
      l = { id: n, root: e, fallback: t, path: r, depth: o }
    return a(l, i), l
  },
  zn = () => {
    const { subscribe: n, update: e } = Lt([])
    return {
      subscribe: n,
      update: (t) => e((r) => [...r.filter((i) => t.id !== i.id), t]),
      remove: (t) => e((r) => r.filter((i) => t.id !== i.id)),
    }
  },
  Nr = (n, e, t) => {
    const r = (u, f, d, h) => {
        let p = vt(u).filter((k) => k !== '/'),
          m = vt(d).filter((k) => k !== '/'),
          b = ''
        if (d === '/') return f || p.length === h
        for (let k = h - m.length; k < h; k++) b = b + p[k]
        return d === b
      },
      i = (u, f, d) => {
        var m, b, k, E
        let h = vt(u).filter((I) => I !== '/'),
          p = !1
        for (let I = 0; I < (d == null ? void 0 : d.length) && !p; I++)
          ((m = d[I]) != null && m.fallback) ||
            (p = r(
              u,
              ((b = d[I]) == null ? void 0 : b.root) ?? !1,
              ((k = d[I]) == null ? void 0 : k.path) ?? '',
              ((E = d[I]) == null ? void 0 : E.depth) ?? 0,
            ))
        return h.length >= f && !p
      },
      { root: s, fallback: a, path: o, depth: l } = e
    return a ? i(n, l, t) : r(n, s, o, l)
  },
  Kn = xn(),
  Ht = {},
  Lr = {}
function Xn(n, e, t) {
  let r, i, s, a, o
  xe(n, Hn, (I) => t(1, (s = I))), xe(n, qt, (I) => t(2, (a = I)))
  let { $$slots: l = {}, $$scope: u } = e
  const f = Kn(),
    d = !Nn(Ht)
  let { fallback: h = !1 } = e,
    { path: p = '/' } = e
  const m = Lt()
  xe(n, m, (I) => t(0, (r = I)))
  const b = Er(Ht)
  xe(n, b, (I) => t(9, (i = I)))
  const k = zn(),
    E = Er(Lr)
  return (
    xe(n, E, (I) => t(3, (o = I))),
    Ln(() => (E == null ? void 0 : E.remove(r))),
    Tr(Ht, m),
    Tr(Lr, k),
    (n.$$set = (I) => {
      'fallback' in I && t(7, (h = I.fallback)),
        'path' in I && t(8, (p = I.path)),
        '$$scope' in I && t(10, (u = I.$$scope))
    }),
    (n.$$.update = () => {
      n.$$.dirty & 896 && $n(m, (r = Gn(f, d, h, p, i)), r),
        n.$$.dirty & 1 && (E == null || E.update(r))
    }),
    [r, s, a, o, m, b, E, h, p, i, u, l]
  )
}
class Qe extends Je {
  constructor(e) {
    super(), je(this, e, Xn, Qn, oi, { fallback: 7, path: 8 })
  }
}
const $r = (n) => {
    var o
    const e = (o = n.target) == null ? void 0 : o.closest('a[href]'),
      t = e == null ? void 0 : e.href
    if (e === null || t === null) return !0
    const r = ['', 'true'].includes(e.getAttribute('data-handle-ignore') ?? 'false'),
      i = (e.getAttribute('target') ?? '_self') !== '_self',
      s = n.metaKey || n.ctrlKey || n.altKey || n.shiftKey,
      a = new URL(t).origin !== document.location.origin
    if (r || i || s || a) return !0
    t === document.location.href ? Fr.replace(t) : Fr.push(t), n.preventDefault()
  },
  Zn = (n) => (
    n.addEventListener('click', $r),
    {
      destroy: () => {
        n.removeEventListener('click', $r)
      },
    }
  )
function Yn(n) {
  let e, t, r, i
  const s = n[5].default,
    a = li(s, n, n[4], null)
  let o = [{ href: n[0] }, n[1]],
    l = {}
  for (let u = 0; u < o.length; u += 1) l = Xt(l, o[u])
  return {
    c() {
      ;(e = $('a')), a && a.c(), Sr(e, l)
    },
    m(u, f) {
      W(u, e, f),
        a && a.m(e, null),
        (t = !0),
        r || ((i = [Mt(Zn.call(null, e)), Ie(e, 'click', n[6])]), (r = !0))
    },
    p(u, [f]) {
      a && a.p && (!t || f & 16) && ui(a, s, u, u[4], t ? di(s, u[4], f, null) : fi(u[4]), null),
        Sr(e, (l = Jn(o, [(!t || f & 1) && { href: u[0] }, f & 2 && u[1]])))
    },
    i(u) {
      t || (z(a, u), (t = !0))
    },
    o(u) {
      Z(a, u), (t = !1)
    },
    d(u) {
      u && V(e), a && a.d(u), (r = !1), Ke(i)
    },
  }
}
const es = (n, e, t) => (n === 'hash' ? '#' : '') + (e ?? '') + t
function ts(n, e, t) {
  let r
  const i = ['href']
  let s = Ar(e, i),
    a
  xe(n, qt, (d) => t(3, (a = d)))
  let { $$slots: o = {}, $$scope: l } = e,
    { href: u } = e
  function f(d) {
    Bn.call(this, n, d)
  }
  return (
    (n.$$set = (d) => {
      ;(e = Xt(Xt({}, e), qn(d))),
        t(1, (s = Ar(e, i))),
        'href' in d && t(2, (u = d.href)),
        '$$scope' in d && t(4, (l = d.$$scope))
    }),
    (n.$$.update = () => {
      n.$$.dirty & 12 && t(0, (r = es(a.mode, a.basePath, u)))
    }),
    [r, s, u, a, l, o, f]
  )
}
class ut extends Je {
  constructor(e) {
    super(), je(this, e, ts, Yn, oi, { href: 2 })
  }
}
class $e {
  constructor(...e) {
    c(this, 'fields')
    c(this, 'options', {})
    c(this, 'target')
    c(this, 'readonly', !0)
    c(this, 'allowNull', !1)
    c(this, 'dbReadOnly', !1)
    c(this, 'isServerExpression', !1)
    c(this, 'key', '')
    c(this, 'caption', '')
    c(this, 'inputType', '')
    c(this, 'dbName', '')
    c(this, 'valueType')
    this.fields = e
  }
  apiUpdateAllowed(e) {
    throw new Error('Method not implemented.')
  }
  displayValue(e) {
    throw new Error('Method not implemented.')
  }
  includedInApi(e) {
    throw new Error('Method not implemented.')
  }
  toInput(e, t) {
    throw new Error('Method not implemented.')
  }
  fromInput(e, t) {
    throw new Error('Method not implemented.')
  }
  getDbName() {
    return Promise.resolve('')
  }
  getId(e) {
    let t = (i) => e[i.key]
    typeof e == 'function' && (t = e)
    let r = ''
    return (
      this.fields.forEach((i) => {
        r.length > 0 && (r += ','), (r += i.valueConverter.toJson(t(i)))
      }),
      r
    )
  }
  get valueConverter() {
    throw new Error('cant get value converter of compound id')
  }
  isEqualTo(e) {
    let t = {},
      i = e.toString().split(',')
    return (
      this.fields.forEach((s, a) => {
        t[s.key] = s.valueConverter.fromJson(i[a])
      }),
      t
    )
  }
}
function X(n, e = !0) {
  var r
  let t = n[Le]
  if (!t && e)
    throw new Error(
      'item ' +
        (((r = n.constructor) == null ? void 0 : r.name) || n) +
        ' was not initialized using a context',
    )
  return t
}
const Le = Symbol.for('entityMember'),
  rs = Symbol.for('entityInfo'),
  is = Symbol.for('entityInfo_key')
function _e(n, e = !0) {
  if (n === void 0) {
    if (e) throw new Error('Undefined is not an entity :)')
    return
  }
  let t = n[rs]
  if (!t && e)
    throw new Error(
      n.prototype.constructor.name +
        " is not a known entity, did you forget to set @Entity() or did you forget to add the '@' before the call to Entity?",
    )
  return t
}
function ns(n) {
  return n[is]
}
const ss = Symbol.for('relationInfo')
function as(n) {
  return n == null ? void 0 : n[ss]
}
const Zt = Symbol.for('fieldRelationInfo')
function ee(n) {
  return n[Zt]
}
function os(n, e, t) {
  for (const r of n.fields.toArray()) {
    const i = as(r.options)
    if (i && !r[Zt]) {
      const s = i.toType(),
        a = e.repo(s, t),
        o = r.options
      r[Zt] = {
        type: i.type,
        toEntity: s,
        options: o,
        toRepo: a,
        getFields: () => {
          let l = o.field,
            u = { fields: o.fields, compoundIdField: void 0 }
          function f(p) {
            return Error(`Error for relation: "${r.key}" to "${a.metadata.key}": ` + p)
          }
          let d = () => l || u.fields
          if (i.type === 'toMany' && !d()) {
            for (const p of a.fields.toArray())
              if (!d()) {
                const m = ee(p),
                  b = p.options
                if (m && m.toEntity === n.metadata.entityType) {
                  if (m.type === 'reference') l = p.key
                  else if (m.type === 'toOne') {
                    if (b.field) l = b.field
                    else if (b.fields) {
                      let k = {}
                      for (const E in b.fields)
                        if (Object.prototype.hasOwnProperty.call(b.fields, E)) {
                          const I = b.fields[E]
                          k[I] = E
                        }
                      u.fields = k
                    }
                  }
                }
              }
            if (!d()) throw f('No matching field found on target. Please specify field/fields')
          }
          function h(p, m) {
            const b = m.fields.find(p)
            if (!b) throw f(`Field "${p}" was not found in "${m.key}".`)
            return b
          }
          i.type === 'reference' && (l = r.key),
            l &&
              (i.type === 'toOne' || i.type === 'reference'
                ? a.metadata.idMetadata.field instanceof $e
                  ? (u.compoundIdField = l)
                  : (u.fields = { [a.metadata.idMetadata.field.key]: l })
                : n.metadata.idMetadata.field instanceof $e
                  ? (u.compoundIdField = l)
                  : (u.fields = { [l]: n.metadata.idMetadata.field.key }))
          for (const p in u.fields)
            Object.prototype.hasOwnProperty.call(u.fields, p) &&
              (h(p, a.metadata), h(u.fields[p], n.metadata))
          return u
        },
      }
    }
  }
}
class S {
  constructor(e) {
    c(this, 'apply')
    this.apply = e
  }
  static throwErrorIfFilterIsEmpty(e, t) {
    if (S.isFilterEmpty(e))
      throw {
        message: `${t}: requires a filter to protect against accidental delete/update of all rows`,
        httpStatusCode: 400,
      }
  }
  static isFilterEmpty(e) {
    if (e.$and) {
      for (const t of e.$and) if (!S.isFilterEmpty(t)) return !1
    }
    if (e.$or) {
      for (const t of e.$or) if (S.isFilterEmpty(t)) return !0
      return !1
    }
    return Object.keys(e).filter((t) => !['$or', '$and'].includes(t)).length == 0
  }
  static async getPreciseValues(e, t) {
    const r = new St()
    return await S.fromEntityFilter(e, t).__applyToConsumer(r), r.preciseValues
  }
  async getPreciseValues() {
    const e = new St()
    return await this.__applyToConsumer(e), e.preciseValues
  }
  static createCustom(e, t = '') {
    let r = { key: t, rawFilterTranslator: e }
    return Object.assign(
      (i) => {
        if ((i == null && (i = {}), !r.key))
          throw 'Usage of custom filter before a key was assigned to it'
        return { [qe + r.key]: i }
      },
      { rawFilterInfo: r },
    )
  }
  static entityFilterToJson(e, t) {
    return S.fromEntityFilter(e, t).toJson()
  }
  static entityFilterFromJson(e, t) {
    return bt(e, { get: (r) => t[r] })
  }
  static fromEntityFilter(e, t) {
    let r = []
    for (const i in t)
      if (Object.prototype.hasOwnProperty.call(t, i)) {
        let s = t[i]
        if (i == '$or') r.push(new fs(...s.map((a) => S.fromEntityFilter(e, a))))
        else if (i == '$not') r.push(new ds(S.fromEntityFilter(e, s)))
        else if (i == '$and') r.push(new qr(...s.map((a) => S.fromEntityFilter(e, a))))
        else if (i.startsWith(qe))
          r.push(
            new S((a) => {
              a.custom(i.substring(qe.length), s)
            }),
          )
        else if (i == ci) r.push(new S((a) => a.databaseCustom(s)))
        else {
          const a = e.fields[i],
            o = ee(a),
            l = a.options
          let u =
              (o == null ? void 0 : o.type) === 'toOne'
                ? l.fields
                  ? new us(a, e.fields, l)
                  : new ls(e.fields[l.field])
                : new Ct(a),
            f = !1
          if (s !== void 0 && s != null) {
            s.$id !== void 0 && (s = s.$id)
            for (const d in s)
              if (Object.prototype.hasOwnProperty.call(s, d)) {
                const h = s[d]
                switch (d) {
                  case '$gte':
                  case '>=':
                    r.push(u.isGreaterOrEqualTo(h)), (f = !0)
                    break
                  case '$gt':
                  case '>':
                    r.push(u.isGreaterThan(h)), (f = !0)
                    break
                  case '$lte':
                  case '<=':
                    r.push(u.isLessOrEqualTo(h)), (f = !0)
                    break
                  case '$lt':
                  case '<':
                    r.push(u.isLessThan(h)), (f = !0)
                    break
                  case '$ne':
                  case '!=':
                  case '$nin':
                    ;(f = !0),
                      Array.isArray(h) ? r.push(u.isNotIn(h)) : r.push(u.isDifferentFrom(h))
                    break
                  case '$in':
                    ;(f = !0), r.push(u.isIn(h))
                    break
                  case '$contains':
                    ;(f = !0), r.push(u.contains(h))
                    break
                  case '$startsWith':
                    ;(f = !0), r.push(u.startsWith(h))
                    break
                  case '$endsWith':
                    ;(f = !0), r.push(u.endsWith(h))
                    break
                  case '$notContains':
                    ;(f = !0), r.push(u.notContains(h))
                    break
                }
              }
            Array.isArray(s) && ((f = !0), r.push(u.isIn(s)))
          }
          !f && s !== void 0 && r.push(u.isEqualTo(s))
        }
      }
    return new qr(...r)
  }
  __applyToConsumer(e) {
    this.apply(e)
  }
  static async resolve(e) {
    return typeof e == 'function' ? await e() : e
  }
  toJson() {
    let e = new Et()
    return this.__applyToConsumer(e), e.result
  }
  static async translateCustomWhere(e, t, r) {
    let i = new Tt(async (s, a) => {
      let o = []
      for (const l in t.entityType) {
        const u = t.entityType[l]
        u &&
          u.rawFilterInfo &&
          u.rawFilterInfo.rawFilterTranslator &&
          u.rawFilterInfo.key == s &&
          o.push(await S.fromEntityFilter(t, await u.rawFilterInfo.rawFilterTranslator(a, r)))
      }
      return o
    })
    return e.__applyToConsumer(i), await i.resolve(), (e = new S((s) => i.applyTo(s))), e
  }
}
class Ct {
  constructor(e) {
    c(this, 'metadata')
    this.metadata = e
  }
  processVal(e) {
    if (_e(this.metadata.valueType, !1)) {
      if (e == null) {
        if (e === null && !this.metadata.allowNull) {
          const r = ee(this.metadata)
          if ((r == null ? void 0 : r.type) === 'reference')
            return r.toRepo.metadata.idMetadata.field.options.valueType === Number ? 0 : ''
        }
        return null
      }
      return typeof e == 'string' || typeof e == 'number' ? e : X(e).getId()
    }
    return e
  }
  contains(e) {
    return new S((t) => t.containsCaseInsensitive(this.metadata, e))
  }
  notContains(e) {
    return new S((t) => t.notContainsCaseInsensitive(this.metadata, e))
  }
  startsWith(e) {
    return new S((t) => t.startsWithCaseInsensitive(this.metadata, e))
  }
  endsWith(e) {
    return new S((t) => t.endsWithCaseInsensitive(this.metadata, e))
  }
  isLessThan(e) {
    return (e = this.processVal(e)), new S((t) => t.isLessThan(this.metadata, e))
  }
  isGreaterOrEqualTo(e) {
    return (e = this.processVal(e)), new S((t) => t.isGreaterOrEqualTo(this.metadata, e))
  }
  isNotIn(e) {
    return new S((t) => {
      for (const r of e) t.isDifferentFrom(this.metadata, this.processVal(r))
    })
  }
  isDifferentFrom(e) {
    return (
      (e = this.processVal(e)),
      e == null && this.metadata.allowNull
        ? new S((t) => t.isNotNull(this.metadata))
        : new S((t) => t.isDifferentFrom(this.metadata, e))
    )
  }
  isLessOrEqualTo(e) {
    return (e = this.processVal(e)), new S((t) => t.isLessOrEqualTo(this.metadata, e))
  }
  isGreaterThan(e) {
    return (e = this.processVal(e)), new S((t) => t.isGreaterThan(this.metadata, e))
  }
  isEqualTo(e) {
    return (
      (e = this.processVal(e)),
      e == null && this.metadata.allowNull
        ? new S((t) => t.isNull(this.metadata))
        : new S((t) => t.isEqualTo(this.metadata, e))
    )
  }
  isIn(e) {
    return (
      (e = e.map((t) => this.processVal(t))),
      (e == null ? void 0 : e.length) == 1 && e[0] != null && e[0] !== null
        ? new S((t) => t.isEqualTo(this.metadata, e[0]))
        : new S((t) => t.isIn(this.metadata, e))
    )
  }
}
class ls extends Ct {
  processVal(e) {
    return e ? (typeof e == 'string' || typeof e == 'number' ? e : X(e).getId()) : null
  }
}
class us {
  constructor(e, t, r) {
    c(this, 'metadata')
    c(this, 'fields')
    c(this, 'relationOptions')
    ;(this.metadata = e), (this.fields = t), (this.relationOptions = r)
  }
  processVal(e) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  contains(e) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  notContains(e) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  endsWith(e) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  startsWith(e) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isLessThan(e) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isGreaterOrEqualTo(e) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isNotIn(e) {
    return new S((t) => {
      e.forEach((r) => this.isDifferentFrom(r).__applyToConsumer(t))
    })
  }
  isDifferentFrom(e) {
    return new S((t) => {
      const r = []
      for (const i in this.relationOptions.fields)
        if (Object.prototype.hasOwnProperty.call(this.relationOptions.fields, i)) {
          const s = this.relationOptions.fields[i]
          r.push(
            new S((a) => new Ct(this.fields.find(s)).isDifferentFrom(e[i]).__applyToConsumer(a)),
          )
        }
      t.or(r)
    })
  }
  isLessOrEqualTo(e) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isGreaterThan(e) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isEqualTo(e) {
    return new S((t) => {
      for (const r in this.relationOptions.fields)
        if (Object.prototype.hasOwnProperty.call(this.relationOptions.fields, r)) {
          const i = this.relationOptions.fields[r]
          new Ct(this.fields.find(i)).isEqualTo(e[r]).__applyToConsumer(t)
        }
    })
  }
  isIn(e) {
    return new S((t) => {
      t.or(e.map((r) => this.isEqualTo(r)))
    })
  }
}
class qr extends S {
  constructor(...t) {
    super((r) => {
      for (const i of this.filters) i && i.__applyToConsumer(r)
    })
    c(this, 'filters')
    this.filters = t
  }
  add(t) {
    this.filters.push(t)
  }
}
class fs extends S {
  constructor(...t) {
    super((r) => {
      let i = this.filters.filter((s) => s !== void 0)
      i.length > 1 ? r.or(i) : i.length == 1 && i[0].__applyToConsumer(r)
    })
    c(this, 'filters')
    this.filters = t
  }
}
class ds extends S {
  constructor(t) {
    super((r) => {
      r.not(t)
    })
    c(this, 'filter')
    this.filter = t
  }
}
const qe = '$custom$',
  ci = '$db$',
  Yt = '$an array'
class Et {
  constructor() {
    c(this, 'result', {})
    c(this, 'hasUndefined', !1)
  }
  databaseCustom(e) {
    throw new Error('database custom is not allowed with api calls.')
  }
  custom(e, t) {
    Array.isArray(t) && (t = { [Yt]: t }), this.add(qe + e, t)
  }
  add(e, t) {
    t === void 0 && (this.hasUndefined = !0)
    let r = this.result
    if (!r[e]) {
      r[e] = t
      return
    }
    let i = r[e]
    i instanceof Array ? i.push(t) : (i = [i, t]), (r[e] = i)
  }
  or(e) {
    this.add(
      'OR',
      e.map((t) => {
        let r = new Et()
        return t.__applyToConsumer(r), r.result
      }),
    )
  }
  not(e) {
    let t = new Et()
    e.__applyToConsumer(t), this.add('NOT', t.result)
  }
  isNull(e) {
    this.add(e.key + '.null', !0)
  }
  isNotNull(e) {
    this.add(e.key + '.null', !1)
  }
  isIn(e, t) {
    this.add(
      e.key + '.in',
      t.map((r) => e.valueConverter.toJson(r)),
    )
  }
  isEqualTo(e, t) {
    this.add(e.key, e.valueConverter.toJson(t))
  }
  isDifferentFrom(e, t) {
    this.add(e.key + '.ne', e.valueConverter.toJson(t))
  }
  isGreaterOrEqualTo(e, t) {
    this.add(e.key + '.gte', e.valueConverter.toJson(t))
  }
  isGreaterThan(e, t) {
    this.add(e.key + '.gt', e.valueConverter.toJson(t))
  }
  isLessOrEqualTo(e, t) {
    this.add(e.key + '.lte', e.valueConverter.toJson(t))
  }
  isLessThan(e, t) {
    this.add(e.key + '.lt', e.valueConverter.toJson(t))
  }
  containsCaseInsensitive(e, t) {
    this.add(e.key + '.contains', t)
  }
  notContainsCaseInsensitive(e, t) {
    this.add(e.key + '.notContains', t)
  }
  startsWithCaseInsensitive(e, t) {
    this.add(e.key + '.startsWith', t)
  }
  endsWithCaseInsensitive(e, t) {
    this.add(e.key + '.endsWith', t)
  }
}
function bt(n, e) {
  let t = {}
  function r(o) {
    t.$and || (t.$and = []), t.$and.push(o)
  }
  function i(o, l) {
    t[o] === void 0 ? (t[o] = l) : r({ [o]: l })
  }
  ;[...n.fields].forEach((o) => {
    function l(f, d, h = !1, p = !1) {
      let m = e.get(o.key + f)
      if (m !== void 0) {
        let b = (k) => {
          let E = k
          if (h) {
            let B
            typeof k == 'string' ? (B = JSON.parse(k)) : (B = k),
              (E = B.map((D) => (p ? D : o.valueConverter.fromJson(D))))
          } else E = p ? E : o.valueConverter.fromJson(E)
          let I = d(E)
          I !== void 0 && i(o.key, I)
        }
        if (!h && m instanceof Array)
          m.forEach((k) => {
            b(k)
          })
        else {
          h && typeof m == 'string' && (m = JSON.parse(m))
          const k = a(m)
          for (const E of k) b(E)
        }
      }
    }
    l('', (f) => f),
      l('.gt', (f) => ({ $gt: f })),
      l('.gte', (f) => ({ $gte: f })),
      l('.lt', (f) => ({ $lt: f })),
      l('.lte', (f) => ({ $lte: f })),
      l('.ne', (f) => ({ $ne: f })),
      l('.in', (f) => f, !0)
    var u = e.get(o.key + '.null')
    if (u)
      switch (((u = u.toString().trim().toLowerCase()), u)) {
        case 'y':
        case 'true':
        case 'yes':
          i(o.key, null)
          break
        default:
          i(o.key, { $ne: null })
          break
      }
    l('.contains', (f) => ({ $contains: f }), !1, !0),
      l('.notContains', (f) => ({ $notContains: f }), !1, !0),
      l('.startsWith', (f) => ({ $startsWith: f }), !1, !0),
      l('.endsWith', (f) => ({ $endsWith: f }), !1, !0)
  })
  let s = e.get('OR')
  if (s) {
    const l = a(s).map((u) => ({ $or: u.map((f) => bt(n, { get: (d) => f[d] })) }))
    l.length == 1 ? (t.$or ? t.$or.push(l[0].$or) : (t.$or = l[0].$or)) : r({ $and: l })
  }
  if (((s = e.get('NOT')), s)) {
    let o = a(s)
    const l = []
    for (const u of o)
      if (Array.isArray(u)) for (const f of u) l.push({ $not: bt(n, { get: (d) => f[d] }) })
      else l.push({ $not: bt(n, { get: (f) => u[f] }) })
    l.length == 1 && !t.$not ? (t = l[0]) : r({ $and: l })
  }
  for (const o in n.entityType) {
    const l = n.entityType[o]
    if (l && l.rawFilterInfo && l.rawFilterInfo.rawFilterTranslator) {
      let u = e.get(qe + o)
      if (u !== void 0) {
        const f = (d) => {
          d[Yt] != null && (d = d[Yt]), i(qe + o, d)
        }
        Array.isArray(u) ? u.forEach((d) => f(d)) : f(u)
      }
    }
  }
  return t
  function a(o) {
    if (!Array.isArray(o)) return [o]
    const l = [],
      u = []
    for (const f of o) Array.isArray(f) ? u.push(f) : l.push(f)
    return u.push(l), u
  }
}
class Tt {
  constructor(e) {
    c(this, 'translateCustom')
    c(this, 'commands', [])
    c(this, 'promises', [])
    this.translateCustom = e
  }
  applyTo(e) {
    this.commands.forEach((t) => t(e))
  }
  or(e) {
    let t
    this.promises.push(
      Promise.all(
        e.map(async (r) => {
          let i = new Tt(this.translateCustom)
          return r.__applyToConsumer(i), await i.resolve(), new S((s) => i.applyTo(s))
        }),
      ).then((r) => {
        t = r
      }),
    ),
      this.commands.push((r) => r.or(t))
  }
  not(e) {
    let t
    this.promises.push(
      (async () => {
        let r = new Tt(this.translateCustom)
        e.__applyToConsumer(r), await r.resolve(), (t = new S((i) => r.applyTo(i)))
      })(),
    ),
      this.commands.push((r) => r.not(t))
  }
  isEqualTo(e, t) {
    this.commands.push((r) => r.isEqualTo(e, t))
  }
  isDifferentFrom(e, t) {
    this.commands.push((r) => r.isDifferentFrom(e, t))
  }
  isNull(e) {
    this.commands.push((t) => t.isNull(e))
  }
  isNotNull(e) {
    this.commands.push((t) => t.isNotNull(e))
  }
  isGreaterOrEqualTo(e, t) {
    this.commands.push((r) => r.isGreaterOrEqualTo(e, t))
  }
  isGreaterThan(e, t) {
    this.commands.push((r) => r.isGreaterThan(e, t))
  }
  isLessOrEqualTo(e, t) {
    this.commands.push((r) => r.isLessOrEqualTo(e, t))
  }
  isLessThan(e, t) {
    this.commands.push((r) => r.isLessThan(e, t))
  }
  containsCaseInsensitive(e, t) {
    this.commands.push((r) => r.containsCaseInsensitive(e, t))
  }
  notContainsCaseInsensitive(e, t) {
    this.commands.push((r) => r.notContainsCaseInsensitive(e, t))
  }
  startsWithCaseInsensitive(e, t) {
    this.commands.push((r) => r.startsWithCaseInsensitive(e, t))
  }
  endsWithCaseInsensitive(e, t) {
    this.commands.push((r) => r.endsWithCaseInsensitive(e, t))
  }
  isIn(e, t) {
    this.commands.push((r) => r.isIn(e, t))
  }
  custom(e, t) {
    this.promises.push(
      (async () => {
        let r = await this.translateCustom(e, t)
        r &&
          (Array.isArray(r)
            ? r.forEach((i) => i.__applyToConsumer(this))
            : r.__applyToConsumer(this))
      })(),
    )
  }
  databaseCustom(e) {
    this.commands.push((t) => t.databaseCustom(e))
  }
  async resolve() {
    for (; this.promises.length > 0; ) {
      let e = this.promises
      ;(this.promises = []), await Promise.all(e)
    }
  }
}
class St {
  constructor() {
    c(this, 'rawValues', {})
    c(
      this,
      'preciseValues',
      new Proxy(this.rawValues, {
        get: (e, t) => {
          if (t in e) {
            let r = e[t]
            if (r.bad) return
            if (r.values.length > 0) {
              const i = ee(r.field)
              if (i) {
                if (i.type === 'reference')
                  return r.values.map((s) => i.toRepo.metadata.idMetadata.getIdFilter(s))
                throw new Error('Only relations toOne without field are supported.')
              }
              return r.values
            }
          }
        },
      }),
    )
  }
  ok(e, ...t) {
    let r = this.rawValues[e.key]
    r
      ? r.values.push(...t.filter((i) => !r.values.includes(i)))
      : (this.rawValues[e.key] = { field: e, bad: !1, values: [...t] })
  }
  notOk(e) {
    let t = this.rawValues[e.key]
    t ? (t.bad = !0) : (this.rawValues[e.key] = { field: e, bad: !0, values: [] })
  }
  not(e) {}
  or(e) {
    const t = e.map((r) => {
      let i = new St()
      return r.__applyToConsumer(i), i
    })
    for (const r of t)
      for (const i in r.rawValues)
        if (Object.prototype.hasOwnProperty.call(r.rawValues, i)) {
          const s = r.rawValues[i]
          s && (s.bad ? this.notOk(s.field) : this.ok(s.field, ...s.values))
        }
    for (const r in this.rawValues)
      if (Object.prototype.hasOwnProperty.call(this.rawValues, r))
        for (const i of t) i.rawValues[r] || this.notOk(this.rawValues[r].field)
  }
  isEqualTo(e, t) {
    this.ok(e, t)
  }
  isDifferentFrom(e, t) {
    this.notOk(e)
  }
  isNull(e) {
    this.ok(e, null)
  }
  isNotNull(e) {
    this.notOk(e)
  }
  isGreaterOrEqualTo(e, t) {
    this.notOk(e)
  }
  isGreaterThan(e, t) {
    this.notOk(e)
  }
  isLessOrEqualTo(e, t) {
    this.notOk(e)
  }
  isLessThan(e, t) {
    this.notOk(e)
  }
  containsCaseInsensitive(e, t) {
    this.notOk(e)
  }
  notContainsCaseInsensitive(e, t) {
    this.notOk(e)
  }
  startsWithCaseInsensitive(e, t) {
    this.notOk(e)
  }
  endsWithCaseInsensitive(e, t) {
    this.notOk(e)
  }
  isIn(e, t) {
    this.ok(e, ...t)
  }
  custom(e, t) {}
  databaseCustom(e) {}
}
var cs = {}
const xt = Symbol.for('remult-static1')
let _t = {
  defaultRemultFactory: void 0,
  remultFactory: void 0,
  defaultRemult: void 0,
  asyncContext: void 0,
  columnsOfType: new Map(),
  allEntities: [],
  classHelpers: new Map(),
  actionInfo: {
    allActions: [],
    runningOnServer: !1,
    runActionWithoutBlockingUI: (n) => n(),
    startBusyWithProgress: () => ({ progress: (n) => {}, close: () => {} }),
  },
  captionTransformer: void 0,
  defaultDataProvider: () => {},
}
;(typeof process < 'u' && cs.IGNORE_GLOBAL_REMULT_IN_TESTS) || typeof globalThis[xt] > 'u'
  ? ((globalThis[xt] = _t), (_t.remultFactory = () => hi()))
  : (_t = globalThis[xt])
const O = _t
function hi() {
  return O.defaultRemult || (O.defaultRemult = O.defaultRemultFactory()), O.defaultRemult
}
function hs() {
  O.remultFactory = () => hi()
}
function Be(n) {
  const e = n
  if (typeof e[at] == 'function') return e[at]()
  throw Error('Error getting repository internal from ' + n)
}
const at = Symbol.for('getInternal')
class ps {
  constructor() {
    c(this, 'iAmRemultProxy', !0)
    c(this, 'repoCache', new Map())
    c(this, 'repo', (...e) => {
      let t = O,
        r = this.repoCache.get(e[0])
      r || this.repoCache.set(e[0], (r = new Map()))
      let i = r.get(e[1])
      return (
        i ||
        ((i = {
          get fields() {
            return O.remultFactory().repo(...e).metadata.fields
          },
          [at]() {
            return t
              .remultFactory()
              .repo(...e)
              [at]()
          },
          relations: (s) =>
            t
              .remultFactory()
              .repo(...e)
              .relations(s),
          validate: (s, ...a) =>
            t
              .remultFactory()
              .repo(...e)
              .validate(s, ...a),
          addEventListener: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .addEventListener(...s),
          count: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .count(...s),
          create: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .create(...s),
          delete: (s) =>
            t
              .remultFactory()
              .repo(...e)
              .delete(s),
          deleteMany: (s) =>
            t
              .remultFactory()
              .repo(...e)
              .deleteMany(s),
          updateMany: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .updateMany(...s),
          find: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .find(...s),
          findFirst: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .findFirst(...s),
          findOne: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .findOne(...s),
          findId: (s, a) =>
            t
              .remultFactory()
              .repo(...e)
              .findId(s, a),
          toJson: (s) =>
            t
              .remultFactory()
              .repo(...e)
              .toJson(s),
          fromJson: (s, a) =>
            t
              .remultFactory()
              .repo(...e)
              .fromJson(s, a),
          getEntityRef: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .getEntityRef(...s),
          insert: (s) =>
            t
              .remultFactory()
              .repo(...e)
              .insert(s),
          liveQuery: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .liveQuery(...s),
          get metadata() {
            return O.remultFactory().repo(...e).metadata
          },
          query: (...s) =>
            t
              .remultFactory()
              .repo(...e)
              .query(...s),
          save: (s) =>
            t
              .remultFactory()
              .repo(...e)
              .save(s),
          update: (s, a) =>
            t
              .remultFactory()
              .repo(...e)
              .update(s, a),
        }),
        r.set(e[1], i),
        i)
      )
    })
  }
  get liveQuerySubscriber() {
    return O.remultFactory().liveQuerySubscriber
  }
  set liveQuerySubscriber(e) {
    O.remultFactory().liveQuerySubscriber = e
  }
  get liveQueryStorage() {
    return O.remultFactory().liveQueryStorage
  }
  set liveQueryStorage(e) {
    O.remultFactory().liveQueryStorage = e
  }
  get liveQueryPublisher() {
    return O.remultFactory().liveQueryPublisher
  }
  set liveQueryPublisher(e) {
    O.remultFactory().liveQueryPublisher = e
  }
  call(e, t, ...r) {
    return O.remultFactory().call(e, t, ...r)
  }
  get context() {
    return O.remultFactory().context
  }
  get dataProvider() {
    return O.remultFactory().dataProvider
  }
  set dataProvider(e) {
    O.remultFactory().dataProvider = e
  }
  get repCache() {
    return O.remultFactory().repCache
  }
  authenticated() {
    return O.remultFactory().authenticated()
  }
  isAllowed(e) {
    return O.remultFactory().isAllowed(e)
  }
  isAllowedForInstance(e, t) {
    return O.remultFactory().isAllowedForInstance(e, t)
  }
  clearAllCache() {
    return O.remultFactory().clearAllCache()
  }
  get user() {
    return O.remultFactory().user
  }
  set user(e) {
    O.remultFactory().user = e
  }
  get apiClient() {
    return O.remultFactory().apiClient
  }
  set apiClient(e) {
    O.remultFactory().apiClient = e
  }
  get subscriptionServer() {
    return O.remultFactory().subscriptionServer
  }
  set subscriptionServer(e) {
    O.remultFactory().subscriptionServer = e
  }
}
const ke = new ps()
function ys(n) {
  return n
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (e) => e.toUpperCase())
    .replace('Email', 'eMail')
    .replace(' I D', ' ID')
}
class ms {
  constructor(e, t, r) {
    c(this, 'repository')
    c(this, 'isReferenceRelation')
    c(this, 'allowNull')
    c(this, 'storedItem')
    c(this, 'id')
    ;(this.repository = e), (this.isReferenceRelation = t), (this.allowNull = r)
  }
  toJson() {
    if (this.storedItem) return this.item === null ? null : this.repository.toJson(this.item)
  }
  setId(e) {
    this.repository.metadata.idMetadata.field.valueType == Number && (e = +e), (this.id = e)
  }
  waitLoadOf(e) {
    return e == null ? null : Be(this.repository)._getCachedByIdAsync(e, !1)
  }
  get(e) {
    if (e == null) return null
    const t = Be(this.repository)._getCachedById(e, this.isReferenceRelation)
    return this.isReferenceRelation && !this.storedItem
      ? !this.allowNull && (this.id === 0 || this.id === '')
        ? null
        : void 0
      : t
  }
  set(e) {
    if (
      e === null &&
      !this.allowNull &&
      this.isReferenceRelation &&
      (this.id == 0 || this.id == '')
    ) {
      this.storedItem = { item: null }
      return
    }
    if (((this.storedItem = void 0), e))
      if (typeof e == 'string' || typeof e == 'number') this.id = e
      else {
        let t = X(e, !1)
        t && !this.isReferenceRelation
          ? (Be(this.repository)._addToCache(e), (this.id = t.getId()))
          : ((this.storedItem = { item: e }),
            (this.id = e[this.repository.metadata.idMetadata.field.key]))
      }
    else e === null ? (this.id = null) : (this.id = void 0)
  }
  get item() {
    return this.storedItem ? this.storedItem.item : this.get(this.id)
  }
  async waitLoad() {
    return this.waitLoadOf(this.id)
  }
}
class Br {
  constructor(e) {
    c(this, 'url')
    this.url = e
  }
  add(e, t) {
    this.url.indexOf('?') >= 0 ? (this.url += '&') : (this.url += '?'),
      (this.url += encodeURIComponent(e) + '=' + encodeURIComponent(t))
  }
  addObject(e, t = '') {
    if (e != null)
      for (var r in e) {
        let i = e[r]
        this.add(r + t, i)
      }
  }
}
const pi = { error500RetryCount: 4 }
function ft(n) {
  if (!n) return new Jr()
  let e
  return e || (yi(n) && (e = new ws(n))), e || (typeof n == 'function' && (e = new Jr(n))), e
}
function yi(n) {
  let e = n
  return !!(e && e.get && e.put && e.post && e.delete)
}
class ws {
  constructor(e) {
    c(this, 'http')
    this.http = e
  }
  async post(e, t) {
    return await At(() => pt(this.http.post(e, t)))
  }
  delete(e) {
    return pt(this.http.delete(e))
  }
  put(e, t) {
    return pt(this.http.put(e, t))
  }
  async get(e) {
    return await At(() => pt(this.http.get(e)))
  }
}
async function At(n) {
  var t, r, i, s
  let e = 0
  for (;;)
    try {
      return await n()
    } catch (a) {
      if (
        (((t = a.message) != null && t.startsWith('Error occurred while trying to proxy')) ||
          ((r = a.message) != null && r.startsWith('Error occured while trying to proxy')) ||
          ((i = a.message) != null && i.includes('http proxy error')) ||
          ((s = a.message) != null && s.startsWith('Gateway Timeout')) ||
          a.status == 500) &&
        e++ < pi.error500RetryCount
      ) {
        await new Promise((o, l) => {
          setTimeout(() => {
            o({})
          }, 500)
        })
        continue
      }
      throw a
    }
}
function pt(n) {
  let e
  return (
    n.toPromise !== void 0 ? (e = n.toPromise()) : (e = n),
    e
      .then((t) =>
        t && (t.status == 200 || t.status == 201) && t.headers && t.request && t.data ? t.data : t,
      )
      .catch(async (t) => {
        throw await gs(t)
      })
  )
}
async function gs(n) {
  var s, a, o
  let e = await n
  var t
  e.error
    ? (t = e.error)
    : e.isAxiosError &&
      (typeof ((s = e.response) == null ? void 0 : s.data) == 'string'
        ? (t = e.response.data)
        : (t = (a = e == null ? void 0 : e.response) == null ? void 0 : a.data)),
    t || (t = e.message),
    e.status == 0 && e.error.isTrusted && (t = 'Network Error'),
    typeof t == 'string' && (t = { message: t }),
    e.modelState && (t.modelState = e.modelState)
  let r = e.status
  r === void 0 && (r = (o = e.response) == null ? void 0 : o.status),
    r != null && (t.httpStatusCode = r)
  var i = Object.assign(t, {})
  return i
}
class mi {
  constructor(e) {
    c(this, 'apiProvider')
    c(this, 'isProxy', !0)
    this.apiProvider = e
  }
  getEntityDataProvider(e) {
    return new vs(
      () => {
        var r
        let t = (r = this.apiProvider()) == null ? void 0 : r.url
        return t == null && (t = '/api'), t + '/' + e.key
      },
      () => ft(this.apiProvider().httpClient),
      e,
    )
  }
  async transaction(e) {
    throw new Error('Method not implemented.')
  }
}
function hr(n, e) {
  if (n.include) {
    let t = {}
    for (const r in n.include)
      if (Object.prototype.hasOwnProperty.call(n.include, r)) {
        let i = n.include[r]
        if (typeof i == 'object') {
          const s = ee(e.fields.find(r))
          s && (i = hr(i, s.toRepo.metadata))
        }
        t[r] = i
      }
    n = { ...n, include: t }
  }
  return (
    n.where && (n = { ...n, where: S.entityFilterToJson(e, n.where) }),
    n.load && (n = { ...n, load: n.load(e.fields).map((t) => t.key) }),
    n
  )
}
class vs {
  constructor(e, t, r) {
    c(this, 'url')
    c(this, 'http')
    c(this, 'entity')
    ;(this.url = e), (this.http = t), (this.entity = r)
  }
  translateFromJson(e) {
    let t = {}
    for (const r of this.entity.fields) t[r.key] = r.valueConverter.fromJson(e[r.key])
    return t
  }
  translateToJson(e) {
    let t = {}
    for (const r of this.entity.fields) t[r.key] = r.valueConverter.toJson(e[r.key])
    return t
  }
  async count(e) {
    const { run: t } = this.buildFindRequest({ where: e })
    return t('count').then((r) => +r.count)
  }
  async deleteMany(e) {
    const { run: t } = this.buildFindRequest({ where: e }, 'delete')
    return t('deleteMany').then((r) => +r.deleted)
  }
  async updateMany(e, t) {
    const { run: r } = this.buildFindRequest({ where: e }, 'put')
    return r('updateMany', this.toJsonOfIncludedKeys(t)).then((i) => +i.updated)
  }
  find(e) {
    let { run: t } = this.buildFindRequest(e)
    return t().then((r) => r.map((i) => this.translateFromJson(i)))
  }
  buildFindRequest(e, t) {
    t || (t = 'get')
    let r = new Br(this.url()),
      i
    if (e) {
      if (
        (e.where && ((i = e.where.toJson()), _s(i, r) && (i = void 0)),
        e.orderBy && e.orderBy.Segments)
      ) {
        let a = '',
          o = '',
          l = !1
        e.orderBy.Segments.forEach((u) => {
          a.length > 0 && ((a += ','), (o += ',')),
            (a += u.field.key),
            (o += u.isDescending ? 'desc' : 'asc'),
            u.isDescending && (l = !0)
        }),
          a && r.add('_sort', a),
          l && r.add('_order', o)
      }
      e.limit && r.add('_limit', e.limit), e.page && r.add('_page', e.page)
    }
    const s = (a, o) => {
      let l = new Br(r.url)
      return (
        !a && i && (a = 'get'),
        a && l.add('__action', a),
        i ? ((o = { set: o, where: i }), this.http().post(l.url, o)) : this.http()[t](l.url, o)
      )
    }
    return {
      createKey: () => JSON.stringify({ url: r, filterObject: i }),
      run: s,
      subscribe: async (a) => ({
        result: await s(ks + a),
        unsubscribe: async () =>
          O.actionInfo.runActionWithoutBlockingUI(() =>
            this.http().post(this.url() + '?__action=endLiveQuery', { id: a }),
          ),
      }),
    }
  }
  update(e, t) {
    return this.http()
      .put(
        this.url() + (e != '' ? '/' + encodeURIComponent(e) : '?__action=emptyId'),
        this.toJsonOfIncludedKeys(t),
      )
      .then((r) => this.translateFromJson(r))
  }
  toJsonOfIncludedKeys(e) {
    let t = {},
      r = Object.keys(e)
    for (const i of this.entity.fields)
      r.includes(i.key) && (t[i.key] = i.valueConverter.toJson(e[i.key]))
    return t
  }
  async delete(e) {
    if (e == '')
      await this.deleteMany(S.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(e)))
    else return this.http().delete(this.url() + '/' + encodeURIComponent(e))
  }
  insert(e) {
    return this.http()
      .post(this.url(), this.translateToJson(e))
      .then((t) => this.translateFromJson(t))
  }
  insertMany(e) {
    return this.http()
      .post(
        this.url(),
        e.map((t) => this.translateToJson(t)),
      )
      .then((t) => t.map((r) => this.translateFromJson(r)))
  }
}
class Jr {
  constructor(e) {
    c(this, 'fetch')
    this.fetch = e
  }
  async get(e) {
    return await At(async () => this.myFetch(e).then((t) => t))
  }
  put(e, t) {
    return this.myFetch(e, { method: 'put', body: JSON.stringify(t) })
  }
  delete(e) {
    return this.myFetch(e, { method: 'delete' })
  }
  async post(e, t) {
    return await At(() => this.myFetch(e, { method: 'post', body: JSON.stringify(t) }))
  }
  myFetch(e, t) {
    const r = {}
    if (
      (t != null && t.body && (r['Content-type'] = 'application/json'),
      typeof window < 'u' &&
        typeof window.document < 'u' &&
        typeof (window.document.cookie !== 'undefined'))
    )
      for (const i of window.document.cookie.split(';'))
        i.trim().startsWith('XSRF-TOKEN=') && (r['X-XSRF-TOKEN'] = i.split('=')[1])
    return (this.fetch || fetch)(e, {
      credentials: 'include',
      method: t == null ? void 0 : t.method,
      body: t == null ? void 0 : t.body,
      headers: r,
    })
      .then((i) => bs(i))
      .catch(async (i) => {
        throw await i
      })
  }
}
function bs(n) {
  if (n.status != 204) {
    if (n.status >= 200 && n.status < 300) return n.json()
    throw n
      .json()
      .then((e) => ({ ...e, message: e.message || n.statusText, url: n.url, status: n.status }))
      .catch(() => {
        throw { message: n.statusText, url: n.url, status: n.status }
      })
  }
}
function _s(n, e) {
  for (const t in n)
    if (Object.prototype.hasOwnProperty.call(n, t)) {
      const r = n[t]
      if (
        (Array.isArray(r) && ((r.length > 0 && typeof r[0] == 'object') || r.length > 10)) ||
        t === 'NOT'
      )
        return !1
    }
  for (const t in n)
    if (Object.prototype.hasOwnProperty.call(n, t)) {
      const r = n[t]
      Array.isArray(r)
        ? t.endsWith('.in')
          ? e.add(t, JSON.stringify(r))
          : r.forEach((i) => e.add(t, i))
        : t.startsWith(qe)
          ? e.add(t, JSON.stringify(r))
          : e.add(t, r)
    }
  return !0
}
const ks = 'liveQuery-'
var yt,
  Is = new Uint8Array(16)
function Os() {
  if (
    !yt &&
    ((yt =
      (typeof crypto < 'u' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
      (typeof msCrypto < 'u' &&
        typeof msCrypto.getRandomValues == 'function' &&
        msCrypto.getRandomValues.bind(msCrypto))),
    !yt)
  )
    throw new Error(
      'crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported',
    )
  return yt(Is)
}
const Cs =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
function Es(n) {
  return typeof n == 'string' && Cs.test(n)
}
var ae = []
for (var Qt = 0; Qt < 256; ++Qt) ae.push((Qt + 256).toString(16).substr(1))
function Ts(n) {
  var e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0,
    t = (
      ae[n[e + 0]] +
      ae[n[e + 1]] +
      ae[n[e + 2]] +
      ae[n[e + 3]] +
      '-' +
      ae[n[e + 4]] +
      ae[n[e + 5]] +
      '-' +
      ae[n[e + 6]] +
      ae[n[e + 7]] +
      '-' +
      ae[n[e + 8]] +
      ae[n[e + 9]] +
      '-' +
      ae[n[e + 10]] +
      ae[n[e + 11]] +
      ae[n[e + 12]] +
      ae[n[e + 13]] +
      ae[n[e + 14]] +
      ae[n[e + 15]]
    ).toLowerCase()
  if (!Es(t)) throw TypeError('Stringified UUID is invalid')
  return t
}
function er(n, e, t) {
  n = n || {}
  var r = n.random || (n.rng || Os)()
  return (r[6] = (r[6] & 15) | 64), (r[8] = (r[8] & 63) | 128), Ts(r)
}
class ve {
  constructor(...e) {
    c(this, 'Segments')
    this.Segments = e
  }
  toEntityOrderBy() {
    let e = {}
    for (const t of this.Segments)
      t.isDescending ? (e[t.field.key] = 'desc') : (e[t.field.key] = 'asc')
    return e
  }
  reverse() {
    let e = new ve()
    for (const t of this.Segments)
      e.Segments.push({ field: t.field, isDescending: !t.isDescending })
    return e
  }
  compare(e, t, r) {
    r || (r = (s) => s.key)
    let i = 0
    for (let s = 0; s < this.Segments.length; s++) {
      let a = this.Segments[s],
        o = jr(e[r(a.field)]),
        l = jr(t[r(a.field)])
      if ((o > l ? (i = 1) : o < l && (i = -1), i != 0)) return a.isDescending && (i *= -1), i
    }
    return i
  }
  static translateOrderByToSort(e, t) {
    let r = new ve()
    if (t) {
      for (const i in t)
        if (Object.prototype.hasOwnProperty.call(t, i)) {
          const s = t[i]
          let a = e.fields.find(i)
          const o = (l) => {
            switch (s) {
              case 'desc':
                r.Segments.push({ field: l, isDescending: !0 })
                break
              case 'asc':
                r.Segments.push({ field: l })
            }
          }
          if (a) {
            const l = ee(a)
            if ((l == null ? void 0 : l.type) === 'toOne') {
              const u = l.options
              if (typeof u.field == 'string') o(e.fields.find(u.field))
              else if (u.fields) {
                for (const f in u.fields)
                  if (Object.prototype.hasOwnProperty.call(u.fields, f)) {
                    const d = u.fields[f]
                    o(e.fields.find(d.toString()))
                  }
              }
            } else o(a)
          }
        }
    }
    return r
  }
  static createUniqueSort(e, t) {
    ;(!t || Object.keys(t).length === 0) &&
      e.options.defaultOrderBy &&
      (t = ve.translateOrderByToSort(e, e.options.defaultOrderBy)),
      t || (t = new ve())
    for (const r of e.idMetadata.fields)
      t.Segments.find((i) => i.field == r) || t.Segments.push({ field: r })
    return t
  }
  static createUniqueEntityOrderBy(e, t) {
    ;(!t || Object.keys(t).length === 0) && (t = e.options.defaultOrderBy),
      t ? (t = { ...t }) : (t = {})
    for (const r of e.idMetadata.fields) t[r.key] || (t[r.key] = 'asc')
    return t
  }
}
function jr(n) {
  return n == null || n == null ? n : n.id !== void 0 ? n.id : n
}
const Gt = 'stream'
class Ss {
  constructor(e, t, r) {
    c(this, 'repo')
    c(this, 'query')
    c(this, 'queryChannel')
    c(this, 'subscribeCode')
    c(this, 'unsubscribe', () => {})
    c(this, 'defaultQueryState', [])
    c(this, 'listeners', [])
    c(this, 'id', er())
    ;(this.repo = e),
      (this.query = t),
      (this.queryChannel = `users:${r}:queries:${this.id}`),
      (this.id = this.queryChannel)
  }
  sendDefaultState(e) {
    e(
      this.createReducerType(
        () => [...this.defaultQueryState],
        this.allItemsMessage(this.defaultQueryState),
      ),
    )
  }
  async setAllItems(e) {
    const t = await Be(this.repo)._fromJsonArray(e, this.query.options)
    this.forListeners((r) => {
      r(() => t)
    }, this.allItemsMessage(t))
  }
  allItemsMessage(e) {
    return [{ type: 'all', data: e }]
  }
  forListeners(e, t) {
    e((r) => {
      if (
        ((this.defaultQueryState = r(this.defaultQueryState)),
        t.find((i) => i.type === 'add' || i.type === 'replace') && this.query.options.orderBy)
      ) {
        const i = ve.translateOrderByToSort(this.repo.metadata, this.query.options.orderBy)
        this.defaultQueryState.sort((s, a) => i.compare(s, a))
      }
    })
    for (const r of this.listeners)
      e((i) => {
        r.next(this.createReducerType(i, t))
      })
  }
  createReducerType(e, t) {
    return { applyChanges: e, changes: t, items: this.defaultQueryState }
  }
  async handle(e) {
    {
      let t = e.filter(({ type: i }) => i == 'add' || i == 'replace'),
        r = await Be(this.repo)._fromJsonArray(
          t.map((i) => i.data.item),
          this.query.options,
        )
      for (let i = 0; i < t.length; i++) {
        const s = t[i]
        s.data.item = r[i]
      }
    }
    this.forListeners((t) => {
      t((r) => {
        r || (r = [])
        for (const i of e)
          switch (i.type) {
            case 'all':
              this.setAllItems(i.data)
              break
            case 'replace': {
              r = r.map((s) =>
                this.repo.metadata.idMetadata.getId(s) === i.data.oldId ? i.data.item : s,
              )
              break
            }
            case 'add':
              ;(r = r.filter(
                (s) =>
                  this.repo.metadata.idMetadata.getId(s) !==
                  this.repo.metadata.idMetadata.getId(i.data.item),
              )),
                r.push(i.data.item)
              break
            case 'remove':
              r = r.filter((s) => this.repo.metadata.idMetadata.getId(s) !== i.data.id)
              break
          }
        return r
      })
    }, e)
  }
}
const As = '_liveQueryKeepAlive'
class Fs {
  constructor(e, t) {
    c(this, 'apiProvider')
    c(this, 'getUserId')
    c(this, 'queries', new Map())
    c(this, 'channels', new Map())
    c(this, 'client')
    c(this, 'interval')
    ;(this.apiProvider = e), (this.getUserId = t)
  }
  wrapMessageHandling(e) {
    var t = this.apiProvider().wrapMessageHandling
    t ? t(e) : e()
  }
  hasQueriesForTesting() {
    return this.queries.size > 0
  }
  runPromise(e) {
    return e
  }
  close() {
    this.queries.clear(), this.channels.clear(), this.closeIfNoListeners()
  }
  async subscribeChannel(e, t) {
    let r = () => {}
    const i = await this.openIfNoOpened()
    try {
      let s = this.channels.get(e)
      if (!s) {
        this.channels.set(e, (s = new Ps()))
        try {
          s.unsubscribe = await i.subscribe(
            e,
            (a) => this.wrapMessageHandling(() => s.handle(a)),
            (a) => {
              t.error(a)
            },
          )
        } catch (a) {
          throw (t.error(a), a)
        }
      }
      s.listeners.push(t),
        (r = () => {
          s.listeners.splice(s.listeners.indexOf(t), 1),
            s.listeners.length == 0 && (this.channels.delete(e), s.unsubscribe()),
            this.closeIfNoListeners()
        })
    } catch (s) {
      throw (t.error(s), s)
    }
    return () => {
      r(), (r = () => {})
    }
  }
  closeIfNoListeners() {
    this.client &&
      this.queries.size === 0 &&
      this.channels.size === 0 &&
      (this.runPromise(this.client.then((e) => e.close())),
      (this.client = void 0),
      clearInterval(this.interval),
      (this.interval = void 0))
  }
  subscribe(e, t, r) {
    let i = !0,
      s = () => {
        i = !1
      }
    return (
      this.runPromise(
        Be(e)
          ._buildEntityDataProviderFindOptions(t)
          .then((a) => {
            if (!i) return
            const { createKey: o, subscribe: l } = new mi(this.apiProvider)
                .getEntityDataProvider(e.metadata)
                .buildFindRequest(a),
              u = o()
            let f = this.queries.get(u)
            f
              ? f.sendDefaultState(r.next)
              : (this.queries.set(
                  u,
                  (f = new Ss(e, { entityKey: e.metadata.key, options: t }, this.getUserId())),
                ),
                (f.subscribeCode = () => {
                  f.unsubscribe && (f.unsubscribe(), (f.unsubscribe = () => {})),
                    this.runPromise(
                      this.subscribeChannel(f.queryChannel, {
                        next: (d) => this.runPromise(f.handle(d)),
                        complete: () => {},
                        error: (d) => {
                          f.listeners.forEach((h) => h.error(d))
                        },
                      }).then((d) => {
                        if (f.listeners.length == 0) {
                          d()
                          return
                        }
                        this.runPromise(
                          l(f.queryChannel)
                            .then((h) => {
                              if (f.listeners.length === 0) {
                                h.unsubscribe(), d()
                                return
                              }
                              this.runPromise(f.setAllItems(h.result)),
                                (f.unsubscribe = () => {
                                  ;(f.unsubscribe = () => {}), d(), this.runPromise(h.unsubscribe())
                                })
                            })
                            .catch((h) => {
                              f.listeners.forEach((p) => p.error(h)), d(), this.queries.delete(u)
                            }),
                        )
                      }),
                    ).catch((d) => {
                      f.listeners.forEach((h) => h.error(d))
                    })
                }),
                f.subscribeCode()),
              f.listeners.push(r),
              (s = () => {
                f.listeners.splice(f.listeners.indexOf(r), 1),
                  r.complete(),
                  f.listeners.length == 0 && (this.queries.delete(u), f.unsubscribe()),
                  this.closeIfNoListeners()
              })
          })
          .catch((a) => {
            r.error(a)
          }),
      ),
      () => {
        s()
      }
    )
  }
  openIfNoOpened() {
    return this.client
      ? this.client
      : ((this.interval = setInterval(async () => {
          const e = []
          for (const t of this.queries.values()) e.push(t.queryChannel)
          if (e.length > 0) {
            let t = this.apiProvider()
            const r = await this.runPromise(
              await O.actionInfo.runActionWithoutBlockingUI(() =>
                ft(t.httpClient).post(t.url + '/' + As, e),
              ),
            )
            for (const i of r)
              for (const s of this.queries.values()) s.queryChannel === i && s.subscribeCode()
          }
        }, 3e4)),
        this.runPromise(
          (this.client = this.apiProvider().subscriptionClient.openConnection(() => {
            for (const e of this.queries.values()) e.subscribeCode()
          })),
        ))
  }
}
class Ps {
  constructor() {
    c(this, 'unsubscribe', () => {})
    c(this, 'listeners', [])
  }
  async handle(e) {
    for (const t of this.listeners) t.next(e)
  }
}
class pr {
  openConnection(e) {
    let t
    const r = new Map(),
      i = ft(ke.apiClient.httpClient)
    let s = !1,
      a
    const o = {
        close() {
          a.close()
        },
        async subscribe(f, d) {
          let h = r.get(f)
          return (
            h || (r.set(f, (h = [])), await u(f)),
            h.push(d),
            () => {
              h.splice(h.indexOf(d, 1)),
                h.length == 0 &&
                  (O.actionInfo.runActionWithoutBlockingUI(() =>
                    i.post(ke.apiClient.url + '/' + Gt + '/unsubscribe', {
                      channel: f,
                      clientId: t,
                    }),
                  ),
                  r.delete(f))
            }
          )
        },
      },
      l = () =>
        new Promise((f) => {
          h()
          let d = 0
          function h() {
            a && a.close(),
              (a = pr.createEventSource(ke.apiClient.url + '/' + Gt)),
              (a.onmessage = (p) => {
                let m = JSON.parse(p.data)
                const b = r.get(m.channel)
                b && b.forEach((k) => k(m.data))
              }),
              (a.onerror = (p) => {
                console.error('Live Query Event Source Error', p),
                  a.close(),
                  d++ < pi.error500RetryCount &&
                    setTimeout(() => {
                      h()
                    }, 500)
              }),
              a.addEventListener('connectionId', async (p) => {
                if (((t = p.data), s)) {
                  for (const m of r.keys()) await u(m)
                  e()
                } else (s = !0), f(o)
              })
          }
        })
    return l()
    async function u(f) {
      ;(await O.actionInfo.runActionWithoutBlockingUI(() =>
        i.post(ke.apiClient.url + '/' + Gt + '/subscribe', { channel: f, clientId: t }),
      )) === Ds && (await l())
    }
  }
  static createEventSource(e) {
    return new EventSource(e, { withCredentials: !0 })
  }
}
const Ds = 'client connection not found',
  tr = Symbol.for('serverActionField')
class Rs {
  constructor(e) {
    c(this, 'remultObjectStorage')
    this.remultObjectStorage = e
  }
  static enable() {
    O.remultFactory = () => {
      const e = O.asyncContext.getStore()
      if (e) return e.remult
      throw new Error(
        'remult object was requested outside of a valid context, try running it within initApi or a remult request cycle',
      )
    }
  }
  static disable() {
    hs()
  }
  async run(e, t) {
    return this.remultObjectStorage ? this.remultObjectStorage.run({ remult: e }, () => t(e)) : t(e)
  }
  isInInitRequest() {
    var e, t
    return (t = (e = this.remultObjectStorage) == null ? void 0 : e.getStore()) == null
      ? void 0
      : t.inInitRequest
  }
  setInInitRequest(e) {
    var r
    const t = (r = this.remultObjectStorage) == null ? void 0 : r.getStore()
    t && (t.inInitRequest = e)
  }
  getStore() {
    if (!this.remultObjectStorage)
      throw new Error(
        "can't use static remult in this environment, `async_hooks` were not initialized",
      )
    return this.remultObjectStorage.getStore()
  }
}
O.asyncContext || (O.asyncContext = new Rs(void 0))
function rr() {
  return O.actionInfo.runningOnServer || !ke.dataProvider.isProxy
}
class Oe {
  constructor(e) {
    c(this, 'repo', (e, t) => {
      t === void 0 && (t = this.dataProvider)
      let r = this.repCache.get(t)
      r || this.repCache.set(t, (r = new Map()))
      let i = r.get(e)
      return i || (r.set(e, (i = new yr(e, this, t, js(e, this)))), os(i, this, t)), i
    })
    c(this, 'user')
    c(this, 'dataProvider', new mi(() => this.apiClient))
    c(this, 'repCache', new Map())
    c(this, 'liveQueryStorage')
    c(this, 'subscriptionServer')
    c(this, 'liveQueryPublisher', { itemChanged: async () => {} })
    c(
      this,
      'liveQuerySubscriber',
      new Fs(
        () => this.apiClient,
        () => {
          var e
          return (e = this.user) == null ? void 0 : e.id
        },
      ),
    )
    c(this, 'context', {})
    c(this, 'apiClient', { url: '/api', subscriptionClient: new pr() })
    if (e && e.getEntityDataProvider) {
      this.dataProvider = e
      return
    }
    if (yi(e)) this.apiClient.httpClient = e
    else if (typeof e == 'function') this.apiClient.httpClient = e
    else if (e) {
      const t = e
      t.httpClient && (this.apiClient.httpClient = t.httpClient),
        t.url && (this.apiClient.url = t.url),
        t.subscriptionClient && (this.apiClient.subscriptionClient = t.subscriptionClient),
        t.wrapMessageHandling && (this.apiClient.wrapMessageHandling = t.wrapMessageHandling)
    }
  }
  authenticated() {
    var e
    return ((e = this.user) == null ? void 0 : e.id) !== void 0
  }
  isAllowed(e) {
    var t, r
    if (e != null) {
      if (e instanceof Array) {
        for (const i of e) if (this.isAllowed(i) === !0) return !0
        return !1
      }
      return typeof e == 'function'
        ? e(this)
        : typeof e == 'boolean'
          ? e
          : !!(
              typeof e == 'string' &&
              (r = (t = this.user) == null ? void 0 : t.roles) != null &&
              r.includes(e.toString())
            )
    }
  }
  isAllowedForInstance(e, t) {
    if (Array.isArray(t)) {
      for (const r of t) if (this.isAllowedForInstance(e, r)) return !0
    } else return typeof t == 'function' ? t(e, this) : this.isAllowed(t)
  }
  call(e, t, ...r) {
    const i = e[tr]
    if (!i.doWork) throw Error('The method received is not a valid backend method')
    return i.doWork(r, t, this.apiClient.url, ft(this.apiClient.httpClient))
  }
  clearAllCache() {
    this.repCache.clear()
  }
}
c(Oe, 'onFind', (e, t) => {}), c(Oe, 'entityRefInit')
O.defaultRemultFactory = () => new Oe()
class Ms {
  constructor() {
    c(this, 'classes', new Map())
  }
}
const Ns = { defaultPageSize: 200 }
async function wi(n, e) {
  const t = new Ls(n.liveQueryPublisher)
  let r = !0
  const i = n.dataProvider
  try {
    await n.dataProvider.transaction(async (s) => {
      ;(n.dataProvider = s), (n.liveQueryPublisher = t), await e(s), (r = !0)
    }),
      r && (await t.flush())
  } finally {
    n.dataProvider = i
  }
}
class Ls {
  constructor(e) {
    c(this, 'orig')
    c(this, 'transactionItems', new Map())
    this.orig = e
  }
  async itemChanged(e, t) {
    let r = this.transactionItems.get(e)
    r || this.transactionItems.set(e, (r = []))
    for (const i of t)
      if (i.oldId !== void 0) {
        const s = r.find((a) => a.id === i.oldId)
        s !== void 0 ? (i.deleted && (s.deleted = !0), i.id != s.id && (s.id = i.id)) : r.push(i)
      } else r.push(i)
  }
  async flush() {
    for (const e of this.transactionItems.keys())
      await this.orig.itemChanged(e, this.transactionItems.get(e))
  }
}
function ir(n, e) {
  return e && Object.assign(n, e), n
}
class Ce {}
c(Ce, 'number', 'number'),
  c(Ce, 'date', 'date'),
  c(Ce, 'checkbox', 'checkbox'),
  c(Ce, 'password', 'password'),
  c(Ce, 'email', 'email'),
  c(Ce, 'tel', 'tel'),
  c(Ce, 'time', 'time')
const N = class N {}
c(N, 'Date', {
  toJson: (e) => {
    if (e === null) return null
    if (!e) return ''
    if ((typeof e == 'string' && (e = new Date(e)), e instanceof Date)) return e.toISOString()
    throw new Error('Expected date but got ' + e)
  },
  fromJson: (e) => {
    if (e === null) return null
    if (e != null && e != '' && !e.startsWith('0000-00-00')) return new Date(Date.parse(e))
  },
  toDb: (e) => e,
  fromDb: (e) => {
    if (
      (typeof e == 'number' && (e = new Date(e)),
      typeof e == 'string' && (e = new Date(e)),
      e && !(e instanceof Date))
    )
      throw 'expected date but got ' + e
    return e
  },
  fromInput: (e) => N.Date.fromJson(e),
  toInput: (e) => N.Date.toJson(e),
  displayValue: (e) => (e ? e.toLocaleString() : ''),
}),
  c(N, 'DateOnly', {
    fromInput: (e) => N.DateOnly.fromJson(e),
    toInput: (e) => N.DateOnly.toJson(e),
    toJson: (e) => {
      var t = e
      return (
        (typeof t == 'string' || typeof t == 'number') && (t = new Date(t)),
        !t || t == null
          ? null
          : t.getHours() == 0
            ? new Date(t.valueOf() - t.getTimezoneOffset() * 6e4).toISOString().substring(0, 10)
            : t.toISOString().substring(0, 10)
      )
    },
    fromJson: (e) => {
      if (!e || e == '' || e == '0000-00-00') return null
      let t = new Date(Date.parse(e))
      return t.setMinutes(t.getMinutes() + t.getTimezoneOffset()), t
    },
    inputType: Ce.date,
    toDb: (e) => (e ? N.DateOnly.fromJson(N.DateOnly.toJson(e)) : null),
    fromDb: (e) => N.Date.fromDb(e),
    fieldTypeInDb: 'date',
    displayValue: (e) => (e ? e.toLocaleDateString(void 0) : ''),
  }),
  c(N, 'DateOnlyString', {
    ...N.DateOnly,
    toDb: (e) => {
      let t = N.DateOnly.toJson(e)
      if (t) return t.replace(/-/g, '')
    },
    fromDb: (e) => {
      if (e === null) return null
      if (e) return new Date(e.substring(0, 4) + '-' + e.substring(4, 6) + '-' + e.substring(6, 8))
    },
  }),
  c(N, 'Boolean', {
    toDb: (e) => e,
    inputType: Ce.checkbox,
    fromDb: (e) => N.Boolean.fromJson(e),
    fromJson: (e) =>
      typeof e == 'boolean'
        ? e
        : e === 1
          ? !0
          : e != null
            ? e.toString().trim().toLowerCase() == 'true'
            : e,
    toJson: (e) => e,
    fromInput: (e) => N.Boolean.fromJson(e),
    toInput: (e) => N.Boolean.toJson(e),
  }),
  c(N, 'Number', {
    fromDb: (e) => {
      if (e === null) return null
      if (e !== void 0) return +e
    },
    toDb: (e) => e,
    fromJson: (e) => N.Number.fromDb(e),
    toJson: (e) => N.Number.toDb(e),
    fromInput: (e, t) => {
      let r = +e
      if (e != null) return r
    },
    toInput: (e, t) => (e == null ? void 0 : e.toString()) ?? '',
    inputType: Ce.number,
  }),
  c(N, 'String', { fromDb: Ve, toDb: Ve, fromJson: Ve, toJson: Ve, fromInput: Ve, toInput: Ve }),
  c(N, 'Integer', {
    ...N.Number,
    toJson: (e) => {
      let t = N.Number.toDb(e)
      return t && +(+t).toFixed(0)
    },
    toDb: (e) => N.Integer.toJson(e),
    fieldTypeInDb: 'integer',
  }),
  c(N, 'Default', {
    fromJson: (e) => e,
    toJson: (e) => e,
    fromDb: (e) => N.JsonString.fromDb(e),
    toDb: (e) => N.JsonString.toDb(e),
    fromInput: (e) => N.Default.fromJson(e),
    toInput: (e) => N.Default.toJson(e),
    displayValue: (e) => e + '',
    fieldTypeInDb: '',
    inputType: 'text',
  }),
  c(N, 'JsonString', {
    fromJson: (e) => e,
    toJson: (e) => e,
    fromDb: (e) => (e == null ? null : e ? JSON.parse(N.JsonString.fromJson(e)) : void 0),
    toDb: (e) =>
      e !== void 0 ? (e === null ? null : JSON.stringify(N.JsonString.toJson(e))) : void 0,
    fromInput: (e) => N.JsonString.fromJson(e),
    toInput: (e) => N.JsonString.toJson(e),
  }),
  c(N, 'JsonValue', {
    fromJson: (e) => e,
    toJson: (e) => e,
    fromDb: (e) => e,
    toDb: (e) => e,
    fromInput: (e) => N.JsonString.fromJson(e),
    toInput: (e) => N.JsonString.toJson(e),
    fieldTypeInDb: 'json',
  })
let de = N
function Ve(n) {
  return n == null ? n : typeof n != 'string' ? n.toString() : n
}
function Ur(n, e, t) {
  let r = S.fromEntityFilter(n, e)
  const i = () => {}
  r &&
    r.__applyToConsumer({
      custom: i,
      databaseCustom: i,
      containsCaseInsensitive: i,
      notContainsCaseInsensitive: i,
      startsWithCaseInsensitive: i,
      endsWithCaseInsensitive: i,
      isDifferentFrom: i,
      isEqualTo: (s, a) => {
        t[s.key] = a
      },
      isGreaterOrEqualTo: i,
      isGreaterThan: i,
      isIn: i,
      isLessOrEqualTo: i,
      isLessThan: i,
      isNotNull: i,
      isNull: i,
      not: i,
      or: i,
    })
}
class Wr {
  constructor() {
    c(this, 'entityLoaders', new Map())
    c(this, 'promises', [])
  }
  load(e, t) {
    let r = this.entityLoaders.get(e.entityType)
    r || this.entityLoaders.set(e.entityType, (r = new $s(e)))
    const i = r.find(t)
    return this.promises.push(i), i
  }
  async resolveAll() {
    for (const t of this.entityLoaders.values()) for (const r of t.queries.values()) r.resolve()
    if (this.promises.length === 0) return
    const e = this.promises
    ;(this.promises = []), await Promise.all(e), await this.resolveAll()
  }
}
class $s {
  constructor(e) {
    c(this, 'rel')
    c(this, 'queries', new Map())
    this.rel = e
  }
  find(e) {
    const { where: t, ...r } = hr(e, this.rel.metadata),
      i = JSON.stringify(r)
    let s = this.queries.get(i)
    return s || this.queries.set(i, (s = new qs(this.rel))), s.find(e, t)
  }
}
class qs {
  constructor(e) {
    c(this, 'rel')
    c(this, 'pendingInStatements', new Map())
    c(this, 'whereVariations', new Map())
    this.rel = e
  }
  find(e, t) {
    const r = JSON.stringify(t)
    let i = this.whereVariations.get(r)
    if (!i) {
      const s = Object.keys(t)
      if (s.length === 1 && typeof t[s[0]] != 'object' && !e.limit) {
        let a = this.pendingInStatements.get(s[0])
        a || this.pendingInStatements.set(s[0], (a = new Bs(this.rel, s[0], e))),
          this.whereVariations.set(r, (i = { result: a.find(t) }))
      } else this.whereVariations.set(r, (i = { result: this.rel.find(e) }))
    }
    return i.result
  }
  resolve() {
    const e = [...this.pendingInStatements.values()]
    this.pendingInStatements.clear()
    for (const t of e) t.resolve()
  }
}
class Bs {
  constructor(e, t, r) {
    c(this, 'rel')
    c(this, 'key')
    c(this, 'options')
    c(this, 'values', new Map())
    ;(this.rel = e), (this.key = t), (this.options = r)
  }
  async resolve() {
    const e = [...this.values.values()]
    if (e.length == 1) {
      this.rel.find(this.options).then(e[0].resolve, e[0].reject)
      return
    }
    var t = { ...this.options }
    ;(t.where = { [this.key]: e.map((i) => i.value) }), (t.limit = 1e3), (t.page = 1)
    let r = []
    try {
      for (;;) {
        const i = await this.rel.find(t)
        if ((r.push(...i), i.length < t.limit)) break
        t.page++
      }
      for (const i of this.values.values())
        i.resolve(
          r.filter((s) => {
            const o = X(s).fields.find(this.key),
              l = ee(o.metadata),
              u = (l == null ? void 0 : l.type) === 'reference' ? o.getId() : s[this.key]
            return i.value == u
          }),
        )
    } catch (i) {
      for (const s of this.values.values()) s.reject(i)
    }
  }
  find(e) {
    const t = e[this.key]
    let r = this.values.get(t)
    if (!r) {
      let i,
        s,
        a = new Promise((o, l) => {
          ;(i = o), (s = l)
        })
      this.values.set(t, (r = { value: t, resolve: i, reject: s, result: a }))
    }
    return r.result
  }
}
const fe = class fe {}
c(
  fe,
  'required',
  rt(async (e, t) => t.value != null && t.value != null && t.value !== '', 'Should not be empty'),
),
  c(
    fe,
    'unique',
    rt(async (e, t) => {
      if (!t.entityRef)
        throw 'unique validation may only work on columns that are attached to an entity'
      return t.isBackend() && (t.isNew || t.valueChanged())
        ? (await t.entityRef.repository.count({ [t.metadata.key]: t.value })) == 0
        : !0
    }, 'already exists'),
  ),
  c(
    fe,
    'uniqueOnBackend',
    rt(
      async (e, t) =>
        t.isBackend() && (t.isNew || t.valueChanged())
          ? (await t.entityRef.repository.count({ [t.metadata.key]: t.value })) == 0
          : !0,
      fe.unique.defaultMessage,
    ),
  ),
  c(
    fe,
    'regex',
    et((e, t) => t.test(e)),
  ),
  c(
    fe,
    'email',
    kt((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), 'Invalid Email'),
  ),
  c(
    fe,
    'url',
    kt((e) => !!new URL(e), 'Invalid Url'),
  ),
  c(
    fe,
    'in',
    et(
      (e, t) => t.includes(e),
      (e) =>
        `Value must be one of: ${e.map((t) => (typeof t == 'object' ? ((t == null ? void 0 : t.id) !== void 0 ? (t == null ? void 0 : t.id) : t == null ? void 0 : t.toString()) : t)).join(', ')}`,
    ),
  ),
  c(
    fe,
    'notNull',
    kt((e) => e != null, 'Should not be null'),
  ),
  c(
    fe,
    'enum',
    et(
      (e, t) => Object.values(t).includes(e),
      (e) => `Value must be one of ${It(e).join(', ')}`,
    ),
  ),
  c(
    fe,
    'relationExists',
    rt(
      async (e, t) => (t.valueIsNull() || !t.isBackend() ? !0 : !!(await t.load())),
      'Relation value does not exist',
    ),
  ),
  c(
    fe,
    'maxLength',
    et(
      (e, t) => e.length <= t,
      (e) => `Value must be at most ${e} characters`,
    ),
  ),
  c(
    fe,
    'minLength',
    et(
      (e, t) => e.length >= t,
      (e) => `Value must be at least ${e} characters`,
    ),
  ),
  c(fe, 'defaultMessage', 'Invalid value')
let Fe = fe
function rt(n, e) {
  const t = async (i, s, a) => {
      const o = await n(i, s)
      typeof o == 'string' && o.length > 0
        ? (s.error = o)
        : o ||
          (s.error =
            (typeof a == 'function' && a(i, s, void 0)) ||
            a ||
            (typeof e == 'function' && e(i, s, void 0)) ||
            e ||
            Fe.defaultMessage)
    },
    r = (i, s, a) =>
      typeof i == 'string' || i === 'function' || (i === void 0 && s === void 0)
        ? async (o, l, u) => await t(o, l, i || u)
        : t(i, s, a)
  return (
    Object.defineProperty(r, 'defaultMessage', {
      get: () => e,
      set: (i) => {
        e = i
      },
      enumerable: !0,
    }),
    Object.assign(r, { withMessage: (i) => async (s, a) => r(s, a, i) })
  )
}
function kt(n, e) {
  return rt((t, r) => (r.value === void 0 || r.value === null ? !0 : n(r.value)), e)
}
function et(n, e) {
  const t = Js(
    (r, i, s) => (i.value === void 0 || i.value === null ? !0 : n(i.value, s)),
    (r, i, s) => (typeof e == 'function' && e(s)) || e,
    !0,
  )
  return Object.assign((r, i) => t(r, i), {
    get defaultMessage() {
      return e
    },
    set defaultMessage(r) {
      e = r
    },
  })
}
function Js(n, e, t = !1) {
  return Object.assign(
    (i, s) => async (a, o) => {
      const l = await n(a, o, i)
      typeof l == 'string'
        ? (o.error = l)
        : l ||
          (o.error = s
            ? typeof s == 'function'
              ? t
                ? s(i)
                : s(a, o, i)
              : s
            : e
              ? typeof e == 'function'
                ? e(a, o, i)
                : e
              : Fe.defaultMessage)
    },
    {
      get defaultMessage() {
        return e
      },
      set defaultMessage(i) {
        e = i
      },
    },
  )
}
function It(n) {
  return Object.values(n).filter((e) => typeof n[e] != 'number')
}
function Ot(n, e, t = !1) {
  if (!e) return n
  const r = Array.isArray(e) ? e : [e],
    i = Array.isArray(n) ? n : n ? [n] : []
  return t ? [...r, ...i] : [...i, ...r]
}
function it(n, e) {
  return typeof n[e] < 'u'
}
class yr {
  constructor(e, t, r, i, s) {
    c(this, '_entity')
    c(this, '_remult')
    c(this, '_dataProvider')
    c(this, '_info')
    c(this, '_defaultFindOptions')
    c(this, '__edp')
    c(this, '_idCache', new Map())
    c(this, 'listeners')
    c(this, '_cache', new Map())
    ;(this._entity = e),
      (this._remult = t),
      (this._dataProvider = r),
      (this._info = i),
      (this._defaultFindOptions = s)
  }
  _notFoundError(e) {
    return { message: `id ${e} not found in entity ${this.metadata.key}`, httpStatusCode: 404 }
  }
  [at]() {
    return this
  }
  async _createAfterFilter(e, t) {
    let r = new Map()
    for (const a of ve.translateOrderByToSort(this.metadata, e).Segments) {
      let o = t[a.field.key]
      r.set(a.field.key, o)
    }
    let i = { $or: [] },
      s = []
    for (const a of ve.translateOrderByToSort(this.metadata, e).Segments) {
      let o = {}
      for (const l of s) o[l.key] = r.get(l.key)
      s.push(a.field),
        a.isDescending
          ? (o[a.field.key] = { $lt: r.get(a.field.key) })
          : (o[a.field.key] = { $gt: r.get(a.field.key) }),
        i.$or.push(o)
    }
    return i
  }
  relations(e) {
    return new Proxy(
      {},
      {
        get: (t, r) => {
          const i = this.fields.find(r),
            s = ee(i)
          if (!s) throw Error(r + ' is not a relation')
          const {
            toRepo: a,
            returnNull: o,
            returnUndefined: l,
          } = this._getFocusedRelationRepo(i, e)
          return s.type === 'toMany'
            ? a
            : {
                findOne: (u) =>
                  o ? Promise.resolve(null) : l ? Promise.resolve(void 0) : a.findFirst({}, u),
              }
        },
      },
    )
  }
  _getFocusedRelationRepo(e, t) {
    const r = ee(e)
    let i = r.toRepo,
      {
        findOptions: s,
        returnNull: a,
        returnUndefined: o,
      } = this._findOptionsBasedOnRelation(r, e, void 0, t, i)
    return {
      toRepo: new yr(i._entity, i._remult, i._dataProvider, i._info, s),
      returnNull: a,
      returnUndefined: o,
    }
  }
  get _edp() {
    return this.__edp
      ? this.__edp
      : (this.__edp = this._dataProvider.getEntityDataProvider(this.metadata))
  }
  _getCachedById(e, t) {
    ;(e = e + ''), this._getCachedByIdAsync(e, t)
    let r = this._idCache.get(e)
    if (!(r instanceof Promise)) return r
  }
  async _getCachedByIdAsync(e, t) {
    e = e + ''
    let r = this._idCache.get(e)
    if (r instanceof Promise) return await r
    if (this._idCache.has(e)) return r
    if (t) return
    this._idCache.set(e, void 0)
    let i = this.findId(e).then(
      (s) => (s === void 0 ? (r = null) : (r = s), this._idCache.set(e, r), r),
    )
    return this._idCache.set(e, i), await i
  }
  _addToCache(e) {
    e && this._idCache.set(this.getEntityRef(e).getId() + '', e)
  }
  get metadata() {
    return this._info
  }
  addEventListener(e) {
    return (
      this.listeners || (this.listeners = []),
      this.listeners.push(e),
      () => {
        this.listeners.splice(this.listeners.indexOf(e), 1)
      }
    )
  }
  query(e) {
    return new Gs(e, this)
  }
  getEntityRef(e) {
    let t = e[Le]
    return (
      t ||
        (this._fixTypes(e),
        (t = new mt(this._info, e, this, this._edp, this._remult, !0)),
        Object.defineProperty(e, Le, { get: () => t }),
        t.saveOriginalData()),
      t
    )
  }
  async delete(e) {
    const t = X(e, !1)
    if (t) return t.delete()
    if (typeof e == 'string' || typeof e == 'number') {
      if (this._dataProvider.isProxy) return this._edp.delete(e)
      {
        let i = await this.findId(e)
        if (!i) throw this._notFoundError(e)
        return await X(i).delete()
      }
    }
    let r = this._getRefForExistingRow(e, void 0)
    return this._dataProvider.isProxy || (await r.reload()), r.delete()
  }
  async insert(e) {
    if (Array.isArray(e))
      if (this._dataProvider.isProxy) {
        let t = [],
          r = []
        for (const i of e) {
          let s = X(e, !1)
          if (s) {
            if (!s.isNew()) throw 'Item is not new'
          } else s = await this.getEntityRef(this.create(i))
          t.push(s), r.push(await s.buildDtoForInsert())
        }
        return nt(await this._edp.insertMany(r), (i, s) => t[s].processInsertResponseDto(i))
      } else {
        let t = []
        for (const r of e) t.push(await this.insert(r))
        return t
      }
    else {
      let t = X(e, !1)
      if (t) {
        if (!t.isNew()) throw 'Item is not new'
        return await t.save()
      } else return await this.getEntityRef(this.create(e)).save()
    }
  }
  get fields() {
    return this.metadata.fields
  }
  async validate(e, ...t) {
    {
      let r = X(e, !1)
      if ((r || (r = this.getEntityRef({ ...e })), !t || t.length === 0)) return await r.validate()
      {
        r.__clearErrorsAndReportChanged()
        let i = !1
        for (const s of t) (await r.fields.find(s).validate()) || (i = !0)
        return i ? r.buildErrorInfoObject() : void 0
      }
    }
  }
  async updateMany({ where: e, set: t }) {
    if ((S.throwErrorIfFilterIsEmpty(e, 'updateMany'), this._dataProvider.isProxy))
      return this._edp.updateMany(await this._translateWhereToFilter(e), t)
    {
      let r = 0
      for await (const i of this.query({ where: e })) ir(i, t), await X(i).save(), r++
      return r
    }
  }
  async update(e, t) {
    {
      let i = X(t, !1)
      if (i) return await i.save()
    }
    {
      let i = X(e, !1)
      if (i) return ir(e, t), i.save()
    }
    let r
    if (
      (typeof e == 'object'
        ? ((r = this._getRefForExistingRow(e, this.metadata.idMetadata.getId(e))),
          Object.assign(r.instance, t))
        : (r = this._getRefForExistingRow(t, e)),
      this._dataProvider.isProxy)
    )
      return await r.save(Object.keys(t))
    {
      const i = await r.reload()
      if (!i) throw this._notFoundError(r.id)
      for (const s in t)
        if (Object.prototype.hasOwnProperty.call(t, s)) {
          let a = r.fields[s]
          if (t[s] === void 0 && ee(a.metadata)) continue
          a && (i[s] = t[s])
        }
      return await this._fixTypes(i), await r.save()
    }
  }
  _getRefForExistingRow(e, t) {
    let r = X(e, !1)
    if (!r) {
      const i = new this._entity(this._remult)
      for (const a of this._fieldsOf(e)) {
        const o = a.key
        i[o] = e[o]
      }
      this._fixTypes(i)
      let s = new mt(this._info, i, this, this._edp, this._remult, !1)
      typeof t == 'object' && (t = this.metadata.idMetadata.getId(t)),
        t ? ((s.id = t), (s.originalId = t)) : (s.id = s.getId()),
        (r = s),
        Object.defineProperty(i, Le, { get: () => s })
    }
    return r
  }
  async save(e) {
    if (Array.isArray(e)) return nt(e, (t) => this.save(t))
    {
      let t = X(e, !1)
      if (t) return await t.save()
      if (e instanceof Ii) return await this.getEntityRef(e).save()
      {
        let r = this.metadata.idMetadata.getId(e)
        return r === void 0 ? this.insert(e) : this.update(r, e)
      }
    }
  }
  liveQuery(e) {
    return (
      e || (e = {}),
      {
        subscribe: (t) => {
          let r = t
          return (
            typeof t == 'function' && (r = { next: t, complete: () => {}, error: () => {} }),
            r.error ?? (r.error = () => {}),
            r.complete ?? (r.complete = () => {}),
            this._remult.liveQuerySubscriber.subscribe(this, e, r)
          )
        },
      }
    )
  }
  async _rawFind(e, t = !1, r) {
    e || (e = {}), this._defaultFindOptions && (e = { ...this._defaultFindOptions, ...e })
    let i = await this._buildEntityDataProviderFindOptions(e)
    t && (delete i.orderBy, delete i.limit), Oe.onFind(this._info, e)
    const s = await this._edp.find(i)
    return await this._loadManyToOneForManyRows(s, e, r)
  }
  async find(e, t = !1) {
    const r = new Wr(),
      i = await this._rawFind(e, t, r)
    return await r.resolveAll(), i
  }
  async _buildEntityDataProviderFindOptions(e) {
    let t = {}
    return (
      (t = {}),
      (!e.orderBy || Object.keys(e.orderBy).length === 0) &&
        (e.orderBy = this._info.entityInfo.defaultOrderBy),
      (t.where = await this._translateWhereToFilter(e.where)),
      e.orderBy !== void 0 && (t.orderBy = ve.translateOrderByToSort(this.metadata, e.orderBy)),
      e.limit !== void 0 && (t.limit = e.limit),
      e.page !== void 0 && (t.page = e.page),
      t
    )
  }
  async _fromJsonArray(e, t) {
    const r = new Wr(),
      i = await this._loadManyToOneForManyRows(
        e.map((s) => {
          let a = {}
          for (const o of this.metadata.fields.toArray())
            a[o.key] = o.valueConverter.fromJson(s[o.key])
          return a
        }),
        t,
        r,
      )
    return await r.resolveAll(), i
  }
  async _loadManyToOneForManyRows(e, t, r) {
    var o
    let i
    t != null && t.load && (i = t.load(this.metadata.fields))
    for (const l of this.metadata.fields)
      if (_e(l.valueType, !1) && !ee(l)) {
        let d = !l.options.lazy
        if ((i !== void 0 && (d = i.includes(l)), d)) {
          let h = this._remult.repo(l.valueType),
            p = []
          for (const m of e) {
            let b = m[l.key]
            b != null && !p.includes(b) && !h._idCache.has(b + '') && p.push(b)
          }
          p.length > 0 && (await s(h, p))
        }
      }
    async function s(l, u) {
      let f = await l.find({ where: l.metadata.idMetadata.getIdFilter(...u) }, !0)
      for (const d of f) l._addToCache(d)
    }
    let a = await nt(e, async (l) => await this._mapRawDataToResult(l, i))
    for (const l of this.metadata.fields) {
      let u = ee(l),
        f = l.options.defaultIncluded
      const d = (o = t == null ? void 0 : t.include) == null ? void 0 : o[l.key]
      if ((d !== void 0 && (f = d), u && f)) {
        const h = u.toRepo
        for (const p of a) {
          let { findOptions: m, returnNull: b } = this._findOptionsBasedOnRelation(u, l, f, p, h)
          const k = l.key
          if (b) p[k] = null
          else {
            const E = u.toEntity,
              I = h
            r.load(
              { entityType: E, find: (B) => I._rawFind(B, !1, r), metadata: I.metadata },
              m,
            ).then((B) => {
              ;(B.length == 0 && u.type == 'toOne') ||
                (p[k] = u.type !== 'toMany' ? (B.length == 0 ? null : B[0]) : B)
            })
          }
        }
      }
    }
    return a
  }
  _findOptionsBasedOnRelation(e, t, r, i, s) {
    let a = !1,
      o = !1,
      l = [],
      u = {},
      f = []
    typeof e.options.findOptions == 'function'
      ? f.push(e.options.findOptions(i))
      : typeof e.options.findOptions == 'object' && f.push(e.options.findOptions),
      typeof r == 'object' && f.push(r)
    for (const p of f) {
      p.where && l.push(p.where)
      for (const m of ['limit', 'include', 'orderBy']) p[m] && (u[m] = p[m])
    }
    const d = e.getFields(),
      h = (p) => {
        let m = e.type === 'reference' ? X(i).fields.find(t.key).getId() : i[p]
        return (
          (e.type === 'toOne' || e.type === 'reference') &&
            (m === null
              ? (a = !0)
              : m === void 0
                ? (o = !0)
                : e.type === 'reference' &&
                  typeof m == 'object' &&
                  (m = s.metadata.idMetadata.getId(m))),
          m
        )
      }
    d.compoundIdField &&
      (e.type === 'toMany'
        ? l.push({ [d.compoundIdField]: this.metadata.idMetadata.getId(i) })
        : l.push(s.metadata.idMetadata.getIdFilter(h(d.compoundIdField))))
    for (const p in d.fields)
      Object.prototype.hasOwnProperty.call(d.fields, p) && l.push({ [p]: h(d.fields[p]) })
    return (
      (u.where = { $and: l }),
      (e.type === 'toOne' || e.type === 'reference') && u.orderBy && (u.limit = 1),
      { findOptions: u, returnNull: a, returnUndefined: o }
    )
  }
  async _mapRawDataToResult(e, t) {
    let r = new this._entity(this._remult),
      i = new mt(this._info, r, this, this._edp, this._remult, !1)
    return (
      Object.defineProperty(r, Le, { get: () => i }),
      await i.loadDataFrom(e, t),
      i.saveOriginalData(),
      r
    )
  }
  toJson(e) {
    return e == null
      ? e
      : Array.isArray(e)
        ? e.map((t) => this.toJson(t))
        : typeof e.then == 'function'
          ? e.then((t) => this.toJson(t))
          : this.getEntityRef(e).toApiJson(!0)
  }
  fromJson(e, t) {
    if (e == null) return e
    if (Array.isArray(e)) return e.map((i) => this.fromJson(i, t))
    let r = new this._entity(this._remult)
    for (const i of this._fieldsOf(e)) {
      const s = i.key
      if (_e(i.valueType, !1)) {
        let o = e[i.key]
        typeof o == 'string' || typeof o == 'number'
          ? (r[s] = o)
          : (r[s] = this._remult.repo(i.valueType).fromJson(o))
      } else e[s] !== void 0 && (r[s] = i.valueConverter.fromJson(e[i.key]))
    }
    if ((this._fixTypes(r), t)) return this.create(r)
    {
      let i = new mt(this._info, r, this, this._edp, this._remult, !1)
      return Object.defineProperty(r, Le, { get: () => i }), i.saveOriginalData(), r
    }
  }
  async count(e) {
    return this._edp.count(await this._translateWhereToFilter(e))
  }
  async deleteMany({ where: e }) {
    if ((S.throwErrorIfFilterIsEmpty(e, 'deleteMany'), this._dataProvider.isProxy))
      return this._edp.deleteMany(await this._translateWhereToFilter(e))
    {
      let t = 0
      for await (const r of this.query({ where: e })) await X(r).delete(), t++
      return t
    }
  }
  async findOne(e, t = !1) {
    let r,
      i,
      s = e ?? {}
    if (s.useCache) {
      let a = hr(s, this.metadata),
        o = JSON.stringify(a)
      if (((i = this._cache.get(o)), i !== void 0))
        if (i.value && this.getEntityRef(i.value).wasDeleted()) (i = void 0), this._cache.delete(o)
        else return i.promise
      else (i = { value: void 0, promise: void 0 }), this._cache.set(o, i)
    }
    return (
      (r = this.find({ ...s, limit: 1 }, t).then(async (a) => {
        let o
        return (
          a.length > 0 && (o = a[0]),
          !o &&
            s.createIfNotFound &&
            ((o = this.create()), s.where && (await Ur(this.metadata, s.where, o))),
          o
        )
      })),
      i && (i.promise = r = r.then((a) => ((i.value = a), a))),
      r
    )
  }
  async findFirst(e, t, r = !1) {
    if ((t || (t = {}), e))
      if (t.where) {
        let i = t.where
        t.where = { $and: [i, e] }
      } else t.where = e
    return this.findOne(t, r)
  }
  _fieldsOf(e) {
    let t = Object.keys(e)
    return this.metadata.fields.toArray().filter((r) => t.includes(r.key))
  }
  create(e) {
    var r
    let t = new this._entity(this._remult)
    if (e) {
      for (const i of this._fieldsOf(e)) {
        const s = i.key
        t[s] = e[s]
      }
      this._fixTypes(t)
    }
    return (
      (r = this._defaultFindOptions) != null &&
        r.where &&
        (Ur(this.metadata, this._defaultFindOptions.where, t), this._fixTypes(t)),
      this.getEntityRef(t),
      t
    )
  }
  async _fixTypes(e) {
    for (const t of this._fieldsOf(e)) {
      const r = e[t.key]
      if (r != null)
        if (t.valueType === Date && !(r instanceof Date))
          e[t.key] = t.valueConverter.fromJson(t.valueConverter.toJson(r))
        else
          for (const [i, s] of [
            [String, 'string'],
            [Number, 'number'],
            [Boolean, 'boolean'],
          ])
            t.valueType === i &&
              typeof r !== s &&
              (e[t.key] = t.valueConverter.fromJson(t.valueConverter.toJson(r)))
    }
    return e
  }
  findId(e, t) {
    if (e == null) return Promise.resolve(null)
    if (typeof e != 'string' && typeof e != 'number')
      throw new Error('id can be either number or string, but got: ' + typeof e)
    return this.findFirst({}, { ...t, where: this.metadata.idMetadata.getIdFilter(e) }, !0)
  }
  async _translateWhereToFilter(e) {
    var i, s
    let t = e ?? {}
    ;(i = this._defaultFindOptions) != null &&
      i.where &&
      (t = { $and: [t, (s = this._defaultFindOptions) == null ? void 0 : s.where] }),
      this._dataProvider.isProxy ||
        (this.metadata.options.backendPreprocessFilter &&
          (t = await this.metadata.options.backendPreprocessFilter(t, {
            metadata: this.metadata,
            getFilterPreciseValues: (a) => S.getPreciseValues(this.metadata, a || t),
          })),
        this.metadata.options.backendPrefilter &&
          (t = { $and: [t, await S.resolve(this.metadata.options.backendPrefilter)] }))
    let r = await S.fromEntityFilter(this.metadata, t)
    return (
      r &&
        !this._dataProvider.isProxy &&
        (r = await S.translateCustomWhere(r, this.metadata, this._remult)),
      r
    )
  }
}
function js(n, e) {
  let t = O.columnsOfType.get(n)
  t || O.columnsOfType.set(n, (t = []))
  let r = _e(n)(e),
    i = ns(n),
    s = Object.getPrototypeOf(n)
  for (; s != null; ) {
    let a = O.columnsOfType.get(s)
    a && t.unshift(...a.filter((l) => !t.find((u) => u.key == l.key)))
    let o = _e(s, !1)
    if (o) {
      let l = o(e)
      r = { ...l, ...r }
      let u = ['saving', 'saved', 'deleting', 'deleted', 'validation']
      for (const f of u)
        if (l[f] && l[f] !== r[f]) {
          let d = r[f]
          r[f] = async (h, p) => {
            await d(h, p), await l[f](h, p)
          }
        }
    }
    s = Object.getPrototypeOf(s)
  }
  return new Hs(vi(t, e), r, e, n, i)
}
class gi {
  constructor(e, t, r, i) {
    c(this, 'fieldsMetadata')
    c(this, 'instance')
    c(this, 'remult')
    c(this, 'isNewRow')
    c(this, '_error')
    c(this, '_subscribers')
    c(this, '_isLoading', !1)
    c(this, 'lookups', new Map())
    c(this, 'errors')
    c(this, 'originalValues', {})
    ;(this.fieldsMetadata = e), (this.instance = t), (this.remult = r), (this.isNewRow = i)
    {
      let s = r
      s != null && s.iAmRemultProxy && (r = O.remultFactory())
    }
    for (const s of e)
      if (_e(s.valueType, !1) && r) {
        let o = new ms(r.repo(s.valueType), !!ee(s), s.allowNull)
        this.lookups.set(s.key, o)
        let l = t[s.key],
          u
        Object.defineProperty(t, s.key, {
          get: () => (
            this._subscribers &&
              (this._subscribers.reportObserved(),
              u || ((u = this.fields.find(s.key)), u._subscribers || (u._subscribers = new wt())),
              u._subscribers.reportObserved()),
            o.item
          ),
          set: (f) => {
            var d
            o.set(f),
              (d = this._subscribers) == null || d.reportChanged(),
              u || ((u = this.fields.find(s.key)), u._subscribers || (u._subscribers = new wt())),
              u._subscribers.reportChanged()
          },
          enumerable: !0,
        }),
          o.set(l)
      } else {
        const o = ee(s)
        if ((o == null ? void 0 : o.type) === 'toOne') {
          let l = t.hasOwnProperty(s.key),
            u = t[s.key]
          i && !u && (l = !1),
            Object.defineProperty(t, s.key, {
              get: () => u,
              set: (f) => {
                if (((u = f), f === void 0)) return
                const d = s.options
                if (
                  (d.field && (this.instance[d.field] = o.toRepo.metadata.idMetadata.getId(f)),
                  d.fields)
                ) {
                  for (const h in d.fields)
                    if (Object.prototype.hasOwnProperty.call(d.fields, h)) {
                      const p = d.fields[h]
                      this.instance[p] = f == null ? null : f[h]
                    }
                }
              },
              enumerable: !0,
            }),
            l && (t[s.key] = u)
        }
      }
  }
  get error() {
    var e
    return (e = this._subscribers) == null || e.reportObserved(), this._error
  }
  set error(e) {
    var t
    ;(this._error = e), (t = this._subscribers) == null || t.reportChanged()
  }
  subscribe(e) {
    return this.initSubscribers(), this._subscribers.subscribe(e)
  }
  initSubscribers() {
    if (!this._subscribers) {
      this._subscribers = new wt()
      const e = this._subscribers
      for (const t of this.fieldsMetadata) {
        let r = _e(t.valueType, !1),
          i = this.fields.find(t.key)
        if (((i._subscribers = new wt()), !(r && this.remult))) {
          let s = this.instance[t.key]
          Object.defineProperty(this.instance, t.key, {
            get: () => (e.reportObserved(), i._subscribers.reportObserved(), s),
            set: (a) => {
              ;(s = a), e.reportChanged(), i._subscribers.reportChanged()
            },
            enumerable: !0,
          })
        }
      }
    }
  }
  get isLoading() {
    var e
    return (e = this._subscribers) == null || e.reportObserved(), this._isLoading
  }
  set isLoading(e) {
    var t
    ;(this._isLoading = e), (t = this._subscribers) == null || t.reportChanged()
  }
  async waitLoad() {
    await nt([...this.lookups.values()], (e) => e.waitLoad())
  }
  __assertValidity() {
    if (!this.hasErrors()) throw this.buildErrorInfoObject()
  }
  buildErrorInfoObject() {
    var t
    let e = { modelState: Object.assign({}, this.errors), message: this.error }
    if (!e.message) {
      for (const r of this.fieldsMetadata)
        if ((t = this.errors) != null && t[r.key]) {
          ;(e.message = this.fields[r.key].metadata.caption + ': ' + this.errors[r.key]),
            (this.error = e.message)
          break
        }
    }
    return e
  }
  catchSaveErrors(e) {
    let t = e
    if (t instanceof Promise) return t.then((i) => this.catchSaveErrors(i))
    t.error && (t = t.error),
      t.message ? (this.error = t.message) : t.Message ? (this.error = t.Message) : (this.error = t)
    let r = t.modelState
    throw (r || (r = t.ModelState), r && (this.errors = r), e)
  }
  __clearErrorsAndReportChanged() {
    ;(this.errors = void 0), (this.error = void 0), this._reportChangedToEntityAndFields()
  }
  _reportChangedToEntityAndFields() {
    if (this._subscribers) {
      this._subscribers.reportChanged()
      for (const e of this.fields) e._subscribers.reportChanged()
    }
  }
  hasErrors() {
    var e
    return (e = this._subscribers) == null || e.reportObserved(), !this.error && this.errors == null
  }
  copyDataToObject(e = !1) {
    let t = {}
    for (const r of this.fieldsMetadata) {
      let i = this.lookups.get(r.key),
        s
      const a = ee(r)
      i ? (s = i.id) : (s = this.instance[r.key]),
        a &&
          e &&
          !r.allowNull &&
          s == null &&
          (a.toRepo.metadata.idMetadata.field.valueType === Number ? (s = 0) : (s = '')),
        (!a || a.type === 'reference') &&
          (s !== void 0 &&
            ((s = r.valueConverter.toJson(s)),
            s != null && (s = r.valueConverter.fromJson(JSON.parse(JSON.stringify(s))))),
          (t[r.key] = s))
    }
    return t
  }
  saveOriginalData() {
    ;(this.originalValues = this.copyDataToObject()), this.saveMoreOriginalData()
  }
  saveMoreOriginalData() {}
  async validate() {
    if (
      (this.__clearErrorsAndReportChanged(),
      await this.__performColumnAndEntityValidations(),
      this.hasErrors(),
      !this.hasErrors())
    )
      return this.buildErrorInfoObject()
  }
  async __validateEntity() {
    this.__clearErrorsAndReportChanged(),
      await this.__performColumnAndEntityValidations(),
      this.__assertValidity()
  }
  async __performColumnAndEntityValidations() {}
  toApiJson(e = !1, t = !1) {
    let r = {}
    for (const i of this.fieldsMetadata)
      if (t || !this.remult || i.includedInApi(this.instance)) {
        let s,
          a = this.lookups.get(i.key),
          o = !1
        a
          ? e
            ? ((s = a.toJson()), (o = !0), (r[i.key] = s))
            : (s = a.id)
          : ee(i) && !e
            ? (o = !0)
            : ((s = this.instance[i.key]),
              this.remult || (s && _e(s.constructor, !1) && (s = X(s).getId()))),
          o || (r[i.key] = i.valueConverter.toJson(s))
      }
    return r
  }
  async _updateEntityBasedOnApi(e, t = !1) {
    let r = Object.keys(e)
    for (const i of this.fieldsMetadata)
      if (
        r.includes(i.key) &&
        i.includedInApi(this.instance) &&
        (!this.remult || t || i.apiUpdateAllowed(this.instance))
      ) {
        let s = this.lookups.get(i.key)
        s ? (s.id = e[i.key]) : (this.instance[i.key] = i.valueConverter.fromJson(e[i.key]))
      }
    await nt(
      [...this.fields].filter((i) => !ee(i.metadata)),
      (i) => i.load(),
    )
  }
}
class mt extends gi {
  constructor(t, r, i, s, a, o) {
    super(t.fieldsMetadata, r, a, o)
    c(this, 'info')
    c(this, 'repo')
    c(this, 'edp')
    c(this, '_isNew')
    c(this, 'repository')
    c(this, 'metadata')
    c(this, '_wasDeleted', !1)
    c(this, '_columns')
    c(this, '_saving', !1)
    c(this, 'id')
    c(this, 'originalId')
    if (
      ((this.info = t),
      (this.repo = i),
      (this.edp = s),
      (this._isNew = o),
      (this.repository = i),
      (this.metadata = t),
      o)
    )
      for (const l of t.fieldsMetadata) {
        const u = l.key
        l.options.defaultValue &&
          r[u] === void 0 &&
          (typeof l.options.defaultValue == 'function'
            ? (r[u] = l.options.defaultValue(r))
            : r[u] || (r[u] = l.options.defaultValue))
      }
    this.info.entityInfo.entityRefInit && this.info.entityInfo.entityRefInit(this, r),
      Oe.entityRefInit && Oe.entityRefInit(this, r)
  }
  clone() {
    const t = this.toApiJson(!0, !0)
    return this.repo.fromJson(t, this.isNew())
  }
  get relations() {
    return this.repo.relations(this.instance)
  }
  get apiUpdateAllowed() {
    return this.remult.isAllowedForInstance(this.instance, this.metadata.options.allowApiUpdate)
  }
  get apiDeleteAllowed() {
    return this.remult.isAllowedForInstance(this.instance, this.metadata.options.allowApiDelete)
  }
  get apiInsertAllowed() {
    return this.remult.isAllowedForInstance(this.instance, this.metadata.options.allowApiInsert)
  }
  getId() {
    const t = (r) => {
      let i = this.lookups.get(r.key)
      return i ? i.id : this.instance[r.key]
    }
    return this.metadata.idMetadata.field instanceof $e
      ? this.metadata.idMetadata.field.getId(t)
      : t(this.metadata.idMetadata.field)
  }
  saveMoreOriginalData() {
    this.originalId = this.getId()
  }
  wasDeleted() {
    var t
    return (t = this._subscribers) == null || t.reportObserved(), this._wasDeleted
  }
  undoChanges() {
    this.loadDataFrom(this.originalValues), this.__clearErrorsAndReportChanged()
  }
  async reload() {
    return (
      await this.edp.find({ where: await this.getIdFilter() }).then(async (t) => {
        if (t.length === 0) throw this.repo._notFoundError(this.id)
        await this.loadDataFrom(t[0]), this.saveOriginalData()
      }),
      this._reportChangedToEntityAndFields(),
      this.instance
    )
  }
  get fields() {
    if (!this._columns) {
      let t = [],
        r = {
          find: (i) => r[typeof i == 'string' ? i : i.key],
          [Symbol.iterator]: () => t[Symbol.iterator](),
          toArray: () => t,
        }
      for (const i of this.info.fieldsMetadata)
        t.push((r[i.key] = new Ft(i.options, i, this.instance, this, this)))
      this._columns = r
    }
    return this._columns
  }
  async save(t) {
    var r, i
    try {
      if (this._saving) throw new Error('cannot save while entity is already saving')
      if (((this._saving = !0), this.wasDeleted())) throw new Error('cannot save a deleted row')
      ;(this.isLoading = !0), t === void 0 && (await this.__validateEntity())
      let s = !1,
        a = this.buildLifeCycleEvent(() => (s = !0))
      if (!this.repo._dataProvider.isProxy) {
        for (const d of this.fields)
          d.metadata.options.saving && (await d.metadata.options.saving(this.instance, d, a))
        this.info.entityInfo.saving && (await this.info.entityInfo.saving(this.instance, a))
      }
      this.__assertValidity()
      let o = this.copyDataToObject(this.isNew()),
        l = []
      for (const d of this.metadata.fields)
        if (d.dbReadOnly || (t !== void 0 && !t.includes(d.key))) {
          ;(o[d.key] = void 0), l.push(d.key)
          let h = this.fields.find(d)
          h.value = h.originalValue
        }
      let u,
        f = this.isNew()
      try {
        if (((r = this._subscribers) == null || r.reportChanged(), this.isNew()))
          s
            ? (u = (u = await this.edp.find({ where: await this.getIdFilter() }))[0])
            : (u = await this.edp.insert(o))
        else {
          let d = {},
            h = !1
          for (const p in o)
            if (Object.prototype.hasOwnProperty.call(o, p)) {
              const m = o[p]
              this.fields.find(p).valueChanged() && !l.includes(p) && ((d[p] = m), (h = !0))
            }
          if (!h) return this.instance
          s
            ? (u = (await this.edp.find({ where: await this.getIdFilter() }))[0])
            : (u = await this.edp.update(this.id, d))
        }
        if (
          (u && (await this.loadDataFrom(u)),
          (a.id = this.getId()),
          !this.repo._dataProvider.isProxy &&
            (this.info.entityInfo.saved && (await this.info.entityInfo.saved(this.instance, a)),
            this.repo.listeners))
        )
          for (const d of this.repo.listeners)
            await ((i = d.saved) == null ? void 0 : i.call(d, this.instance, f))
        return (
          await this.repo._remult.liveQueryPublisher.itemChanged(this.repo.metadata.key, [
            { id: this.getId(), oldId: this.getOriginalId(), deleted: !1 },
          ]),
          this.saveOriginalData(),
          (this._isNew = !1),
          this.instance
        )
      } catch (d) {
        throw await this.catchSaveErrors(d)
      }
    } finally {
      ;(this.isLoading = !1), this._reportChangedToEntityAndFields(), (this._saving = !1)
    }
  }
  async processInsertResponseDto(t) {
    return await this.loadDataFrom(t), this.saveOriginalData(), (this._isNew = !1), this.instance
  }
  async buildDtoForInsert() {
    await this.__validateEntity(), this.__assertValidity()
    let t = this.copyDataToObject(this.isNew()),
      r = []
    for (const i of this.metadata.fields)
      if (i.dbReadOnly) {
        ;(t[i.key] = void 0), r.push(i.key)
        let s = this.fields.find(i)
        s.value = s.originalValue
      }
    return t
  }
  buildLifeCycleEvent(t = () => {}) {
    const r = this
    return {
      isNew: r.isNew(),
      fields: r.fields,
      id: r.getId(),
      originalId: r.getOriginalId(),
      metadata: r.repo.metadata,
      repository: r.repo,
      preventDefault: () => t(),
      relations: r.repo.relations(r.instance),
    }
  }
  async getIdFilter() {
    return await this.repo._translateWhereToFilter(
      this.repo.metadata.idMetadata.getIdFilter(this.id),
    )
  }
  async delete() {
    var i
    this.__clearErrorsAndReportChanged()
    let t = !0,
      r = this.buildLifeCycleEvent(() => (t = !1))
    this.repo._dataProvider.isProxy ||
      (this.info.entityInfo.deleting && (await this.info.entityInfo.deleting(this.instance, r))),
      this.__assertValidity()
    try {
      if (
        (t && (await this.edp.delete(this.id)),
        this.repo._dataProvider.isProxy ||
          (this.info.entityInfo.deleted && (await this.info.entityInfo.deleted(this.instance, r))),
        this.repo.listeners)
      )
        for (const s of this.repo.listeners)
          await ((i = s.deleted) == null ? void 0 : i.call(s, this.instance))
      await this.repo._remult.liveQueryPublisher.itemChanged(this.repo.metadata.key, [
        { id: this.getId(), oldId: this.getOriginalId(), deleted: !0 },
      ]),
        (this._wasDeleted = !0)
    } catch (s) {
      throw await this.catchSaveErrors(s)
    }
  }
  async loadDataFrom(t, r) {
    for (const i of this.info.fields) {
      let s = this.lookups.get(i.key)
      s
        ? ((s.id = t[i.key]),
          r === void 0
            ? !i.options.lazy && !ee(i) && (await s.waitLoad())
            : r.includes(i) && (await s.waitLoad()))
        : ee(i) || (this.instance[i.key] = t[i.key])
    }
    await this.calcServerExpression(), (this.id = this.getId())
  }
  getOriginalId() {
    return this.originalId
  }
  async calcServerExpression() {
    if (rr())
      for (const t of this.info.fieldsMetadata)
        t.options.serverExpression &&
          (this.instance[t.key] = await t.options.serverExpression(this.instance))
  }
  isNew() {
    var t
    return (t = this._subscribers) == null || t.reportObserved(), this._isNew
  }
  wasChanged() {
    var t
    ;(t = this._subscribers) == null || t.reportObserved()
    for (const r of this.fields) {
      const i = ee(r.metadata)
      if ((!i || i.type == 'reference') && r.valueChanged()) return !0
    }
    return !1
  }
  async __performColumnAndEntityValidations() {
    var t
    for (const r of this.fieldsMetadata)
      r.options.validate &&
        (await new Ft(r.options, r, this.instance, this, this).__performValidation())
    if (this.info.entityInfo.validation) {
      let r = this.buildLifeCycleEvent(() => {})
      await this.info.entityInfo.validation(this.instance, r)
    }
    if (this.repo.listeners)
      for (const r of this.repo.listeners)
        await ((t = r.validating) == null ? void 0 : t.call(r, this.instance))
  }
}
const Vr = Symbol.for('controllerColumns')
function vi(n, e) {
  return n.map((t) => mr(t.settings(e), e))
}
function Hr(n, e) {
  const t = e || ke
  let r = n[Vr]
  if ((r || (r = n[Le]), !r)) {
    let i = O.columnsOfType.get(n.constructor)
    i || O.columnsOfType.set(n.constructor, (i = []))
    let s = Object.getPrototypeOf(n.constructor)
    for (; s != null; ) {
      let a = O.columnsOfType.get(s)
      a && i.unshift(...a.filter((o) => !i.find((l) => l.key == o.key))),
        (s = Object.getPrototypeOf(s))
    }
    n[Vr] = r = new Us(
      vi(i, t).map((a) => new _i(a, void 0, t)),
      n,
      t,
    )
  }
  return r
}
class Us extends gi {
  constructor(t, r, i) {
    super(t, r, i, !1)
    c(this, 'fields')
    let s = [],
      a = {
        find: (o) => a[typeof o == 'string' ? o : o.key],
        [Symbol.iterator]: () => s[Symbol.iterator](),
        toArray: () => s,
      }
    for (const o of t) s.push((a[o.key] = new Ft(o.options, o, r, void 0, this)))
    this.fields = a
  }
  async __performColumnAndEntityValidations() {
    for (const t of this.fields) t instanceof Ft && (await t.__performValidation())
  }
}
class Ft {
  constructor(e, t, r, i, s) {
    c(this, 'settings')
    c(this, 'metadata')
    c(this, 'container')
    c(this, 'helper')
    c(this, 'rowBase')
    c(this, '_subscribers')
    c(this, 'target')
    c(this, 'entityRef')
    ;(this.settings = e),
      (this.metadata = t),
      (this.container = r),
      (this.helper = i),
      (this.rowBase = s),
      (this.target = this.settings.target),
      (this.entityRef = this.helper)
  }
  subscribe(e) {
    return this._subscribers || this.rowBase.initSubscribers(), this._subscribers.subscribe(e)
  }
  valueIsNull() {
    this.reportObserved()
    let e = this.rowBase.lookups.get(this.metadata.key)
    return e ? e.id === void 0 || e.id === null : this.value === null
  }
  originalValueIsNull() {
    return (
      this.reportObserved(),
      this.rowBase.lookups.get(this.metadata.key),
      this.rawOriginalValue() === null
    )
  }
  get key() {
    return this.metadata.key
  }
  get repo() {
    var e
    return (e = this.helper) == null ? void 0 : e.repository
  }
  async load() {
    let e = this.rowBase.lookups.get(this.metadata.key),
      t = ee(this.metadata)
    if (t && this.helper) {
      if (t.type === 'toMany')
        return (this.container[this.metadata.key] = await this.repo
          .relations(this.container)
          [this.key].find())
      {
        let r = await this.repo.relations(this.container)[this.metadata.key].findOne()
        if (r) this.container[this.metadata.key] = r
        else return null
      }
    } else if (e)
      return (
        this.valueChanged() && (await e.waitLoadOf(this.rawOriginalValue())), await e.waitLoad()
      )
    return this.value
  }
  reportObserved() {
    var e, t
    ;(e = this._subscribers) == null || e.reportObserved(),
      (t = this.rowBase._subscribers) == null || t.reportObserved()
  }
  reportChanged() {
    var e, t
    ;(e = this._subscribers) == null || e.reportChanged(),
      (t = this.rowBase._subscribers) == null || t.reportChanged()
  }
  get error() {
    if ((this.reportObserved(), !!this.rowBase.errors))
      return this.rowBase.errors[this.metadata.key]
  }
  set error(e) {
    this.rowBase.errors || (this.rowBase.errors = {}),
      (this.rowBase.errors[this.metadata.key] = e),
      this.reportChanged()
  }
  get displayValue() {
    return (
      this.reportObserved(),
      this.value != null
        ? this.settings.displayValue
          ? this.settings.displayValue(this.container, this.value)
          : this.metadata.valueConverter.displayValue
            ? this.metadata.valueConverter.displayValue(this.value)
            : this.value.toString()
        : ''
    )
  }
  get value() {
    return this.container[this.metadata.key]
  }
  set value(e) {
    this.container[this.metadata.key] = e
  }
  get originalValue() {
    this.reportObserved()
    let e = this.rowBase.lookups.get(this.metadata.key)
    return e ? e.get(this.rawOriginalValue()) : this.rowBase.originalValues[this.metadata.key]
  }
  rawOriginalValue() {
    return this.rowBase.originalValues[this.metadata.key]
  }
  setId(e) {
    this.value = e
  }
  getId() {
    let e = this.rowBase.lookups.get(this.metadata.key)
    return e ? (e.id != null ? e.id : null) : this.value
  }
  get inputValue() {
    this.reportObserved()
    let e = this.rowBase.lookups.get(this.metadata.key)
    return e
      ? e.id != null
        ? e.id.toString()
        : null
      : this.metadata.valueConverter.toInput(this.value, this.settings.inputType)
  }
  set inputValue(e) {
    let t = this.rowBase.lookups.get(this.metadata.key)
    t
      ? t.setId(e)
      : (this.value = this.metadata.valueConverter.fromInput(e, this.settings.inputType))
  }
  valueChanged() {
    this.reportObserved()
    let e = this.value,
      t = this.rowBase.lookups.get(this.metadata.key)
    return (
      t && (e = t.id),
      JSON.stringify(
        this.metadata.valueConverter.toJson(this.rowBase.originalValues[this.metadata.key]),
      ) != JSON.stringify(this.metadata.valueConverter.toJson(e))
    )
  }
  async __performValidation() {
    var e
    try {
      const t = (r) => {
        r !== !0 &&
          r !== void 0 &&
          !this.error &&
          (typeof r == 'string' && r.length > 0 ? (this.error = r) : (this.error = 'invalid value'))
      }
      if (this.settings.validate) {
        let r = this,
          i = {
            entityRef: this.entityRef,
            get error() {
              return r.error
            },
            set error(s) {
              r.error = s
            },
            isNew: ((e = this.entityRef) == null ? void 0 : e.isNew()) ?? !1,
            load: () => r.load(),
            metadata: r.metadata,
            originalValue: r.originalValue,
            value: r.value,
            valueChanged: () => r.valueChanged(),
            originalValueIsNull: () => r.originalValueIsNull(),
            valueIsNull: () => r.valueIsNull(),
            isBackend: () => {
              var s, a, o
              return !(
                (o =
                  (a = (s = r.rowBase) == null ? void 0 : s.remult) == null
                    ? void 0
                    : a.dataProvider) != null && o.isProxy
              )
            },
          }
        if (Array.isArray(this.settings.validate))
          for (const s of this.settings.validate) t(await s(this.container, i))
        else
          typeof this.settings.validate == 'function' &&
            t(await this.settings.validate(this.container, i))
      }
    } catch (t) {
      typeof t == 'string' ? (this.error = t) : (this.error = t == null ? void 0 : t.message)
    }
  }
  async validate() {
    return await this.__performValidation(), !this.error
  }
}
let Ws = { transformCaption: (n, e, t, r) => t }
const Vs = O.captionTransformer || (O.captionTransformer = Ws)
function bi(n, e, t, r) {
  let i
  return (
    typeof n == 'function' ? t && (i = n(t)) : n && (i = n),
    (i = Vs.transformCaption(t, e, i ?? '', r)),
    i || (e ? ys(e) : '')
  )
}
class _i {
  constructor(e, t, r) {
    c(this, 'settings')
    c(this, 'entityDefs')
    c(this, 'remult')
    c(this, 'options')
    c(this, 'target')
    c(this, 'readonly', !1)
    c(this, 'valueConverter')
    c(this, 'allowNull')
    c(this, 'caption')
    c(this, 'dbName')
    c(this, 'inputType')
    c(this, 'key')
    c(this, 'isServerExpression', !1)
    c(this, 'valueType')
    ;(this.settings = e),
      (this.entityDefs = t),
      (this.remult = r),
      (this.options = this.settings),
      (this.target = this.settings.target),
      (this.valueConverter = new Proxy(this.settings.valueConverter ?? {}, {
        get: (i, s) => {
          let a = i[s]
          return typeof a == 'function'
            ? (...o) => {
                try {
                  return i[s](...o)
                } catch (l) {
                  const u = `${String(s)} failed for value ${o == null ? void 0 : o[0]}. Error: ${typeof l == 'string' ? l : l.message}`
                  throw { message: this.caption + ': ' + u, modelState: { [this.key]: u } }
                }
              }
            : a
        },
      })),
      (this.allowNull = !!this.settings.allowNull),
      (this.valueType = this.settings.valueType),
      (this.key = this.settings.key),
      (this.inputType = this.settings.inputType),
      e.serverExpression && (this.isServerExpression = !0),
      typeof this.settings.allowApiUpdate == 'boolean' &&
        (this.readonly = this.settings.allowApiUpdate),
      this.inputType || (this.inputType = this.valueConverter.inputType),
      (this.dbName = e.dbName),
      this.dbName == null && (this.dbName = e.key),
      (this.caption = bi(e.caption, e.key, r, t))
  }
  apiUpdateAllowed(e) {
    return this.options.allowApiUpdate === void 0
      ? !0
      : this.remult.isAllowedForInstance(e, this.options.allowApiUpdate)
  }
  displayValue(e) {
    return this.entityDefs.getEntityMetadataWithoutBreakingTheEntity(e).fields.find(this.key)
      .displayValue
  }
  includedInApi(e) {
    return this.options.includeInApi === void 0
      ? !0
      : this.remult.isAllowedForInstance(e, this.options.includeInApi)
  }
  toInput(e, t) {
    return this.valueConverter.toInput(e, t)
  }
  fromInput(e, t) {
    return this.valueConverter.fromInput(e, t)
  }
  async getDbName() {
    return wr(this, this.entityDefs)
  }
  get dbReadOnly() {
    return !!this.settings.dbReadOnly
  }
}
class Hs {
  constructor(e, t, r, i, s) {
    c(this, 'entityInfo')
    c(this, 'remult')
    c(this, 'entityType')
    c(this, 'key')
    c(this, 'options')
    c(this, 'fieldsMetadata', [])
    c(this, 'idMetadata', {
      getId: (e) => {
        if (e == null) return e
        const t = X(e, !1)
        return t
          ? t.getId()
          : this.idMetadata.field instanceof $e
            ? this.idMetadata.field.getId(e)
            : e[this.idMetadata.field.key]
      },
      field: void 0,
      get fields() {
        return this.field instanceof $e ? this.field.fields : [this.field]
      },
      createIdInFilter: (e) =>
        e.length > 0
          ? { $or: e.map((t) => this.idMetadata.getIdFilter(X(t).getId())) }
          : { [this.fields.toArray()[0].key]: [] },
      isIdField: (e) => e.key == this.idMetadata.field.key,
      getIdFilter: (...e) => {
        if (this.idMetadata.field instanceof $e) {
          let t = this.idMetadata.field
          return e.length == 1 ? t.isEqualTo(e[0]) : { $or: e.map((r) => t.isEqualTo(r)) }
        }
        return e.length == 1
          ? { [this.idMetadata.field.key]: e[0] }
          : { [this.idMetadata.field.key]: e }
      },
    })
    c(this, 'fields')
    c(this, 'dbName')
    c(this, 'caption')
    if (
      ((this.entityInfo = t),
      (this.remult = r),
      (this.entityType = i),
      (this.key = s),
      (this.options = t),
      this.options.allowApiCrud !== void 0)
    ) {
      let o
      typeof this.options.allowApiCrud == 'function'
        ? (o = (l, u) => this.options.allowApiCrud(u))
        : (o = this.options.allowApiCrud),
        this.options.allowApiDelete === void 0 && (this.entityInfo.allowApiDelete = o),
        this.options.allowApiInsert === void 0 && (this.entityInfo.allowApiInsert = o),
        this.options.allowApiUpdate === void 0 && (this.entityInfo.allowApiUpdate = o),
        this.options.allowApiRead === void 0 &&
          (this.options.allowApiRead = this.options.allowApiCrud)
    }
    this.options.allowApiRead === void 0 && (this.options.allowApiRead = !0),
      this.key || (this.key = i.name),
      t.dbName || (t.dbName = this.key),
      (this.dbName = t.dbName)
    let a = {
      find: (o) => a[typeof o == 'string' ? o : o.key],
      [Symbol.iterator]: () => this.fieldsMetadata[Symbol.iterator](),
      toArray: () => this.fieldsMetadata,
    }
    for (const o of e) this.fieldsMetadata.push((a[o.key] = new _i(o, this, r)))
    if (((this.fields = a), (this.caption = bi(t.caption, this.key, r, this)), t.id)) {
      let o =
        typeof t.id == 'function'
          ? t.id(this.fields)
          : Object.keys(t.id).map((l) => this.fields.find(l))
      Array.isArray(o)
        ? o.length > 1
          ? (this.idMetadata.field = new $e(...o))
          : o.length == 1 && (this.idMetadata.field = o[0])
        : (this.idMetadata.field = o)
    }
    if (!this.idMetadata.field) {
      const o = this.fields.id
      o ? (this.idMetadata.field = o) : (this.idMetadata.field = [...this.fields][0])
    }
  }
  apiUpdateAllowed(e) {
    return this.options.allowApiUpdate === void 0
      ? !1
      : e
        ? this.getEntityMetadataWithoutBreakingTheEntity(e).apiUpdateAllowed
        : this.remult.isAllowedForInstance(void 0, this.options.allowApiUpdate)
  }
  get apiReadAllowed() {
    return this.options.allowApiRead === void 0
      ? !0
      : this.remult.isAllowed(this.options.allowApiRead)
  }
  apiDeleteAllowed(e) {
    return this.options.allowApiDelete === void 0
      ? !1
      : e
        ? this.getEntityMetadataWithoutBreakingTheEntity(e).apiDeleteAllowed
        : this.remult.isAllowedForInstance(void 0, this.options.allowApiDelete)
  }
  apiInsertAllowed(e) {
    return this.options.allowApiUpdate === void 0
      ? !1
      : e
        ? this.getEntityMetadataWithoutBreakingTheEntity(e).apiInsertAllowed
        : this.remult.isAllowedForInstance(void 0, this.options.allowApiInsert)
  }
  getEntityMetadataWithoutBreakingTheEntity(e) {
    let t = X(e, !1)
    return t || this.remult.repo(this.entityType).getEntityRef({ ...e })
  }
  getDbName() {
    return Ei(this)
  }
}
function xs(n) {
  var e, t
  return (
    ((t = (e = n.options) == null ? void 0 : e.valueConverter) == null
      ? void 0
      : t.fieldTypeInDb) === 'autoincrement'
  )
}
const Qs = Symbol.for('storableMember'),
  zt = Symbol.for('fieldOptionalValues')
function ki(n, e) {
  let t = {}
  for (const r of n)
    if (r)
      if (typeof r == 'function') r(t, e)
      else {
        const { validate: i, ...s } = r
        ;(t.validate = Ot(t.validate, i)), Object.assign(t, s)
      }
  return t
}
function mr(n, e) {
  if (n.valueType) {
    let i = n.valueType[Qs]
    i && (n = ki([...i, n], e))
  }
  if (n.valueType == String) {
    let i = n
    n.valueConverter || (i.valueConverter = de.String)
  }
  if (n.valueType == Number) {
    let i = n
    n.valueConverter || (i.valueConverter = de.Number)
  }
  if (n.valueType == Date) {
    let i = n
    n.valueConverter || (i.valueConverter = de.Date)
  }
  if (n.valueType == Boolean) {
    let i = n
    i.valueConverter || (i.valueConverter = de.Boolean)
  }
  if (!n.valueConverter) {
    if (_e(n.valueType, !1)) {
      let s
      ;(n.valueConverter = { toDb: (a) => a, fromDb: (a) => a }),
        (n.valueConverter = new Proxy(n.valueConverter, {
          get(a, o) {
            if (a[o] === void 0 && s === void 0) {
              if (o === 'inputType') return ''
              s = e.repo(n.valueType).metadata.idMetadata.field.valueType === Number
              for (const l of ['fieldTypeInDb', 'toJson', 'fromJson', 'toDb', 'fromDb'])
                a[l] = s ? de.Integer[l] : de.String[l]
            }
            return a[o]
          },
          set(a, o, l, u) {
            return (a[o] = l), !0
          },
        }))
    } else n.valueConverter = de.Default
    return n
  }
  n.valueConverter.toJson || (n.valueConverter.toJson = (i) => i),
    n.valueConverter.fromJson || (n.valueConverter.fromJson = (i) => i)
  const t = n.valueConverter.fromJson,
    r = n.valueConverter.toJson
  return (
    n.valueConverter.toDb || (n.valueConverter.toDb = (i) => r(i)),
    n.valueConverter.fromDb || (n.valueConverter.fromDb = (i) => t(i)),
    n.valueConverter.toInput || (n.valueConverter.toInput = (i) => r(i)),
    n.valueConverter.fromInput || (n.valueConverter.fromInput = (i) => t(i)),
    n
  )
}
class Ii {
  get _() {
    return X(this)
  }
  save() {
    return X(this).save()
  }
  assign(e) {
    return ir(this, e), this
  }
  delete() {
    return this._.delete()
  }
  isNew() {
    return this._.isNew()
  }
  get $() {
    return this._.fields
  }
}
class Gs {
  constructor(e, t) {
    c(this, 'options')
    c(this, 'repo')
    c(this, '_count')
    ;(this.options = e),
      (this.repo = t),
      this.options || (this.options = {}),
      this.options.pageSize || (this.options.pageSize = Ns.defaultPageSize)
  }
  async getPage(e) {
    return (
      (e ?? 0) < 1 && (e = 1),
      this.repo.find({
        where: this.options.where,
        orderBy: this.options.orderBy,
        limit: this.options.pageSize,
        page: e,
        load: this.options.load,
        include: this.options.include,
      })
    )
  }
  async count() {
    return (
      this._count === void 0 && (this._count = await this.repo.count(this.options.where)),
      this._count
    )
  }
  async forEach(e) {
    let t = 0
    for await (const r of this) await e(r), t++
    return t
  }
  async paginator(e) {
    this.options.orderBy = ve.createUniqueEntityOrderBy(this.repo.metadata, this.options.orderBy)
    let t = await this.repo.find({
        where: { $and: [this.options.where, e] },
        orderBy: this.options.orderBy,
        limit: this.options.pageSize,
        load: this.options.load,
        include: this.options.include,
      }),
      r = () => {
        throw new Error('no more pages')
      },
      i = t.length == this.options.pageSize
    if (i) {
      let s = await this.repo._createAfterFilter(this.options.orderBy, t[t.length - 1])
      r = () => this.paginator(s)
    }
    return { count: () => this.count(), hasNextPage: i, items: t, nextPage: r }
  }
  [Symbol.asyncIterator]() {
    this.options.where || (this.options.where = {})
    let e = this.options.orderBy
    this.options.orderBy = ve.createUniqueEntityOrderBy(this.repo.metadata, e)
    let t = -1,
      r,
      i,
      s = 0
    return (
      (i = async () => {
        if (
          (this.options.progress && this.options.progress.progress(s++ / (await this.count())),
          r === void 0 || t == r.items.length)
        ) {
          if (r && !r.hasNextPage) return { value: void 0, done: !0 }
          let a = r
          if (
            (r ? (r = await r.nextPage()) : (r = await this.paginator()),
            (t = 0),
            r.items.length == 0)
          )
            return { value: void 0, done: !0 }
          if (
            ((a == null ? void 0 : a.items.length) ?? !1) &&
            this.repo.getEntityRef(a.items[0]).getId() == this.repo.getEntityRef(r.items[0]).getId()
          )
            throw new Error('pagination failure, returned same first row')
        }
        return t < r.items.length ? { value: r.items[t++], done: !1 } : { done: !0, value: void 0 }
      }),
      { next: async () => i() }
    )
  }
}
class wt {
  constructor() {
    c(this, '_subscribers')
  }
  reportChanged() {
    this._subscribers && this._subscribers.forEach((e) => e.reportChanged())
  }
  reportObserved() {
    this._subscribers && this._subscribers.forEach((e) => e.reportObserved())
  }
  subscribe(e) {
    let t
    return (
      typeof e == 'function'
        ? (t = { reportChanged: () => e(), reportObserved: () => {} })
        : (t = e),
      this._subscribers || (this._subscribers = []),
      this._subscribers.push(t),
      () => (this._subscribers = this._subscribers.filter((r) => r != t))
    )
  }
}
function zs(n) {
  return n.metadata ? n.metadata : _e(n, !1) ? ke.repo(n).metadata : n
}
function Ks(n) {
  return _e(n, !1) ? ke.repo(n) : n
}
async function nt(n, e) {
  const t = []
  for (let r = 0; r < n.length; r++) {
    const i = n[r]
    t.push(await e(i, r))
  }
  return t
}
const Ge = class Ge {
  constructor(e) {
    c(this, 'sql')
    c(this, 'wrapIdentifier', (e) => e)
    c(this, 'provideMigrationBuilder')
    c(this, 'createdEntities', [])
    c(this, 'end')
    ;(this.sql = e),
      e.wrapIdentifier && (this.wrapIdentifier = (t) => e.wrapIdentifier(t)),
      it(e, 'provideMigrationBuilder') &&
        (this.provideMigrationBuilder = (t) => e.provideMigrationBuilder(t)),
      it(e, 'end') && (this.end = () => e.end())
  }
  static getDb(e) {
    const t = e || ke.dataProvider
    if (it(t, 'createCommand')) return t
    throw 'the data provider is not an SqlCommandFactory'
  }
  createCommand() {
    return new Zs(this.sql.createCommand(), Ge.LogToConsole)
  }
  async execute(e) {
    return await this.createCommand().execute(e)
  }
  _getSourceSql() {
    return this.sql
  }
  async ensureSchema(e) {
    this.sql.ensureSchema && (await this.sql.ensureSchema(e))
  }
  getEntityDataProvider(e) {
    if (!this.sql.supportsJsonColumnType)
      for (const t of e.fields.toArray())
        t.valueConverter.fieldTypeInDb === 'json' &&
          (t.valueConverter = {
            ...t.valueConverter,
            toDb: de.JsonString.toDb,
            fromDb: de.JsonString.fromDb,
          })
    return new Oi(
      e,
      this,
      async (t) => {
        this.createdEntities.indexOf(t.$entityName) < 0 &&
          (this.createdEntities.push(t.$entityName), await this.sql.entityIsUsedForTheFirstTime(e))
      },
      this.sql,
    )
  }
  transaction(e) {
    return this.sql.transaction(async (t) => {
      let r = !1
      try {
        await e(
          new Ge({
            createCommand: () => {
              let i = t.createCommand()
              return {
                addParameterAndReturnSqlToken: (s) => i.param(s),
                param: (s) => i.param(s),
                execute: async (s) => {
                  if (r) throw "can't run a command after the transaction was completed"
                  return i.execute(s)
                },
              }
            },
            getLimitSqlSyntax: this.sql.getLimitSqlSyntax,
            entityIsUsedForTheFirstTime: (i) => t.entityIsUsedForTheFirstTime(i),
            transaction: (i) => t.transaction(i),
            supportsJsonColumnType: this.sql.supportsJsonColumnType,
            wrapIdentifier: this.wrapIdentifier,
            end: this.end,
            doesNotSupportReturningSyntax: this.sql.doesNotSupportReturningSyntax,
            doesNotSupportReturningSyntaxOnlyForUpdate:
              this.sql.doesNotSupportReturningSyntaxOnlyForUpdate,
            orderByNullsFirst: this.sql.orderByNullsFirst,
          }),
        )
      } finally {
        r = !0
      }
    })
  }
  static rawFilter(e) {
    return { [ci]: { buildSql: e } }
  }
  static async filterToRaw(e, t, r, i, s) {
    r || (r = new Ys())
    const a = Ks(e)
    var o = new De(r, i || (await Ci(a.metadata, s)))
    return (
      (o._addWhere = !1),
      await (await Be(a)._translateWhereToFilter(t)).__applyToConsumer(o),
      await o.resolveWhere()
    )
  }
}
c(Ge, 'LogToConsole', !1), c(Ge, 'durationThreshold', 0)
let ze = Ge
const Xs = new Map([
  ['INSERT', '⚪'],
  ['SELECT', '🔵'],
  ['UPDATE', '🟣'],
  ['DELETE', '🟤'],
  ['CREATE', '🟩'],
  ['ALTER', '🟨'],
  ['DROP', '🟥'],
  ['TRUNCATE', '⬛'],
  ['GRANT', '🟪'],
  ['REVOKE', '🟫'],
])
class Zs {
  constructor(e, t) {
    c(this, 'origin')
    c(this, 'logToConsole')
    c(this, 'args', {})
    ;(this.origin = e), (this.logToConsole = t)
  }
  addParameterAndReturnSqlToken(e) {
    return this.param(e)
  }
  param(e, t) {
    let r = this.origin.param(e)
    return (this.args[r] = e), r
  }
  async execute(e) {
    try {
      let r = new Date(),
        i = await this.origin.execute(e)
      if (this.logToConsole !== !1) {
        var t = new Date().valueOf() - r.valueOf()
        if (t > ze.durationThreshold) {
          const s = t / 1e3
          if (this.logToConsole === 'oneLiner') {
            const a = e
                .replace(/(\r\n|\n|\r|\t)/gm, ' ')
                .replace(/  +/g, ' ')
                .trim(),
              o = a.split(' ')[0].toUpperCase()
            console.info(`${Xs.get(o) || '💢'} (${s.toFixed(3)}) ${a} ${JSON.stringify(this.args)}`)
          } else
            typeof this.logToConsole == 'function'
              ? this.logToConsole(s, e, this.args)
              : console.info(
                  e +
                    `
`,
                  { arguments: this.args, duration: s },
                )
        }
      }
      return i
    } catch (r) {
      throw (
        (console.error(
          (r.message || 'Sql Error') +
            `:
`,
          e,
          { arguments: this.args, error: r },
        ),
        r)
      )
    }
  }
}
class Oi {
  constructor(e, t, r, i) {
    c(this, 'entity')
    c(this, 'sql')
    c(this, 'iAmUsed')
    c(this, 'strategy')
    ;(this.entity = e), (this.sql = t), (this.iAmUsed = r), (this.strategy = i)
  }
  async init() {
    let e = await Ci(this.entity, (t) => this.sql.wrapIdentifier(t))
    return await this.iAmUsed(e), e
  }
  async count(e) {
    let t = await this.init(),
      r = 'select count(*) count from ' + t.$entityName,
      i = this.sql.createCommand()
    if (e) {
      let s = new De(i, t)
      e.__applyToConsumer(s), (r += await s.resolveWhere())
    }
    return i.execute(r).then((s) => Number(s.rows[0].count))
  }
  async find(e) {
    let t = await this.init(),
      { colKeys: r, select: i } = this.buildSelect(t)
    ;(i = 'select ' + i),
      (i +=
        `
 from ` + t.$entityName)
    let s = this.sql.createCommand()
    if (e) {
      if (e.where) {
        let a = new De(s, t)
        e.where.__applyToConsumer(a), (i += await a.resolveWhere())
      }
      if (
        (e.limit && (e.orderBy = ve.createUniqueSort(this.entity, e.orderBy)),
        e.orderBy || (e.orderBy = ve.createUniqueSort(this.entity, new ve())),
        e.orderBy)
      ) {
        let a = !0,
          o = []
        for (const l of e.orderBy.Segments) o.push(l)
        for (const l of o)
          a ? ((i += ' Order By '), (a = !1)) : (i += ', '),
            (i += t.$dbNameOf(l.field)),
            l.isDescending && (i += ' desc'),
            this.sql._getSourceSql().orderByNullsFirst &&
              (l.isDescending ? (i += ' nulls last') : (i += ' nulls first'))
      }
      if (e.limit) {
        let a = 1
        e.page && (a = e.page),
          a < 1 && (a = 1),
          (i += ' ' + this.strategy.getLimitSqlSyntax(e.limit, (a - 1) * e.limit))
      }
    }
    return s.execute(i).then((a) => a.rows.map((o) => this.buildResultRow(r, o, a)))
  }
  buildResultRow(e, t, r) {
    let i = {}
    for (let s = 0; s < e.length; s++) {
      const a = e[s]
      try {
        i[a.key] = a.valueConverter.fromDb(t[r.getColumnKeyInResultForIndexInSelect(s)])
      } catch (o) {
        throw new Error(
          'Failed to load from db:' +
            a.key +
            `\r
` +
            o,
        )
      }
    }
    return i
  }
  buildSelect(e) {
    let t = '',
      r = []
    for (const i of this.entity.fields)
      i.isServerExpression ||
        (r.length > 0 && (t += ', '),
        (t += e.$dbNameOf(i)),
        i.options.sqlExpression && (t += ' as ' + i.key),
        r.push(i))
    return { colKeys: r, select: t }
  }
  async update(e, t) {
    let r = await this.init(),
      i = this.sql.createCommand(),
      s = 'update ' + r.$entityName + ' set ',
      a = !1
    for (const h of this.entity.fields)
      if (!Qr(h, r)) {
        if (t[h.key] !== void 0) {
          let p = h.valueConverter.toDb(t[h.key])
          p !== void 0 && (a ? (s += ', ') : (a = !0), (s += r.$dbNameOf(h) + ' = ' + i.param(p)))
        }
      }
    const o = this.entity.idMetadata.getIdFilter(e)
    let l = new De(i, r)
    S.fromEntityFilter(this.entity, o).__applyToConsumer(l), (s += await l.resolveWhere())
    let { colKeys: u, select: f } = this.buildSelect(r),
      d = !0
    return (
      this.sql._getSourceSql().doesNotSupportReturningSyntax && (d = !1),
      d && this.sql._getSourceSql().doesNotSupportReturningSyntaxOnlyForUpdate && (d = !1),
      d && (s += ' returning ' + f),
      i.execute(s).then((h) => {
        var p, m
        if (((m = (p = this.sql._getSourceSql()).afterMutation) == null || m.call(p), !d))
          return xr(this.entity, this, t, e, 'update')
        if (h.rows.length != 1)
          throw new Error('Failed to update row with id ' + e + ', rows updated: ' + h.rows.length)
        return this.buildResultRow(u, h.rows[0], h)
      })
    )
  }
  async delete(e) {
    let t = await this.init(),
      r = this.sql.createCommand(),
      i = new De(r, t)
    S.fromEntityFilter(this.entity, this.entity.idMetadata.getIdFilter(e)).__applyToConsumer(i)
    let s = 'delete from ' + t.$entityName
    return (
      (s += await i.resolveWhere()),
      r.execute(s).then(() => {
        var a, o
        ;(o = (a = this.sql._getSourceSql()).afterMutation) == null || o.call(a)
      })
    )
  }
  async insert(e) {
    let t = await this.init(),
      r = this.sql.createCommand(),
      i = '',
      s = '',
      a = !1
    for (const f of this.entity.fields)
      if (!Qr(f, t)) {
        let d = f.valueConverter.toDb(e[f.key])
        d != null &&
          (a ? ((i += ', '), (s += ', ')) : (a = !0), (i += t.$dbNameOf(f)), (s += r.param(d)))
      }
    let o = `insert into ${t.$entityName} (${i}) values (${s})`,
      { colKeys: l, select: u } = this.buildSelect(t)
    return (
      this.sql._getSourceSql().doesNotSupportReturningSyntax || (o += ' returning ' + u),
      await r.execute(o).then((f) => {
        var d, h
        if (
          ((h = (d = this.sql._getSourceSql()).afterMutation) == null || h.call(d),
          this.sql._getSourceSql().doesNotSupportReturningSyntax)
        )
          if (xs(this.entity.idMetadata.field)) {
            const p = f.rows[0]
            if (typeof p != 'number')
              throw new Error(
                'Auto increment, for a database that is does not support returning syntax, should return an array with the single last added id. Instead it returned: ' +
                  JSON.stringify(p),
              )
            return this.find({
              where: new S((m) => m.isEqualTo(this.entity.idMetadata.field, p)),
            }).then((m) => m[0])
          } else return xr(this.entity, this, e, void 0, 'insert')
        return this.buildResultRow(l, f.rows[0], f)
      })
    )
  }
}
c(Oi, 'LogToConsole', !1)
class Ys {
  execute(e) {
    throw new Error('Method not implemented.')
  }
  addParameterAndReturnSqlToken(e) {
    return this.param(e)
  }
  param(e) {
    return e === null
      ? 'null'
      : (e instanceof Date && (e = e.toISOString()),
        typeof e == 'string'
          ? (e == null && (e = ''), "'" + e.replace(/'/g, "''") + "'")
          : e.toString())
  }
}
function xr(n, e, t, r, i) {
  const s = r !== void 0 ? n.idMetadata.getIdFilter(r) : {}
  return e
    .find({
      where: new S((a) => {
        for (const o of n.idMetadata.fields) a.isEqualTo(o, t[o.key] ?? s[o.key])
      }),
    })
    .then((a) => {
      if (a.length != 1) throw new Error(`Failed to ${i} row - result contained ${a.length} rows`)
      return a[0]
    })
}
class De {
  constructor(e, t) {
    c(this, 'r')
    c(this, 'nameProvider')
    c(this, 'where', '')
    c(this, '_addWhere', !0)
    c(this, 'promises', [])
    ;(this.r = e), (this.nameProvider = t)
  }
  async resolveWhere() {
    for (; this.promises.length > 0; ) {
      let e = this.promises
      this.promises = []
      for (const t of e) await t
    }
    return this.where
  }
  custom(e, t) {
    throw new Error('Custom filter should be translated before it gets here')
  }
  or(e) {
    let t = ''
    this.promises.push(
      (async () => {
        for (const r of e) {
          let i = new De(this.r, this.nameProvider)
          ;(i._addWhere = !1), r.__applyToConsumer(i)
          let s = await i.resolveWhere()
          if (!s) return
          s.length > 0 &&
            (t.length > 0 && (t += ' or '), e.length > 1 ? (t += '(' + s + ')') : (t += s))
        }
        this.addToWhere('(' + t + ')')
      })(),
    )
  }
  not(e) {
    this.promises.push(
      (async () => {
        let t = new De(this.r, this.nameProvider)
        ;(t._addWhere = !1), e.__applyToConsumer(t)
        let r = await t.resolveWhere()
        r && this.addToWhere('not (' + r + ')')
      })(),
    )
  }
  isNull(e) {
    this.promises.push((async () => this.addToWhere(this.nameProvider.$dbNameOf(e) + ' is null'))())
  }
  isNotNull(e) {
    this.promises.push(
      (async () => this.addToWhere(this.nameProvider.$dbNameOf(e) + ' is not null'))(),
    )
  }
  isIn(e, t) {
    this.promises.push(
      (async () => {
        t && t.length > 0
          ? this.addToWhere(
              this.nameProvider.$dbNameOf(e) +
                ' in (' +
                t.map((r) => this.r.param(e.valueConverter.toDb(r))).join(',') +
                ')',
            )
          : this.addToWhere('1 = 0 /*isIn with no values*/')
      })(),
    )
  }
  isEqualTo(e, t) {
    this.add(e, t, '=')
  }
  isDifferentFrom(e, t) {
    this.add(e, t, '<>')
  }
  isGreaterOrEqualTo(e, t) {
    this.add(e, t, '>=')
  }
  isGreaterThan(e, t) {
    this.add(e, t, '>')
  }
  isLessOrEqualTo(e, t) {
    this.add(e, t, '<=')
  }
  isLessThan(e, t) {
    this.add(e, t, '<')
  }
  containsCaseInsensitive(e, t) {
    this.promises.push(
      (async () => {
        this.addToWhere(
          'lower (' +
            this.nameProvider.$dbNameOf(e) +
            ") like lower ('%" +
            t.replace(/'/g, "''") +
            "%')",
        )
      })(),
    )
  }
  notContainsCaseInsensitive(e, t) {
    this.promises.push(
      (async () => {
        this.addToWhere(
          'not lower (' +
            this.nameProvider.$dbNameOf(e) +
            ") like lower ('%" +
            t.replace(/'/g, "''") +
            "%')",
        )
      })(),
    )
  }
  startsWithCaseInsensitive(e, t) {
    this.promises.push(
      (async () => {
        this.addToWhere(
          'lower (' +
            this.nameProvider.$dbNameOf(e) +
            ") like lower ('" +
            t.replace(/'/g, "''") +
            "%')",
        )
      })(),
    )
  }
  endsWithCaseInsensitive(e, t) {
    this.promises.push(
      (async () => {
        this.addToWhere(
          'lower (' +
            this.nameProvider.$dbNameOf(e) +
            ") like lower ('%" +
            t.replace(/'/g, "''") +
            "')",
        )
      })(),
    )
  }
  add(e, t, r) {
    this.promises.push(
      (async () => {
        let i =
          this.nameProvider.$dbNameOf(e) + ' ' + r + ' ' + this.r.param(e.valueConverter.toDb(t))
        this.addToWhere(i)
      })(),
    )
  }
  addToWhere(e) {
    this.where.length == 0 ? this._addWhere && (this.where += ' where ') : (this.where += ' and '),
      (this.where += e)
  }
  databaseCustom(e) {
    this.promises.push(
      (async () => {
        if (e != null && e.buildSql) {
          let t = new ea(this.r, this.nameProvider.wrapIdentifier),
            r = await e.buildSql(t)
          typeof r != 'string' && (r = t.sql), r && this.addToWhere('(' + r + ')')
        }
      })(),
    )
  }
}
class ea {
  constructor(e, t) {
    c(this, 'r')
    c(this, 'wrapIdentifier')
    c(this, 'sql', '')
    c(
      this,
      'param',
      (e, t) => (
        typeof t == 'object' && t.valueConverter.toDb && (e = t.valueConverter.toDb(e)),
        this.r.param(e)
      ),
    )
    c(this, 'filterToRaw', async (e, t) => ze.filterToRaw(e, t, this, void 0, this.wrapIdentifier))
    ;(this.r = e), (this.wrapIdentifier = t), this.param.bind(this), this.filterToRaw.bind(this)
  }
  addParameterAndReturnSqlToken(e) {
    return this.param(e)
  }
}
function Qr(n, e) {
  return (
    n.dbReadOnly || n.isServerExpression || (n.options.sqlExpression && n.dbName != e.$dbNameOf(n))
  )
}
async function Ci(n, e) {
  return ta(n, e, !0)
}
async function ta(n, e, t = !1) {
  let r = typeof e == 'function' ? { wrapIdentifier: e } : e || {}
  var i = zs(n)
  r.wrapIdentifier || (r.wrapIdentifier = ke.dataProvider.wrapIdentifier),
    r.wrapIdentifier || (r.wrapIdentifier = (a) => a)
  const s = {
    $entityName: await Ei(i, r.wrapIdentifier),
    toString: () => s.$entityName,
    $dbNameOf: (a) => {
      var o
      return typeof a == 'string' ? (o = a) : (o = a.key), s[o]
    },
    wrapIdentifier: r.wrapIdentifier,
  }
  for (const a of i.fields) {
    let o = await wr(a, i, r.wrapIdentifier, t)
    a.options.sqlExpression ||
      (typeof r.tableName == 'string'
        ? (o = r.wrapIdentifier(r.tableName) + '.' + o)
        : r.tableName === !0 && (o = s.$entityName + '.' + o)),
      (s[a.key] = o)
  }
  return s
}
async function Ei(n, e = (t) => t) {
  if (n.options.sqlExpression) {
    if (typeof n.options.sqlExpression == 'string') return n.options.sqlExpression
    if (typeof n.options.sqlExpression == 'function') {
      const t = n.options.sqlExpression
      try {
        return (
          (n.options.sqlExpression = "recursive sqlExpression call for entity '" + n.key + "'. "),
          await t(n)
        )
      } finally {
        n.options.sqlExpression = t
      }
    }
  }
  return e(n.dbName)
}
const Kt = Symbol.for('sqlExpressionInProgressKey')
async function wr(n, e, t = (i) => i, r = !1) {
  try {
    if (n.options.sqlExpression) {
      let a
      if (typeof n.options.sqlExpression == 'function') {
        if (n[Kt] && !r) return "recursive sqlExpression call for field '" + n.key + "'. "
        try {
          ;(n[Kt] = !0), (a = await n.options.sqlExpression(e)), (n.options.sqlExpression = () => a)
        } finally {
          delete n[Kt]
        }
      } else a = n.options.sqlExpression
      return a || n.dbName
    }
    const i = ee(n)
    let s = (i == null ? void 0 : i.type) === 'toOne' && n.options.field
    if (s) {
      let a = e.fields.find(s)
      if (a) return wr(a, e, t, r)
    }
    return t(n.dbName)
  } finally {
  }
}
var Pt =
    typeof globalThis < 'u'
      ? globalThis
      : typeof window < 'u'
        ? window
        : typeof global < 'u'
          ? global
          : typeof self < 'u'
            ? self
            : {},
  Me = {},
  G = {},
  se = {}
Object.defineProperty(se, '__esModule', { value: !0 })
se.output = se.exists = se.hash = se.bytes = se.bool = se.number = se.isBytes = void 0
function Dt(n) {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`positive integer expected, not ${n}`)
}
se.number = Dt
function Ti(n) {
  if (typeof n != 'boolean') throw new Error(`boolean expected, not ${n}`)
}
se.bool = Ti
function Si(n) {
  return (
    n instanceof Uint8Array ||
    (n != null && typeof n == 'object' && n.constructor.name === 'Uint8Array')
  )
}
se.isBytes = Si
function gr(n, ...e) {
  if (!Si(n)) throw new Error('Uint8Array expected')
  if (e.length > 0 && !e.includes(n.length))
    throw new Error(`Uint8Array expected of length ${e}, not of length=${n.length}`)
}
se.bytes = gr
function Ai(n) {
  if (typeof n != 'function' || typeof n.create != 'function')
    throw new Error('Hash should be wrapped by utils.wrapConstructor')
  Dt(n.outputLen), Dt(n.blockLen)
}
se.hash = Ai
function Fi(n, e = !0) {
  if (n.destroyed) throw new Error('Hash instance has been destroyed')
  if (e && n.finished) throw new Error('Hash#digest() has already been called')
}
se.exists = Fi
function Pi(n, e) {
  gr(n)
  const t = e.outputLen
  if (n.length < t) throw new Error(`digestInto() expects output buffer of length at least ${t}`)
}
se.output = Pi
const ra = { number: Dt, bool: Ti, bytes: gr, hash: Ai, exists: Fi, output: Pi }
se.default = ra
var F = {}
Object.defineProperty(F, '__esModule', { value: !0 })
F.add5L =
  F.add5H =
  F.add4H =
  F.add4L =
  F.add3H =
  F.add3L =
  F.add =
  F.rotlBL =
  F.rotlBH =
  F.rotlSL =
  F.rotlSH =
  F.rotr32L =
  F.rotr32H =
  F.rotrBL =
  F.rotrBH =
  F.rotrSL =
  F.rotrSH =
  F.shrSL =
  F.shrSH =
  F.toBig =
  F.split =
  F.fromBig =
    void 0
const gt = BigInt(2 ** 32 - 1),
  nr = BigInt(32)
function vr(n, e = !1) {
  return e
    ? { h: Number(n & gt), l: Number((n >> nr) & gt) }
    : { h: Number((n >> nr) & gt) | 0, l: Number(n & gt) | 0 }
}
F.fromBig = vr
function Di(n, e = !1) {
  let t = new Uint32Array(n.length),
    r = new Uint32Array(n.length)
  for (let i = 0; i < n.length; i++) {
    const { h: s, l: a } = vr(n[i], e)
    ;[t[i], r[i]] = [s, a]
  }
  return [t, r]
}
F.split = Di
const Ri = (n, e) => (BigInt(n >>> 0) << nr) | BigInt(e >>> 0)
F.toBig = Ri
const Mi = (n, e, t) => n >>> t
F.shrSH = Mi
const Ni = (n, e, t) => (n << (32 - t)) | (e >>> t)
F.shrSL = Ni
const Li = (n, e, t) => (n >>> t) | (e << (32 - t))
F.rotrSH = Li
const $i = (n, e, t) => (n << (32 - t)) | (e >>> t)
F.rotrSL = $i
const qi = (n, e, t) => (n << (64 - t)) | (e >>> (t - 32))
F.rotrBH = qi
const Bi = (n, e, t) => (n >>> (t - 32)) | (e << (64 - t))
F.rotrBL = Bi
const Ji = (n, e) => e
F.rotr32H = Ji
const ji = (n, e) => n
F.rotr32L = ji
const Ui = (n, e, t) => (n << t) | (e >>> (32 - t))
F.rotlSH = Ui
const Wi = (n, e, t) => (e << t) | (n >>> (32 - t))
F.rotlSL = Wi
const Vi = (n, e, t) => (e << (t - 32)) | (n >>> (64 - t))
F.rotlBH = Vi
const Hi = (n, e, t) => (n << (t - 32)) | (e >>> (64 - t))
F.rotlBL = Hi
function xi(n, e, t, r) {
  const i = (e >>> 0) + (r >>> 0)
  return { h: (n + t + ((i / 2 ** 32) | 0)) | 0, l: i | 0 }
}
F.add = xi
const Qi = (n, e, t) => (n >>> 0) + (e >>> 0) + (t >>> 0)
F.add3L = Qi
const Gi = (n, e, t, r) => (e + t + r + ((n / 2 ** 32) | 0)) | 0
F.add3H = Gi
const zi = (n, e, t, r) => (n >>> 0) + (e >>> 0) + (t >>> 0) + (r >>> 0)
F.add4L = zi
const Ki = (n, e, t, r, i) => (e + t + r + i + ((n / 2 ** 32) | 0)) | 0
F.add4H = Ki
const Xi = (n, e, t, r, i) => (n >>> 0) + (e >>> 0) + (t >>> 0) + (r >>> 0) + (i >>> 0)
F.add5L = Xi
const Zi = (n, e, t, r, i, s) => (e + t + r + i + s + ((n / 2 ** 32) | 0)) | 0
F.add5H = Zi
const ia = {
  fromBig: vr,
  split: Di,
  toBig: Ri,
  shrSH: Mi,
  shrSL: Ni,
  rotrSH: Li,
  rotrSL: $i,
  rotrBH: qi,
  rotrBL: Bi,
  rotr32H: Ji,
  rotr32L: ji,
  rotlSH: Ui,
  rotlSL: Wi,
  rotlBH: Vi,
  rotlBL: Hi,
  add: xi,
  add3L: Qi,
  add3H: Gi,
  add4L: zi,
  add4H: Ki,
  add5H: Zi,
  add5L: Xi,
}
F.default = ia
var Yi = {},
  Bt = {}
Object.defineProperty(Bt, '__esModule', { value: !0 })
Bt.crypto = void 0
Bt.crypto = typeof globalThis == 'object' && 'crypto' in globalThis ? globalThis.crypto : void 0
;(function (n) {
  /*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */ Object.defineProperty(
    n,
    '__esModule',
    { value: !0 },
  ),
    (n.randomBytes =
      n.wrapXOFConstructorWithOpts =
      n.wrapConstructorWithOpts =
      n.wrapConstructor =
      n.checkOpts =
      n.Hash =
      n.concatBytes =
      n.toBytes =
      n.utf8ToBytes =
      n.asyncLoop =
      n.nextTick =
      n.hexToBytes =
      n.bytesToHex =
      n.byteSwap32 =
      n.byteSwapIfBE =
      n.byteSwap =
      n.isLE =
      n.rotl =
      n.rotr =
      n.createView =
      n.u32 =
      n.u8 =
      n.isBytes =
        void 0)
  const e = Bt,
    t = se
  function r(g) {
    return (
      g instanceof Uint8Array ||
      (g != null && typeof g == 'object' && g.constructor.name === 'Uint8Array')
    )
  }
  n.isBytes = r
  const i = (g) => new Uint8Array(g.buffer, g.byteOffset, g.byteLength)
  n.u8 = i
  const s = (g) => new Uint32Array(g.buffer, g.byteOffset, Math.floor(g.byteLength / 4))
  n.u32 = s
  const a = (g) => new DataView(g.buffer, g.byteOffset, g.byteLength)
  n.createView = a
  const o = (g, P) => (g << (32 - P)) | (g >>> P)
  n.rotr = o
  const l = (g, P) => (g << P) | ((g >>> (32 - P)) >>> 0)
  ;(n.rotl = l), (n.isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)
  const u = (g) =>
    ((g << 24) & 4278190080) | ((g << 8) & 16711680) | ((g >>> 8) & 65280) | ((g >>> 24) & 255)
  ;(n.byteSwap = u), (n.byteSwapIfBE = n.isLE ? (g) => g : (g) => (0, n.byteSwap)(g))
  function f(g) {
    for (let P = 0; P < g.length; P++) g[P] = (0, n.byteSwap)(g[P])
  }
  n.byteSwap32 = f
  const d = Array.from({ length: 256 }, (g, P) => P.toString(16).padStart(2, '0'))
  function h(g) {
    ;(0, t.bytes)(g)
    let P = ''
    for (let K = 0; K < g.length; K++) P += d[g[K]]
    return P
  }
  n.bytesToHex = h
  const p = { _0: 48, _9: 57, _A: 65, _F: 70, _a: 97, _f: 102 }
  function m(g) {
    if (g >= p._0 && g <= p._9) return g - p._0
    if (g >= p._A && g <= p._F) return g - (p._A - 10)
    if (g >= p._a && g <= p._f) return g - (p._a - 10)
  }
  function b(g) {
    if (typeof g != 'string') throw new Error('hex string expected, got ' + typeof g)
    const P = g.length,
      K = P / 2
    if (P % 2) throw new Error('padded hex string expected, got unpadded hex of length ' + P)
    const Q = new Uint8Array(K)
    for (let te = 0, le = 0; te < K; te++, le += 2) {
      const Ze = m(g.charCodeAt(le)),
        Ye = m(g.charCodeAt(le + 1))
      if (Ze === void 0 || Ye === void 0) {
        const ct = g[le] + g[le + 1]
        throw new Error('hex string expected, got non-hex character "' + ct + '" at index ' + le)
      }
      Q[te] = Ze * 16 + Ye
    }
    return Q
  }
  n.hexToBytes = b
  const k = async () => {}
  n.nextTick = k
  async function E(g, P, K) {
    let Q = Date.now()
    for (let te = 0; te < g; te++) {
      K(te)
      const le = Date.now() - Q
      ;(le >= 0 && le < P) || (await (0, n.nextTick)(), (Q += le))
    }
  }
  n.asyncLoop = E
  function I(g) {
    if (typeof g != 'string') throw new Error(`utf8ToBytes expected string, got ${typeof g}`)
    return new Uint8Array(new TextEncoder().encode(g))
  }
  n.utf8ToBytes = I
  function B(g) {
    return typeof g == 'string' && (g = I(g)), (0, t.bytes)(g), g
  }
  n.toBytes = B
  function D(...g) {
    let P = 0
    for (let Q = 0; Q < g.length; Q++) {
      const te = g[Q]
      ;(0, t.bytes)(te), (P += te.length)
    }
    const K = new Uint8Array(P)
    for (let Q = 0, te = 0; Q < g.length; Q++) {
      const le = g[Q]
      K.set(le, te), (te += le.length)
    }
    return K
  }
  n.concatBytes = D
  class q {
    clone() {
      return this._cloneInto()
    }
  }
  n.Hash = q
  const ne = {}.toString
  function oe(g, P) {
    if (P !== void 0 && ne.call(P) !== '[object Object]')
      throw new Error('Options should be object or undefined')
    return Object.assign(g, P)
  }
  n.checkOpts = oe
  function R(g) {
    const P = (Q) => g().update(B(Q)).digest(),
      K = g()
    return (P.outputLen = K.outputLen), (P.blockLen = K.blockLen), (P.create = () => g()), P
  }
  n.wrapConstructor = R
  function x(g) {
    const P = (Q, te) => g(te).update(B(Q)).digest(),
      K = g({})
    return (P.outputLen = K.outputLen), (P.blockLen = K.blockLen), (P.create = (Q) => g(Q)), P
  }
  n.wrapConstructorWithOpts = x
  function Jt(g) {
    const P = (Q, te) => g(te).update(B(Q)).digest(),
      K = g({})
    return (P.outputLen = K.outputLen), (P.blockLen = K.blockLen), (P.create = (Q) => g(Q)), P
  }
  n.wrapXOFConstructorWithOpts = Jt
  function jt(g = 32) {
    if (e.crypto && typeof e.crypto.getRandomValues == 'function')
      return e.crypto.getRandomValues(new Uint8Array(g))
    throw new Error('crypto.getRandomValues must be defined')
  }
  n.randomBytes = jt
})(Yi)
Object.defineProperty(G, '__esModule', { value: !0 })
G.shake256 =
  G.shake128 =
  G.keccak_512 =
  G.keccak_384 =
  G.keccak_256 =
  G.keccak_224 =
  G.sha3_512 =
  G.sha3_384 =
  G.sha3_256 =
  G.sha3_224 =
  G.Keccak =
  G.keccakP =
    void 0
const He = se,
  ot = F,
  Ae = Yi,
  en = [],
  tn = [],
  rn = [],
  na = BigInt(0),
  tt = BigInt(1),
  sa = BigInt(2),
  aa = BigInt(7),
  oa = BigInt(256),
  la = BigInt(113)
for (let n = 0, e = tt, t = 1, r = 0; n < 24; n++) {
  ;([t, r] = [r, (2 * t + 3 * r) % 5]),
    en.push(2 * (5 * r + t)),
    tn.push((((n + 1) * (n + 2)) / 2) % 64)
  let i = na
  for (let s = 0; s < 7; s++)
    (e = ((e << tt) ^ ((e >> aa) * la)) % oa), e & sa && (i ^= tt << ((tt << BigInt(s)) - tt))
  rn.push(i)
}
const [ua, fa] = (0, ot.split)(rn, !0),
  Gr = (n, e, t) => (t > 32 ? (0, ot.rotlBH)(n, e, t) : (0, ot.rotlSH)(n, e, t)),
  zr = (n, e, t) => (t > 32 ? (0, ot.rotlBL)(n, e, t) : (0, ot.rotlSL)(n, e, t))
function nn(n, e = 24) {
  const t = new Uint32Array(10)
  for (let r = 24 - e; r < 24; r++) {
    for (let a = 0; a < 10; a++) t[a] = n[a] ^ n[a + 10] ^ n[a + 20] ^ n[a + 30] ^ n[a + 40]
    for (let a = 0; a < 10; a += 2) {
      const o = (a + 8) % 10,
        l = (a + 2) % 10,
        u = t[l],
        f = t[l + 1],
        d = Gr(u, f, 1) ^ t[o],
        h = zr(u, f, 1) ^ t[o + 1]
      for (let p = 0; p < 50; p += 10) (n[a + p] ^= d), (n[a + p + 1] ^= h)
    }
    let i = n[2],
      s = n[3]
    for (let a = 0; a < 24; a++) {
      const o = tn[a],
        l = Gr(i, s, o),
        u = zr(i, s, o),
        f = en[a]
      ;(i = n[f]), (s = n[f + 1]), (n[f] = l), (n[f + 1] = u)
    }
    for (let a = 0; a < 50; a += 10) {
      for (let o = 0; o < 10; o++) t[o] = n[a + o]
      for (let o = 0; o < 10; o++) n[a + o] ^= ~t[(o + 2) % 10] & t[(o + 4) % 10]
    }
    ;(n[0] ^= ua[r]), (n[1] ^= fa[r])
  }
  t.fill(0)
}
G.keccakP = nn
class dt extends Ae.Hash {
  constructor(e, t, r, i = !1, s = 24) {
    if (
      (super(),
      (this.blockLen = e),
      (this.suffix = t),
      (this.outputLen = r),
      (this.enableXOF = i),
      (this.rounds = s),
      (this.pos = 0),
      (this.posOut = 0),
      (this.finished = !1),
      (this.destroyed = !1),
      (0, He.number)(r),
      0 >= this.blockLen || this.blockLen >= 200)
    )
      throw new Error('Sha3 supports only keccak-f1600 function')
    ;(this.state = new Uint8Array(200)), (this.state32 = (0, Ae.u32)(this.state))
  }
  keccak() {
    Ae.isLE || (0, Ae.byteSwap32)(this.state32),
      nn(this.state32, this.rounds),
      Ae.isLE || (0, Ae.byteSwap32)(this.state32),
      (this.posOut = 0),
      (this.pos = 0)
  }
  update(e) {
    ;(0, He.exists)(this)
    const { blockLen: t, state: r } = this
    e = (0, Ae.toBytes)(e)
    const i = e.length
    for (let s = 0; s < i; ) {
      const a = Math.min(t - this.pos, i - s)
      for (let o = 0; o < a; o++) r[this.pos++] ^= e[s++]
      this.pos === t && this.keccak()
    }
    return this
  }
  finish() {
    if (this.finished) return
    this.finished = !0
    const { state: e, suffix: t, pos: r, blockLen: i } = this
    ;(e[r] ^= t), t & 128 && r === i - 1 && this.keccak(), (e[i - 1] ^= 128), this.keccak()
  }
  writeInto(e) {
    ;(0, He.exists)(this, !1), (0, He.bytes)(e), this.finish()
    const t = this.state,
      { blockLen: r } = this
    for (let i = 0, s = e.length; i < s; ) {
      this.posOut >= r && this.keccak()
      const a = Math.min(r - this.posOut, s - i)
      e.set(t.subarray(this.posOut, this.posOut + a), i), (this.posOut += a), (i += a)
    }
    return e
  }
  xofInto(e) {
    if (!this.enableXOF) throw new Error('XOF is not possible for this instance')
    return this.writeInto(e)
  }
  xof(e) {
    return (0, He.number)(e), this.xofInto(new Uint8Array(e))
  }
  digestInto(e) {
    if (((0, He.output)(e, this), this.finished)) throw new Error('digest() was already called')
    return this.writeInto(e), this.destroy(), e
  }
  digest() {
    return this.digestInto(new Uint8Array(this.outputLen))
  }
  destroy() {
    ;(this.destroyed = !0), this.state.fill(0)
  }
  _cloneInto(e) {
    const { blockLen: t, suffix: r, outputLen: i, rounds: s, enableXOF: a } = this
    return (
      e || (e = new dt(t, r, i, a, s)),
      e.state32.set(this.state32),
      (e.pos = this.pos),
      (e.posOut = this.posOut),
      (e.finished = this.finished),
      (e.rounds = s),
      (e.suffix = r),
      (e.outputLen = i),
      (e.enableXOF = a),
      (e.destroyed = this.destroyed),
      e
    )
  }
}
G.Keccak = dt
const Ne = (n, e, t) => (0, Ae.wrapConstructor)(() => new dt(e, n, t))
G.sha3_224 = Ne(6, 144, 224 / 8)
G.sha3_256 = Ne(6, 136, 256 / 8)
G.sha3_384 = Ne(6, 104, 384 / 8)
G.sha3_512 = Ne(6, 72, 512 / 8)
G.keccak_224 = Ne(1, 144, 224 / 8)
G.keccak_256 = Ne(1, 136, 256 / 8)
G.keccak_384 = Ne(1, 104, 384 / 8)
G.keccak_512 = Ne(1, 72, 512 / 8)
const sn = (n, e, t) =>
  (0, Ae.wrapXOFConstructorWithOpts)((r = {}) => new dt(e, n, r.dkLen === void 0 ? t : r.dkLen, !0))
G.shake128 = sn(31, 168, 128 / 8)
G.shake256 = sn(31, 136, 256 / 8)
const { sha3_512: da } = G,
  an = 24,
  st = 32,
  sr = (n = 4, e = Math.random) => {
    let t = ''
    for (; t.length < n; ) t = t + Math.floor(e() * 36).toString(36)
    return t
  }
function on(n) {
  let e = 8n,
    t = 0n
  for (const r of n.values()) {
    const i = BigInt(r)
    t = (t << e) + i
  }
  return t
}
const ln = (n = '') => on(da(n)).toString(36).slice(1),
  Kr = Array.from({ length: 26 }, (n, e) => String.fromCharCode(e + 97)),
  ca = (n) => Kr[Math.floor(n() * Kr.length)],
  un = ({
    globalObj: n = typeof Pt < 'u' ? Pt : typeof window < 'u' ? window : {},
    random: e = Math.random,
  } = {}) => {
    const t = Object.keys(n).toString(),
      r = t.length ? t + sr(st, e) : sr(st, e)
    return ln(r).substring(0, st)
  },
  fn = (n) => () => n++,
  ha = 476782367,
  dn = ({
    random: n = Math.random,
    counter: e = fn(Math.floor(n() * ha)),
    length: t = an,
    fingerprint: r = un({ random: n }),
  } = {}) =>
    function () {
      const s = ca(n),
        a = Date.now().toString(36),
        o = e().toString(36),
        l = sr(t, n),
        u = `${a + l + o + r}`
      return `${s + ln(u).substring(1, t)}`
    },
  pa = dn(),
  ya = (n, { minLength: e = 2, maxLength: t = st } = {}) => {
    const r = n.length,
      i = /^[0-9a-z]+$/
    try {
      if (typeof n == 'string' && r >= e && r <= t && i.test(n)) return !0
    } finally {
    }
    return !1
  }
Me.getConstants = () => ({ defaultLength: an, bigLength: st })
Me.init = dn
Me.createId = pa
Me.bufToBigInt = on
Me.createCounter = fn
Me.createFingerprint = un
Me.isCuid = ya
const { createId: ma, init: no, getConstants: so, isCuid: ao } = Me
var Xr = ma
const Zr = kt((n) => !isNaN(n) && isFinite(n))
class br {
  static object(...e) {
    return we(void 0, ...e)
  }
  static json(...e) {
    let t = e
    return (
      t.valueConverter &&
        !t.valueConverter.fieldTypeInDb &&
        (t.valueConverter.fieldTypeInDb = 'json'),
      we(void 0, { valueConverter: { fieldTypeInDb: 'json' } }, ...e)
    )
  }
  static dateOnly(...e) {
    return we(() => Date, { valueConverter: de.DateOnly }, ...e)
  }
  static date(...e) {
    return we(() => Date, ...e)
  }
  static integer(...e) {
    return we(() => Number, { valueConverter: de.Integer, validate: Zr }, ...e)
  }
  static autoIncrement(...e) {
    return we(
      () => Number,
      {
        allowApiUpdate: !1,
        dbReadOnly: !0,
        valueConverter: { ...de.Integer, fieldTypeInDb: 'autoincrement' },
      },
      ...e,
    )
  }
  static number(...e) {
    return we(() => Number, { validate: Zr }, ...e)
  }
  static createdAt(...e) {
    return we(
      () => Date,
      {
        allowApiUpdate: !1,
        saving: (t, r, { isNew: i }) => {
          i && (r.value = new Date())
        },
      },
      ...e,
    )
  }
  static updatedAt(...e) {
    return we(
      () => Date,
      {
        allowApiUpdate: !1,
        saving: (t, r) => {
          r.value = new Date()
        },
      },
      ...e,
    )
  }
  static uuid(...e) {
    return we(
      () => String,
      {
        allowApiUpdate: !1,
        defaultValue: () => er(),
        saving: (t, r) => {
          r.value || (r.value = er())
        },
      },
      ...e,
    )
  }
  static cuid(...e) {
    return we(
      () => String,
      {
        allowApiUpdate: !1,
        defaultValue: () => Xr(),
        saving: (t, r) => {
          r.value || (r.value = Xr())
        },
      },
      ...e,
    )
  }
  static literal(e, ...t) {
    return br.string({ validate: (r, i) => Fe.in(e())(r, i), [zt]: e }, ...t)
  }
  static enum(e, ...t) {
    let r
    return we(
      () => e(),
      { validate: (i, s) => Fe.enum(e())(i, s), [zt]: () => It(e()) },
      ...t,
      (i) => {
        if (((i[zt] = () => It(e())), r === void 0)) {
          let s = e()
          r = It(s).find((o) => typeof o == 'string') ? de.String : de.Integer
        }
        i.valueConverter
          ? i.valueConverter.fieldTypeInDb || (i.valueConverter.fieldTypeInDb = r.fieldTypeInDb)
          : (i.valueConverter = r)
      },
    )
  }
  static string(...e) {
    return we(() => String, ...e)
  }
  static boolean(...e) {
    return we(() => Boolean, ...e)
  }
}
function we(n, ...e) {
  return (t, r, i) => {
    const s = typeof r == 'string' ? r : r.name.toString()
    let a = (u) => {
      let f = ki(e, u)
      if ((f.required && (f.validate = Ot(f.validate, Fe.required, !0)), it(f, 'maxLength'))) {
        let h = f
        h.maxLength && (h.validate = Ot(h.validate, Fe.maxLength(h.maxLength)))
      }
      if (it(f, 'minLength')) {
        let h = f
        h.minLength && (h.validate = Ot(h.validate, Fe.minLength(h.minLength)))
      }
      !f.valueType && n && (f.valueType = n()), f.key || (f.key = s), f.dbName || (f.dbName = f.key)
      let d = f.valueType
      return (
        d ||
          ((d =
            typeof Reflect.getMetadata == 'function'
              ? Reflect.getMetadata('design:type', t, s)
              : []),
          (f.valueType = d)),
        f.target || (f.target = t),
        f
      )
    }
    cn(t)
    let o = O.columnsOfType.get(t.constructor)
    o || ((o = []), O.columnsOfType.set(t.constructor, o))
    let l = o.find((u) => u.key == s)
    if (!l) o.push({ key: s, settings: a })
    else {
      let u = l.settings
      l.settings = (f) => {
        let d = u(f),
          h = a(f)
        return Object.assign(d, h)
      }
    }
  }
}
function cn(n) {
  if (!n)
    throw new Error(
      "Set the 'experimentalDecorators:true' option in your 'tsconfig' or 'jsconfig' (target undefined)",
    )
}
function wa(n, e, t, r) {
  var i = arguments.length,
    s = i < 3 ? e : r === null ? (r = Object.getOwnPropertyDescriptor(e, t)) : r,
    a
  if (typeof Reflect == 'object' && typeof Reflect.decorate == 'function')
    s = Reflect.decorate(n, e, t, r)
  else
    for (var o = n.length - 1; o >= 0; o--)
      (a = n[o]) && (s = (i < 3 ? a(s) : i > 3 ? a(e, t, s) : a(e, t)) || s)
  return i > 3 && s && Object.defineProperty(e, t, s), s
}
function ga(n, e) {
  if (typeof Reflect == 'object' && typeof Reflect.metadata == 'function')
    return Reflect.metadata(n, e)
}
class va extends Ii {
  constructor() {
    super(...arguments)
    c(this, 'id')
  }
}
wa([br.uuid(), ga('design:type', String)], va.prototype, 'id', void 0)
var Yr = {}
/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */ var ei
;(function (n) {
  ;(function (e) {
    var t =
        typeof Pt == 'object'
          ? Pt
          : typeof self == 'object'
            ? self
            : typeof this == 'object'
              ? this
              : Function('return this;')(),
      r = i(n)
    typeof t.Reflect > 'u' ? (t.Reflect = n) : (r = i(t.Reflect, r)), e(r)
    function i(s, a) {
      return function (o, l) {
        typeof s[o] != 'function' &&
          Object.defineProperty(s, o, { configurable: !0, writable: !0, value: l }),
          a && a(o, l)
      }
    }
  })(function (e) {
    var t = Object.prototype.hasOwnProperty,
      r = typeof Symbol == 'function',
      i = r && typeof Symbol.toPrimitive < 'u' ? Symbol.toPrimitive : '@@toPrimitive',
      s = r && typeof Symbol.iterator < 'u' ? Symbol.iterator : '@@iterator',
      a = typeof Object.create == 'function',
      o = { __proto__: [] } instanceof Array,
      l = !a && !o,
      u = {
        create: a
          ? function () {
              return Wt(Object.create(null))
            }
          : o
            ? function () {
                return Wt({ __proto__: null })
              }
            : function () {
                return Wt({})
              },
        has: l
          ? function (y, w) {
              return t.call(y, w)
            }
          : function (y, w) {
              return w in y
            },
        get: l
          ? function (y, w) {
              return t.call(y, w) ? y[w] : void 0
            }
          : function (y, w) {
              return y[w]
            },
      },
      f = Object.getPrototypeOf(Function),
      d = typeof process == 'object' && Yr && Yr.REFLECT_METADATA_USE_MAP_POLYFILL === 'true',
      h = !d && typeof Map == 'function' && typeof Map.prototype.entries == 'function' ? Map : Cn(),
      p = !d && typeof Set == 'function' && typeof Set.prototype.entries == 'function' ? Set : En(),
      m = !d && typeof WeakMap == 'function' ? WeakMap : Tn(),
      b = new m()
    function k(y, w, v, _) {
      if (re(v)) {
        if (!kr(y)) throw new TypeError()
        if (!Ir(w)) throw new TypeError()
        return Jt(y, w)
      } else {
        if (!kr(y)) throw new TypeError()
        if (!ue(w)) throw new TypeError()
        if (!ue(_) && !re(_) && !Ue(_)) throw new TypeError()
        return Ue(_) && (_ = void 0), (v = Se(v)), jt(y, w, v, _)
      }
    }
    e('decorate', k)
    function E(y, w) {
      function v(_, T) {
        if (!ue(_)) throw new TypeError()
        if (!re(T) && !bn(T)) throw new TypeError()
        le(y, w, _, T)
      }
      return v
    }
    e('metadata', E)
    function I(y, w, v, _) {
      if (!ue(v)) throw new TypeError()
      return re(_) || (_ = Se(_)), le(y, w, v, _)
    }
    e('defineMetadata', I)
    function B(y, w, v) {
      if (!ue(w)) throw new TypeError()
      return re(v) || (v = Se(v)), P(y, w, v)
    }
    e('hasMetadata', B)
    function D(y, w, v) {
      if (!ue(w)) throw new TypeError()
      return re(v) || (v = Se(v)), K(y, w, v)
    }
    e('hasOwnMetadata', D)
    function q(y, w, v) {
      if (!ue(w)) throw new TypeError()
      return re(v) || (v = Se(v)), Q(y, w, v)
    }
    e('getMetadata', q)
    function ne(y, w, v) {
      if (!ue(w)) throw new TypeError()
      return re(v) || (v = Se(v)), te(y, w, v)
    }
    e('getOwnMetadata', ne)
    function oe(y, w) {
      if (!ue(y)) throw new TypeError()
      return re(w) || (w = Se(w)), Ze(y, w)
    }
    e('getMetadataKeys', oe)
    function R(y, w) {
      if (!ue(y)) throw new TypeError()
      return re(w) || (w = Se(w)), Ye(y, w)
    }
    e('getOwnMetadataKeys', R)
    function x(y, w, v) {
      if (!ue(w)) throw new TypeError()
      re(v) || (v = Se(v))
      var _ = g(w, v, !1)
      if (re(_) || !_.delete(y)) return !1
      if (_.size > 0) return !0
      var T = b.get(w)
      return T.delete(v), T.size > 0 || b.delete(w), !0
    }
    e('deleteMetadata', x)
    function Jt(y, w) {
      for (var v = y.length - 1; v >= 0; --v) {
        var _ = y[v],
          T = _(w)
        if (!re(T) && !Ue(T)) {
          if (!Ir(T)) throw new TypeError()
          w = T
        }
      }
      return w
    }
    function jt(y, w, v, _) {
      for (var T = y.length - 1; T >= 0; --T) {
        var me = y[T],
          M = me(w, v, _)
        if (!re(M) && !Ue(M)) {
          if (!ue(M)) throw new TypeError()
          _ = M
        }
      }
      return _
    }
    function g(y, w, v) {
      var _ = b.get(y)
      if (re(_)) {
        if (!v) return
        ;(_ = new h()), b.set(y, _)
      }
      var T = _.get(w)
      if (re(T)) {
        if (!v) return
        ;(T = new h()), _.set(w, T)
      }
      return T
    }
    function P(y, w, v) {
      var _ = K(y, w, v)
      if (_) return !0
      var T = Ut(w)
      return Ue(T) ? !1 : P(y, T, v)
    }
    function K(y, w, v) {
      var _ = g(w, v, !1)
      return re(_) ? !1 : gn(_.has(y))
    }
    function Q(y, w, v) {
      var _ = K(y, w, v)
      if (_) return te(y, w, v)
      var T = Ut(w)
      if (!Ue(T)) return Q(y, T, v)
    }
    function te(y, w, v) {
      var _ = g(w, v, !1)
      if (!re(_)) return _.get(y)
    }
    function le(y, w, v, _) {
      var T = g(v, _, !0)
      T.set(y, w)
    }
    function Ze(y, w) {
      var v = Ye(y, w),
        _ = Ut(y)
      if (_ === null) return v
      var T = Ze(_, w)
      if (T.length <= 0) return v
      if (v.length <= 0) return T
      for (var me = new p(), M = [], L = 0, A = v; L < A.length; L++) {
        var J = A[L],
          j = me.has(J)
        j || (me.add(J), M.push(J))
      }
      for (var Pe = 0, Cr = T; Pe < Cr.length; Pe++) {
        var J = Cr[Pe],
          j = me.has(J)
        j || (me.add(J), M.push(J))
      }
      return M
    }
    function Ye(y, w) {
      var v = [],
        _ = g(y, w, !1)
      if (re(_)) return v
      for (var T = _.keys(), me = _n(T), M = 0; ; ) {
        var L = In(me)
        if (!L) return (v.length = M), v
        var A = kn(L)
        try {
          v[M] = A
        } catch (J) {
          try {
            On(me)
          } finally {
            throw J
          }
        }
        M++
      }
    }
    function ct(y) {
      if (y === null) return 1
      switch (typeof y) {
        case 'undefined':
          return 0
        case 'boolean':
          return 2
        case 'string':
          return 3
        case 'symbol':
          return 4
        case 'number':
          return 5
        case 'object':
          return y === null ? 1 : 6
        default:
          return 6
      }
    }
    function re(y) {
      return y === void 0
    }
    function Ue(y) {
      return y === null
    }
    function yn(y) {
      return typeof y == 'symbol'
    }
    function ue(y) {
      return typeof y == 'object' ? y !== null : typeof y == 'function'
    }
    function mn(y, w) {
      switch (ct(y)) {
        case 0:
          return y
        case 1:
          return y
        case 2:
          return y
        case 3:
          return y
        case 4:
          return y
        case 5:
          return y
      }
      var v = 'string',
        _ = Or(y, i)
      if (_ !== void 0) {
        var T = _.call(y, v)
        if (ue(T)) throw new TypeError()
        return T
      }
      return wn(y)
    }
    function wn(y, w) {
      var v, _
      {
        var T = y.toString
        if (ht(T)) {
          var _ = T.call(y)
          if (!ue(_)) return _
        }
        var v = y.valueOf
        if (ht(v)) {
          var _ = v.call(y)
          if (!ue(_)) return _
        }
      }
      throw new TypeError()
    }
    function gn(y) {
      return !!y
    }
    function vn(y) {
      return '' + y
    }
    function Se(y) {
      var w = mn(y)
      return yn(w) ? w : vn(w)
    }
    function kr(y) {
      return Array.isArray
        ? Array.isArray(y)
        : y instanceof Object
          ? y instanceof Array
          : Object.prototype.toString.call(y) === '[object Array]'
    }
    function ht(y) {
      return typeof y == 'function'
    }
    function Ir(y) {
      return typeof y == 'function'
    }
    function bn(y) {
      switch (ct(y)) {
        case 3:
          return !0
        case 4:
          return !0
        default:
          return !1
      }
    }
    function Or(y, w) {
      var v = y[w]
      if (v != null) {
        if (!ht(v)) throw new TypeError()
        return v
      }
    }
    function _n(y) {
      var w = Or(y, s)
      if (!ht(w)) throw new TypeError()
      var v = w.call(y)
      if (!ue(v)) throw new TypeError()
      return v
    }
    function kn(y) {
      return y.value
    }
    function In(y) {
      var w = y.next()
      return w.done ? !1 : w
    }
    function On(y) {
      var w = y.return
      w && w.call(y)
    }
    function Ut(y) {
      var w = Object.getPrototypeOf(y)
      if (typeof y != 'function' || y === f || w !== f) return w
      var v = y.prototype,
        _ = v && Object.getPrototypeOf(v)
      if (_ == null || _ === Object.prototype) return w
      var T = _.constructor
      return typeof T != 'function' || T === y ? w : T
    }
    function Cn() {
      var y = {},
        w = [],
        v = (function () {
          function M(L, A, J) {
            ;(this._index = 0), (this._keys = L), (this._values = A), (this._selector = J)
          }
          return (
            (M.prototype['@@iterator'] = function () {
              return this
            }),
            (M.prototype[s] = function () {
              return this
            }),
            (M.prototype.next = function () {
              var L = this._index
              if (L >= 0 && L < this._keys.length) {
                var A = this._selector(this._keys[L], this._values[L])
                return (
                  L + 1 >= this._keys.length
                    ? ((this._index = -1), (this._keys = w), (this._values = w))
                    : this._index++,
                  { value: A, done: !1 }
                )
              }
              return { value: void 0, done: !0 }
            }),
            (M.prototype.throw = function (L) {
              throw (
                (this._index >= 0 && ((this._index = -1), (this._keys = w), (this._values = w)), L)
              )
            }),
            (M.prototype.return = function (L) {
              return (
                this._index >= 0 && ((this._index = -1), (this._keys = w), (this._values = w)),
                { value: L, done: !0 }
              )
            }),
            M
          )
        })()
      return (function () {
        function M() {
          ;(this._keys = []), (this._values = []), (this._cacheKey = y), (this._cacheIndex = -2)
        }
        return (
          Object.defineProperty(M.prototype, 'size', {
            get: function () {
              return this._keys.length
            },
            enumerable: !0,
            configurable: !0,
          }),
          (M.prototype.has = function (L) {
            return this._find(L, !1) >= 0
          }),
          (M.prototype.get = function (L) {
            var A = this._find(L, !1)
            return A >= 0 ? this._values[A] : void 0
          }),
          (M.prototype.set = function (L, A) {
            var J = this._find(L, !0)
            return (this._values[J] = A), this
          }),
          (M.prototype.delete = function (L) {
            var A = this._find(L, !1)
            if (A >= 0) {
              for (var J = this._keys.length, j = A + 1; j < J; j++)
                (this._keys[j - 1] = this._keys[j]), (this._values[j - 1] = this._values[j])
              return (
                this._keys.length--,
                this._values.length--,
                L === this._cacheKey && ((this._cacheKey = y), (this._cacheIndex = -2)),
                !0
              )
            }
            return !1
          }),
          (M.prototype.clear = function () {
            ;(this._keys.length = 0),
              (this._values.length = 0),
              (this._cacheKey = y),
              (this._cacheIndex = -2)
          }),
          (M.prototype.keys = function () {
            return new v(this._keys, this._values, _)
          }),
          (M.prototype.values = function () {
            return new v(this._keys, this._values, T)
          }),
          (M.prototype.entries = function () {
            return new v(this._keys, this._values, me)
          }),
          (M.prototype['@@iterator'] = function () {
            return this.entries()
          }),
          (M.prototype[s] = function () {
            return this.entries()
          }),
          (M.prototype._find = function (L, A) {
            return (
              this._cacheKey !== L && (this._cacheIndex = this._keys.indexOf((this._cacheKey = L))),
              this._cacheIndex < 0 &&
                A &&
                ((this._cacheIndex = this._keys.length),
                this._keys.push(L),
                this._values.push(void 0)),
              this._cacheIndex
            )
          }),
          M
        )
      })()
      function _(M, L) {
        return M
      }
      function T(M, L) {
        return L
      }
      function me(M, L) {
        return [M, L]
      }
    }
    function En() {
      return (function () {
        function y() {
          this._map = new h()
        }
        return (
          Object.defineProperty(y.prototype, 'size', {
            get: function () {
              return this._map.size
            },
            enumerable: !0,
            configurable: !0,
          }),
          (y.prototype.has = function (w) {
            return this._map.has(w)
          }),
          (y.prototype.add = function (w) {
            return this._map.set(w, w), this
          }),
          (y.prototype.delete = function (w) {
            return this._map.delete(w)
          }),
          (y.prototype.clear = function () {
            this._map.clear()
          }),
          (y.prototype.keys = function () {
            return this._map.keys()
          }),
          (y.prototype.values = function () {
            return this._map.values()
          }),
          (y.prototype.entries = function () {
            return this._map.entries()
          }),
          (y.prototype['@@iterator'] = function () {
            return this.keys()
          }),
          (y.prototype[s] = function () {
            return this.keys()
          }),
          y
        )
      })()
    }
    function Tn() {
      var y = 16,
        w = u.create(),
        v = _()
      return (function () {
        function A() {
          this._key = _()
        }
        return (
          (A.prototype.has = function (J) {
            var j = T(J, !1)
            return j !== void 0 ? u.has(j, this._key) : !1
          }),
          (A.prototype.get = function (J) {
            var j = T(J, !1)
            return j !== void 0 ? u.get(j, this._key) : void 0
          }),
          (A.prototype.set = function (J, j) {
            var Pe = T(J, !0)
            return (Pe[this._key] = j), this
          }),
          (A.prototype.delete = function (J) {
            var j = T(J, !1)
            return j !== void 0 ? delete j[this._key] : !1
          }),
          (A.prototype.clear = function () {
            this._key = _()
          }),
          A
        )
      })()
      function _() {
        var A
        do A = '@@WeakMap@@' + L()
        while (u.has(w, A))
        return (w[A] = !0), A
      }
      function T(A, J) {
        if (!t.call(A, v)) {
          if (!J) return
          Object.defineProperty(A, v, { value: u.create() })
        }
        return A[v]
      }
      function me(A, J) {
        for (var j = 0; j < J; ++j) A[j] = (Math.random() * 255) | 0
        return A
      }
      function M(A) {
        return typeof Uint8Array == 'function'
          ? typeof crypto < 'u'
            ? crypto.getRandomValues(new Uint8Array(A))
            : typeof msCrypto < 'u'
              ? msCrypto.getRandomValues(new Uint8Array(A))
              : me(new Uint8Array(A), A)
          : me(new Array(A), A)
      }
      function L() {
        var A = M(y)
        ;(A[6] = (A[6] & 79) | 64), (A[8] = (A[8] & 191) | 128)
        for (var J = '', j = 0; j < y; ++j) {
          var Pe = A[j]
          ;(j === 4 || j === 6 || j === 8) && (J += '-'),
            Pe < 16 && (J += '0'),
            (J += Pe.toString(16).toLowerCase())
        }
        return J
      }
    }
    function Wt(y) {
      return (y.__ = void 0), delete y.__, y
    }
  })
})(ei || (ei = {}))
const Rt = class Rt {
  constructor(e, t, r) {
    c(this, 'actionUrl')
    c(this, 'queue')
    c(this, 'allowed')
    c(this, 'doWork')
    ;(this.actionUrl = e), (this.queue = t), (this.allowed = r)
  }
  async run(e, t, r) {
    t === void 0 && (t = ke.apiClient.url), r || (r = ft(ke.apiClient.httpClient))
    let i = await r.post(t + '/' + this.actionUrl, e),
      s = i
    if (s && s.queuedJobId) {
      let a = O.actionInfo.startBusyWithProgress()
      try {
        let o
        if (
          (await O.actionInfo.runActionWithoutBlockingUI(async () => {
            for (; !o || !o.done; )
              o &&
                (await new Promise((l) =>
                  setTimeout(() => {
                    l(void 0)
                  }, 200),
                )),
                (o = await r.post(t + '/' + Rt.apiUrlForJobStatus, { queuedJobId: i.queuedJobId })),
                o.progress && a.progress(o.progress)
          }),
          o.error)
        )
          throw o.error
        return a.progress(1), o.result
      } finally {
        a.close()
      }
    } else return i
  }
  __register(e) {
    e(this.actionUrl, this.queue, this.allowed, async (t, r, i) => {
      try {
        var s = await this.execute(t, r, i)
        i.success(s)
      } catch (a) {
        a.isForbiddenError ? i.forbidden() : i.error(a, void 0)
      }
    })
  }
}
c(Rt, 'apiUrlForJobStatus', 'jobStatusInQueue')
let lt = Rt
class ar extends Error {
  constructor(t = 'Forbidden') {
    super(t)
    c(this, 'isForbiddenError', !0)
  }
}
class ba extends lt {
  constructor(t, r, i, s) {
    super(t, i.queue ?? !1, i.allowed)
    c(this, 'types')
    c(this, 'options')
    c(this, 'originalMethod')
    ;(this.types = r), (this.options = i), (this.originalMethod = s)
  }
  async execute(t, r, i) {
    let s = { data: {} },
      a = r.dataProvider
    return (
      await wi(r, async () => {
        if (!r.isAllowedForInstance(void 0, this.options.allowed)) throw new ar()
        t.args = await pn(this.types(), t.args, r, a, i)
        try {
          s.data = await this.originalMethod(t.args)
        } catch (o) {
          throw o
        }
      }),
      s
    )
  }
}
function Ee(n) {
  return (e, t, r) => {
    const i = typeof t == 'string' ? t : t.name.toString(),
      s = r ? r.value : e
    let a = s
    cn(e)
    function o() {
      var f =
        typeof Reflect.getMetadata == 'function'
          ? Reflect.getMetadata('design:paramtypes', e, i)
          : []
      return (
        n.paramTypes && (f = typeof n.paramTypes == 'function' ? n.paramTypes() : n.paramTypes), f
      )
    }
    if (e.prototype !== void 0) {
      let f = new ba(
        (n != null && n.apiPrefix ? n.apiPrefix + '/' : '') + i,
        () => o(),
        n,
        (d) => s.apply(void 0, d),
      )
      return (
        (f.doWork = async (d, h, p, m) => (
          (d = ii(o(), d)),
          n.blockUser === !1
            ? await O.actionInfo.runActionWithoutBlockingUI(
                async () => (await f.run({ args: d }, p, m)).data,
              )
            : (await f.run({ args: d }, p, m)).data
        )),
        (a = async function (...d) {
          return rr() ? await s.apply(this, d) : await f.doWork(d, void 0)
        }),
        ti(e, a),
        (a[tr] = f),
        r ? ((r.value = a), r) : a
      )
    }
    let l = O.classHelpers.get(e.constructor)
    l || ((l = new Ms()), O.classHelpers.set(e.constructor, l))
    let u = {
      __register(f) {
        let d = new Oe()
        for (const h of l.classes.keys()) {
          let p = l.classes.get(h)
          p.key || (p.key = d.repo(h).metadata.key),
            f(
              p.key + '/' + (n != null && n.apiPrefix ? n.apiPrefix + '/' : '') + i,
              n ? n.queue ?? !1 : !1,
              n.allowed,
              async (m, b, k) => {
                m.args = m.args.map((I) => (hn(I) ? void 0 : I))
                let E = n.allowed
                try {
                  let I = b,
                    B
                  await wi(I, async () => {
                    if (
                      ((m.args = await pn(o(), m.args, I, I.dataProvider, k)),
                      O.allEntities.includes(h))
                    ) {
                      let D = I.repo(h),
                        q
                      const ne = m.rowInfo
                      if (ne.isNewRow)
                        (q = D.create()), await D.getEntityRef(q)._updateEntityBasedOnApi(ne.data)
                      else {
                        let R = await D.find({
                          where: {
                            ...D.metadata.idMetadata.getIdFilter(ne.id),
                            $and: [D.metadata.options.apiPrefilter ?? {}],
                          },
                        })
                        if (R.length != 1) throw new Error('not found or too many matches')
                        ;(q = R[0]), await D.getEntityRef(q)._updateEntityBasedOnApi(ne.data)
                      }
                      if (!I.isAllowedForInstance(q, E)) throw new ar()
                      let oe = X(q)
                      await oe.__validateEntity()
                      try {
                        B = {
                          result: await s.apply(q, m.args),
                          rowInfo: {
                            data: await oe.toApiJson(),
                            isNewRow: oe.isNew(),
                            wasChanged: oe.wasChanged(),
                            id: oe.getOriginalId(),
                          },
                        }
                      } catch (R) {
                        throw oe.catchSaveErrors(R)
                      }
                    } else {
                      let D = new h(I, I.dataProvider),
                        q = Hr(D, I)
                      if (
                        (await q._updateEntityBasedOnApi(m.fields), !I.isAllowedForInstance(D, E))
                      )
                        throw new ar()
                      await q.__validateEntity()
                      try {
                        B = { result: await s.apply(D, m.args), fields: await q.toApiJson() }
                      } catch (ne) {
                        throw q.catchSaveErrors(ne)
                      }
                    }
                  }),
                    k.success(B)
                } catch (I) {
                  I.isForbiddenError ? k.forbidden() : k.error(I, void 0)
                }
              },
            )
        }
      },
      doWork: async function (f, d, h, p) {
        if (((f = ii(o(), f)), O.allEntities.includes(e.constructor))) {
          let m = X(d)
          await m.__validateEntity()
          let b = l.classes.get(d.constructor)
          b.key || (b.key = m.repository.metadata.key + '_methods')
          try {
            let k = await new (class extends lt {
              constructor() {
                super(...arguments)
                c(this, 'execute')
              }
            })(
              b.key + '/' + (n != null && n.apiPrefix ? n.apiPrefix + '/' : '') + i,
              (n == null ? void 0 : n.queue) ?? !1,
              n.allowed,
            ).run(
              {
                args: f,
                rowInfo: {
                  data: await m.toApiJson(),
                  isNewRow: m.isNew(),
                  wasChanged: m.wasChanged(),
                  id: m.getOriginalId(),
                },
              },
              h,
              p,
            )
            return await m._updateEntityBasedOnApi(k.rowInfo.data, !0), k.result
          } catch (k) {
            throw m.catchSaveErrors(k)
          }
        } else {
          let m = Hr(d, void 0)
          try {
            await m.__validateEntity()
            let b = await new (class extends lt {
              constructor() {
                super(...arguments)
                c(this, 'execute')
              }
            })(
              l.classes.get(d.constructor).key +
                '/' +
                (n != null && n.apiPrefix ? n.apiPrefix + '/' : '') +
                i,
              (n == null ? void 0 : n.queue) ?? !1,
              n.allowed,
            ).run({ args: f, fields: await m.toApiJson() }, h, p)
            return await m._updateEntityBasedOnApi(b.fields), b.result
          } catch (b) {
            throw m.catchSaveErrors(b)
          }
        }
      },
    }
    return (
      (a = async function (...f) {
        let d = this
        return rr() ? await s.apply(d, f) : u.doWork(f, d)
      }),
      ti(e.constructor, a),
      (a[tr] = u),
      r ? ((r.value = a), r) : a
    )
  }
}
const _a = { _isUndefined: !0 }
function ti(n, e) {
  ;(n[ni] || (n[ni] = [])).push(e), O.actionInfo.allActions.push(e)
}
function hn(n) {
  return n && n._isUndefined
}
class ri {
  constructor(e) {
    c(this, 'res')
    this.res = e
  }
  progress(e) {
    this.res.progress(e)
  }
}
function ii(n, e) {
  if (n)
    for (let t = 0; t < n.length; t++) {
      const r = n[t]
      for (const i of [Oe, ze]) (e[t] instanceof i || r == i) && (e[t] = void 0)
      if (e[t] != null) {
        let i = { valueType: r }
        if (((i = mr(i, new Oe())), _e(r, !1) != null)) {
          let a = X(e[t])
          e[t] = a.getId()
        }
        i.valueConverter && (e[t] = i.valueConverter.toJson(e[t]))
      }
    }
  return e.map((t) => (t !== void 0 ? t : _a))
}
async function pn(n, e, t, r, i) {
  for (let s = 0; s < e.length; s++) {
    const a = e[s]
    hn(a) && (e[s] = void 0)
  }
  if (n)
    for (let s = 0; s < n.length; s++)
      if ((e.length < s && e.push(void 0), n[s] == Oe || n[s] == Oe)) e[s] = t
      else if (n[s] == ze && r) e[s] = r
      else if (n[s] == ri) e[s] = new ri(i)
      else {
        let a = { valueType: n[s] }
        ;(a = mr(a, t)),
          a.valueConverter && (e[s] = a.valueConverter.fromJson(e[s])),
          _e(n[s], !1) != null &&
            (e[s] === null || e[s] === void 0 || (e[s] = await t.repo(n[s]).findId(e[s])))
      }
  return e
}
const ni = Symbol.for('classBackendMethodsArray')
O.actionInfo
var ka = Object.defineProperty,
  Ia = Object.getOwnPropertyDescriptor,
  Te = (n, e, t, r) => {
    for (var i = Ia(e, t), s = n.length - 1, a; s >= 0; s--) (a = n[s]) && (i = a(e, t, i) || i)
    return i && ka(e, t, i), i
  }
class be {
  static async signOut() {}
  static async signInDemo() {}
  static async invite() {}
  static async signUpPassword() {}
  static async signInPassword() {}
  static async forgotPassword() {}
  static async resetPassword() {}
  static async signInOTP() {}
  static async verifyOtp() {}
  static async signInOAuthGetUrl() {}
}
Te([Ee({})], be, 'signOut')
Te([Ee({})], be, 'signInDemo')
Te([Ee({})], be, 'invite')
Te([Ee({})], be, 'signUpPassword')
Te([Ee({})], be, 'signInPassword')
Te([Ee({})], be, 'forgotPassword')
Te([Ee({})], be, 'resetPassword')
Te([Ee({})], be, 'signInOTP')
Te([Ee({})], be, 'verifyOtp')
Te([Ee({})], be, 'signInOAuthGetUrl')
function _r(n) {
  n.focus()
}
function Oa(n) {
  let e,
    t,
    r,
    i,
    s,
    a,
    o,
    l,
    u,
    f,
    d = n[1].ui.providers.password.dico.send_password_reset_instructions + '',
    h,
    p,
    m
  return {
    c() {
      ;(e = $('div')),
        (t = $('p')),
        (r = Y(n[2])),
        (i = Y(Ca)),
        (s = H()),
        (a = $('form')),
        (o = $('input')),
        (u = H()),
        (f = $('button')),
        (h = Y(d)),
        U(t, 'class', 'message'),
        Re(t, 'error', n[2]),
        U(o, 'type', 'text'),
        U(o, 'placeholder', (l = n[1].ui.providers.password.dico.email_placeholder)),
        U(a, 'class', 'svelte-wa5ykb'),
        U(e, 'class', 'login')
    },
    m(b, k) {
      W(b, e, k),
        C(e, t),
        C(t, r),
        C(t, i),
        C(e, s),
        C(e, a),
        C(a, o),
        ge(o, n[0]),
        C(a, u),
        C(a, f),
        C(f, h),
        p ||
          ((m = [Mt(_r.call(null, o)), Ie(o, 'input', n[4]), Ie(a, 'submit', Nt(n[3]))]), (p = !0))
    },
    p(b, [k]) {
      k & 4 && ce(r, b[2]),
        k & 4 && Re(t, 'error', b[2]),
        k & 2 &&
          l !== (l = b[1].ui.providers.password.dico.email_placeholder) &&
          U(o, 'placeholder', l),
        k & 1 && o.value !== b[0] && ge(o, b[0]),
        k & 2 &&
          d !== (d = b[1].ui.providers.password.dico.send_password_reset_instructions + '') &&
          ce(h, d)
    },
    i: ie,
    o: ie,
    d(b) {
      b && V(e), (p = !1), Ke(m)
    },
  }
}
let Ca = ''
function Ea(n, e, t) {
  let { firstlyDataAuth: r } = e,
    { email: i = '' } = e,
    s = ''
  async function a() {
    try {
      await be.forgotPassword(i), (window.location.href = '/ff/auth/sign-in')
    } catch (l) {
      l && t(2, (s = l.message ?? ''))
    }
  }
  function o() {
    ;(i = this.value), t(0, i)
  }
  return (
    (n.$$set = (l) => {
      'firstlyDataAuth' in l && t(1, (r = l.firstlyDataAuth)), 'email' in l && t(0, (i = l.email))
    }),
    [i, r, s, a, o]
  )
}
class Ta extends Je {
  constructor(e) {
    super(), je(this, e, Ea, Oa, Xe, { firstlyDataAuth: 1, email: 0 })
  }
}
function Sa(n) {
  let e,
    t,
    r,
    i,
    s,
    a,
    o = n[2].ui.providers.password.dico.password + '',
    l,
    u,
    f,
    d,
    h = n[2].ui.providers.password.dico.password + '',
    p,
    m,
    b,
    k,
    E,
    I,
    B
  return {
    c() {
      ;(e = $('div')),
        (t = $('p')),
        (r = Y(n[3])),
        (i = Y(n[4])),
        (s = H()),
        (a = $('form')),
        (l = Y(o)),
        (u = H()),
        (f = $('input')),
        (d = H()),
        (p = Y(h)),
        (m = H()),
        (b = $('input')),
        (k = H()),
        (E = $('button')),
        (E.textContent = 'reset'),
        U(t, 'class', 'message'),
        Re(t, 'error', n[3]),
        U(f, 'type', 'password'),
        U(b, 'type', 'password'),
        U(a, 'class', 'svelte-wa5ykb'),
        U(e, 'class', 'login')
    },
    m(D, q) {
      W(D, e, q),
        C(e, t),
        C(t, r),
        C(t, i),
        C(e, s),
        C(e, a),
        C(a, l),
        C(a, u),
        C(a, f),
        ge(f, n[0]),
        C(a, d),
        C(a, p),
        C(a, m),
        C(a, b),
        ge(b, n[1]),
        C(a, k),
        C(a, E),
        I ||
          ((B = [Ie(f, 'input', n[6]), Ie(b, 'input', n[7]), Ie(a, 'submit', Nt(n[5]))]), (I = !0))
    },
    p(D, [q]) {
      q & 8 && ce(r, D[3]),
        q & 16 && ce(i, D[4]),
        q & 8 && Re(t, 'error', D[3]),
        q & 4 && o !== (o = D[2].ui.providers.password.dico.password + '') && ce(l, o),
        q & 1 && f.value !== D[0] && ge(f, D[0]),
        q & 4 && h !== (h = D[2].ui.providers.password.dico.password + '') && ce(p, h),
        q & 2 && b.value !== D[1] && ge(b, D[1])
    },
    i: ie,
    o: ie,
    d(D) {
      D && V(e), (I = !1), Ke(B)
    },
  }
}
function Aa(n, e, t) {
  let { firstlyDataAuth: r } = e,
    { password1: i = '' } = e,
    { password2: s = '' } = e,
    a = '',
    o = ''
  async function l() {
    t(3, (a = '')), t(4, (o = ''))
    const d = new URL(location.href).searchParams.get('token')
    try {
      await be.resetPassword(d ?? '', i), (window.location.href = '/')
    } catch (h) {
      h && t(3, (a = h.message ?? ''))
    }
  }
  function u() {
    ;(i = this.value), t(0, i)
  }
  function f() {
    ;(s = this.value), t(1, s)
  }
  return (
    (n.$$set = (d) => {
      'firstlyDataAuth' in d && t(2, (r = d.firstlyDataAuth)),
        'password1' in d && t(0, (i = d.password1)),
        'password2' in d && t(1, (s = d.password2))
    }),
    [i, s, r, a, o, l, u, f]
  )
}
class Fa extends Je {
  constructor(e) {
    super(), je(this, e, Aa, Sa, Xe, { firstlyDataAuth: 2, password1: 0, password2: 1 })
  }
}
function si(n) {
  let e,
    t,
    r,
    i,
    s,
    a,
    o = n[1].ui.providers.password.dico.email + '',
    l,
    u,
    f,
    d,
    h,
    p,
    m = n[1].ui.providers.password.dico.password + '',
    b,
    k,
    E,
    I,
    B,
    D = n[1].ui.providers.password.dico.btn_sign_in + '',
    q,
    ne,
    oe
  return {
    c() {
      ;(e = $('form')),
        (t = $('p')),
        (r = Y(n[3])),
        (i = Y(n[4])),
        (s = H()),
        (a = $('label')),
        (l = Y(o)),
        (u = H()),
        (f = $('input')),
        (h = H()),
        (p = $('label')),
        (b = Y(m)),
        (k = H()),
        (E = $('input')),
        (I = H()),
        (B = $('button')),
        (q = Y(D)),
        U(t, 'class', 'message svelte-1rtdg09'),
        Re(t, 'error', n[3]),
        U(f, 'type', 'text'),
        U(f, 'placeholder', (d = n[1].ui.providers.password.dico.email_placeholder)),
        U(E, 'type', 'password'),
        U(e, 'class', 'svelte-1rtdg09')
    },
    m(R, x) {
      W(R, e, x),
        C(e, t),
        C(t, r),
        C(t, i),
        C(e, s),
        C(e, a),
        C(a, l),
        C(a, u),
        C(a, f),
        ge(f, n[0]),
        C(e, h),
        C(e, p),
        C(p, b),
        C(p, k),
        C(p, E),
        ge(E, n[5]),
        C(e, I),
        C(e, B),
        C(B, q),
        ne ||
          ((oe = [
            Ie(f, 'input', n[7]),
            Mt(_r.call(null, f)),
            Ie(E, 'input', n[8]),
            Ie(e, 'submit', Nt(n[6])),
          ]),
          (ne = !0))
    },
    p(R, x) {
      x & 8 && ce(r, R[3]),
        x & 16 && ce(i, R[4]),
        x & 8 && Re(t, 'error', R[3]),
        x & 2 && o !== (o = R[1].ui.providers.password.dico.email + '') && ce(l, o),
        x & 2 &&
          d !== (d = R[1].ui.providers.password.dico.email_placeholder) &&
          U(f, 'placeholder', d),
        x & 1 && f.value !== R[0] && ge(f, R[0]),
        x & 2 && m !== (m = R[1].ui.providers.password.dico.password + '') && ce(b, m),
        x & 32 && E.value !== R[5] && ge(E, R[5]),
        x & 2 && D !== (D = R[1].ui.providers.password.dico.btn_sign_in + '') && ce(q, D)
    },
    d(R) {
      R && V(e), (ne = !1), Ke(oe)
    },
  }
}
function Pa(n) {
  let e,
    t = n[2] == 'login' && si(n)
  return {
    c() {
      t && t.c(), (e = or())
    },
    m(r, i) {
      t && t.m(r, i), W(r, e, i)
    },
    p(r, [i]) {
      r[2] == 'login'
        ? t
          ? t.p(r, i)
          : ((t = si(r)), t.c(), t.m(e.parentNode, e))
        : t && (t.d(1), (t = null))
    },
    i: ie,
    o: ie,
    d(r) {
      r && V(e), t && t.d(r)
    },
  }
}
function Da(n, e, t) {
  let { firstlyDataAuth: r } = e,
    { view: i = 'login' } = e,
    { email: s = '' } = e,
    a = '',
    o = '',
    l
  async function u() {
    t(3, (a = '')), t(4, (o = ''))
    try {
      await be.signInPassword(s, l), (window.location.href = '/')
    } catch (h) {
      h && t(3, (a = h.message ?? ''))
    }
  }
  function f() {
    ;(s = this.value), t(0, s)
  }
  function d() {
    ;(l = this.value), t(5, l)
  }
  return (
    (n.$$set = (h) => {
      'firstlyDataAuth' in h && t(1, (r = h.firstlyDataAuth)),
        'view' in h && t(2, (i = h.view)),
        'email' in h && t(0, (s = h.email))
    }),
    [s, r, i, a, o, l, u, f, d]
  )
}
class Ra extends Je {
  constructor(e) {
    super(), je(this, e, Da, Pa, Xe, { firstlyDataAuth: 1, view: 2, email: 0 })
  }
}
function ai(n) {
  let e,
    t,
    r,
    i,
    s,
    a,
    o = n[1].ui.providers.password.dico.email + '',
    l,
    u,
    f,
    d,
    h,
    p,
    m = n[1].ui.providers.password.dico.password + '',
    b,
    k,
    E,
    I,
    B,
    D = n[1].ui.providers.password.dico.btn_sign_up + '',
    q,
    ne,
    oe
  return {
    c() {
      ;(e = $('form')),
        (t = $('p')),
        (r = Y(n[3])),
        (i = Y(n[4])),
        (s = H()),
        (a = $('label')),
        (l = Y(o)),
        (u = H()),
        (f = $('input')),
        (h = H()),
        (p = $('label')),
        (b = Y(m)),
        (k = H()),
        (E = $('input')),
        (I = H()),
        (B = $('button')),
        (q = Y(D)),
        U(t, 'class', 'message svelte-1rtdg09'),
        Re(t, 'error', n[3]),
        U(f, 'type', 'text'),
        U(f, 'placeholder', (d = n[1].ui.providers.password.dico.email_placeholder)),
        U(E, 'type', 'password'),
        U(e, 'class', 'svelte-1rtdg09')
    },
    m(R, x) {
      W(R, e, x),
        C(e, t),
        C(t, r),
        C(t, i),
        C(e, s),
        C(e, a),
        C(a, l),
        C(a, u),
        C(a, f),
        ge(f, n[0]),
        C(e, h),
        C(e, p),
        C(p, b),
        C(p, k),
        C(p, E),
        ge(E, n[5]),
        C(e, I),
        C(e, B),
        C(B, q),
        ne ||
          ((oe = [
            Ie(f, 'input', n[7]),
            Mt(_r.call(null, f)),
            Ie(E, 'input', n[8]),
            Ie(e, 'submit', Nt(n[6])),
          ]),
          (ne = !0))
    },
    p(R, x) {
      x & 8 && ce(r, R[3]),
        x & 16 && ce(i, R[4]),
        x & 8 && Re(t, 'error', R[3]),
        x & 2 && o !== (o = R[1].ui.providers.password.dico.email + '') && ce(l, o),
        x & 2 &&
          d !== (d = R[1].ui.providers.password.dico.email_placeholder) &&
          U(f, 'placeholder', d),
        x & 1 && f.value !== R[0] && ge(f, R[0]),
        x & 2 && m !== (m = R[1].ui.providers.password.dico.password + '') && ce(b, m),
        x & 32 && E.value !== R[5] && ge(E, R[5]),
        x & 2 && D !== (D = R[1].ui.providers.password.dico.btn_sign_up + '') && ce(q, D)
    },
    d(R) {
      R && V(e), (ne = !1), Ke(oe)
    },
  }
}
function Ma(n) {
  let e,
    t = n[2] == 'login' && ai(n)
  return {
    c() {
      t && t.c(), (e = or())
    },
    m(r, i) {
      t && t.m(r, i), W(r, e, i)
    },
    p(r, [i]) {
      r[2] == 'login'
        ? t
          ? t.p(r, i)
          : ((t = ai(r)), t.c(), t.m(e.parentNode, e))
        : t && (t.d(1), (t = null))
    },
    i: ie,
    o: ie,
    d(r) {
      r && V(e), t && t.d(r)
    },
  }
}
function Na(n, e, t) {
  let { firstlyDataAuth: r } = e,
    { view: i = 'login' } = e,
    { email: s = '' } = e,
    a = '',
    o = '',
    l
  async function u() {
    t(3, (a = '')), t(4, (o = ''))
    try {
      await be.signUpPassword(s, l), (window.location.href = '/')
    } catch (h) {
      h && t(3, (a = h.message ?? ''))
    }
  }
  function f() {
    ;(s = this.value), t(0, s)
  }
  function d() {
    ;(l = this.value), t(5, l)
  }
  return (
    (n.$$set = (h) => {
      'firstlyDataAuth' in h && t(1, (r = h.firstlyDataAuth)),
        'view' in h && t(2, (i = h.view)),
        'email' in h && t(0, (s = h.email))
    }),
    [s, r, i, a, o, l, u, f, d]
  )
}
class La extends Je {
  constructor(e) {
    super(), je(this, e, Na, Ma, Xe, { firstlyDataAuth: 1, view: 2, email: 0 })
  }
}
function $a(n) {
  let e, t
  return (
    (e = new Qe({
      props: {
        path: n[1].ui.providers.password.paths.sign_up,
        $$slots: { default: [Ja] },
        $$scope: { ctx: n },
      },
    })),
    {
      c() {
        he(e.$$.fragment)
      },
      m(r, i) {
        pe(e, r, i), (t = !0)
      },
      p(r, i) {
        const s = {}
        i & 65 && (s.$$scope = { dirty: i, ctx: r }), e.$set(s)
      },
      i(r) {
        t || (z(e.$$.fragment, r), (t = !0))
      },
      o(r) {
        Z(e.$$.fragment, r), (t = !1)
      },
      d(r) {
        ye(e, r)
      },
    }
  )
}
function qa(n) {
  let e, t
  return (
    (e = new ut({
      props: {
        href: n[1].ui.providers.password.paths.sign_in,
        $$slots: { default: [Ba] },
        $$scope: { ctx: n },
      },
    })),
    {
      c() {
        he(e.$$.fragment)
      },
      m(r, i) {
        pe(e, r, i), (t = !0)
      },
      p(r, i) {
        const s = {}
        i & 64 && (s.$$scope = { dirty: i, ctx: r }), e.$set(s)
      },
      i(r) {
        t || (z(e.$$.fragment, r), (t = !0))
      },
      o(r) {
        Z(e.$$.fragment, r), (t = !1)
      },
      d(r) {
        ye(e, r)
      },
    }
  )
}
function Ba(n) {
  let e = n[1].ui.providers.password.dico.back_to_sign_in + '',
    t
  return {
    c() {
      t = Y(e)
    },
    m(r, i) {
      W(r, t, i)
    },
    p: ie,
    d(r) {
      r && V(t)
    },
  }
}
function Ja(n) {
  let e, t, r, i, s
  function a(u) {
    n[3](u)
  }
  let o = { firstlyDataAuth: n[1] }
  n[0] !== void 0 && (o.email = n[0]), (e = new La({ props: o })), lr.push(() => ur(e, 'email', a))
  let l = n[1].ui.providers.password.paths.sign_in && qa(n)
  return {
    c() {
      he(e.$$.fragment),
        (r = H()),
        (i = $('div')),
        l && l.c(),
        U(i, 'class', 'form-footer svelte-15iffyp')
    },
    m(u, f) {
      pe(e, u, f), W(u, r, f), W(u, i, f), l && l.m(i, null), (s = !0)
    },
    p(u, f) {
      const d = {}
      !t && f & 1 && ((t = !0), (d.email = u[0]), fr(() => (t = !1))),
        e.$set(d),
        u[1].ui.providers.password.paths.sign_in && l.p(u, f)
    },
    i(u) {
      s || (z(e.$$.fragment, u), z(l), (s = !0))
    },
    o(u) {
      Z(e.$$.fragment, u), Z(l), (s = !1)
    },
    d(u) {
      u && (V(r), V(i)), ye(e, u), l && l.d()
    },
  }
}
function ja(n) {
  let e, t
  return (
    (e = new ut({
      props: {
        href: n[1].ui.providers.password.paths.forgot_password,
        $$slots: { default: [Ua] },
        $$scope: { ctx: n },
      },
    })),
    {
      c() {
        he(e.$$.fragment)
      },
      m(r, i) {
        pe(e, r, i), (t = !0)
      },
      p(r, i) {
        const s = {}
        i & 64 && (s.$$scope = { dirty: i, ctx: r }), e.$set(s)
      },
      i(r) {
        t || (z(e.$$.fragment, r), (t = !0))
      },
      o(r) {
        Z(e.$$.fragment, r), (t = !1)
      },
      d(r) {
        ye(e, r)
      },
    }
  )
}
function Ua(n) {
  let e = n[1].ui.providers.password.dico.forgot_password + '',
    t
  return {
    c() {
      t = Y(e)
    },
    m(r, i) {
      W(r, t, i)
    },
    p: ie,
    d(r) {
      r && V(t)
    },
  }
}
function Wa(n) {
  let e, t
  return (
    (e = new ut({
      props: {
        href: n[1].ui.providers.password.paths.sign_up,
        $$slots: { default: [Va] },
        $$scope: { ctx: n },
      },
    })),
    {
      c() {
        he(e.$$.fragment)
      },
      m(r, i) {
        pe(e, r, i), (t = !0)
      },
      p(r, i) {
        const s = {}
        i & 64 && (s.$$scope = { dirty: i, ctx: r }), e.$set(s)
      },
      i(r) {
        t || (z(e.$$.fragment, r), (t = !0))
      },
      o(r) {
        Z(e.$$.fragment, r), (t = !1)
      },
      d(r) {
        ye(e, r)
      },
    }
  )
}
function Va(n) {
  let e = n[1].ui.providers.password.dico.btn_sign_up + '',
    t
  return {
    c() {
      t = Y(e)
    },
    m(r, i) {
      W(r, t, i)
    },
    p: ie,
    d(r) {
      r && V(t)
    },
  }
}
function Ha(n) {
  let e, t, r, i, s, a, o, l
  function u(p) {
    n[4](p)
  }
  let f = { firstlyDataAuth: n[1] }
  n[0] !== void 0 && (f.email = n[0]), (e = new Ra({ props: f })), lr.push(() => ur(e, 'email', u))
  let d = n[1].ui.providers.password.paths.forgot_password && ja(n),
    h = n[1].ui.providers.password.paths.sign_up && Wa(n)
  return {
    c() {
      he(e.$$.fragment),
        (r = H()),
        (i = $('div')),
        d && d.c(),
        (s = H()),
        (a = $('hr')),
        (o = H()),
        h && h.c(),
        U(i, 'class', 'form-footer svelte-15iffyp')
    },
    m(p, m) {
      pe(e, p, m),
        W(p, r, m),
        W(p, i, m),
        d && d.m(i, null),
        C(i, s),
        C(i, a),
        C(i, o),
        h && h.m(i, null),
        (l = !0)
    },
    p(p, m) {
      const b = {}
      !t && m & 1 && ((t = !0), (b.email = p[0]), fr(() => (t = !1))),
        e.$set(b),
        p[1].ui.providers.password.paths.forgot_password && d.p(p, m),
        p[1].ui.providers.password.paths.sign_up && h.p(p, m)
    },
    i(p) {
      l || (z(e.$$.fragment, p), z(d), z(h), (l = !0))
    },
    o(p) {
      Z(e.$$.fragment, p), Z(d), Z(h), (l = !1)
    },
    d(p) {
      p && (V(r), V(i)), ye(e, p), d && d.d(), h && h.d()
    },
  }
}
function xa(n) {
  let e, t
  return (
    (e = new ut({
      props: {
        href: n[1].ui.providers.password.paths.sign_in,
        $$slots: { default: [Qa] },
        $$scope: { ctx: n },
      },
    })),
    {
      c() {
        he(e.$$.fragment)
      },
      m(r, i) {
        pe(e, r, i), (t = !0)
      },
      p(r, i) {
        const s = {}
        i & 64 && (s.$$scope = { dirty: i, ctx: r }), e.$set(s)
      },
      i(r) {
        t || (z(e.$$.fragment, r), (t = !0))
      },
      o(r) {
        Z(e.$$.fragment, r), (t = !1)
      },
      d(r) {
        ye(e, r)
      },
    }
  )
}
function Qa(n) {
  let e = n[1].ui.providers.password.dico.back_to_sign_in + '',
    t
  return {
    c() {
      t = Y(e)
    },
    m(r, i) {
      W(r, t, i)
    },
    p: ie,
    d(r) {
      r && V(t)
    },
  }
}
function Ga(n) {
  let e, t, r, i, s
  function a(u) {
    n[5](u)
  }
  let o = { firstlyDataAuth: n[1] }
  n[0] !== void 0 && (o.email = n[0]), (e = new Ta({ props: o })), lr.push(() => ur(e, 'email', a))
  let l = n[1].ui.providers.password.paths.sign_in && xa(n)
  return {
    c() {
      he(e.$$.fragment),
        (r = H()),
        (i = $('div')),
        l && l.c(),
        U(i, 'class', 'form-footer svelte-15iffyp')
    },
    m(u, f) {
      pe(e, u, f), W(u, r, f), W(u, i, f), l && l.m(i, null), (s = !0)
    },
    p(u, f) {
      const d = {}
      !t && f & 1 && ((t = !0), (d.email = u[0]), fr(() => (t = !1))),
        e.$set(d),
        u[1].ui.providers.password.paths.sign_in && l.p(u, f)
    },
    i(u) {
      s || (z(e.$$.fragment, u), z(l), (s = !0))
    },
    o(u) {
      Z(e.$$.fragment, u), Z(l), (s = !1)
    },
    d(u) {
      u && (V(r), V(i)), ye(e, u), l && l.d()
    },
  }
}
function za(n) {
  let e, t
  return (
    (e = new ut({
      props: {
        href: n[1].ui.providers.password.paths.sign_in,
        $$slots: { default: [Ka] },
        $$scope: { ctx: n },
      },
    })),
    {
      c() {
        he(e.$$.fragment)
      },
      m(r, i) {
        pe(e, r, i), (t = !0)
      },
      p(r, i) {
        const s = {}
        i & 64 && (s.$$scope = { dirty: i, ctx: r }), e.$set(s)
      },
      i(r) {
        t || (z(e.$$.fragment, r), (t = !0))
      },
      o(r) {
        Z(e.$$.fragment, r), (t = !1)
      },
      d(r) {
        ye(e, r)
      },
    }
  )
}
function Ka(n) {
  let e = n[1].ui.providers.password.dico.back_to_sign_in + '',
    t
  return {
    c() {
      t = Y(e)
    },
    m(r, i) {
      W(r, t, i)
    },
    p: ie,
    d(r) {
      r && V(t)
    },
  }
}
function Xa(n) {
  let e, t, r, i
  e = new Fa({ props: { firstlyDataAuth: n[1] } })
  let s = n[1].ui.providers.password.paths.sign_in && za(n)
  return {
    c() {
      he(e.$$.fragment),
        (t = H()),
        (r = $('div')),
        s && s.c(),
        U(r, 'class', 'form-footer svelte-15iffyp')
    },
    m(a, o) {
      pe(e, a, o), W(a, t, o), W(a, r, o), s && s.m(r, null), (i = !0)
    },
    p(a, o) {
      a[1].ui.providers.password.paths.sign_in && s.p(a, o)
    },
    i(a) {
      i || (z(e.$$.fragment, a), z(s), (i = !0))
    },
    o(a) {
      Z(e.$$.fragment, a), Z(s), (i = !1)
    },
    d(a) {
      a && (V(t), V(r)), ye(e, a), s && s.d()
    },
  }
}
function Za(n) {
  let e, t, r
  return {
    c() {
      ;(e = $('div')),
        (e.innerHTML = '<small>- 404 -</small>'),
        (t = H()),
        (r = $('div')),
        (r.innerHTML = '<small>Nothing to see here</small>'),
        U(e, 'class', 'fallback svelte-15iffyp'),
        U(r, 'class', 'fallback svelte-15iffyp')
    },
    m(i, s) {
      W(i, e, s), W(i, t, s), W(i, r, s)
    },
    p: ie,
    d(i) {
      i && (V(e), V(t), V(r))
    },
  }
}
function Ya(n) {
  let e,
    t,
    r,
    i,
    s,
    a,
    o,
    l,
    u,
    f = n[1].ui.providers.password.paths.sign_up && $a(n)
  return (
    (t = new Qe({
      props: {
        path: n[1].ui.providers.password.paths.sign_in,
        $$slots: { default: [Ha] },
        $$scope: { ctx: n },
      },
    })),
    (i = new Qe({
      props: {
        path: n[1].ui.providers.password.paths.forgot_password,
        $$slots: { default: [Ga] },
        $$scope: { ctx: n },
      },
    })),
    (a = new Qe({
      props: {
        path: n[1].ui.providers.password.paths.reset_password,
        $$slots: { default: [Xa] },
        $$scope: { ctx: n },
      },
    })),
    (l = new Qe({ props: { fallback: !0, $$slots: { default: [Za] }, $$scope: { ctx: n } } })),
    {
      c() {
        f && f.c(),
          (e = H()),
          he(t.$$.fragment),
          (r = H()),
          he(i.$$.fragment),
          (s = H()),
          he(a.$$.fragment),
          (o = H()),
          he(l.$$.fragment)
      },
      m(d, h) {
        f && f.m(d, h),
          W(d, e, h),
          pe(t, d, h),
          W(d, r, h),
          pe(i, d, h),
          W(d, s, h),
          pe(a, d, h),
          W(d, o, h),
          pe(l, d, h),
          (u = !0)
      },
      p(d, h) {
        d[1].ui.providers.password.paths.sign_up && f.p(d, h)
        const p = {}
        h & 65 && (p.$$scope = { dirty: h, ctx: d }), t.$set(p)
        const m = {}
        h & 65 && (m.$$scope = { dirty: h, ctx: d }), i.$set(m)
        const b = {}
        h & 64 && (b.$$scope = { dirty: h, ctx: d }), a.$set(b)
        const k = {}
        h & 64 && (k.$$scope = { dirty: h, ctx: d }), l.$set(k)
      },
      i(d) {
        u ||
          (z(f),
          z(t.$$.fragment, d),
          z(i.$$.fragment, d),
          z(a.$$.fragment, d),
          z(l.$$.fragment, d),
          (u = !0))
      },
      o(d) {
        Z(f),
          Z(t.$$.fragment, d),
          Z(i.$$.fragment, d),
          Z(a.$$.fragment, d),
          Z(l.$$.fragment, d),
          (u = !1)
      },
      d(d) {
        d && (V(e), V(r), V(s), V(o)), f && f.d(d), ye(t, d), ye(i, d), ye(a, d), ye(l, d)
      },
    }
  )
}
function eo(n) {
  let e, t, r, i
  return (
    (r = new Qe({ props: { $$slots: { default: [Ya] }, $$scope: { ctx: n } } })),
    {
      c() {
        ;(e = $('div')),
          (t = $('div')),
          he(r.$$.fragment),
          U(t, 'class', 'form svelte-15iffyp'),
          U(e, 'class', 'wrapper svelte-15iffyp')
      },
      m(s, a) {
        W(s, e, a), C(e, t), pe(r, t, null), (i = !0)
      },
      p(s, [a]) {
        const o = {}
        a & 65 && (o.$$scope = { dirty: a, ctx: s }), r.$set(o)
      },
      i(s) {
        i || (z(r.$$.fragment, s), (i = !0))
      },
      o(s) {
        Z(r.$$.fragment, s), (i = !1)
      },
      d(s) {
        s && V(e), ye(r)
      },
    }
  )
}
function to(n, e, t) {
  let { firstlyData: r } = e,
    i = r.props,
    s = ''
  function a(u) {
    ;(s = u), t(0, s)
  }
  function o(u) {
    ;(s = u), t(0, s)
  }
  function l(u) {
    ;(s = u), t(0, s)
  }
  return (
    (n.$$set = (u) => {
      'firstlyData' in u && t(2, (r = u.firstlyData))
    }),
    [s, i, r, a, o, l]
  )
}
class oo extends Je {
  constructor(e) {
    super(), je(this, e, to, eo, Xe, { firstlyData: 2 })
  }
}
export { oo as default }
