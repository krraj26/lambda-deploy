var properties = require("properties");
var path = require('path');
var fs = require('fs');
const directoryPath = path.join(__dirname, '../public/static');
if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });
const git = require('simple-git/promise')(directoryPath);
const commitDir = path.join(__dirname, '../public/commitDir');
if (!fs.existsSync(commitDir)) fs.mkdirSync(commitDir, { recursive: true });
const convertDir = path.join(__dirname, '../public/convertDIR')
if (!fs.existsSync(convertDir)) fs.mkdirSync(convertDir, { recursive: true });

var jsToYaml = require('../routes/convertJStoYaml')

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
    pullCode: function () {
        let _self = this;
        return new Promise(function (resolve, reject) {
            if (fs.existsSync(directoryPath + '/test')) {
                try{
                    require('simple-git/promise')(directoryPath + '/test')
                        .pull('origin', 'master');
                    resolve({ msg: 'update successfully' })
                }catch(err){
                    reject(err);
                }
                
            } else {
                _self.getProperties().then(data => {
                    let remote = `https://${data.username}:${data.password}@${data.repository}`;
                    git.silent(true)
                        .clone(remote)
                        .then(() => resolve({ "msg": "clone successfully" }));
                }).catch(err => {
                    _self.myConsole(err);
                    reject(err);
                });
            }
        });
    },
    listRepoDirectories: function () {
        let _self = this;
        return new Promise(function (resolve, reject) {
            let repoDir = directoryPath + '/test';
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
    cleanDirectory: function (myDir) {
        fs.readdir(myDir, (err, files) => {
            if (err) throw err;
            for (const file of files) {
                fs.unlink(path.join(myDir, file), err => {
                    if (err) throw err;
                });
            }
        });
    },
    copyFilesToCommitDir: function (testPath) {
        let _self = this;
        return new Promise(function (resolve, reject) {

            let array = [];
            console.log(`directory : ` + testPath);
            fs.readdir(testPath, function (err, files) {

                if (err) {
                    reject(err);
                }
                _self.cleanDirectory(commitDir);
                files.forEach(function (fileName) {

                    var filePath = path.join(testPath, fileName);
                    var stat = fs.statSync(filePath);

                    if (stat.isFile() && fileName.indexOf(".js") !== -1) {
                        array.push({ fileName: fileName, filePath: filePath });
                        var dotIndex = fileName.lastIndexOf(".");
                        var name = fileName.slice(0, dotIndex);
                        var newName = name + path.extname(fileName);
                        var read = fs.createReadStream(path.join(filePath));
                        var write = fs.createWriteStream(path.join(commitDir, newName));
                        read.pipe(write);
                    }
                });
                resolve(array);
            });
        });
    },
    convertJStoYaml : function(dirName){
        let _self = this;
        return new Promise(function(resolve, reject){
            try{
                _self.cleanDirectory(convertDir);
                jsToYaml.tiggerPoint(dirName);
                resolve("success");
            }catch(err){
                reject(err);
            }
        });
        
    }
}



module.exports = customUtils;