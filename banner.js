const { execSync } = require('child_process')

// get latest version tag as version value
let version
try {
  version = execSync('git describe --abbrev=0 --tag', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trimRight()
} catch (error) {
  throw Error(`can't find any tags, you may use 'git tag' to assign a tag to your commit first`)
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
