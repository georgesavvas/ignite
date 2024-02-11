export const fetch_ = (url: string, options: object, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject("timeout"), timeout)),
  ]);
};

export default fetch_;
