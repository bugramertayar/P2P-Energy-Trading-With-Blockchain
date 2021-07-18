//to import mongodb 
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/test";
//make client connect 
 MongoClient.connect(url, function (err, client) {
    var db = client.db('test');
    if (err) throw err;
    //students is a collection we want to create inside db2                            
    db.createCollection("transactions", function (err, res) {
        if (err) throw err;
        console.log("Collection created!");
        client.close();
    });
});