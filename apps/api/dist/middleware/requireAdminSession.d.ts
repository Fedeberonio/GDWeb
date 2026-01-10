import type { NextFunction, Request, Response } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";
export type AdminRequest = Request & {
    adminUser?: DecodedIdToken;
};
export declare function requireAdminSession(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=requireAdminSession.d.ts.map