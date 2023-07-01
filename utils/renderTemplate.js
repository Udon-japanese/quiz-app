/**
 * @description テンプレートとデータを受け取り、HTMLを生成する関数
 * @param {string} template
 * @param {object} data
 * @returns {string} HTML文字列
 */
export function renderTemplate(template, data) {
  const keys = Object.keys(data);
  let result = template;

  keys.forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, data[key]);
  });

  return result;
}