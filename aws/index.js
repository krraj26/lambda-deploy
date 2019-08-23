const git = require('simple-git');
const path = require('path');
const lambdaDir = path.join(__dirname, "../public/static/lambda-repo-pst");
const config = path.join(__dirname, "config/aws.json");
function codeCommitToWAS() {
  return new Promise(function (resolve, reject) {
      try {
          const USER = config.USER;
          const PASS = config.PASS;
          const REPO = config.REPO;
          const gitHubUrl = `https://${USER}:${PASS}@${REPO}`;
          //const gitHubUrl = "https://Kumar_Raj:Praj@pati1989@git-codecommit.us-east-1.amazonaws.com/v1/repos/lambda-repo-pst";

          git(lambdaDir).add('./*')
              .commit("first commit!")
              .push(['-u', 'origin', 'master'], () => console.log("files push to aws"));
      }
      catch (err) {
          reject(err);
      }

  });
}

codeCommitToWAS();
