const topPage = document.getElementById("top-page");
const crtQPage = document.getElementById("crt-quiz-page");
const qListPage = document.getElementById("quiz-list-page");
const qPage = document.getElementById("quiz-page");
const pages = [topPage, crtQPage, qListPage, qPage];

const navToCrtQPBtn = document.querySelector(".nav-link.to-crt-q-page");
const navToQListPBtn = document.querySelector(".nav-link.to-q-list-page");
const navbarBtns = [navToCrtQPBtn, navToQListPBtn];

document.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("to-top-page")) {
      hideOtherPages(topPage, pages);
      navbarBtns.forEach((b) => {
        b.classList.remove("active");
      });
    } else if (classList.contains("to-crt-q-page")) {
      hideOtherPages(crtQPage, pages);
      navbarBtns.forEach((b) => {
        b.classList.toggle("active", b === navToCrtQPBtn);
      });
    } else if (classList.contains("to-q-list-page")) {
      hideOtherPages(qListPage, pages);
      navbarBtns.forEach((b) => {
        b.classList.toggle("active", b === navToQListPBtn);
      });
    } else if (classList.contains("to-q-page")) {
      hideOtherPages(qPage, pages);
      navbarBtns.forEach((b) => {
        b.classList.remove("active");
      });
    } else if (classList.contains("")) {
    }
  });
});

export function hideOtherPages(showPage) {
  pages.forEach((p) => {
    p.classList.toggle("is-hidden", showPage !== p);
  });
}

/**
 * @description templateタグのクローンを生成する
 * @param {string} id templateタグのid名
 * @returns {DocumentFragment} cloneされた要素
 */
export function cloneFromTemplate(id) {
  const template = document.getElementById(id);
  const clone = template.content.cloneNode(true);
  return clone;
}
