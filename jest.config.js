/** @type { import('jest').Config} */
module.exports = {
  verbose: true,
  roots:['<rootDir>/tests/'],
  testRegex:['.*\\.(spec|test)\\.[jt]sx?$'],
  testTimeout:30000
}
