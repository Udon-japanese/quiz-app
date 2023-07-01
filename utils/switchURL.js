const isLocal = !window.location.href.includes('github.io');
const ROOT_PATH = "/quiz-app"

/**
 * @description GitHub Pagesにデプロイされているかどうかを判断し、デプロイされていない(ローカル環境)場合、URLをローカル環境用のものに置き換える関数
 */
export function switchURL() {
  if (isLocal) {
    const a = document.querySelector("a");
    const href = a.getAttribute("href");
    a.setAttribute("href", `${href.split(ROOT_PATH)[1]}`);
  }
}