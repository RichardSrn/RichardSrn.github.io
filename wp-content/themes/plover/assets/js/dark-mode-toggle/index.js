/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./static/scripts/utils/persistent-dark-mode.js":
/*!******************************************************!*\
  !*** ./static/scripts/utils/persistent-dark-mode.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ persistentDarkMode)
/* harmony export */ });
/**
 * persistent dark mode in cookie
 * 
 * @param mode 
 * @param cookiePeriod 
 * 
 * @returns 
 */
function persistentDarkMode(mode, cookiePeriod) {
  const cookiePeriodInSeconds = {
    '1-day': 3600 * 24,
    '7-days': 3600 * 24 * 7,
    '30-days': 3600 * 24 * 30
  };
  const colorModeValue = mode === 'system' ? mode : mode === 'dark';
  if (cookiePeriod === 'session') {
    document.cookie = `ploverDarkMode=${colorModeValue};path=/`;
  } else {
    document.cookie = `ploverDarkMode=${colorModeValue};path=/;max-age=${cookiePeriodInSeconds[cookiePeriod]}`;
  }
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**************************************************!*\
  !*** ./static/scripts/dark-mode-toggle/index.js ***!
  \**************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   togglePloverThemeMode: () => (/* binding */ togglePloverThemeMode)
/* harmony export */ });
/* harmony import */ var _utils_persistent_dark_mode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/persistent-dark-mode */ "./static/scripts/utils/persistent-dark-mode.js");


/**
 * Toggle theme color mode
 * 
 * @param mode 
 * @returns 
 */
function togglePloverThemeMode(mode) {
  var _window$ploverDarkMod;
  const cookiePeriod = ((_window$ploverDarkMod = window?.ploverDarkModeSettings?.cookiePeriod) !== null && _window$ploverDarkMod !== void 0 ? _window$ploverDarkMod : 'session').toLowerCase();
  document.body.classList.remove(`is-style-dark`);
  document.body.classList.remove(`is-style-light`);
  document.body.classList.remove(`is-style-system`);
  document.body.classList.add(`is-style-${mode}`);
  (0,_utils_persistent_dark_mode__WEBPACK_IMPORTED_MODULE_0__["default"])(mode, cookiePeriod);
}
window.togglePloverThemeMode = togglePloverThemeMode;
})();

/******/ })()
;
//# sourceMappingURL=index.js.map