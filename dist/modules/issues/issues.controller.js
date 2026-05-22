import sendResponse from "../../utility/sendResponse";
import { issueService } from "./issues.service";
//  Create Issue
const createIssue = async (req, res) => {
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
    }
    catch (error) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        });
    }
};
//  Get All Issues
const getAllIssues = async (req, res) => {
    try {
        const { sort, type, status } = req.query;
        const result = await issueService.getAllIssuesFromDB({
            sort: sort,
            type: type,
            status: status,
        });
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issues retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        });
    }
};
// Get Single Issue
const getSingleIssue = async (req, res) => {
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
    }
    catch (error) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message,
            error: error,
        });
    }
};
//Update Issue 
const updateIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user?.id;
        const requesterRole = req.user?.role;
        const result = await issueService.updateIssueIntoDB(id, req.body, requesterId, requesterRole);
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
    }
    catch (error) {
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
const deleteIssue = async (req, res) => {
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
    }
    catch (error) {
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
//# sourceMappingURL=issues.controller.js.map