import { plugin } from './core'
import { logger } from './logger'
import { createFontController } from './fontControl'

// logger.setLevel(LogLevels.debug)
plugin.registerComponent('font-controller', createFontController)

//===============================Danger Zone===============================
plugin
  .init()
  .then(() => {
    plugin.addReloadListener(
      document.querySelector('#explorer>div.tree>table>tbody>tr>td>div>table'),
      'click',
      function(event) {
        let target = event.target

        return target.tagName === 'A' && target.className === 'tree__row-contents'
      }
    )
  })
  .catch(err => {
    logger.error(err)
  })
//=========================================================================
