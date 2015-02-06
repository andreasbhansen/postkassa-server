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
        devices: [String]
    }
);

// Models
var Mailbox = mongoose.model('Mailbox', mailboxSchema, 'mailboxes');

// Endpoint for microcontroller to send push notification
app.post('/send-push', function (req, res)
{
    var mailbox_id = req.body.mailbox_id;

    Mailbox.findOne({mailbox_id: mailbox_id}, function (err, mailbox)
    {
        var config = {
            "send_date": "now",
            "ignore_user_timezone": true,
            "content": "New mail in mailbox!",
            "android_sound": "mail",
            "devices": mailbox.devices
        };

        pushClient.sendMessage(config).then(function (data)
        {
            console.log("Sender: " + new Date());
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
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({message: "No content on root."}));
});

app.post('/register-device', function (req, res)
{
    var mailbox_id = req.body.params.mailbox_id;
    var token = req.body.params.token;

    Mailbox.findOne({mailbox_id: mailbox_id}, function (err, mailbox)
    {
        Mailbox.update(
            {
                mailbox_id: mailbox_id
            },
            {
                $push: {
                    "devices": token
                }
            },
            {
                safe: true,
                upsert: true
            },
            function (err, model)
            {
                if (err)
                {
                    console.log(err);
                }
                else
                {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        status_code: 201,
                        message: 'You successfully subscribed to notifications for this mailbox.'
                    }, null, 3));
                }
            });
    });
});

app.put('/remove-device-from-mailbox', function (req, res) {
    var mailbox_id = req.body.params.mailbox_id;
    var token = req.body.params.token;

    Mailbox.update(
        {
            mailbox_id: mailbox_id
        },
        {
            $pull: {
                "devices": token
            }
        },
        {
            safe: true,
            upsert: true
        },
        function (err, model)
        {
            if (err)
            {
                console.log(err);
            }
            else
            {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    status_code: 201,
                    message: 'You successfully unsubscribed to notifications for this mailbox.'
                }, null, 3));
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


app.get('/is-mailbox-registered/:mailbox_id', function (req, res)
{
    var mailbox_id = req.params.mailbox_id;

    res.setHeader('Content-Type', 'application/json');

    Mailbox.findOne({mailbox_id: mailbox_id}, function (err, mailbox)
    {
        console.log(mailbox);
        if (mailbox === null)
        {
            res.end(JSON.stringify({status_code: 404}, null, 3));
        }
        else
        {
            res.end(JSON.stringify({status_code: 200}, null, 3));
        }
    });
});

app.post('/register-mailbox', function (req, res)
{

    var mailboxInfo = {
        mailbox_id: req.body.mailbox_id,
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
    mailbox.save(function (err)
    {
        if (err)
        {
            console.log(err);
        }
        else
        {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({status_code: 200, mailbox: mailbox}, null, 3));
        }
    })
});


app.listen(7654, function ()
{
    console.log("Magic @ port 7654!");
});
