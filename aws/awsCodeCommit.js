var path = require("path");
//var codeCommitDir = path.join(__dirname,'../public/static/AWSRepository');
var gitp = require("simple-git");
//const git = gitp(codeCommitDir);
var config = require("../aws/config");

console.log(config);


gitp().add('./*')
.commit("first commit!")
//.addRemote('origin', 'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/lambda-pipeline-repo')
.push(['-u', 'origin', 'master'], () => console.log('done'));
