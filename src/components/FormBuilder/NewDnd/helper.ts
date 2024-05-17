export function generateId() {
  return Date.now() + Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
}
