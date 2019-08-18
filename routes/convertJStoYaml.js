const fs = require("fs");
const path = require("path");
var writeData = require('write-data');
var readline = require("readline");
const commitDir = path.join(__dirname, '../public/commitDir');
if (!fs.existsSync(commitDir)) fs.mkdirSync(commitDir, { recursive: true });
const convertDir = path.join(__dirname, '../public/convertDIR')
if (!fs.existsSync(convertDir)) fs.mkdirSync(convertDir, { recursive: true });
const sampleDir = path.join(__dirname, '../sample')
const yaml = require("js-yaml");


var fileConvertor = {

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

                    const readInterface = readline.createInterface({
                        input: fs.createReadStream(commitDir + "/" + fileName),
                        console: false
                    });
                    readInterface.on('line', function (line) {
                        // if (line.indexOf("require('") !== -1 && line.indexOf("')") !== -1) {
                        //     var result = line.match(/\('(.*)'\)/, "");
                        //     npm = result;
                        //     for (var i = 0; i < npm.length; i++) {
                        //         console.log("npm install " + npm[i]);
                        //     }
                        // }
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
                        })
                        .catch(err => console.log(err));
                    if(npmDependencies){
                        _self.replaceContentBuildSpec(npmDependencies)
                        .then(data => {
                            _self.readWriteFile('/buildspec.yaml', data);
                        })
                        .catch(err => console.log(err));
                    }
                    
                                        
                }
            });
            // console.log(array);
        });

    },
    readWriteFile : function(writeTo, content){
        fs.writeFile(convertDir + writeTo, content, 'utf8', function (err) {
            if (err) reject(err);
            console.log(writeTo + ` : success`);
        });
    },
    replaceContentTemplate : function(jsFileName, dirName){
        return new Promise(function(resolve, reject){
            fs.readFile(sampleDir  + '/template.yaml', 'utf8', function read(err, data){
                if (err) reject(err);
                data = data.replace(/{{index}}/g, jsFileName);
                data = data.replace(/{{dirName}}/g, dirName);
                resolve(data);            
            });
        });        
    },
    replaceContentBuildSpec : function(npmArray){
        return new Promise(function(resolve, reject){
            fs.readFile(sampleDir  + '/buildspec.yaml', 'utf8', function read(err, data){
                if (err) reject(err);
                data = data.replace(/{{dependencies}}/g, npmArray);
                resolve(data);            
            });
        });        
    }
}

module.exports = fileConvertor;