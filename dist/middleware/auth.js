import jwt, {} from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
const auth = (...roles) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized! No token provided.",
                });
                return;
            }
            const decoded = jwt.verify(token, config.secret);
            const userData = await pool.query(`SELECT * FROM users WHERE id = $1`, [decoded.id]);
            if (userData.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "User not found!",
                });
                return;
            }
            const user = userData.rows[0];
            if (roles.length && !roles.includes(user.role)) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden! You do not have permission to access this.",
                });
                return;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
export default auth;
//# sourceMappingURL=auth.js.map