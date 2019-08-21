const git = require('simple-git');
const path = require('path');
const dir = path.join(__dirname, "../public/static/lambda-repo-pst");
const config = path.join(__dirname, "config/aws.properties");
const USER = config.USER;
const PASS = config.PASS;
const REPO = config.REPO;
const gitHubUrl = `https://${USER}:${PASS}@${REPO}`;

git(dir).add('./*')
  .commit("first commit!")
  .push(['-u', 'origin', 'master'], () => console.log('done'));

