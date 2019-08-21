const fs = require("fs");
const path = require("path");
var writeData = require('write-data');
var readline = require("readline");
const commitDir = path.join(__dirname, '../public/commitDir');
if (!fs.existsSync(commitDir)) fs.mkdirSync(commitDir, { recursive: true });
const convertDir = path.join(__dirname, '../public/convertDIR')
if (!fs.existsSync(convertDir)) fs.mkdirSync(convertDir, { recursive: true });
const sampleDir = path.join(__dirname, '../sample');
const repoDir = path.join(__dirname, '../public/static/lambda-repo-pst');
//const testDir = path.join(__dirname, '../public/test');
const git = require('simple-git');
const config = path.join(__dirname, "config/aws.properties");

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
                            _self.readWriteFile('/template.yaml', data);
                            _self.moveFilesFromConverDIR(dirName);
                        })
                        .catch(err => console.log(err));

                    _self.replaceContentBuildSpec(name, dirName)
                        .then(data => {
                            _self.readWriteFile('/buildspec.yaml', data);
                            _self.moveFilesFromConverDIR(dirName);
                        })
                        .catch(err => console.log(err));
                }
            });

            _self.moveFilesFromConverDIR(dirName,function (success) {
                console.log(success);
            });
            // _self.codeCommitToAWS(dirName, function(success){
            //     console.log(success);
            // })
        });



    },


    readWriteFile: function (writeTo, content) {
        fs.writeFile(convertDir + writeTo, content, 'utf8', function (err) {
            if (err) reject(err);
            console.log(writeTo + ` : success`);
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

    moveFilesFromConverDIR: function () {
        fs.readdir(convertDir, function (err, files) {
            if (err) {
                console.error("Could not list the directory.", err);
                process.exit(1);
            }

            files.forEach(function (file, index) {
                // Make one pass and make the file complete
                var fromPath = path.join(convertDir, file);
                console.log("formpath" + fromPath);
                var toPath = path.join(repoDir, file);

                fs.stat(fromPath, function (error, stat) {
                    if (error) {
                        console.error("Error stating file.", error);
                        return;
                    }

                    if (stat.isFile())
                        console.log("'%s' is a file.", fromPath);
                    else if (stat.isDirectory())
                        console.log("'%s' is a directory.", fromPath);

                    fs.rename(fromPath, toPath, function (error) {
                        if (error) {
                            console.error("File moving error.", error);
                        } else {
                            console.log("Moved file '%s' to '%s'.", fromPath, toPath);
                        }
                    });
                });
            });
        });
    },

    codeCommitToAWS: function (dirName) {
        return new Promise(function (resolve, reject) {
            try {
                const USER = config.username;
                const PASS = config.password;
                const REPO = config.repository;
                const gitHubUrl = `https://${USER}:${PASS}@${REPO}`;

                git(repoDir).add('./*')
                    .commit("first commit!")
                    .push(['-u', 'origin', 'master'], () => resolve('done'));
            }
            catch (err) {
                reject(err);
            }

        });
    }
}

module.exports = fileConvertor;