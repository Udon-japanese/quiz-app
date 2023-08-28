"use strict";
import { clearDelQDsWaitTimeout } from "../js/createQuiz.js";
import { cloneFromTemplate } from "../js/index.js";
import { clearDelQsWaitTimeout } from "../js/quizList.js";
/**
 * @description モーダルを作成、表示する
 * @param {{title: string; body: string; colorClass?: string; modalCont: HTMLElement; header: {HTMLAttributes?: Object<string, string>} cancelBtn?: {HTMLAttributes?: Object<string, string>} actionBtn: {text: string; HTMLAttributes?: Object<string, string> color: "red" | "green" | "blue";} }} option オプションのオブジェクト
 * @returns {void} なし
 */
export function openModal(option) {
  const { title, body, colorClass, modalCont, header, cancelBtn, actionBtn } = option;
  const modalClone = cloneFromTemplate("modal-tem");
  modalClone.querySelector(".modal-title").innerText = title;
  modalClone.querySelector(".modal-body").innerHTML = body;

  if (colorClass) {
    const elsNeedBgColor = modalClone.querySelectorAll(".modal-header, .modal-body, .modal-footer");
    elsNeedBgColor.forEach(e => {
      e.classList.add(colorClass);
    });
  }

  const modalHeaderElem = modalClone.querySelector(".modal-header");
  if (header?.HTMLAttributes) {
    applyAttributes(modalHeaderElem, header.HTMLAttributes);
  }

  const cancelBtnElem = modalClone.querySelector(".cancel-btn");
  if (cancelBtn?.HTMLAttributes) {
    applyAttributes(cancelBtnElem, cancelBtn.HTMLAttributes);
  }

  const actionBtnElem = modalClone.querySelector(".action-btn");
  let btnColor = "btn-";
  switch (actionBtn.color) {
    case "red":
      btnColor += "danger";
      break;
    case "green":
      btnColor += "success";
      break;
    case "blue":
      btnColor += "primary";
      break;
  }
  actionBtnElem.classList.add(btnColor);
  
  if (actionBtn?.HTMLAttributes) {
    applyAttributes(actionBtnElem, actionBtn.HTMLAttributes);
  }
  actionBtnElem.innerText = actionBtn.text;
  modalCont.appendChild(modalClone);

  const modalElem = document.querySelector(".modal");
  trapFocus(modalElem);
  modalElem.addEventListener("hidden.bs.modal", () => {
    clearDelQsWaitTimeout();// クイズ全削除ボタンが押せるようになるまでのsetTimeoutを解除
    clearDelQDsWaitTimeout();// 下書き全削除ボタンが押せるようになるまでのsetTimeoutを解除
    modalElem.remove();
  });
  
  const modalInstance = new bootstrap.Modal(document.querySelector(".modal"));
  modalInstance.show();

  /**
   * @description 指定された属性を要素に適用する
   * @param {Element} element 属性を付与する要素
   * @param {Object<string, string>} attributes 属性のオブジェクト 
   */
  function applyAttributes(element, attributes) {
    Object.keys(attributes).forEach(key => {
      const val = attributes[key];
      if (key === "class") {
        const classes = val.split(" ");
        classes.forEach(className => {
          element.classList.add(className);
        });
      } else {
        element.setAttribute(key, val);
      }
    });
  }
}
/**
 * @description モーダルを閉じる
 * @returns {void} なし
 */
export function closeModal() {
  const modalElem = document.querySelector(".modal");
  bootstrap.Modal.getInstance(modalElem).hide();
}

// https://hidde.blog/using-javascript-to-trap-focus-in-an-element/
/**
 * @description 要素からフォーカスが出ないようにする
 * @param {Element} elem フォーカスさせたい要素
 * @returns {void} なし
 */
function trapFocus(elem) {
  const focusableEls = elem.querySelectorAll(
    `a[href]:not([disabled]):not([tabindex="-1"]),
    button:not([disabled]):not([tabindex="-1"]),
    textarea:not([disabled]):not([tabindex="-1"]),
    input[type="text"]:not([disabled]):not([tabindex="-1"]),
    input[type="radio"]:not([disabled]):not([tabindex="-1"]),
    input[type="checkbox"]:not([disabled]):not([tabindex="-1"]),
    select:not([disabled]):not([tabindex="-1"])`
  );
  const firstFocusableEl = focusableEls[0];
  const lastFocusableEl = focusableEls[focusableEls.length - 1];

  elem.addEventListener("keydown", (e) => {
    if (!e.key === "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableEl) {
        lastFocusableEl.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus();
        e.preventDefault();
      }
    }
  });
}
