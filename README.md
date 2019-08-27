# git-lambda-deploy
git-lambda-deploy


add File Default 

> config > default.properties

```
username:kr-raj
password:{your_password}
repository:github.com/kr-raj/test
```


```


app.use('/', function(req, res, next){

  try{
    require('simple-git')(commitDir+ '/test')
     .add('./*')
     .commit("first commit!")
    //  .addRemote('origin', 'https:praveshasiwal:pravesh.technolabs@//github.com/praveshasiwal/test.git')
     .push(['-u', 'origin', 'master'], () => console.log('done'));

    res.json({msg : "Hello World!"});
  }catch(err){
    res.json({msg : err});
  }  
});


```
