var express = require('express');
var pushWoosh = require('pushwoosh');
var pushClient = new pushWoosh("0456C-F5F07", "SxUGjDOZqIGFAFjpskYwDgeY5Ulm4J3R9IoZWmsBh2l1G1Q2lhxxBk5MbSbjonzEgRc0skBXpgEtbdbKCWzo");
var bodyParser = require('body-parser');
var _ = require('lodash');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mailbox');

var app = express();

app.use(bodyParser.json());

// Schemas
var mailboxSchema = new mongoose.Schema(
    {
        mailbox_id: String,
        mailbox_name: String,
        devices: [String]
    }
);

// Models
var Mailbox = mongoose.model('Mailbox', mailboxSchema, 'mailboxes');

// Endpoint for microcontroller
app.post('/send-push', function (req, res)
{
    var mailbox_id = req.body.mailbox_id;

    console.log(req.body.mailbox_id);
    Mailbox.findOne({mailbox_id: mailbox_id}, function (err, mailbox)
    {
        console.log(mailbox);
        var config = {
            "send_date": "now",
            "ignore_user_timezone": true,
            "content": "New mail in mailbox!",
            "data": {"custom": "wot"},
            "devices": mailbox.devices
        };

        console.log(config);

        pushClient.sendMessage(config).then(function (data)
        {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({status_code: data.status_code}, null, 3));
        });
    });
});

/*
    ::HTTPcode + meaning in this context::
    200: Found, as in "already existing"
    201: Created
 */

app.get('/', function (req, res)
{
    res.send('LOL')
});

app.post('/register-device', function (req, res)
{

    console.log("INNI REGDEV");

    var mailbox_id = req.body.mailbox_id;
    var token = req.body.token;
    console.log(mailbox_id);
    console.log(token);

    Mailbox.findOne({mailbox_id: mailbox_id}, function (err, mailbox) {
        if(_.contains(mailbox.devices, token)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({status_code: 200, message: 'You already subscribe to notifications for this mailbox.'}, null, 3));
        } else {

            Mailbox.update(
                {mailbox_id: mailbox_id},
                {$push: {"devices": token}},
                {safe: true, upsert: true},
                function (err, model)
                {
                    if (err)
                    {
                        console.log(err);
                    } else
                    {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({status_code: 201, message: 'You successfully subscribed to notifications for this mailbox.'}, null, 3));
                    }
                });
        }
    });
});

app.get('/fetch-mailboxes', function (req, res)
{

    Mailbox.find(function (err, mailboxes)
    {
        if (err)
        {
            console.log(err);
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({mailboxes: mailboxes}, null, 3));
    });
});


app.get('/is-mailbox-registered', function (req, res)
{
    res.setHeader('Content-Type', 'application/json');

    Mailbox.findOne({mailbox_id: mailbox_id}, function (err, mailbox)
    {


        if (mailbox === {})
        {
            res.end(JSON.stringify({status_code: 404}, null, 3));
        }
        else
        {
            res.end(JSON.stringify({status_code: 200}, null, 3));
        }

        console.log(mailbox.devices);


    });

});

app.post('/register-mailbox', function (req, res)
{

    var mailboxInfo = {
        mailbox_id: req.body.mailbox_id,
        mailbox_name: req.body.mailbox_name,
        devices: []
    };

    Mailbox.find({mailbox_id: mailboxInfo.mailbox_id}, function (err, mailbox)
    {
        if (err)
        {
            console.log(err);
        }
        if (mailbox)
        {
            if (mailbox === [])
            {
                console.log("non-existing mailbox");
            }
            else
            {
                console.log(mailbox);
            }
        }
    });

    var mailbox = new Mailbox(mailboxInfo);
    console.log(mailbox);
    mailbox.save(function (err)
    {
        if (err)
        {
            console.log(err);
        }
        else
        {
            console.log("didit");
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({status_code: 200, mailbox: mailbox}, null, 3));
        }
    })
});


app.listen(7654, function ()
{
    console.log("Check it out!");
});
