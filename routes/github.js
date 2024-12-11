const express = require('express');
const { connectToGitHub, callbackFromGitHub, fetchGitHubData, removeIntegration, fetchOrganizations, fetchRepos, fetchCommits, fetchPulls, fetchIssues, fetchChangelogs, fetchUsers } = require('../controllers/githubController');

const router = express.Router();

router.get('/connect', connectToGitHub);
router.get('/callback', callbackFromGitHub);
router.get('/fetch-data', fetchGitHubData);
router.get('/organizations', fetchOrganizations);
router.get('/organizations/repos', fetchRepos);
router.get('/organizations/repos/commits', fetchCommits);
router.get('/organizations/repos/pulls', fetchPulls);
router.get('/organizations/repos/issues', fetchIssues);
router.get('/organizations/repos/issues/changelogs', fetchChangelogs);
router.get('/organizations/users', fetchUsers);
router.delete('/remove', removeIntegration);

module.exports = router;