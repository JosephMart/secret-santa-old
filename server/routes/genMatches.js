const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');


router.post('/', function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    const users = req.body;

    if (users.length < 2) {
        res.send(JSON.stringify({
            status: "failure",
            msg: "You need at least 2 users",
        }));
        return;
    }

    // Sort users by how many noMatch they have
    users.sort((a, b) => {
        if (a.noMatch.length > b.noMatch.length)
            return -1;
        if (a.noMatch.length < b.noMatch.length)
            return 1;
        return 0;
    });

    // Queue containing only ids
    const idQ = new Queue();
    const ids = [];

    // Add the current user id to noMatch
    users.forEach(u => {
         u.noMatch.push(u.id);
         ids.push(u.id);
    });

    // Randomize and add to the q
    shuffle(ids).forEach(idQ.enqueue);

    let cycled = false;
    let user, matchID, found, seen;
    // Generate the matches
    for (let i = 0; i < users.length; i++) {
        user = users[i];
        found = false;
        seen = false;
        cycled = false;
        do {
            matchID = idQ.dequeue();

            if (matchID === user.id) {
                if (seen) {
                    cycled = true;
                }
                seen = true;
            }

            if (user.noMatch.includes(matchID)) {
                idQ.enqueue(matchID);
            } else {
                found = true;
                user.matchID = matchID;
            }
        } while (!cycled && !found);

        if (cycled) {
            res.send(JSON.stringify({
                status: "failure",
                msg: `Cycled without finding a match for ${user.name}. The current configuration does not seem possible`,
            }));
            return;
        }
    }

    // Construct and send the emails
    const invalidEmails = [];
    const emails = [];
    let matchedUser;
    for (let i = 0; i < users.length; i++) {
        user = users[i];
        matchedUser = users.find(u => u.id === user.matchID);
        if (!validateEmail(user.email)) {
            invalidEmails.push(user.email);
        }
        emails.push({
            santa: {
                name: user.name,
                email: user.email,
            },
            matched: {
                name: matchedUser.name,
                email: matchedUser.email,
            }
        })
    }
    if (invalidEmails.length > 0) {
        res.send(JSON.stringify({
            status: "failure",
            msg: `Invalid emails: ${invalidEmails.toString()}`,
        }));
        return;
    }

    if (process.env.env === "PROD")
        sendEmails(emails);
    res.send(JSON.stringify({
        status: "success",
        msg: "Successfully sent the emails!"
    }));
});

// Fisher-Yates (aka Knuth) Shuffle
function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
function sendEmails(emails) {
    const transporter = nodemailer.createTransport({
        pool: true,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true, // use TLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PWD
        }
    });
    transporter.verify(function(error, success) {
        if (error) {
            console.log(error);
        } else {
            console.log('Server is ready to take our messages');
        }
    });

    emails.forEach(({santa, matched}) => {
        transporter.sendMail({
            ...generateEmail(santa.name, matched.name),
            subject: 'Secret Santa Assignment!',
            from: 'SecretSanta@r0s.io', // listed in rfc822 message header
            to: santa.email, // listed in rfc822 message header
            envelope: {
                to: `${santa.name} <${santa.email}>`,
                from: 'SecretSanta <SecretSanta@r0s.io>', // used as MAIL FROM: address for SMTP
            }
        }, sendMailCB);
    });
}

function generateEmail(santa, matched) {
    const text = `Howdy ${santa}!
    
    You have been matched with ${matched}!
    `;
    return {
        text, html: text,
    }
}

function sendMailCB(error, info) {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
}

// https://stackoverflow.com/a/46181/7249729
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/*
A function to represent a queue

Created by Kate Morley - http://code.iamkate.com/ - and released under the terms
of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/

/* Creates a new queue. A queue is a first-in-first-out (FIFO) data structure -
 * items are added to the end of the queue and removed from the front.
 */
function Queue() {

    // initialise the queue and offset
    let queue = [];
    let offset = 0;

    // Returns the length of the queue.
    this.getLength = function () {
        return (queue.length - offset);
    };

    // Returns true if the queue is empty, and false otherwise.
    this.isEmpty = function () {
        return (queue.length == 0);
    };

    /* Enqueues the specified item. The parameter is:
     *
     * item - the item to enqueue
     */
    this.enqueue = function (item) {
        queue.push(item);
    };

    /* Dequeues an item and returns it. If the queue is empty, the value
     * 'undefined' is returned.
     */
    this.dequeue = function () {

        // if the queue is empty, return immediately
        if (queue.length == 0) return undefined;

        // store the item at the front of the queue
        let item = queue[offset];

        // increment the offset and remove the free space if necessary
        if (++offset * 2 >= queue.length) {
            queue = queue.slice(offset);
            offset = 0;
        }

        // return the dequeued item
        return item;

    };

    /* Returns the item at the front of the queue (without dequeuing it). If the
     * queue is empty then undefined is returned.
     */
    this.peek = function () {
        return (queue.length > 0 ? queue[offset] : undefined);
    }
}


module.exports = router;
