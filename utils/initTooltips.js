"use strict";
/**
 * @description BootstrapのTooltipを初期化する
 * @returns {void} なし
 */
export function initTooltips() {
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((tooltipTriggerElem) => {
      bootstrap.Tooltip.getOrCreateInstance(tooltipTriggerElem);
    });
}
