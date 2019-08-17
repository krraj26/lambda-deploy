const fs = require("fs");
const path = require("path");
var writeData = require('write-data');
const directoryPath = path.join(__dirname, '../public/static/test');
const commitDir = path.join(__dirname, '../public/commitDir');
const convertDir = path.join(__dirname, '../public/convertDIR')
const yaml = require("js-yaml");

//console.log("Directory is :" + directoryPath);

let array = [];
fs.readdir(commitDir, function (err, files) {
    if (err) {
        //res.json(err);
        console.log(err);
    }

    files.forEach(function (fileName) {
        console.log(fileName);

        var DIRfilePath = path.join(directoryPath, fileName);

        console.log("Directory is :" + DIRfilePath);

        var filePath = path.join(commitDir, fileName);
        console.log(filePath);

        var stat = fs.statSync(filePath);

        if (stat.isFile() && fileName.indexOf(".js")!==-1) {

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

            const customer = {
                "AWSTemplateFormatVersion": "2010-09-09",
                "Transform": "AWS::Serverless-2016-10-31",
                "Description": "Outputs the time",
                "Resources": {
                    "TimeFunction": {
                        "Type": "AWS::Serverless::Function",
                        "Properties": {
                            "Handler": name +".handler",
                            "Runtime": "nodejs10.x",
                            "CodeUri": "./",
                            "Events": {
                                "MyTimeApi": {
                                    "Type": "Api",
                                    "Properties": {
                                        "Path": "/TimeResource",
                                        "Method": "GET"
                                    }
                                }
                            }
                        }
                    }
                }
            }
            const jsonString = JSON.stringify(customer);

            fs.readFile(convertDir + '/' + newName, function (err, data) {
                if (err) { console.log(err); }
                else {
                    { //console.log("Content is :" +data);

                    var js = JSON.stringify(data);
                  //  console.log(js);
                    
                    writeData(convertDir+'/template.yaml', customer, function(err) {
                        if(err)
                        {
                            console.log(err);
                        }else{
                            console.log("saved");
                        }
                      })
                }}
            });

            fs.readFile(convertDir + '/' + newName, function (err, data) {
                if (err) { console.log(err); }
                else {
                    { //console.log("Content is :" +data);

                    var js = JSON.stringify(data);
                  //  console.log(js);
                    
                    writeData(convertDir+'/buildspec.yaml', customer, function(err) {
                        if(err)
                        {
                            console.log(err);
                        }else{
                            console.log("saved");
                        }
                      })
                }}
            });

            // let doc = yaml.safeLoad(fs.readFileSync(convertDir + '/' + newName, 'utf8'));

            // fs.writeFile(convertDir + '/' + newName, yaml.safeDump(doc), (err) => {
            //     if (err) {
            //         console.log(err);
            //     }
            // });


        }
    });
    //res.json(array);
    console.log(array);
});