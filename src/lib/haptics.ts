export function tap() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

export function success() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([10, 50, 10]);
  }
}

export function error() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([50, 30, 50]);
  }
}

export function toggle() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(15);
  }
}
