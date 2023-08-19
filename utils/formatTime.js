export function formatTime(seconds) {
  if (typeof seconds !== "number" || isNaN(seconds)) {
    return null;
  }

  if (seconds < 60) {
    return `${seconds}秒`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes}分`;
    } else {
      return `${minutes}分${remainingSeconds}秒`;
    }
  }
}
