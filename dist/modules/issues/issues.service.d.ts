import type { IIssue, IUpdateIssue } from "./issues.interface";
export declare const issueService: {
    createIssueIntoDB: (payload: IIssue) => Promise<any>;
    getAllIssuesFromDB: (query: {
        sort?: string;
        type?: string;
        status?: string;
    }) => Promise<{
        id: any;
        title: any;
        description: any;
        type: any;
        status: any;
        reporter: {
            id: any;
            name: any;
            role: any;
        };
        created_at: any;
        updated_at: any;
    }[]>;
    getSingleIssueFromDB: (id: string | string[] | undefined) => Promise<{
        id: any;
        title: any;
        description: any;
        type: any;
        status: any;
        reporter: {
            id: any;
            name: any;
            role: any;
        };
        created_at: any;
        updated_at: any;
    } | null>;
    updateIssueIntoDB: (id: string | string[] | undefined, payload: IUpdateIssue, requesterId: number, requesterRole: string) => Promise<any>;
    deleteIssueFromDB: (id: string | string[] | undefined) => Promise<import("pg").QueryResult<any>>;
};
//# sourceMappingURL=issues.service.d.ts.map