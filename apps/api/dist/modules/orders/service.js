"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrdersForAdmin = listOrdersForAdmin;
exports.getOrderDetail = getOrderDetail;
exports.updateOrderStatusById = updateOrderStatusById;
const schemas_1 = require("./schemas");
const repository_1 = require("./repository");
async function listOrdersForAdmin(limit = 100) {
    const orders = await (0, repository_1.listOrders)(limit);
    return orders.map((order) => schemas_1.orderSchema.parse(order));
}
async function getOrderDetail(id) {
    const order = await (0, repository_1.getOrderById)(id);
    if (!order)
        return null;
    return schemas_1.orderSchema.parse(order);
}
async function updateOrderStatusById(id, status) {
    const parsedStatus = schemas_1.orderStatusSchema.parse(status);
    const updated = await (0, repository_1.updateOrderStatus)(id, parsedStatus);
    if (!updated)
        return null;
    return schemas_1.orderSchema.parse(updated);
}
//# sourceMappingURL=service.js.map