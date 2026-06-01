module.exports = {
  rootDir: ".",
  moduleFileExtensions: ["js", "json", "ts"],
  extensionsToTreatAsEsm: [".ts"],
  modulePaths: ["<rootDir>"],
  testRegex: ".spec.ts$",
  coverageDirectory: "./coverage",
  coverageReporters: ["html"],
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["<rootDir>/src/utils"],
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest"],
  },
  moduleNameMapper: {
    "^@src/(.*)$": "src/$1",
  },
}
