const fs = require("fs");
const path = require("path");
var writeData = require('write-data');
var readline = require("readline");
const commitDir = path.join(__dirname, '../public/commitDir');
if (!fs.existsSync(commitDir)) fs.mkdirSync(commitDir, { recursive: true });
const convertDir = path.join(__dirname, '../public/convertDIR')
if (!fs.existsSync(convertDir)) fs.mkdirSync(convertDir, { recursive: true });
const sampleDir = path.join(__dirname, '../sample');
if (!fs.existsSync(sampleDir)) fs.mkdirSync(sampleDir, { recursive: true });
const git = require('simple-git');
const config = require("../config/aws.json");
var lambdaDir = path.join(__dirname, '../public/static/lambda-repo-pst');
var awsCli = require('aws-cli-js');

var fileConvertor = {
    npmDependencies: [],

    tiggerPoint: function (dirName) {
        _self = this;
        var npm;

        _self.copyandConvert();
        _self.replaceContentTemplate(dirName)
            .then(data => {
                return _self.readWriteFile('/template.yaml', data);
                // console.log(data)
            }).then(data => {
                _self.replaceContentBuildSpec(dirName)
                    .then(data => {
                        return _self.readWriteFile('/buildspec.yaml', data);
                        // console.log(data)
                    }).then(data => {
                        _self.asyncAwaitCode();
                    })

                    .catch(err => {
                        console.log(err);
                    });

            });

    },

    copyandConvert: function () {
        fs.readdir(commitDir, function (err, files) {
            if (err) {
                console.log(err);
            }
            let array = [];
            files.forEach(function (fileName) {

                var filePath = path.join(commitDir, fileName);
                var stat = fs.statSync(filePath);

                if (stat.isFile() && fileName.indexOf(".js") !== -1) {

                    array.push({ fileName: fileName });

                    var dotIndex = fileName.lastIndexOf(".");
                    var name = fileName.slice(0, dotIndex)
                    var newName = name + path.extname(fileName);

                    var read = fs.createReadStream(path.join(filePath));
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(err)
                        }
                        console.log("File removed from convertDIR successfully :" + fileName);
                    });
                    var write = fs.createWriteStream(path.join(convertDir, newName));
                    read.pipe(write);
                }

            });

        });
    },

    moveFiles: function (oldPath, newPath) {
        return new Promise((resolve, reject) => {
            fs.readdir(convertDir, function (err, files) {
                if (err) {
                    reject(err);
                }
                else {
                    console.log(files);

                    files.forEach((filename) => {
                        var filepath = path.join(convertDir, filename);
                        var stat = fs.statSync(filepath);

                        if (stat.isFile() && filename.indexOf(".") !== -1) {
                            fs.rename(convertDir + "/" + filename, lambdaDir + "/" + filename, function (err) {
                                resolve('Move complete.');
                            });
                        }

                    });

                }

            });
        })
    },

    readWriteFile: function (writeTo, content) {
        return new Promise((resolve, reject) => {
            fs.writeFile(convertDir + writeTo, content, 'utf8', function (err) {
                if (err) { reject(err); }
                else {
                    resolve("success");
                }
            });
        });
    },
    replaceContentTemplate: function (dirName) {
        return new Promise(function (resolve, reject) {
            fs.readFile(sampleDir + '/template.yaml', 'utf8', function read(err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    data = data.replace(/{{dirName}}/g, dirName);
                    resolve(data);
                }

            });
        });
    },
    replaceContentBuildSpec: function (dirName) {
        return new Promise(function (resolve, reject) {
            fs.readFile(sampleDir + '/buildspec.yaml', 'utf8', function read(err, data) {
                if (err) { reject(err); }
                else {
                    resolve(data);
                }
            });
        });
    },

    codeCommitToAWS: function () {
        return new Promise((resolve, reject) => {
            const USER = config.USER;
            const PASS = config.PASS;
            const REPO = config.REPO;
            const gitHubUrl = `https://${USER}:${PASS}@${REPO}`;

            try {
                git(lambdaDir).add('./*')
                    .commit("first commit!")
                    .push(['-u', 'origin', 'master'],
                        () => {
                            console.log("files pushed to AWS repository successfully");
                            resolve(true);
                        });

            } catch (error) {
                console.log("Please check your network" + error);
                reject(err);
            }
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
                                    console.log("file deleted from lambdaDIR succesfully " + filename);
                                    resolve(true);
                                }
                            });
                        }
                    });
                }
            });
        });
    },

    pipeline: function () {
        return new Promise((resolve, reject) => {
            var Options = awsCli.Options;
            var Aws = awsCli.Aws
            var Key = require("../config/pipeline.json");

            var options = new Options(
                AWS_ACCESS_KEY_ID = Key.aws_access_key_id,
                AWS_SECRET_ACCESS_KEY = Key.aws_secret_access_key
            );
            var aws = new Aws(options);
            aws.command('codepipeline start-pipeline-execution --name pipeline-pipeline').then(function (data) {
                console.log('AWS Script run Successfully');
            }).catch(err => { console.log("error" +err) });
            resolve(true);
        })
    },
    asyncAwaitCode: async function () {
        const mf = await _self.moveFiles();
        const cca = await _self.codeCommitToAWS();
        const ld = await _self.deleteFiles();
        const pl = await _self.pipeline();
        //console.log(`${a} ${b} ${c}`);
    }
}
module.exports = fileConvertor;