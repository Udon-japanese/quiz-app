const buttons = document.querySelectorAll(".modal-btn");
const modalOuter = document.querySelector(".modal-outer");
const modal = document.querySelector(".modal");
const modalClose = document.querySelectorAll(".modal-close, .modal-bg");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    modalOuter.style.display = "block";
    document.body.style.overflowY = "hidden";
  });
});

modalClose.forEach((close) => {
  close.addEventListener("click", () => {
    modalOuter.style.display = "none";
    document.body.style.overflowY = "";
  });
});
