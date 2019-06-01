// get latest version tag as version value
const version = process.env.RELEASE_VERSION
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && !version) {
  throw Error(`can't get version number, be sure to use 'yarn release' instead of invoking this file directly`)
}

export default `
// ==UserScript==
// @name         missing settings for sourcegraph(MSFS)
// @namespace    https://greasyfork.org
// @version      ${version}
// @description  add extra settings to sourcegraph
// @author       pot-code
// @match        https://sourcegraph.com/*
// @grant        none
// ==/UserScript==
`
