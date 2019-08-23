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
const config = require("../config/git.json");
const lambdaDir = path.join(__dirname, '../public/static/lambda-repo-pst');
var ncp = require('ncp').ncp;
ncp.limit = 16;

// const config = path.join(__dirname, "config/aws.properties");

//console.log(repoDir);

var fileConvertor = {
    npmDependencies: [],
    tiggerPoint: function (dirName) {
        _self = this;
        let array = [];
        var npm;

        fs.readdir(commitDir, function (err, files) {
            if (err) {
                console.log(err);
            }

            files.forEach(function (fileName) {
                console.log(fileName);

                var filePath = path.join(commitDir, fileName);
                console.log(filePath);

                var stat = fs.statSync(filePath);



                if (stat.isFile() && fileName.indexOf(".js") !== -1) {

                    _self.findRequireFromJs(fileName, function (success) {
                        console.log(success);
                    });



                    array.push({ fileName: fileName });

                    var dotIndex = fileName.lastIndexOf(".");
                    var name = fileName.slice(0, dotIndex)
                    var newName = name + path.extname(fileName);

                    var read = fs.createReadStream(path.join(filePath));
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(err)
                        }
                        console.log("File removed successfully :" + fileName);
                    });

                    var write = fs.createWriteStream(path.join(convertDir, newName));
                    read.pipe(write);

                    _self.replaceContentTemplate(name, dirName)
                        .then(data => {
                            return _self.readWriteFile('/template.yaml', data);
                        }).then(data => {
                            _self.replaceContentBuildSpec(name, dirName)
                                .then(data => {
                                    _self.readWriteFile('/buildspec.yaml', data);
                                    _self.moveAllFiles();

                                })
                                .catch(err => console.log(err));
                        })
                        .catch(err => console.log(err));
                }
            });
            _self.codeCommitToAWS();

        });

    },


    readWriteFile: function (writeTo, content) {
        return new Promise((resolve, reject) => {
            fs.writeFile(convertDir + writeTo, content, 'utf8', function (err) {
                if (err) reject(err);
                resolve("success");
            });
        });

    },
    replaceContentTemplate: function (jsFileName, dirName) {
        return new Promise(function (resolve, reject) {
            fs.readFile(sampleDir + '/template.yaml', 'utf8', function read(err, data) {
                if (err) reject(err);
                data = data.replace(/{{index}}/g, jsFileName);
                data = data.replace(/{{dirName}}/g, dirName);
                resolve(data);
            });
        });
    },
    replaceContentBuildSpec: function (fileName, dirName) {
        return new Promise(function (resolve, reject) {
            fs.readFile(sampleDir + '/buildspec.yaml', 'utf8', function read(err, data) {
                if (err) reject(err);
                // data = data.replace(/{{dependencies}}/g, npmArray);
                resolve(data);
            });
        });
    },
    findRequireFromJs: function (fileName) {
        _self = this;
        _self.npmDependencies = [];
        const readInterface = readline.createInterface({
            input: fs.createReadStream(commitDir + "/" + fileName),
            console: false
        });
        readInterface.on('line', function (line) {
            if (line.indexOf("require('") !== -1 && line.indexOf("')") !== -1) {
                let result = line.match(/'(.*)'/g);
                _self.npmDependencies.push(result);
            }

        });
    },

    // createDirForAWS: function (dirName) {
    //     fs.readdir(repoDir, function (err, data) {
    //         if (err)
    //             throw err;
    //         fs.mkdirSync(repoDir + "/" + dirName, { recursive: true });
    //     });
    // },

    moveAllFiles: function () {

        if (fs.existsSync(lambdaDir)) {
            ncp(convertDir, lambdaDir, function (err) {
                if (err) {
                    return console.error(err);
                }
                console.log('done!');
            });
        } else {
            console.log('lambda directory not found');
        }
    },
    codeCommitToAWS: function () {

        try {
            const USER = config.USER;
            const PASS = config.PASS;
            const REPO = config.REPO;
            const gitHubUrl = `https://${USER}:${PASS}@${REPO}`;
            //console.log("github url "+gitHubUrl);

            git(lambdaDir).add("./*")
                .commit("first commit!")
                .push(['-u', 'origin', 'master'], () => console.log("files push to aws"));
        }
        catch (err) {
            console.log(err);
        }
    }
}

module.exports = fileConvertor;