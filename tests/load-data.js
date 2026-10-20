// Carrega data.js (feito para o navegador) dentro do Node, para os testes.
const fs = require("fs");
const vm = require("vm");
const path = require("path");

module.exports = function loadData() {
  const code = fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code + "\nglobalThis.__EXPORTS__ = { QUESTIONS, COURSES, COURSE_EXTRAS, VETERANS, MENTORIAS };", sandbox);
  return sandbox.__EXPORTS__;
};
