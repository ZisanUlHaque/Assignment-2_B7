import type { IssueStatus, IssueType } from "../../types";

export interface IIssue {
  title: string;
  description: string;
  type: IssueType;
  status?: IssueStatus;
  reporter_id?: number;
}

export interface IUpdateIssue {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
}