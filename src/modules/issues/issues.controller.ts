import type { Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import { issueService } from "./issues.service";

//  Create Issue
const createIssue = async (req: Request, res: Response) => {
  try {
    const reporterId = req.user?.id;

    const payload = {
      ...req.body,
      reporter_id: reporterId,
    };

    const result = await issueService.createIssueIntoDB(payload);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

//  Get All Issues
const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort, type, status } = req.query;

    const result = await issueService.getAllIssuesFromDB({
      sort: sort as string,
      type: type as string,
      status: status as string,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

// Get Single Issue
const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issueService.getSingleIssueFromDB(id);

    if (!result) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found!",
      });
      return;
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

//Update Issue 
const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.id as number;
    const requesterRole = req.user?.role as string;

    const result = await issueService.updateIssueIntoDB(
      id,
      req.body,
      requesterId,
      requesterRole
    );

    if (!result) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found!",
      });
      return;
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: any) {

    if (error.message.startsWith("FORBIDDEN:")) {
      sendResponse(res, {
        statusCode: 403,
        success: false,
        message: error.message.replace("FORBIDDEN: ", ""),
        error: error,
      });
      return;
    }

    if (error.message.startsWith("CONFLICT:")) {
      sendResponse(res, {
        statusCode: 409,
        success: false,
        message: error.message.replace("CONFLICT: ", ""),
        error: error,
      });
      return;
    }

    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

// Delete Issue 
const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issueService.deleteIssueFromDB(id);

    if (result.rowCount === 0) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found!",
      });
      return;
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};