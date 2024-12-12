const mongoose = require('mongoose');

const GitHubIntegrationSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    accessToken: { type: String, required: true },
    code: { type: String, required: false },
    connectedAt: { type: Date, required: true },
    updatedAt: { type: Date, required: false },
});

module.exports = mongoose.model('GitHubIntegration', GitHubIntegrationSchema);