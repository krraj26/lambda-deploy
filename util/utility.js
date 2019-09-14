var properties = require("properties");
var path = require('path');
var fs = require('fs');
const directoryPath = path.join(__dirname, '../public/static');
if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });
const git = require('simple-git/promise')(directoryPath);
var jsToYaml = require('../routes/convertJStoYaml');
const config = require("../config/aws.json");
var lambdaDir = path.join(__dirname, '../public/static/lambda-pipeline-repo-pst');
//var aws = require("../aws/index");

customUtils = {

    myConsole: function (variable) {
        if (variable instanceof Object)
            console.log(variable);
        console.log(variable);
    },
    getProperties: function () {
        return new Promise(function (resolve, reject) {
            properties.parse("./config/git.properties", { path: true }, function (error, prop) {
                if (error) reject(error);
                resolve(prop);
            });
        });
    },
    getJson: function () {
        return new Promise(function (resolve, reject) {
            properties.parse("./config/aws.json", { path: true }, function (error, prop) {
                if (error) reject(error);
                resolve(prop);
            });
        });
    },
    devRepoClone: function () {
        let _self = this;
        return new Promise(function (resolve, reject) {
            if (!fs.existsSync(directoryPath + '/DeveloperRepo')) {
                try {
                    _self.getProperties().then(data => {
                        let remote = `https://${data.username}:${data.password}@${data.repository}`;
                        git.silent(true)
                            .clone(remote)
                            .then(() => resolve({ "msg": "Developer repository clone successfully" }));
                    }).catch(err => {
                        _self.myConsole("Please check, Something is wrong " + err);
                        reject(err);
                    });
                } catch (err) {
                    reject(err);
                }
            }

        });
    },
    AwsRepoClone: function () {
        let _self = this;
        return new Promise(function (resolve, reject) {
            if (!fs.existsSync(directoryPath + '/lambda-pipeline-repo-pst')) {
                try {

                    const REPO = config.REPO;

                    let remote = `${REPO}`;

                    git.silent(true)
                        .clone(remote)
                        .then(() => resolve({ "msg": "AWS repository clone successfully" }))
                        .catch((err) => console.error('failed: ', err));
                }
                catch (err) {
                    _self.myConsole("Please check, Something is wrong " + err);
                    reject(err);
                }

            }

        });
    },
    syncPullCode: function () {
        let _self = this;
        return new Promise(function (resolve, reject) {
            try {
                if (fs.existsSync(directoryPath + '/DeveloperRepo')) {

                    require('simple-git/promise')(directoryPath + '/DeveloperRepo')
                        //.reset(['--hard','origin/master'])
                        .pull((err, update) => {
                            if (update && update.summary.changes) {
                                require('child_process').exec('npm restart');
                            }
                        });
                    resolve('files pulled');
                }

            } catch (error) {
                reject(error)
            }


        });
    },
    listRepoDirectories: function () {
        let _self = this;
        return new Promise(function (resolve, reject) {
            let repoDir = directoryPath + '/DeveloperRepo';
            let array = [];
            fs.readdir(repoDir, function (err, files) {

                if (err) reject(err);

                files.forEach(function (fileName) {

                    var filePath = path.join(repoDir, fileName);
                    var stat = fs.statSync(filePath);

                    if (stat.isDirectory() && fileName.indexOf('.') == -1) {
                        array.push({ fileName: fileName, filePath: filePath });
                    }
                });
                resolve(array);
            });
        });
    },
    deleteFiles: function () {
        return new Promise((resolve, reject) => {
            fs.readdir(lambdaDir, function (err, files) {
                if (err) {
                    reject(err);
                }
                else {
                    files.forEach((filename) => {
                        var filePath = path.join(lambdaDir, filename);
                        var stat = fs.statSync(filePath);
                        if (stat.isFile() && filename.indexOf(".git") == -1) {
                            fs.unlink(lambdaDir + "/" + filename, function (err) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve("files deleted from lambda directory succesfully ");
                                }
                            });
                        }
                    });
                }
            });
        });
    },
    copyFilesToAwsRepo: function (testPath) {
        let _self = this;
        return new Promise(function (resolve, reject) {

            let array = [];
            resolve(`directory : ` + testPath);
            fs.readdir(testPath, function (err, files) {

                if (err) {
                    reject(err);
                }

                else {
                    files.forEach(function (fileName) {

                        var filePath = path.join(testPath, fileName);
                        var stat = fs.statSync(filePath);
                        if (stat.isFile()) {
                            array.push({ fileName: fileName, filePath: filePath });
                            var dotIndex = fileName.lastIndexOf(".");
                            var name = fileName.slice(0, dotIndex);
                            var newName = name + path.extname(fileName);
                            var read = fs.createReadStream(path.join(filePath));
                            var write = fs.createWriteStream(path.join(lambdaDir, newName));
                            read.pipe(write);
                        }
                    });
                    resolve(array);
                }
            });
        });
    },
    convertJStoYaml: function (dirName) {

        return new Promise(function (resolve, reject) {
            jsToYaml.tiggerPoint(dirName)
                .then(data =>{resolve(data); })
                .catch(err =>{ reject(err); })
        });
    }
}
module.exports = customUtils;