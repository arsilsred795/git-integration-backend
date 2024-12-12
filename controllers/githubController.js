const axios = require("axios");
const GitHubIntegration = require("../models/githubIntegration");
require("dotenv").config();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

exports.connectToGitHub = (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo,read:org`;
  res.header("Access-Control-Allow-Origin", "*");
  res.status(200).json(githubAuthUrl);
};

exports.getAccessToken = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing authorization code");
  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const integration = new GitHubIntegration({
      userId: userResponse.data.id,
      username: userResponse.data.login,
      accessToken: access_token,
      connectedAt: new Date(),
      updatedAt: userResponse.data.updatedAt,
      code: code,
    });

    await integration.save();

    return res
      .status(200)
      .json({ message: "Integration successful", integration });
  } catch (error) {
    console.error("GitHub callback error:", error);
    res.status(500).send("Integration failed");
  }
};

exports.fetchGitHubData = async (req, res) => {
  try {
    const integrations = await GitHubIntegration.find();
    // Perform API calls to fetch data
    res.status(200).json({ message: "Data fetched", integrations });
  } catch (error) {
    console.error("Fetch data error:", error);
    res.status(500).send("Failed to fetch data");
  }
};

exports.fetchOrganizations = async (req, res) => {
  const { accesstoken } = req.headers;
  try {
    const response = await axios.get("https://api.github.com/user/orgs", {
      headers: { Authorization: `Bearer ${accesstoken}` },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Fetch organizations error:", error);
    res.status(500).send("Failed to fetch organizations");
  }
};

exports.fetchRepos = async (req, res) => {
  const { accesstoken } = req.headers;
  const { org } = req.query;
  try {
    const response = await axios.get(
      `https://api.github.com/orgs/${org}/repos`,
      {
        headers: { Authorization: `Bearer ${accesstoken}` },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Fetch repositories error:", error);
    res.status(500).send("Failed to fetch repositories");
  }
};

exports.fetchCommits = async (req, res) => {
  const { accesstoken, repo, owner } = req.headers;
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: { Authorization: `Bearer ${accesstoken}` },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Fetch commits error:", error);
    res.status(500).send("Failed to fetch commits");
  }
};

exports.fetchPulls = async (req, res) => {
  const { accesstoken, repo, owner } = req.headers;
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        headers: { Authorization: `Bearer ${accesstoken}` },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Fetch pull requests error:", error);
    res.status(500).send("Failed to fetch pull requests");
  }
};

exports.fetchIssues = async (req, res) => {
  const { accessToken, repo, owner } = req.headers;
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Fetch issues error:", error);
    res.status(500).send("Failed to fetch issues");
  }
};

exports.fetchChangelogs = async (req, res) => {
  res.status(501).send("Changelogs endpoint not implemented yet");
};

exports.fetchUsers = async (req, res) => {
  const { accessToken, org } = req.headers;
  try {
    const response = await axios.get(
      `https://api.github.com/orgs/${org}/members`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).send("Failed to fetch users");
  }
};

exports.removeIntegration = async (req, res) => {
    const { userId } = req.body;
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

    try {
        // Find the integration for the given user ID
        const integration = await GitHubIntegration.findOne({ userId });
        if (!integration) {
            return res.status(404).json({ message: 'Integration not found' });
        }

        if (integration.accessToken) {
            try {
                // Revoke the GitHub token
                const revokeResponse = await axios({
                    method: 'delete',
                    url: `https://api.github.com/applications/${GITHUB_CLIENT_ID}/token`,
                    headers: {
                        Authorization: `Basic ${Buffer.from(`${GITHUB_CLIENT_ID}:${GITHUB_CLIENT_SECRET}`).toString('base64')}`,
                        'Content-Type': 'application/json',
                    },
                    data: {
                        access_token: integration.accessToken,
                    },
                });

                if (revokeResponse.status !== 204) {
                    console.warn('GitHub token revocation returned unexpected status:', revokeResponse.status);
                }
            } catch (error) {
                console.error('Error revoking GitHub token:', error.response?.data || error.message);
                return res.status(500).json({ message: 'Failed to revoke GitHub token' });
            }
        }

        // Remove the integration from the database
        await GitHubIntegration.deleteOne({ userId });

        res.status(200).json({ message: 'Integration removed successfully' });
    } catch (error) {
        console.error('Error removing integration:', error.message);
        res.status(500).json({ message: 'Failed to remove integration' });
    }
};