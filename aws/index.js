const git = require('simple-git');
const path = require('path');
const lambdaDir = path.join(__dirname, "../public/static/lambda-repo-pst");
const config = require("../config/aws.json");

var codeComit ={
    codeCommitToWAS:function() {
        return new Promise(function (resolve, reject) {
            try {
                const USER = config.USER;
                const PASS = config.PASS;
                const REPO = config.REPO;
                const gitHubUrl = `https://${USER}:${PASS}@${REPO}`;
        
                git(lambdaDir).add('./*')
                    .commit("first commit!")
                    .push(['-u', 'origin', 'master'], () => console.log("files push to aws"));
            }
            catch (err) {
                reject(err);
            }
      
        });
      }
}

module.exports = codeComit;