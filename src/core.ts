import { logger } from './logger'
import { PREFIX, CODE_AREA_PATH, NAV_ROOT_PATH } from './meta'

interface IPluginDependency {
  navItem: { dom: HTMLElement }
  codeArea: HTMLElement
  dropdown: { dom: HTMLElement; toggle: Function }
}

interface IPluginComponent {
  uninstall?: Function
  reload?: Function
  style?: string
  root?: HTMLElement
}

export interface IPluginComponentDefinition {
  (dep: IPluginDependency, context?: Plugin): IPluginComponent
}

function offsetToBody(element: HTMLElement) {
  let offsetTop = 0,
    offsetLeft = 0

  while (element !== document.body) {
    offsetLeft += element.offsetLeft
    offsetTop += element.offsetTop
    element = element.offsetParent as HTMLElement
  }

  return {
    offsetLeft,
    offsetTop
  }
}

/**
 * hepler function to iterate map object
 * @param mapLikeObject
 * @param fn function to call on each map entry
 */
function mapIterator(mapLikeObject: Map<any, any> | Object, fn: (key: any, value: any) => any) {
  if (Object.prototype.toString.call(mapLikeObject) === '[object Map]') {
    ;(mapLikeObject as Map<any, any>).forEach((value, key) => fn(key, value))
  } else {
    Object.keys(mapLikeObject).forEach(key => fn(key, mapLikeObject[key]))
  }
}

/**
 * helper function to add entry to a map like object
 * @param mapLikeObject
 * @param key
 * @param value
 */
function mapAddEntry(mapLikeObject: Map<any, any> | Object, key: any, value: any) {
  if (Object.prototype.toString.call(mapLikeObject) === '[object Map]') {
    ;(mapLikeObject as Map<any, any>).set(key, value)
  } else {
    mapLikeObject[key] = value
  }
}

function initNavItem(navRoot: HTMLElement) {
  function create_nav_button(actionName: string) {
    return `
<div class="popover-button popover-button__btn popover-button__anchor" style="margin: .425rem .175rem;padding: 0 .425rem;color: #566e9f;">
  <span class="popover-button__container">
    ${actionName}
    <svg class="mdi-icon icon-inline popover-button__icon" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7,10L12,15L17,10H7Z"></path>
    </svg>
  </span>
</div>`
  }

  const navItem = document.createElement('li')

  navItem.classList.add('nav-item')
  navItem.innerHTML = create_nav_button('settings')
  navRoot.appendChild(navItem)

  return {
    dom: navItem
  }
}

function initDropdownMenu(navItem: any) {
  let openState = false // dropdown state

  const container = document.createElement('div')
  const { offsetTop } = offsetToBody(navItem.dom)

  // create container
  container.className = `popover popover-button2__popover rounded ${PREFIX}-settings`
  container.style.transform = `translateY(${offsetTop + navItem.dom.offsetHeight}px)`

  const toggle = (event?: Event) => {
    if (event) {
      event.stopPropagation()
    }
    container.style.display = ((openState = !openState), openState) ? 'block' : 'none'
  }

  // document.body click fix
  document.body.addEventListener('click', event => {
    if (event.target === container) {
      toggle()
    } else {
      if (openState === true) {
        toggle()
      }
    }
  })
  navItem.dom.addEventListener('click', toggle)
  container.addEventListener('click', event => {
    event.stopPropagation()
  })

  logger.debug('dropdown container initialized')
  // insert DOM
  document.body.appendChild(container)
  return {
    dom: container,
    toggle
  }
}

function getNavRoot() {
  return document.querySelector(NAV_ROOT_PATH)
}

function getCodeArea() {
  return document.querySelector(CODE_AREA_PATH)
}

function patch_style(definition) {
  const style = document.createElement('style')

  style.innerHTML = definition
  document.head.appendChild(style)
  logger.debug('======================patched styles======================')
  logger.debug(definition)
  logger.debug('==========================================================')
}

const defaultStyles = `
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
}`

const definitions = new Map() // 组件定义表
const components = new Map() // 组件实例表
const reloadListeners = [] // 导致插件需要重载的监听器列表
const styles = [defaultStyles] // 注入样式

let navRoot = getNavRoot() // 工具栏根元素
let codeArea = getCodeArea() // 代码显示区
let navItem = null
let dropdown = null

function ensureCriticalElement(reload = false) {
  const MAX_RETRY_COUNT = 10
  const RETRY_DELAY = 1000

  let tried = 0
  let lastNavRoot = navRoot
  let lastCodeArea = codeArea

  return new Promise((res, rej) => {
    function queryElement() {
      ;[navRoot, codeArea] = [reload ? navRoot : getNavRoot(), getCodeArea()]

      if (navRoot && codeArea) {
        if (reload && lastCodeArea === codeArea) {
          if (++tried > MAX_RETRY_COUNT) {
            logger.warn('max retry count reached, plugin failed to reload or reload is not needed')
            return
          }
          setTimeout(queryElement, RETRY_DELAY, reload)
          return
        }
        tried = 0
        ;[lastNavRoot, lastCodeArea] = [navRoot, codeArea]
        res({ navRoot, codeArea })
        logger.debug('critical path created, initializing plugin...')
      } else {
        logger.debug('failed to detect critical element, retrying...')
        if (++tried > MAX_RETRY_COUNT) {
          rej('max retry count reached, plugin failed to initialize')
          return
        }
        setTimeout(queryElement, RETRY_DELAY)
      }
    }
    queryElement()
  })
}

class Plugin {
  init: Function
  constructor() {
    const self = this
    let initialized = false
    let stylePatched = false

    function initComponent(
      dep: IPluginDependency,
      name: string,
      definition: IPluginComponentDefinition,
      context: Plugin
    ) {
      let component = definition(dep, context)

      styles.push(component.style)
      components.set(name, component)
      component.root && component.root.classList.add(`${PREFIX}-settings__item`)
      logger.debug(`component ${name} is initialized`)
    }

    function initComponents(dep: IPluginDependency) {
      mapIterator(definitions, function(name: string, definition: IPluginComponentDefinition) {
        initComponent(dep, name, definition, self)
      })
    }

    this.init = () => {
      if (initialized) {
        return Promise.resolve()
      }
      return ensureCriticalElement()
        .then(({ navRoot, codeArea }) => {
          navItem = initNavItem(navRoot)
          dropdown = initDropdownMenu(navItem)

          return { navItem, codeArea, dropdown }
        })
        .then((dep: IPluginDependency) => {
          initComponents(dep)
          patch_style(styles.join('\n'))

          stylePatched = true
          initialized = true
        })
    }
  }
  /**
   * @param target event source element which may change the dependencies
   * @param event event name
   * @param shouldReload should trigger the reload
   * @param capture should event be capture type
   */
  addReloadListener(target: HTMLElement, event: string, shouldReload: (event: any) => boolean, capture = false) {
    shouldReload = shouldReload.bind(target)

    let handler = _event => {
      if (shouldReload(_event)) {
        this.reload()
        logger.debug(`plugin will reload due to the ${event} event on ${target}`)
      }
    }

    target.addEventListener(event, handler, capture)
    reloadListeners.push({
      target,
      event,
      handler,
      capture,
      dispose: function() {
        target.removeEventListener(event, handler, capture)
      }
    })
  }

  reload() {
    function reloadComponent(newDep: IPluginDependency, name: string, component: IPluginComponent) {
      component.reload && component.reload(newDep)
      logger.debug(`component ${name} is reloaded`)
    }

    ensureCriticalElement(true)
      .then(({ codeArea }) => {
        return { navItem, codeArea, dropdown }
      })
      .then(newDep => {
        mapIterator(components, function(name: string, component: IPluginComponent) {
          reloadComponent(newDep, name, component)
        })
        logger.debug('plugin reloaded')
      })
      .catch(err => {
        logger.error(err)
      })
  }

  registerComponent(name: string, definition: IPluginComponentDefinition) {
    if (name in definition || name in components) {
      logger.warn(`component ${name} is already registered, registration cancelled`)
      return
    }
    mapAddEntry(definitions, name, definition)
  }
}

export const plugin = new Plugin()
