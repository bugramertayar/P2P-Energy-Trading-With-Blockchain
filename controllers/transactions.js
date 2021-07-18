const SHA256 = require('crypto-js/sha256');
const fs = require('fs');
const client = require('scp2');
const http = require('http');

const node1File = "controllers/jsonFiles/blockchain1.json"
const node2File = "controllers/jsonFiles/blockchain2.json"
const node3File = "controllers/jsonFiles/blockchain3.json"
const staticIp  = '13.66.212.202';
let blockchainJsonData ;
let blockchainJsonData1;
let blockchainJsonData2;
let isJsonFilesMatched;
let awaitingTransactions;

class CryptoBlock{
  constructor(index, timestamp, data, precedingHash=" "){
   this.index = index;
   this.timestamp = timestamp;
   this.data = data;
   this.precedingHash = precedingHash;
   this.hash = this.computeHash();     
  }
  computeHash(){
      return SHA256(this.index + this.precedingHash + this.timestamp + JSON.stringify(this.data)).toString();
  }   
}

class CryptoBlockchain{
  constructor(){
      this.blockchain = [this.startGenesisBlock()];     
  }
  startGenesisBlock(){
      return new CryptoBlock(0, "19/04/2021", "Initial Block in the Chain", "0");
  }
  obtainLatestBlock(){
      return this.blockchain[this.blockchain.length - 1];
  }
  addNewBlock(newBlock){
      newBlock.precedingHash = this.obtainLatestBlock().hash;
      newBlock.hash = newBlock.computeHash();        
      this.blockchain.push(newBlock);
  }
  computeUserHash(senderName){
    return SHA256(senderName).toString();
}   
}

let newBlock = new CryptoBlockchain();
let blockIndex =  1;

exports.getTransactions = (req, res) => {
  getAllTransactions(req.user.profile.name);
  const unknownUser = !(req.user);
  res.render('api', {
    title: 'Api',
    awaitingTransactions: awaitingTransactions,
    sitekey: process.env.RECAPTCHA_SITE_KEY,
    unknownUser,
  });
};

function getAllTransactions(userName){
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/test";
  MongoClient.connect(url,{useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
    if (err) throw err;
    var dbo = db.db("test");
    dbo.collection("transactions").findOne({recieverName: userName, status: 0}, function(err, result) {
      if (err) throw err;
      awaitingTransactions = result === null ? '' : result;
      db.close();
    });
  });
}

exports.sendTransactionRequestApproved = async (req, res) => {
   //to import mongodb 
   var MongoClient = require('mongodb').MongoClient;
   var url = "mongodb://localhost:27017/test";
   MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("test");
    var myquery = { recieverName: req.body.recieverName, status: 0 };
    var newvalues = { $set: {status: 1 } };
    dbo.collection("transactions").updateOne(myquery, newvalues, function(err, res) {
      if (err) throw err;
      console.log("1 document updated");
      readJsonFiles();
      setTimeout(() => {
        if (isJsonFilesMatched){
          doBlockchainOperations(blockIndex, req.body.senderName, req.body.recieverName, req.body.quantity);
        }
      }, 1000); 
      db.close();
    });
    return res.redirect('/');
  });
}

function doBlockchainOperations(blockIndex, senderName, recieverName, quantity) {
  let newBlock = createBlock(blockIndex, senderName, recieverName, quantity);
  updateJsonFile(newBlock);
  deleteNodeFiles();
  setTimeout(() => {
    sendFileToServer();
  }, 500);
}


function createBlock(index, senderName, recipientName, quantity){
  var today = new Date().toJSON().slice(0,10);
  let userHash = newBlock.computeUserHash(senderName);
  let recipientHash =  newBlock.computeUserHash(recipientName);
  newBlock.addNewBlock(new CryptoBlock(index, today, {sender: userHash, recipient: recipientHash, quantity: quantity}));
  blockIndex++;
  console.log(JSON.stringify(newBlock, null, 4));
  return newBlock;
}

   function readJsonFiles(){
     getFilesFromNodes();
     setTimeout(() => {
      fs.readFile(node1File, (err, data) => {
        if (err) throw err;
        blockchainJsonData = JSON.parse(data);
      });

      fs.readFile(node2File, (err, data) => {
        if (err) throw err;
        blockchainJsonData1 = JSON.parse(data);
      });

      fs.readFile(node3File, (err, data) => {
        if (err) throw err;
        blockchainJsonData2 = JSON.parse(data);
      });  
      setTimeout(compareDatas, 50);
     }, 500);     
}


function updateJsonFile(jsonData){
  let data = JSON.stringify(jsonData);
  fs.writeFileSync('controllers/jsonFiles/blockchain.json', data);
} 
  

function deleteNodeFiles(){
  fs.unlink(node1File, function(err) {
    if (err) {
      throw err
    } else {
      console.log("Successfully deleted the file.")
    }
  });
  fs.unlink(node2File, function(err) {
    if (err) {
      throw err
    } else {
      console.log("Successfully deleted the file.")
    }
  });
  fs.unlink(node3File, function(err) {
    if (err) {
      throw err
    } else {
      console.log("Successfully deleted the file.")
    }
  });
}

 function compareDatas() {
  
  if((JSON.stringify(blockchainJsonData)===JSON.stringify(blockchainJsonData1))&&(JSON.stringify(blockchainJsonData1)===JSON.stringify(blockchainJsonData2))){
      isJsonFilesMatched = true;
  }
  else{
      console.log('compares data false');
      isJsonFilesMatched = false;
  }  
  } 
  
  function getFilesFromNodes(){
    for(let i = 1; i < 4; i++){      
      const file = fs.createWriteStream(`controllers/jsonFiles/blockchain${i}.json`);
      const request = http.get(`http://${staticIp}/node${i}/blockchain.json`, function(response) {
        response.pipe(file);
    });
    }    
  }


  function sendFileToServer(){
    for(let i = 1; i < 4; i++){
     client.scp("controllers/jsonFiles/blockchain.json", {
       host: staticIp,
       username: 'adminserver',
       password: 'Admin1234567',
       path: `/var/www/html/node${i}` 
   }, function(err) {
   
      if(err){
         console.log('There has been some error!!!');
         console.log(err);
      }else{
         console.log('succeeded copying the file to remote server');   
      }
   });
   }  
 }
  
