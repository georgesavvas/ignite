export default function (url: string, options: object, timeout = 3000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject("timeout"), timeout))
  ]);
}
