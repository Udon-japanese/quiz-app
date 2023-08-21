"use strict";
import { cloneFromTemplate } from "../js/index.js";
/**
 * @description トーストを表示する
 * @param {"red" | "yellow" | "green" | "sky-blue"} color トーストの色
 * @param {string} message トーストに表示したいメッセージ
 * @returns {void} なし
 */
export function showToast(color, message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    const toastClone = cloneFromTemplate("toast-tem");
    document.body.insertBefore(toastClone, document.body.firstChild);
    toast = document.getElementById("toast");
  }
  toast.classList.remove("text-bg-danger", "text-bg-warning", "text-bg-success", "bg-info", "text-light");
  
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
  toastColorClass.split(" ").forEach(colorClass => {
    toast.classList.add(colorClass);
  })
  const toastBody = toast.querySelector(".toast-body");
  toastBody.innerText = message;

  const toastInstance = bootstrap.Toast.getOrCreateInstance(toast);
  toastInstance.show();
}