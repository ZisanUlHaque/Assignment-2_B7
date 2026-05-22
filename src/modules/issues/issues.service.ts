import { pool } from "../../db";
import type { IIssue, IUpdateIssue } from "./issues.interface";
import type { IssueStatus, IssueType } from "../../types";

//  Create Issue 
const createIssueIntoDB = async (payload: IIssue) => {
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

//  Get All Issues 
const getAllIssuesFromDB = async (query: {
  sort?: string;
  type?: string;
  status?: string;
}) => {
  const { sort = "newest", type, status } = query;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (type) {
    conditions.push(`i.type = $${paramIndex++}`);
    params.push(type);
  }

  if (status) {
    conditions.push(`i.status = $${paramIndex++}`);
    params.push(status);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderClause =
    sort === "oldest" ? "ORDER BY i.created_at ASC" : "ORDER BY i.created_at DESC";

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

  const reporterIds = [...new Set(issues.map((issue: any) => issue.reporter_id))];

  const placeholders = reporterIds.map((_, i) => `$${i + 1}`).join(", ");
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    reporterIds
  );

  const reporterMap = new Map<number, any>();
  for (const reporter of reportersResult.rows) {
    reporterMap.set(reporter.id, reporter);
  }

  const issuesWithReporter = issues.map((issue: any) => {
    const reporter = reporterMap.get(issue.reporter_id);
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporter
        ? { id: reporter.id, name: reporter.name, role: reporter.role }
        : { id: issue.reporter_id, name: "Unknown", role: "contributor" },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };
  });

  return issuesWithReporter;
};

//  Get Single Issue 
const getSingleIssueFromDB = async (id: string | string[] | undefined) => {

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
    reporter: reporter
      ? { id: reporter.id, name: reporter.name, role: reporter.role }
      : { id: issue.reporter_id, name: "Unknown", role: "contributor" },
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

//  Update Issue 
const updateIssueIntoDB = async (
  id: string | string[] | undefined,
  payload: IUpdateIssue,
  requesterId: number,
  requesterRole: string
) => {
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

    if (payload.status !== undefined) {
      throw new Error("FORBIDDEN: Contributors cannot change the issue status.");
    }
  }

  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (payload.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    params.push(payload.title);
  }

  if (payload.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(payload.description);
  }

  if (payload.type !== undefined) {
    updates.push(`type = $${paramIndex++}`);
    params.push(payload.type);
  }

  if (payload.status !== undefined) {
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

//  Delete Issue 
const deleteIssueFromDB = async (id: string | string[] | undefined) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id]
  );
  return result;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB,
};