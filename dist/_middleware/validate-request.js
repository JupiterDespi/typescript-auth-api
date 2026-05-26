"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// v1.0 - Updated May 2026
exports.default = validateRequest;
function validateRequest(req, next, schema) {
    const options = {
        abortEarly: false, // include all errors
        allowUnknown: true, // ignore unknown props
        stripUnknown: true // remove unknown props
    };
    const { error, value } = schema.validate(req.body, options);
    if (error) {
        next(`Validation error: ${error.details.map((x) => x.message).join(', ')}`);
    }
    else {
        req.body = value;
        next();
    }
}
