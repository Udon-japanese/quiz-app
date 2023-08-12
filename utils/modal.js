"use strict";
import { cloneFromTemplate } from "../js/index.js";
/**
 *
 * @param {{title: string; body: string; colorClass: string; actionBtn: {text: string; id: string; class: string; color: "red" | "green" | "blue";} }} option オプション
 */
export function openModal(option) {
  const { title, body, colorClass, actionBtn } = option;
  const modalClone = cloneFromTemplate("modal-tem");
  modalClone.querySelector(".modal-title").innerText = title;
  modalClone.querySelector(".modal-body").innerHTML = body;
  const elsNeedsBgColor = modalClone.querySelectorAll(".modal-header, .modal-body, .modal-footer");
  elsNeedsBgColor.forEach(e => {
    e.classList.add(colorClass);
  });
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
  actionBtnEl.id = actionBtn.id;
  const classes = actionBtn.class.split(" ");
  classes.forEach((c) => {
    actionBtnEl.classList.add(c);
  });
  actionBtnEl.innerText = actionBtn.text;
  document.body.insertBefore(modalClone, document.body.firstChild);

  const modalEl = document.querySelector(".modal");
  trapFocus(modalEl);
  modalEl.addEventListener("hidden.bs.modal", () => {
    modalEl.remove();
  });
  
  const modalInstance = new bootstrap.Modal(document.querySelector(".modal"));
  modalInstance.show();
}

export function closeModal() {
  const modalEl = document.querySelector(".modal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
}

/**
 *
 * @param {Element} el
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
