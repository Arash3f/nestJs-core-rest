module.exports = {
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  modulePaths: ["<rootDir>"],
  testRegex: ".e2e-spec.ts$",
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "@src/$1": "src/$1"
},
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
};
