const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Page-CaIYu0-y.js","assets/Page-MkYglNtu.css"])))=>i.map(i=>d[i]);
var ye=Object.defineProperty;var ge=(e,t,n)=>t in e?ye(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var v=(e,t,n)=>ge(e,typeof t!="symbol"?t+"":t,n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))o(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function n(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(s){if(s.ep)return;s.ep=!0;const r=n(s);fetch(s.href,r)}})();const be="modulepreload",ve=function(e){return"/api/static/"+e},G={},x=function(t,n,o){let s=Promise.resolve();if(n&&n.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),c=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));s=Promise.all(n.map(u=>{if(u=ve(u),u in G)return;G[u]=!0;const l=u.endsWith(".css"),i=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${u}"]${i}`))return;const a=document.createElement("link");if(a.rel=l?"stylesheet":be,l||(a.as="script",a.crossOrigin=""),a.href=u,c&&a.setAttribute("nonce",c),document.head.appendChild(a),l)return new Promise((f,d)=>{a.addEventListener("load",f),a.addEventListener("error",()=>d(new Error(`Unable to preload CSS for ${u}`)))})}))}return s.then(()=>t()).catch(r=>{const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=r,window.dispatchEvent(c),!c.defaultPrevented)throw r})};function _(){}function we(e,t){for(const n in t)e[n]=t[n];return e}function $e(e){return!!e&&(typeof e=="object"||typeof e=="function")&&typeof e.then=="function"}function T(e,t,n,o,s){e.__svelte_meta={loc:{file:t,line:n,column:o,char:s}}}function ne(e){return e()}function H(){return Object.create(null)}function S(e){e.forEach(ne)}function q(e){return typeof e=="function"}function ke(e,t){return e!=e?t==t:e!==t||e&&typeof e=="object"||typeof e=="function"}let A;function Ze(e,t){return e===t?!0:(A||(A=document.createElement("a")),A.href=t,e===A.href)}function et(e,t){return e!=e?t==t:e!==t}function Ee(e){return Object.keys(e).length===0}function tt(e,t){if(e!=null&&typeof e.subscribe!="function")throw new Error(`'${t}' is not a store with a 'subscribe' method`)}function oe(e,...t){if(e==null){for(const o of t)o(void 0);return _}const n=e.subscribe(...t);return n.unsubscribe?()=>n.unsubscribe():n}function nt(e){let t;return oe(e,n=>t=n)(),t}function ot(e,t,n){e.$$.on_destroy.push(oe(t,n))}function rt(e,t,n,o){if(e){const s=re(e,t,n,o);return e[0](s)}}function re(e,t,n,o){return e[1]&&o?we(n.ctx.slice(),e[1](o(t))):n.ctx}function st(e,t,n,o){if(e[2]&&o){const s=e[2](o(n));if(t.dirty===void 0)return s;if(typeof s=="object"){const r=[],c=Math.max(t.dirty.length,s.length);for(let u=0;u<c;u+=1)r[u]=t.dirty[u]|s[u];return r}return t.dirty|s}return t.dirty}function ct(e,t,n,o,s,r){if(s){const c=re(t,n,o,r);e.p(c,s)}}function it(e){if(e.ctx.length>32){const t=[],n=e.ctx.length/32;for(let o=0;o<n;o++)t[o]=-1;return t}return-1}function ut(e){const t={};for(const n in e)n[0]!=="$"&&(t[n]=e[n]);return t}function lt(e,t){const n={};t=new Set(t);for(const o in e)!t.has(o)&&o[0]!=="$"&&(n[o]=e[o]);return n}function ft(e,t,n){return e.set(n),t}function at(e){return e&&q(e.destroy)?e.destroy:_}const De=typeof window<"u"?window:typeof globalThis<"u"?globalThis:global;function Oe(e,t){e.appendChild(t)}function Se(e,t,n){e.insertBefore(t,n||null)}function se(e){e.parentNode&&e.parentNode.removeChild(e)}function Ae(e,t){for(let n=0;n<e.length;n+=1)e[n]&&e[n].d(t)}function z(e){return document.createElement(e)}function V(e){return document.createTextNode(e)}function ce(){return V(" ")}function ie(){return V("")}function Re(e,t,n,o){return e.addEventListener(t,n,o),()=>e.removeEventListener(t,n,o)}function dt(e){return function(t){return t.preventDefault(),e.call(this,t)}}function ue(e,t,n){n==null?e.removeAttribute(t):e.getAttribute(t)!==n&&e.setAttribute(t,n)}const xe=["width","height"];function _t(e,t){const n=Object.getOwnPropertyDescriptors(e.__proto__);for(const o in t)t[o]==null?e.removeAttribute(o):o==="style"?e.style.cssText=t[o]:o==="__value"?e.value=e[o]=t[o]:n[o]&&n[o].set&&xe.indexOf(o)===-1?e[o]=t[o]:ue(e,o,t[o])}function Pe(e){return Array.from(e.childNodes)}function ht(e,t){e.value=t??""}function pt(e,t,n){e.classList.toggle(t,!!n)}function je(e,t,{bubbles:n=!1,cancelable:o=!1}={}){return new CustomEvent(e,{detail:t,bubbles:n,cancelable:o})}let D;function p(e){D=e}function E(){if(!D)throw new Error("Function called outside component initialization");return D}function J(e){E().$$.on_mount.push(e)}function mt(e){E().$$.on_destroy.push(e)}function yt(e,t){return E().$$.context.set(e,t),t}function gt(e){return E().$$.context.get(e)}function bt(e){return E().$$.context.has(e)}function vt(e,t){const n=e.$$.callbacks[t.type];n&&n.slice().forEach(o=>o.call(this,t))}const $=[],Q=[];let k=[];const j=[],Ce=Promise.resolve();let C=!1;function Le(){C||(C=!0,Ce.then(U))}function L(e){k.push(e)}function wt(e){j.push(e)}const P=new Set;let w=0;function U(){if(w!==0)return;const e=D;do{try{for(;w<$.length;){const t=$[w];w++,p(t),Me(t.$$)}}catch(t){throw $.length=0,w=0,t}for(p(null),$.length=0,w=0;Q.length;)Q.pop()();for(let t=0;t<k.length;t+=1){const n=k[t];P.has(n)||(P.add(n),n())}k.length=0}while($.length);for(;j.length;)j.pop()();C=!1,P.clear(),p(e)}function Me(e){if(e.fragment!==null){e.update(),S(e.before_update);const t=e.dirty;e.dirty=[-1],e.fragment&&e.fragment.p(e.ctx,t),e.after_update.forEach(L)}}function Be(e){const t=[],n=[];k.forEach(o=>e.indexOf(o)===-1?t.push(o):n.push(o)),n.forEach(o=>o()),k=t}const R=new Set;let g;function le(){g={r:0,c:[],p:g}}function fe(){g.r||S(g.c),g=g.p}function b(e,t){e&&e.i&&(R.delete(e),e.i(t))}function O(e,t,n,o){if(e&&e.o){if(R.has(e))return;R.add(e),g.c.push(()=>{R.delete(e),o&&(n&&e.d(1),o())}),e.o(t)}else o&&o()}function X(e,t){const n=t.token={};function o(s,r,c,u){if(t.token!==n)return;t.resolved=u;let l=t.ctx;c!==void 0&&(l=l.slice(),l[c]=u);const i=s&&(t.current=s)(l);let a=!1;t.block&&(t.blocks?t.blocks.forEach((f,d)=>{d!==r&&f&&(le(),O(f,1,1,()=>{t.blocks[d]===f&&(t.blocks[d]=null)}),fe())}):t.block.d(1),i.c(),b(i,1),i.m(t.mount(),t.anchor),a=!0),t.block=i,t.blocks&&(t.blocks[r]=i),a&&U()}if($e(e)){const s=E();if(e.then(r=>{p(s),o(t.then,1,t.value,r),p(null)},r=>{if(p(s),o(t.catch,2,t.error,r),p(null),!t.hasCatch)throw r}),t.current!==t.pending)return o(t.pending,0),!0}else{if(t.current!==t.then)return o(t.then,1,t.value,e),!0;t.resolved=e}}function Ie(e,t,n){const o=t.slice(),{resolved:s}=e;e.current===e.then&&(o[e.value]=s),e.current===e.catch&&(o[e.error]=s),e.block.p(o,n)}function Ne(e){return(e==null?void 0:e.length)!==void 0?e:Array.from(e)}function $t(e,t,n){const o=e.$$.props[t];o!==void 0&&(e.$$.bound[o]=n,n(e.$$.ctx[o]))}function Te(e){e&&e.c()}function ae(e,t,n){const{fragment:o,after_update:s}=e.$$;o&&o.m(t,n),L(()=>{const r=e.$$.on_mount.map(ne).filter(q);e.$$.on_destroy?e.$$.on_destroy.push(...r):S(r),e.$$.on_mount=[]}),s.forEach(L)}function de(e,t){const n=e.$$;n.fragment!==null&&(Be(n.after_update),S(n.on_destroy),n.fragment&&n.fragment.d(t),n.on_destroy=n.fragment=null,n.ctx=[])}function qe(e,t){e.$$.dirty[0]===-1&&($.push(e),Le(),e.$$.dirty.fill(0)),e.$$.dirty[t/31|0]|=1<<t%31}function ze(e,t,n,o,s,r,c=null,u=[-1]){const l=D;p(e);const i=e.$$={fragment:null,ctx:[],props:r,update:_,not_equal:s,bound:H(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(t.context||(l?l.$$.context:[])),callbacks:H(),dirty:u,skip_bound:!1,root:t.target||l.$$.root};c&&c(i.root);let a=!1;if(i.ctx=n?n(e,t.props||{},(f,d,...F)=>{const W=F.length?F[0]:d;return i.ctx&&s(i.ctx[f],i.ctx[f]=W)&&(!i.skip_bound&&i.bound[f]&&i.bound[f](W),a&&qe(e,f)),d}):[],i.update(),a=!0,S(i.before_update),i.fragment=o?o(i.ctx):!1,t.target){if(t.hydrate){const f=Pe(t.target);i.fragment&&i.fragment.l(f),f.forEach(se)}else i.fragment&&i.fragment.c();t.intro&&b(e.$$.fragment),ae(e,t.target,t.anchor),U()}p(l)}class Ve{constructor(){v(this,"$$");v(this,"$$set")}$destroy(){de(this,1),this.$destroy=_}$on(t,n){if(!q(n))return _;const o=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return o.push(n),()=>{const s=o.indexOf(n);s!==-1&&o.splice(s,1)}}$set(t){this.$$set&&!Ee(t)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}const Ue="4.2.18",Ke="4";function h(e,t){document.dispatchEvent(je(e,{version:Ue,...t},{bubbles:!0}))}function kt(e,t){h("SvelteDOMInsert",{target:e,node:t}),Oe(e,t)}function m(e,t,n){h("SvelteDOMInsert",{target:e,node:t,anchor:n}),Se(e,t,n)}function y(e){h("SvelteDOMRemove",{node:e}),se(e)}function Fe(e,t,n,o,s,r,c){const u=o===!0?["capture"]:o?Array.from(Object.keys(o)):[];s&&u.push("preventDefault"),r&&u.push("stopPropagation"),c&&u.push("stopImmediatePropagation"),h("SvelteDOMAddEventListener",{node:e,event:t,handler:n,modifiers:u});const l=Re(e,t,n,o);return()=>{h("SvelteDOMRemoveEventListener",{node:e,event:t,handler:n,modifiers:u}),l()}}function _e(e,t,n){ue(e,t,n),n==null?h("SvelteDOMRemoveAttribute",{node:e,attribute:t}):h("SvelteDOMSetAttribute",{node:e,attribute:t,value:n})}function We(e,t){t=""+t,e.data!==t&&(h("SvelteDOMSetData",{node:e,data:t}),e.data=t)}function Y(e){if(typeof e!="string"&&!(e&&typeof e=="object"&&"length"in e)&&!(typeof Symbol=="function"&&e&&Symbol.iterator in e))throw new Error("{#each} only works with iterable values.");return Ne(e)}function Ge(e,t,n){for(const o of Object.keys(t))~n.indexOf(o)||console.warn(`<${e}> received an unexpected slot "${o}".`)}class He extends Ve{constructor(n){if(!n||!n.target&&!n.$$inline)throw new Error("'target' is a required option");super();v(this,"$$prop_def");v(this,"$$events_def");v(this,"$$slot_def")}$destroy(){super.$destroy(),this.$destroy=()=>{console.warn("Component was already destroyed")}}$capture_state(){}$inject_state(){}}typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(Ke);const{Object:Je,console:Z}=De,K="src/App.svelte";function ee(e,t,n){const o=e.slice();return o[6]=t[n],o}function te(e){e[9]=e[10].default}function M(e){let t,n,o,s={ctx:e,current:null,token:null,hasCatch:!1,pending:me,then:pe,catch:he,value:10,blocks:[,,,]};X(n=e[1],s);const r={c:function(){t=ie(),s.block.c()},m:function(u,l){m(u,t,l),s.block.m(u,s.anchor=l),s.mount=()=>t.parentNode,s.anchor=t,o=!0},p:function(u,l){e=u,s.ctx=e,l&2&&n!==(n=e[1])&&X(n,s)||Ie(s,e,l)},i:function(u){o||(b(s.block),o=!0)},o:function(u){for(let l=0;l<3;l+=1){const i=s.blocks[l];O(i)}o=!1},d:function(u){u&&y(t),s.block.d(u),s.token=null,s=null}};return h("SvelteRegisterBlock",{block:r,id:M.name,type:"if",source:"(19:2) {#if activeModuleRef}",ctx:e}),r}function he(e){const t={c:_,m:_,p:_,i:_,o:_,d:_};return h("SvelteRegisterBlock",{block:t,id:he.name,type:"catch",source:'(1:0) <script lang=\\"ts\\">import { onMount }',ctx:e}),t}function pe(e){te(e);let t,n;t=new e[9]({props:{firstlyData:e[0]},$$inline:!0});const o={c:function(){Te(t.$$.fragment)},m:function(r,c){ae(t,r,c),n=!0},p:function(r,c){te(r);const u={};c&1&&(u.firstlyData=r[0]),t.$set(u)},i:function(r){n||(b(t.$$.fragment,r),n=!0)},o:function(r){O(t.$$.fragment,r),n=!1},d:function(r){de(t,r)}};return h("SvelteRegisterBlock",{block:o,id:pe.name,type:"then",source:"(20:62)        <ModuleComponent {firstlyData}",ctx:e}),o}function me(e){const t={c:_,m:_,p:_,i:_,o:_,d:_};return h("SvelteRegisterBlock",{block:t,id:me.name,type:"pending",source:'(1:0) <script lang=\\"ts\\">import { onMount }',ctx:e}),t}function B(e){let t=console.info(e[0])+"",n,o,s,r=Y(e[3]()),c=[];for(let l=0;l<r.length;l+=1)c[l]=I(ee(e,r,l));const u={c:function(){n=V(t),o=ce(),s=z("div");for(let i=0;i<c.length;i+=1)c[i].c();_e(s,"class","debug svelte-4ze7zl"),T(s,K,38,2,681)},m:function(i,a){m(i,n,a),m(i,o,a),m(i,s,a);for(let f=0;f<c.length;f+=1)c[f]&&c[f].m(s,null)},p:function(i,a){if(a&1&&t!==(t=console.info(i[0])+"")&&We(n,t),a&12){r=Y(i[3]());let f;for(f=0;f<r.length;f+=1){const d=ee(i,r,f);c[f]?c[f].p(d,a):(c[f]=I(d),c[f].c(),c[f].m(s,null))}for(;f<c.length;f+=1)c[f].d(1);c.length=r.length}},d:function(i){i&&(y(n),y(o),y(s)),Ae(c,i)}};return h("SvelteRegisterBlock",{block:u,id:B.name,type:"if",source:"(26:0) {#if firstlyData.debug}",ctx:e}),u}function I(e){let t,n,o;function s(){return e[4](e[6])}const r={c:function(){t=z("button"),t.textContent=`Load ${e[6]}`,_e(t,"class","svelte-4ze7zl"),T(t,K,40,6,739)},m:function(u,l){m(u,t,l),n||(o=Fe(t,"click",s,!1,!1,!1,!1),n=!0)},p:function(u,l){e=u},d:function(u){u&&y(t),n=!1,o()}};return h("SvelteRegisterBlock",{block:r,id:I.name,type:"each",source:"(29:4) {#each getKeys() as module}",ctx:e}),r}function N(e){let t,n,o,s,r=e[1]&&M(e),c=e[0].debug&&B(e);const u={c:function(){t=z("main"),r&&r.c(),n=ce(),c&&c.c(),o=ie(),T(t,K,28,0,461)},l:function(i){throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option")},m:function(i,a){m(i,t,a),r&&r.m(t,null),m(i,n,a),c&&c.m(i,a),m(i,o,a),s=!0},p:function(i,[a]){i[1]?r?(r.p(i,a),a&2&&b(r,1)):(r=M(i),r.c(),b(r,1),r.m(t,null)):r&&(le(),O(r,1,1,()=>{r=null}),fe()),i[0].debug?c?c.p(i,a):(c=B(i),c.c(),c.m(o.parentNode,o)):c&&(c.d(1),c=null)},i:function(i){s||(b(r),s=!0)},o:function(i){O(r),s=!1},d:function(i){i&&(y(t),y(n),y(o)),r&&r.d(),c&&c.d(i)}};return h("SvelteRegisterBlock",{block:u,id:N.name,type:"component",source:"",ctx:e}),u}function Qe(e,t,n){let{$$slots:o={},$$scope:s}=t;Ge("App",o,[]);let{firstlyData:r}=t;const c={auth:x(()=>import("./Page-CaIYu0-y.js"),__vite__mapDeps([0,1])),admin:x(()=>import("./Page-BxomFlZ8.js"),[]),storage:x(()=>import("./Page-Bb8bFlrP.js"),[])};let u;function l(d){n(1,u=c[d])}const i=()=>Object.keys(c);J(()=>{l(r.module)}),e.$$.on_mount.push(function(){r===void 0&&!("firstlyData"in t||e.$$.bound[e.$$.props.firstlyData])&&Z.warn("<App> was created without expected prop 'firstlyData'")});const a=["firstlyData"];Je.keys(t).forEach(d=>{!~a.indexOf(d)&&d.slice(0,2)!=="$$"&&d!=="slot"&&Z.warn(`<App> was created with unknown prop '${d}'`)});const f=d=>l(d);return e.$$set=d=>{"firstlyData"in d&&n(0,r=d.firstlyData)},e.$capture_state=()=>({onMount:J,firstlyData:r,modules:c,activeModuleRef:u,loadModule:l,getKeys:i}),e.$inject_state=d=>{"firstlyData"in d&&n(0,r=d.firstlyData),"activeModuleRef"in d&&n(1,u=d.activeModuleRef)},t&&"$$inject"in t&&e.$inject_state(t.$$inject),[r,u,l,i,f]}class Xe extends He{constructor(t){super(t),ze(this,t,Qe,N,ke,{firstlyData:0}),h("SvelteRegisterComponent",{component:this,tagName:"App",options:t,id:N.name})}get firstlyData(){throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'")}set firstlyData(t){throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'")}}new Xe({target:document.getElementById("app"),props:{firstlyData}});export{Ze as $,ct as A,it as B,st as C,we as D,lt as E,ut as F,z as G,_t as H,T as I,at as J,Fe as K,vt as L,V as M,ce as N,_e as O,pt as P,kt as Q,ht as R,He as S,dt as T,We as U,Te as V,ae as W,de as X,Q as Y,$t as Z,wt as _,ke as a,ze as b,et as c,h as d,De as e,ot as f,nt as g,Ge as h,q as i,bt as j,gt as k,yt as l,ft as m,_ as n,mt as o,rt as p,ie as q,S as r,oe as s,m as t,b as u,tt as v,le as w,O as x,fe as y,y as z};
