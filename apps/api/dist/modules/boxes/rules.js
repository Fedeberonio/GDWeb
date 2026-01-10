"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoxRules = getBoxRules;
exports.getRuleForBox = getRuleForBox;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const rulesPath = path_1.default.join(process.cwd(), "src", "data", "boxRules.json");
let cachedRules = null;
function getBoxRules() {
    if (cachedRules) {
        return cachedRules;
    }
    const file = fs_1.default.readFileSync(rulesPath, "utf-8");
    cachedRules = JSON.parse(file);
    return cachedRules;
}
function getRuleForBox(boxId) {
    const rules = getBoxRules();
    return rules[boxId];
}
// @ts-nocheck
//# sourceMappingURL=rules.js.map