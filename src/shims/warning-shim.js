export default function warning(condition, format, ...args) {
  if (!condition) {
    if (typeof console !== 'undefined') {
      let argIndex = 0;
      const message = 'Warning: ' + format.replace(/%s/g, () => args[argIndex++]);
      console.warn(message);
    }
  }
}
