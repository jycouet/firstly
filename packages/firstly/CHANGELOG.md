# firstly

## 0.2.0

### Minor Changes

- [#176](https://github.com/jycouet/firstly/pull/176)
  [`1859bba`](https://github.com/jycouet/firstly/commit/1859bbaff86d3592900c7a18de1491203f8ebe8d)
  Thanks [@jycouet](https://github.com/jycouet)! - align with remult 3.1 (cuid to id)

### Patch Changes

- [#172](https://github.com/jycouet/firstly/pull/172)
  [`ab633f5`](https://github.com/jycouet/firstly/commit/ab633f59964f437c636f84c06e0ba82d11954c0a)
  Thanks [@jycouet](https://github.com/jycouet)! - new module https://carbone.io/ 🎉

## 0.1.3

### Patch Changes

- [`2348b71`](https://github.com/jycouet/firstly/commit/2348b7172d67b2357daf6cc57fbbd69d13345505)
  Thanks [@jycouet](https://github.com/jycouet)! - export `withChangeLog` to chain options for
  `@Entity`

- [`51cbd73`](https://github.com/jycouet/firstly/commit/51cbd7318797bf740627ae4cac8cc5074f7dab5e)
  Thanks [@jycouet](https://github.com/jycouet)! - export @kitql/helper as `h`

## 0.1.2

### Patch Changes

- [`e4d8b67`](https://github.com/jycouet/firstly/commit/e4d8b673787beee6d28e36aac1a404f49d690fb8)
  Thanks [@jycouet](https://github.com/jycouet)! - export interface for `changeLog` Module

## 0.1.1

### Patch Changes

- [`847af7a`](https://github.com/jycouet/firstly/commit/847af7a6d33224884032c80f63cb489106e6d40a)
  Thanks [@jycouet](https://github.com/jycouet)! - export mail & cron roles from client bundle

## 0.1.0

### Minor Changes

- [#140](https://github.com/jycouet/firstly/pull/140)
  [`94b2188`](https://github.com/jycouet/firstly/commit/94b2188c78772f94e7835ab933fcebbe2a37703c)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] - deprecate firstly module in favor of
  remult module

  ```diff
  remultApi({
  --	modules: [],   // firstly modules
  ++	modulesFF: [], // firstly modules (deprecated)
  ++  modules: [],   // remult modules
  })

  Then, you can use `modules` level of `remult`

  ```

- [#153](https://github.com/jycouet/firstly/pull/153)
  [`f8ca698`](https://github.com/jycouet/firstly/commit/f8ca698aa2b4ec7cfe77f6e63486c0bf9a124946)
  Thanks [@jycouet](https://github.com/jycouet)! - all root import ... from `firstly` moved to
  `firstly/internals` (we will gradually add them back when needed

### Patch Changes

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`407ed4d`](https://github.com/jycouet/firstly/commit/407ed4db8f4b99f234932965b870d51f6a9c07ca)
  Thanks [@jycouet](https://github.com/jycouet)! - need to pass `redirect` to handleAuth manually

- [#102](https://github.com/jycouet/firstly/pull/102)
  [`f0effb9`](https://github.com/jycouet/firstly/commit/f0effb9e2dfa3f1c3070bc27c498d7f1e1ed877d)
  Thanks [@jycouet](https://github.com/jycouet)! - Prepare JYC 016

- [`c4606c5`](https://github.com/jycouet/firstly/commit/c4606c5ad5c0c9d90c830d99d1d2a919dc3750ec)
  Thanks [@jycouet](https://github.com/jycouet)! - role to roles

- [#108](https://github.com/jycouet/firstly/pull/108)
  [`cf100f4`](https://github.com/jycouet/firstly/commit/cf100f40a8462eca51acff3ac5d8779da78816ec)
  Thanks [@jycouet](https://github.com/jycouet)! - fix import paths

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`f30c737`](https://github.com/jycouet/firstly/commit/f30c73781d8f50da08fcdc25f1f7611133ea8b0c)
  Thanks [@jycouet](https://github.com/jycouet)! - switch mail engine to sailkit

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`5e1d67e`](https://github.com/jycouet/firstly/commit/5e1d67eb8f75127c3d729945e20b22c40184ee20)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] - Auth Identifier got removed in favor
  of name in User table.

- [#110](https://github.com/jycouet/firstly/pull/110)
  [`0c66f11`](https://github.com/jycouet/firstly/commit/0c66f114dd95f65c0407abddbd647a66769142eb)
  Thanks [@jycouet](https://github.com/jycouet)! - add github in default ui (if configured)

## 0.1.0-next.5

### Patch Changes

- [`c4606c5`](https://github.com/jycouet/firstly/commit/c4606c5ad5c0c9d90c830d99d1d2a919dc3750ec)
  Thanks [@jycouet](https://github.com/jycouet)! - role to roles

## 0.1.0-next.4

### Minor Changes

- [#153](https://github.com/jycouet/firstly/pull/153)
  [`f8ca698`](https://github.com/jycouet/firstly/commit/f8ca698aa2b4ec7cfe77f6e63486c0bf9a124946)
  Thanks [@jycouet](https://github.com/jycouet)! - all root import ... from `firstly` moved to
  `firstly/internals` (we will gradually add them back when needed

## 0.1.0-next.3

### Minor Changes

- [#140](https://github.com/jycouet/firstly/pull/140)
  [`94b2188`](https://github.com/jycouet/firstly/commit/94b2188c78772f94e7835ab933fcebbe2a37703c)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] - deprecate firstly module in favor of
  remult module

  ```diff
  remultApi({
  --	modules: [],   // firstly modules
  ++	modulesFF: [], // firstly modules
  })

  Then, you can use `modules` level of `remult`
  ```

### Patch Changes

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`407ed4d`](https://github.com/jycouet/firstly/commit/407ed4db8f4b99f234932965b870d51f6a9c07ca)
  Thanks [@jycouet](https://github.com/jycouet)! - need to pass `redirect` to handleAuth manually

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`f30c737`](https://github.com/jycouet/firstly/commit/f30c73781d8f50da08fcdc25f1f7611133ea8b0c)
  Thanks [@jycouet](https://github.com/jycouet)! - switch mail engine to sailkit

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`5e1d67e`](https://github.com/jycouet/firstly/commit/5e1d67eb8f75127c3d729945e20b22c40184ee20)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] - Auth Identifier got removed in favor
  of name in User table.

## 0.0.16-next.2

### Patch Changes

- [#110](https://github.com/jycouet/firstly/pull/110)
  [`0c66f11`](https://github.com/jycouet/firstly/commit/0c66f114dd95f65c0407abddbd647a66769142eb)
  Thanks [@jycouet](https://github.com/jycouet)! - add github in default ui (if configured)

## 0.0.16-next.1

### Patch Changes

- [#108](https://github.com/jycouet/firstly/pull/108)
  [`cf100f4`](https://github.com/jycouet/firstly/commit/cf100f40a8462eca51acff3ac5d8779da78816ec)
  Thanks [@jycouet](https://github.com/jycouet)! - fix import paths

## 0.0.16-next.0

### Patch Changes

- [#102](https://github.com/jycouet/firstly/pull/102)
  [`f0effb9`](https://github.com/jycouet/firstly/commit/f0effb9e2dfa3f1c3070bc27c498d7f1e1ed877d)
  Thanks [@jycouet](https://github.com/jycouet)! - Prepare JYC 016

## 0.0.15

### Patch Changes

- [#98](https://github.com/jycouet/firstly/pull/98)
  [`0d708f6`](https://github.com/jycouet/firstly/commit/0d708f605dc9d2943730f68ebf99c1d2f8a49926)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare JYC 0.0.15

## 0.0.14

### Patch Changes

- [#85](https://github.com/jycouet/firstly/pull/85)
  [`993f733`](https://github.com/jycouet/firstly/commit/993f73374591f134d76e30f8b5e4402b4d3112d0)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare JYC 014

## 0.0.13

### Patch Changes

- [#66](https://github.com/jycouet/firstly/pull/66)
  [`7d8b323`](https://github.com/jycouet/firstly/commit/7d8b323b49d7d76b6d59ec887ed2e37a2238f201)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare JYC 013

## 0.0.12

### Patch Changes

- [#64](https://github.com/jycouet/firstly/pull/64)
  [`782ef9c`](https://github.com/jycouet/firstly/commit/782ef9c8a1d967950e4c17de59b3225bc28df5c2)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare JYC 012

## 0.0.11

### Patch Changes

- [#56](https://github.com/jycouet/firstly/pull/56)
  [`a1e8de0`](https://github.com/jycouet/firstly/commit/a1e8de0a8871b8f1aa6cd81ee20d24f6a3da4c3f)
  Thanks [@jycouet](https://github.com/jycouet)! - export changeLog module and not changeLogs

## 0.0.10

### Patch Changes

- [#51](https://github.com/jycouet/firstly/pull/51)
  [`803023a`](https://github.com/jycouet/firstly/commit/803023a6257c0bfb9396bc0a7bd454bd1281e26c)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare 0.0.10

## 0.0.9

### Patch Changes

- [#43](https://github.com/jycouet/firstly/pull/43)
  [`46cfc39`](https://github.com/jycouet/firstly/commit/46cfc39090fc448a22c5ca95e45507a31ab8e2e0)
  Thanks [@jycouet](https://github.com/jycouet)! - better enum filter, grid action left/right, bump
  deps, opti session check, action after createOptionWhenNoResult

## 0.0.8

### Patch Changes

- [#27](https://github.com/jycouet/firstly/pull/27)
  [`66711b2`](https://github.com/jycouet/firstly/commit/66711b2373c69006d7ae5f06d8f4a6cb0e43670b)
  Thanks [@jycouet](https://github.com/jycouet)! - fix the session creation on signIn! (+default
  expiration is 30 days)

- [#27](https://github.com/jycouet/firstly/pull/27)
  [`0657c5c`](https://github.com/jycouet/firstly/commit/0657c5ca8b81673b493a6815a196a8c5351ecdf0)
  Thanks [@jycouet](https://github.com/jycouet)! - add uiStaticPath option in auth module to
  overwrite where are the static files for the module (dev option)

## 0.0.7

### Patch Changes

- [#25](https://github.com/jycouet/firstly/pull/25)
  [`54f2f6a`](https://github.com/jycouet/firstly/commit/54f2f6a833c1977c3163e91ce3172fa8edc9da47)
  Thanks [@jycouet](https://github.com/jycouet)! - adding e2e tests for accounts

- [#25](https://github.com/jycouet/firstly/pull/25)
  [`943e9d0`](https://github.com/jycouet/firstly/commit/943e9d0b6d5d6a631dc78661d188a76f254d4632)
  Thanks [@jycouet](https://github.com/jycouet)! - rename name to identifier in db

## 0.0.6

### Patch Changes

- [#23](https://github.com/jycouet/firstly/pull/23)
  [`c188eb3`](https://github.com/jycouet/firstly/commit/c188eb3d81a9e75b246387512621b5213bbe8dbd)
  Thanks [@jycouet](https://github.com/jycouet)! - fix auth & mail (logs & co)

## 0.0.5

### Patch Changes

- [#20](https://github.com/jycouet/firstly/pull/20)
  [`5b365a4`](https://github.com/jycouet/firstly/commit/5b365a474619f611b0eb0bfe38bbbb262acb3a7e)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] Renaming almost all exports! (Some
  `FF_` and `ff_` only when direct collision with other packages)

- [#20](https://github.com/jycouet/firstly/pull/20)
  [`b1ea110`](https://github.com/jycouet/firstly/commit/b1ea1101c45c137e477a937a8c6d130b346b2bb9)
  Thanks [@jycouet](https://github.com/jycouet)! - tweak cli, update github auth

## 0.0.4

### Patch Changes

- [#16](https://github.com/jycouet/firstly/pull/16)
  [`ac00e70`](https://github.com/jycouet/firstly/commit/ac00e703af515009bbe7e078998f77ef3a9e9ce5)
  Thanks [@jycouet](https://github.com/jycouet)! - WIP next version / split client & server imports.

## 0.0.3

### Patch Changes

- [`aab33e7`](https://github.com/jycouet/firstly/commit/aab33e7681b06c8336c263471a87b97cc6186c6e)
  Thanks [@jycouet](https://github.com/jycouet)! - deploy ui in package (test!)

## 0.0.2

### Patch Changes

- [`f127fc7`](https://github.com/jycouet/firstly/commit/f127fc78e00f6464d8fbbebc10f3ffb43402fcc3)
  Thanks [@jycouet](https://github.com/jycouet)! - publish firstly for the first time ;)
