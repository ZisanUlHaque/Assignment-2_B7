export declare const authService: {
    registerUserIntoDB: (payload: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }) => Promise<any>;
    loginUserIntoDB: (payload: {
        email: string;
        password: string;
    }) => Promise<{
        token: string;
        user: any;
    }>;
};
//# sourceMappingURL=auth.service.d.ts.map