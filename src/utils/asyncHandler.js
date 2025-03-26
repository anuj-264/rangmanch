//higher order function that takes a function and returns a new function that takes the same parameters as
//  the original function
const asyncHandler = (requestHandler) => async (req, res, next) => {
    try {
        await requestHandler(req, res, next);
    } catch (error) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message
        })
    }

};

export default asyncHandler;