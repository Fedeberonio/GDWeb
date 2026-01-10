import { type BoxBuilderRequest } from "./schemas";
export declare function listBuilderRequests(limit?: number): Promise<BoxBuilderRequest[]>;
export declare function setBuilderRequestStatus(id: string, status: string): Promise<BoxBuilderRequest | null>;
//# sourceMappingURL=service.d.ts.map