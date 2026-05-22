import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../types";
declare const auth: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default auth;
//# sourceMappingURL=auth.d.ts.map