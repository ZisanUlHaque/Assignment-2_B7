

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import cors from "cors";
import express from "express";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: err
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/middleware/logger.ts
var logger = (req, res, next) => {
  const log = `
Method -> ${req.method} - Time -> ${Date.now()} - URL -> ${req.url}
`;
  next();
};
var logger_default = logger;

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET,
  refresh_secret: process.env.JWT_REFRESH_SECRET
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        role        VARCHAR(20) NOT NULL DEFAULT 'contributor' 
                    CHECK (role IN ('contributor', 'maintainer')),
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id           SERIAL PRIMARY KEY,
        title        VARCHAR(150) NOT NULL,
        description  TEXT NOT NULL,
        type         VARCHAR(20) NOT NULL 
                     CHECK (type IN ('bug', 'feature_request')),
        status       VARCHAR(20) NOT NULL DEFAULT 'open' 
                     CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id  INT NOT NULL,
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Database connected successfully!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const existingUser = await pool.query(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );
  if (existingUser.rows.length > 0) {
    throw new Error("An account with this email already exists.");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const userRole = role === "maintainer" ? "maintainer" : "contributor";
  const result = await pool.query(
    `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, hashedPassword, userRole]
  );
  return result.rows[0];
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid email or password.");
  }
  const user = userData.rows[0];
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error("Invalid email or password.");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.secret, {
    expiresIn: "7d"
  });
  const { password: _pass, ...userWithoutPassword } = user;
  return {
    token,
    user: userWithoutPassword
  };
};
var authService = {
  registerUserIntoDB,
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var signup = async (req, res) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: error.message.includes("already exists") ? 409 : 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var login = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 401,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  signup,
  login
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signup);
router.post("/login", authController.login);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized! No token provided."
        });
        return;
      }
      const decoded = jwt2.verify(
        token,
        config_default.secret
      );
      const userData = await pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [decoded.id]
      );
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!"
        });
        return;
      }
      const user = userData.rows[0];
      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden! You do not have permission to access this."
        });
        return;
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, status, reporter_id)
    VALUES ($1, $2, $3, 'open', $4)
    RETURNING *
    `,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { sort = "newest", type, status } = query;
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  if (type) {
    conditions.push(`i.type = $${paramIndex++}`);
    params.push(type);
  }
  if (status) {
    conditions.push(`i.status = $${paramIndex++}`);
    params.push(status);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderClause = sort === "oldest" ? "ORDER BY i.created_at ASC" : "ORDER BY i.created_at DESC";
  const issuesResult = await pool.query(
    `
    SELECT i.id, i.title, i.description, i.type, i.status,
           i.reporter_id, i.created_at, i.updated_at
    FROM issues i
    ${whereClause}
    ${orderClause}
    `,
    params
  );
  const issues = issuesResult.rows;
  if (issues.length === 0) return [];
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const placeholders = reporterIds.map((_, i) => `$${i + 1}`).join(", ");
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    reporterIds
  );
  const reporterMap = /* @__PURE__ */ new Map();
  for (const reporter of reportersResult.rows) {
    reporterMap.set(reporter.id, reporter);
  }
  const issuesWithReporter = issues.map((issue) => {
    const reporter = reporterMap.get(issue.reporter_id);
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporter ? { id: reporter.id, name: reporter.name, role: reporter.role } : { id: issue.reporter_id, name: "Unknown", role: "contributor" },
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return issuesWithReporter;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id = $1`,
    [id]
  );
  if (issueResult.rows.length === 0) {
    return null;
  }
  const issue = issueResult.rows[0];
  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  const reporter = reporterResult.rows[0];
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporter ? { id: reporter.id, name: reporter.name, role: reporter.role } : { id: issue.reporter_id, name: "Unknown", role: "contributor" },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (id, payload, requesterId, requesterRole) => {
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  if (issueResult.rows.length === 0) {
    return null;
  }
  const issue = issueResult.rows[0];
  if (requesterRole === "contributor") {
    if (issue.reporter_id !== requesterId) {
      throw new Error("FORBIDDEN: You can only update your own issues.");
    }
    if (issue.status !== "open") {
      throw new Error(
        "CONFLICT: Contributors can only update issues with status 'open'."
      );
    }
    if (payload.status !== void 0) {
      throw new Error("FORBIDDEN: Contributors cannot change the issue status.");
    }
  }
  const updates = [];
  const params = [];
  let paramIndex = 1;
  if (payload.title !== void 0) {
    updates.push(`title = $${paramIndex++}`);
    params.push(payload.title);
  }
  if (payload.description !== void 0) {
    updates.push(`description = $${paramIndex++}`);
    params.push(payload.description);
  }
  if (payload.type !== void 0) {
    updates.push(`type = $${paramIndex++}`);
    params.push(payload.type);
  }
  if (payload.status !== void 0) {
    updates.push(`status = $${paramIndex++}`);
    params.push(payload.status);
  }
  if (updates.length === 0) {
    throw new Error("No valid fields provided for update.");
  }
  updates.push(`updated_at = NOW()`);
  params.push(id);
  const result = await pool.query(
    `
    UPDATE issues
    SET ${updates.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *
    `,
    params
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id]
  );
  return result;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const reporterId = req.user?.id;
    const payload = {
      ...req.body,
      reporter_id: reporterId
    };
    const result = await issueService.createIssueIntoDB(payload);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const result = await issueService.getAllIssuesFromDB({
      sort,
      type,
      status
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssueFromDB(id);
    if (!result) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found!"
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;
    const result = await issueService.updateIssueIntoDB(
      id,
      req.body,
      requesterId,
      requesterRole
    );
    if (!result) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found!"
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    if (error.message.startsWith("FORBIDDEN:")) {
      sendResponse_default(res, {
        statusCode: 403,
        success: false,
        message: error.message.replace("FORBIDDEN: ", ""),
        error
      });
      return;
    }
    if (error.message.startsWith("CONFLICT:")) {
      sendResponse_default(res, {
        statusCode: 409,
        success: false,
        message: error.message.replace("CONFLICT: ", ""),
        error
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.deleteIssueFromDB(id);
    if (result.rowCount === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found!"
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.createIssue
);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch(
  "/:id",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.updateIssue
);
router2.delete(
  "/:id",
  auth_default(USER_ROLE.maintainer),
  issueController.deleteIssue
);
var issueRoute = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger_default);
app.use(
  cors({
    origin: "*"
  })
);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API Server",
    author: "Zisan Ul Haque"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = async () => {
  await initDB();
  app_default.listen(config_default.port, () => {
    console.log(`DevPulse server listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map