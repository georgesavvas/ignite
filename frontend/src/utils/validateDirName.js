export const validateDirName = value => {
  return value.replace(/[\W_]+/g, "_");
}
