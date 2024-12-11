const mongoose = require('mongoose');

const GitHubIntegrationSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    accessToken: { type: String, required: true },
    connectedAt: { type: Date, required: true },
});

module.exports = mongoose.model('GitHubIntegration', GitHubIntegrationSchema);