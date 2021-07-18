const axios = require('axios');
const validator = require('validator');
const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');

/**
 * GET /contact
 * Contact form page.
 */
exports.getContact = (req, res) => {
  const unknownUser = !(req.user);
  res.render('contact', {
    title: 'Contact',
    sitekey: process.env.RECAPTCHA_SITE_KEY,
    unknownUser,
  });
};
/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
exports.postContact = async (req, res) => {
  //to import mongodb 
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/test";
  MongoClient.connect(url, function (err, db) {
    var db1 = db.db('test');
    if (err) throw err;
    var transaction = { senderName: req.body.userName, recieverName: req.body.name, quantity: req.body.quantity, status: 0 };
    db1.collection("transactions").insertOne(transaction, function (err, result) {
        if (err) throw err;
        console.log("1 Recorded Inserted");
        db.close();
        return res.redirect('/');
    });

});
};
