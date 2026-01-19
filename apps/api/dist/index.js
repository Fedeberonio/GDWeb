"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
app_1.app.listen(app_1.env.PORT, () => {
    console.log(`API server listening on port ${app_1.env.PORT}`);
});
//# sourceMappingURL=index.js.map