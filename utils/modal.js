"use strict";
import { clearDelQDsWaitTimeout } from "../js/createQuiz.js";
import { cloneFromTemplate } from "../js/index.js";
import { clearDelQsWaitTimeout } from "../js/quizList.js";
/**
 * @description モーダルを作成、表示する
 * @param {{title: string; body: string; colorClass?: string; modalCont: HTMLElement actionBtn: {text: string; HTMLAttributes?: Object<string, string> color: "red" | "green" | "blue";} }} option オプション
 * @returns {void} なし
 */
export function openModal(option) {
  const { title, body, colorClass, modalCont, actionBtn } = option;
  const modalClone = cloneFromTemplate("modal-tem");
  modalClone.querySelector(".modal-title").innerText = title;
  modalClone.querySelector(".modal-body").innerHTML = body;
  if (colorClass) {
    const elsNeedBgColor = modalClone.querySelectorAll(".modal-header, .modal-body, .modal-footer");
    elsNeedBgColor.forEach(e => {
      e.classList.add(colorClass);
    });
  }
  const actionBtnEl = modalClone.querySelector(".action-btn");
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
  actionBtnEl.classList.add(btnColor);
  if (actionBtn.HTMLAttributes) {
    Object.keys(actionBtn.HTMLAttributes).forEach((key) => {
      const val = actionBtn.HTMLAttributes[key];
  
      if (key === "class") {
        const classes = val.split(" ");
        classes.forEach((c) => {
          actionBtnEl.classList.add(c);
        });
      } else {
        actionBtnEl.setAttribute(key, val);
      }
    });
  }
  actionBtnEl.innerText = actionBtn.text;
  modalCont.appendChild(modalClone);

  const modalEl = document.querySelector(".modal");
  trapFocus(modalEl);
  modalEl.addEventListener("hidden.bs.modal", () => {
    clearDelQsWaitTimeout();// クイズ全削除ボタンのタイムアウト
    clearDelQDsWaitTimeout();// 下書き全削除ボタンのタイムアウト
    modalEl.remove();
  });
  
  const modalInstance = new bootstrap.Modal(document.querySelector(".modal"));
  modalInstance.show();
}

/**
 * @description モーダルを閉じる
 * @returns {void} なし
 */
export function closeModal() {
  const modalEl = document.querySelector(".modal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
}


// https://hidde.blog/using-javascript-to-trap-focus-in-an-element/
/**
 * @description 要素からフォーカスが出ないようにする
 * @param {Element} el フォーカスさせたい要素
 * @returns {void} なし
 */
function trapFocus(el) {
  const focusableEls = el.querySelectorAll(
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

  el.addEventListener("keydown", (e) => {
    const isTabPressed = e.key === "Tab"

    if (!isTabPressed) {
      return;
    }

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
