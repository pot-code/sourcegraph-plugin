export function createFontController({ codeArea, dropdown }) {
  const DEFAULT_SIZE = '12'
  const fontSizeController = document.createElement('div'),
    label = document.createElement('span'),
    input = document.createElement('input'),
    indicator = document.createElement('span')

  label.innerText = 'font-size'

  input.type = 'range'
  input.min = DEFAULT_SIZE
  input.max = '17'
  input.step = '1'
  input.value = DEFAULT_SIZE
  input.style.margin = '0 0.5rem'

  indicator.style.display = 'inline-block'
  // prevent layout from changing while the character is not monospaced
  indicator.style.width = '17px'
  indicator.innerText = DEFAULT_SIZE

  fontSizeController.appendChild(label)
  fontSizeController.appendChild(input)
  fontSizeController.appendChild(indicator)

  function sizeChangeHandlerFactory(_codeArea) {
    return function() {
      const newSize = input.value

      indicator.innerText = newSize
      _codeArea.style.fontSize = `${newSize}px`
      // logger.debug(`new font size is ${newSize}`);
    }
  }

  let sizeChangeHandler = sizeChangeHandlerFactory(codeArea)

  input.addEventListener('input', sizeChangeHandler)
  dropdown.dom.appendChild(fontSizeController)
  return {
    root: fontSizeController,
    reload: function({ codeArea }) {
      input.removeEventListener('input', sizeChangeHandler)

      sizeChangeHandler = sizeChangeHandlerFactory(codeArea)
      input.addEventListener('input', sizeChangeHandler)
      sizeChangeHandler()
    }
  }
}
