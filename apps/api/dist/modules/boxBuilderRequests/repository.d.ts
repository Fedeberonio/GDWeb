export declare function listRequests(limit?: number): Promise<{
    id: string;
}[]>;
export declare function getRequestById(id: string): Promise<{
    id: string;
}>;
export declare function updateRequestStatus(id: string, status: string): Promise<{
    id: string;
}>;
//# sourceMappingURL=repository.d.ts.map