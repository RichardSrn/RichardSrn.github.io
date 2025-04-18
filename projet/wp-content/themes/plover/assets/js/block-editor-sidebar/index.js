/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./static/scripts/utils/get-editor-root-element.js":
/*!*********************************************************!*\
  !*** ./static/scripts/utils/get-editor-root-element.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ getEditorRootElement)
/* harmony export */ });
/**
 * Find the editor element
 * 
 * @returns 
 */
function getEditorRootElement() {
  const editorIframe = document.querySelector('[name=editor-canvas]');
  if (editorIframe) {
    return editorIframe.contentDocument.body;
  }
  const editorStylesWrapper = document.getElementsByClassName('editor-styles-wrapper')[0];
  if (editorStylesWrapper) {
    return editorStylesWrapper;
  }
  return document.body;
}

/***/ }),

/***/ "./static/scripts/utils/get-session-color-mode.js":
/*!********************************************************!*\
  !*** ./static/scripts/utils/get-session-color-mode.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ getSessionColorMode)
/* harmony export */ });
/**
 * Get current color mode from cookie
 *
 * @returns {undefined|string}
 */
function getSessionColorMode() {
  const cookie = document.cookie.split(';').filter(c => c.indexOf('ploverDarkMode') !== -1).at(0);
  if (!cookie) {
    return undefined;
  }
  const value = cookie.substring(cookie.indexOf('=') + 1);
  if (value === 'true') {
    return 'dark';
  } else if (value === 'false') {
    return 'light';
  } else if (value === 'system') {
    return 'system';
  }
  return undefined;
}

/***/ }),

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

/***/ }),

/***/ "./static/scripts/utils/set-color-mode.js":
/*!************************************************!*\
  !*** ./static/scripts/utils/set-color-mode.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ setColorMode)
/* harmony export */ });
/* harmony import */ var _persistent_dark_mode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./persistent-dark-mode */ "./static/scripts/utils/persistent-dark-mode.js");


/**
 * Set color mode for given el
 * 
 * @param {HTMLElement} el 
 * @param {string} mode 
 */
function setColorMode(el, mode, persistent = true) {
  el.classList.remove(`is-style-dark`);
  el.classList.remove(`is-style-light`);
  el.classList.remove(`is-style-system`);
  if (mode !== '') {
    el.classList.add(`is-style-${mode}`);
    if (persistent) {
      var _window$PloverTheme$d;
      (0,_persistent_dark_mode__WEBPACK_IMPORTED_MODULE_0__["default"])(mode, ((_window$PloverTheme$d = window?.PloverTheme?.darkMode?.cookiePeriod) !== null && _window$PloverTheme$d !== void 0 ? _window$PloverTheme$d : 'session').toLowerCase());
    }
  }
}

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/***/ ((module) => {

module.exports = window["React"];

/***/ }),

/***/ "@wordpress/components":
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
/***/ ((module) => {

module.exports = window["wp"]["components"];

/***/ }),

/***/ "@wordpress/element":
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/***/ ((module) => {

module.exports = window["wp"]["element"];

/***/ }),

/***/ "@wordpress/i18n":
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/***/ ((module) => {

module.exports = window["wp"]["i18n"];

/***/ }),

/***/ "@wordpress/plugins":
/*!*********************************!*\
  !*** external ["wp","plugins"] ***!
  \*********************************/
/***/ ((module) => {

module.exports = window["wp"]["plugins"];

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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
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
/*!******************************************************!*\
  !*** ./static/scripts/block-editor-sidebar/index.js ***!
  \******************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_plugins__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/plugins */ "@wordpress/plugins");
/* harmony import */ var _wordpress_plugins__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_plugins__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _utils_get_editor_root_element__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/get-editor-root-element */ "./static/scripts/utils/get-editor-root-element.js");
/* harmony import */ var _utils_set_color_mode__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/set-color-mode */ "./static/scripts/utils/set-color-mode.js");
/* harmony import */ var _utils_get_session_color_mode__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/get-session-color-mode */ "./static/scripts/utils/get-session-color-mode.js");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_7__);

/**
 * WordPress dependencies
 */




/**
 * Internal dependencies
 */




function ThemeSettings() {
  var _getSessionColorMode;
  const icon = (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.SVG, {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.Path, {
    d: "M10.4,11.4c0.8-0.4,1.4-0.8,1.8-1.3c0.6-0.7,0.9-1.4,1.1-2.3c0.1-0.2,0.1-0.3,0.1-2.9c0-2.9,0-2.9,0.2-3.2 c0.2-0.3,0.4-0.6,0.7-0.7C14.3,1,14.5,1,14.5,1s0.1,0,0.1-0.1C14.5,1,6.9,1,6.8,1c0,0,0,0,0.8,0.1c0.7,0.1,1.2,0.3,1.6,0.7 c0.6,0.5,0.8,1.1,0.8,1.7c0,0.5-0.2,1-0.6,1.4C9.2,5.1,9.2,5.1,8.7,5.5C8.3,5.7,8.1,5.8,7.8,6c-1.1,0.7-2,1.9-2.3,3.3 c-0.2,0.6-0.1,0.3-0.1,4.6c0,4.3,0,5.3,0.1,5.3c0,0,0-0.3,0.1-0.7c0-0.7,0.1-1,0.2-1.6C5.8,16.5,5.9,16,6,15.7 c0.2-0.6,0.5-1.2,0.9-1.7c0.2-0.2,0.6-0.8,1-1.1c0.2-0.2,0.7-0.5,1-0.7 M11.4,3.2c-0.3,0-0.6-0.2-0.6-0.6S11.1,2,11.4,2 C11.8,2,12,2.3,12,2.6C12,2.8,11.8,3.2,11.4,3.2z"
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("path", {
    d: "M9.8,18.9C9.6,17.6,9.4,14,9.4,14s-0.1-0.4-0.1-0.5c0-0.1-0.1-0.4-0.1-0.4h1.3c0,0-0.1,0.3-0.1,0.4 S10.2,14,10.2,14S9.9,17.5,9.8,18.9"
  }));
  const PluginSidebar = wp?.editor?.PluginSidebar || wp?.editPost?.PluginSidebar || wp?.editSite?.PluginSidebar;
  const PluginSidebarMoreMenuItem = wp?.editor?.PluginSidebarMoreMenuItem || wp?.editPost?.PluginSidebarMoreMenuItem || wp?.editSite?.PluginSidebarMoreMenuItem;
  if (!PluginSidebar || !PluginSidebarMoreMenuItem) {
    return null;
  }
  const [currentColorMode, setCurrentColorMode] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_7__.useState)((_getSessionColorMode = (0,_utils_get_session_color_mode__WEBPACK_IMPORTED_MODULE_6__["default"])()) !== null && _getSessionColorMode !== void 0 ? _getSessionColorMode : window?.PloverTheme?.darkMode?.defaultMode);
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(PluginSidebarMoreMenuItem, {
    target: "plover-theme-settings-panel",
    icon: icon
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Plover Settings', 'plover')), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(PluginSidebar, {
    isPinnable: true,
    icon: icon,
    name: "plover-theme-settings-panel",
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Plover Settings', 'kenta')
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: 'plover-sidebar-container',
    style: {
      padding: '24px 12px'
    }
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.__experimentalToggleGroupControl, {
    isBlock: true,
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Editor color mode', 'plover'),
    __nextHasNoMarginBottom: true,
    value: currentColorMode !== null && currentColorMode !== void 0 ? currentColorMode : 'system',
    onChange: mode => {
      (0,_utils_set_color_mode__WEBPACK_IMPORTED_MODULE_5__["default"])((0,_utils_get_editor_root_element__WEBPACK_IMPORTED_MODULE_4__["default"])(), mode);
      setCurrentColorMode(mode);
    }
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.__experimentalToggleGroupControlOption, {
    value: 'system',
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('System', 'plover')
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.__experimentalToggleGroupControlOption, {
    value: 'dark',
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Dark', 'plover')
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.__experimentalToggleGroupControlOption, {
    value: 'light',
    label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Light', 'plover')
  })))));
}
(function (wp) {
  (0,_wordpress_plugins__WEBPACK_IMPORTED_MODULE_1__.registerPlugin)('plover-theme-settings', {
    render: ThemeSettings
  });
})(window.wp);
})();

/******/ })()
;
//# sourceMappingURL=index.js.map