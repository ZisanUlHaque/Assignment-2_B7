const sendResponse = (res, data) => {
    res.status(data.statusCode).json({
        success: data.success,
        message: data.message,
        data: data.data,
        error: data.error,
    });
};
export default sendResponse;
//# sourceMappingURL=sendResponse.js.map