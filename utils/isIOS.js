/**
 * @description iOSデバイスならtrue,それ以外ならfalseを返す
 * @returns {boolean} iOSデバイスかどうか(MacBookなどはiOSに含んでいない)
 */
export function iOS() {
  const userAgent = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(userAgent) ||
    (userAgent.includes("Mac") && "ontouchend" in document)
  );
}
