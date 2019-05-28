// ==UserScript==
// @name         missing settings for sourcegraph(MSFS)
// @namespace    https://greasyfork.org
// @version      1.0.0
// @description  add extra settings to sourcegraph
// @author       pot-code
// @match        https://sourcegraph.com/*
// @grant        none
// ==/UserScript==

;(function() {
  'use strict'

  const PREFIX = 'MSFS'

  const defaultLevel = 3,
    logMethods = ['trace', 'debug', 'info', 'warn', 'error'],
    noop = function() {} // warn level
  function Logger() {
    function a(a) {
      logMethods.forEach((b, c) => {
        this[b] = c < a ? noop : console['debug' === b ? 'log' : b].bind(console, `[${PREFIX}][${b.toUpperCase()}]:`)
      })
    }
    const b = this
    ;(b.setLevel = c => {
      a.call(b, c)
    }),
      a.call(b, defaultLevel)
  }
  const logger = new Logger()
  const LogLevels = logMethods.reduce((a, b, c) => ((a[b] = c), a), {})

  function offsetToBody(a) {
    let b = 0,
      c = 0
    for (; a !== document.body; ) (c += a.offsetLeft), (b += a.offsetTop), (a = a.offsetParent)
    return { offsetLeft: c, offsetTop: b }
  }
  /**
   * hepler function to iterate map object
   * @param {Map|Object} mapLikeObject
   * @param {(key, value)=>any} fn function to call on map entry
   */ function mapIterator(a, b) {
    '[object Map]' === Object.prototype.toString.call(a)
      ? a.forEach((a, c) => b(c, a))
      : Object.keys(a).forEach(c => b(c, a[c]))
  }
  function mapAddEntry(a, b, c) {
    '[object Map]' === Object.prototype.toString.call(a) ? a.set(b, c) : (a[b] = c)
  }
  function initNavItem(a) {
    const b = document.createElement('li')
    return (
      b.classList.add('nav-item'),
      (b.innerHTML = (function(a) {
        return `
<div class="popover-button popover-button__btn popover-button__anchor" style="margin: .425rem .175rem;padding: 0 .425rem;color: #566e9f;">
  <span class="popover-button__container">
    ${a}
    <svg class="mdi-icon icon-inline popover-button__icon" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7,10L12,15L17,10H7Z"></path>
    </svg>
  </span>
</div>`
      })('settings')),
      a.appendChild(b),
      { dom: b }
    )
  }
  function initDropdownMenu(a) {
    let b = !1 // dropdown state
    const c = document.createElement('div'),
      { offsetTop: d } = offsetToBody(a.dom)
    ;(c.className = `popover popover-button2__popover rounded ${PREFIX}-settings`),
      (c.style.transform = `translateY(${d + a.dom.offsetHeight}px)`)
    const e = a => {
      a && a.stopPropagation(), (c.style.display = ((b = !b), b) ? 'block' : 'none')
    } // document.body click fix
    return (
      document.body.addEventListener('click', a => {
        a.target === c ? e() : !0 == b && e()
      }),
      a.dom.addEventListener('click', e),
      c.addEventListener('click', a => {
        a.stopPropagation()
      }),
      logger.debug('dropdown container initialized'),
      document.body.appendChild(c),
      { dom: c, toggle: e }
    )
  }
  function getNavRoot() {
    return document.querySelector(
      '#root > div.layout > div.layout__app-router-container.layout__app-router-container--full-width > div > nav > ul:nth-child(7)'
    )
  }
  function getCodeArea() {
    return document.querySelector('div.blob.blob-page__blob')
  }
  function patch_style(a) {
    const b = document.createElement('style')
    ;(b.innerHTML = a),
      document.head.appendChild(b),
      logger.debug('======================patched styles======================'),
      logger.debug(a),
      logger.debug('==========================================================')
  }
  const plugin = (function() {
    return new (function() {
      function a(a, b, c) {
        c.reload && c.reload(a), logger.debug(`component ${b} is reloaded`)
      }
      function b(a, b, c, d) {
        let e = c(a, d)
        h.push(e.style),
          f.set(b, e),
          e.root && e.root.classList.add(`${PREFIX}-settings__item`),
          logger.debug(`component ${b} is initialized`)
      }
      function c(a = !1) {
        const b = 10,
          c = 1e3
        let d = 0,
          e = k,
          f = l
        return new Promise((g, h) => {
          function i() {
            if ((([k, l] = [a ? k : getNavRoot(), getCodeArea()]), k && l)) {
              if (a && f === l)
                return ++d > b
                  ? void logger.warn('max retry count reached, plugin failed to reload or reload is not needed')
                  : void setTimeout(i, c, a)
              ;(d = 0),
                ([e, f] = [k, l]),
                g({ navRoot: k, codeArea: l }),
                logger.debug('critical path created, initializing plugin...')
            } else {
              if ((logger.debug('failed to detect critical element, retrying...'), ++d > b))
                return void h('max retry count reached, plugin failed to initialize')
              setTimeout(i, c)
            }
          }
          i()
        })
      }
      /**
       * @param name {string} component name
       * @param definition {(dep, plugin:Plugin)=>{uninstall?:Function, reload?:Function, style?: string, root?:HTMLElement}} component object
       */ const d = this,
        e = new Map(),
        f = new Map(),
        g = [],
        h = [
          `
  .${PREFIX}-settings{
    padding: 0.3em 0.5em;
    position: absolute;
    display: none;
    top: 0;
    right: 10px;
  }
  .${PREFIX}-settings__item{
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }
  .${PREFIX}-settings__item:last-child{
    margin-bottom: 0;
  }
  div.blob.blob-page__blob{
    font-size: 12px;
  }
  code.blob__code.e2e-blob{
    font-size: inherit;
    line-height: 1.33;
  }
      `
        ] // 注入样式
      let j = !1,
        k = getNavRoot(),
        l = getCodeArea(),
        m = null,
        n = null
      ;(this.registerComponent = (a, b) =>
        a in b || a in f
          ? void logger.warn(`component ${a} is already registered, registration cancelled`)
          : void mapAddEntry(e, a, b)),
        (this.reload = () => {
          c(!0)
            .then(({ codeArea: a }) => ({ navItem: m, codeArea: a, dropdown: n }))
            .then(b => {
              mapIterator(f, function(c, d) {
                a(b, c, d)
              }),
                logger.debug('plugin reloaded')
            })
            .catch(a => {
              logger.error(a)
            })
        })
      const o = a => {
        mapIterator(e, function(c, e) {
          b(a, c, e, d)
        })
      }
      /**
       * @param target {HTMLElement} event source element which may change the dependencies
       * @param event {string} event name
       * @param shouldReload should trigger the reload
       * @param capture should event be capture type
       */ ;(this.init = () =>
        c()
          .then(
            ({ navRoot: a, codeArea: b }) => (
              (m = initNavItem(a)), (n = initDropdownMenu(m)), { navItem: m, codeArea: b, dropdown: n }
            )
          )
          .then(a => {
            o(a), patch_style(h.join('\n')), (j = !0)
          })),
        (this.addReloadListener = (a, b, c, d = !1) => {
          c = c.bind(a)
          let e = d => {
            c(d) && (this.reload(), logger.debug(`plugin will reload due to the ${b} event on ${a}`))
          }
          a.addEventListener(b, e, d),
            g.push({
              target: a,
              event: b,
              handler: e,
              capture: d,
              dispose: function() {
                a.removeEventListener(b, e, d)
              }
            })
        })
    })()
  })()

  function createFontController({ codeArea: a, dropdown: b }) {
    function c(a) {
      return function() {
        const b = f.value
        ;(g.innerText = b), (a.style.fontSize = `${b}px`)
      }
    }
    const d = document.createElement('div'),
      e = document.createElement('span'),
      f = document.createElement('input'),
      g = document.createElement('span')
    ;(e.innerText = 'font-size'),
      (f.type = 'range'),
      (f.min = '12'),
      (f.max = '17'),
      (f.step = '1'),
      (f.value = '12'),
      (f.style.margin = '0 0.5rem'),
      (g.style.display = 'inline-block'),
      (g.style.width = '17px'),
      (g.innerText = '12'),
      d.appendChild(e),
      d.appendChild(f),
      d.appendChild(g)
    let h = c(a)
    return (
      f.addEventListener('input', h),
      b.dom.appendChild(d),
      {
        root: d,
        reload: function({ codeArea: a }) {
          f.removeEventListener('input', h), (h = c(a)), f.addEventListener('input', h), h()
        }
      }
    )
  }

  //===============================Danger Zone===============================
  plugin.registerComponent('font-controller', createFontController),
    plugin
      .init()
      .then(() => {
        plugin.addReloadListener(
          document.querySelector('#explorer>div.tree>table>tbody>tr>td>div>table'),
          'click',
          function(a) {
            let b = a.target
            return 'A' === b.tagName && 'tree__row-contents' === b.className
          }
        )
      })
      .catch(a => {
        logger.error(a)
      })
})()
