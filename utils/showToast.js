"use strict";
import { cloneFromTemplate } from "../js/index.js";

/**
 * @description トーストを表示する
 * @param {"red" | "yellow" | "green"} color トーストの色
 * @param {string} message トーストのメッセージ
 */
export function showToast(color, message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    const toastClone = cloneFromTemplate("toast-tem");
    document.body.insertBefore(toastClone, document.body.firstChild);
    toast = document.getElementById("toast");
  }
  let toastColor = "text-bg-";
  switch (color) {
    case "red":
      toastColor += "danger";
      break;
    case "yellow":
      toastColor += "warning";
      break;
    case "green":
      toastColor += "success";
      break;
  }
  toast.classList.add(toastColor);
  const toastBody = toast.querySelector(".toast-body");
  toastBody.innerText = message;

  const toastInstance = bootstrap.Toast.getOrCreateInstance(toast);
  toastInstance.show();
}