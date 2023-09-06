"use strict";
import { cloneFromTemplate } from "../js/index.js";
/**
 * @description トーストを表示する
 * @param {"red" | "yellow" | "green" | "sky-blue"} color トーストの色
 * @param {string} message トーストに表示したいメッセージ
 * @returns {void} なし
 */
export function showToast(color, message) {
  const toastClone = cloneFromTemplate("toast-tem");
  const toast = toastClone.querySelector(".toast");

  let toastColorClass = "text-bg-";
  switch (color) {
    case "red":
      toastColorClass += "danger";
      break;
    case "yellow":
      toastColorClass += "warning";
      break;
    case "green":
      toastColorClass += "success";
      break;
    case "sky-blue":
      toastColorClass = "bg-info text-light";
      break;
  }
  toastColorClass.split(" ").forEach((colorClass) => {
    toast.classList.add(colorClass);
  });

  const toastBody = toast.querySelector(".toast-body");
  toastBody.innerText = message;

  document.getElementById("toast-container").appendChild(toastClone);

  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
  const toastInstance = new bootstrap.Toast(toast);
  toastInstance.show();
}
