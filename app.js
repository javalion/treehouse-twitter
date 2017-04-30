
const express = require("express");
const Twit = require("twit");
const pug = require("pug");
const config = require("./config.js");
const app = express();
const twit = new Twit(config);




function getUserTweets() {
    var promise = new Promise(function(resolve, reject) {
    twit.get("https://api.twitter.com/1.1/statuses/user_timeline.json?trim_user=1&count=5&exclude_replies=true&tweet_mode=extended",
            function (err, data) {
            var result = [];
            if (err) {
                console.log(err.message);
                reject();
            } else {
                for (var i = 0; i < data.length && i < 5; i++) {
                    result.push(data[i]);
                }
                resolve({tweets: result});
            }
    });
   });
    return promise;
}

function getUserFriends() {
    var promise = new Promise(function(resolve, reject) {
    var userFriends = [];
    twit.get("https://api.twitter.com/1.1/friends/list.json?cursor=-1&screen_name=javalion&skip_status=true&include_user_entities=false", function (err, data, res) {
        if (err) {
            console.log(err.message);
            reject();
        } else {
        for (var i = 0; i < data.users.length && i < 5; i++) {
            userFriends.push(data.users[i]);
        }
         resolve({friends: userFriends});
        }
    });
    });
    return promise;
}

function getPrivateMessages() {
    var promise = new Promise(function(resolve, reject){
    var privateMessages = [];
    twit.get("https://api.twitter.com/1.1/direct_messages.json?count=5&full_text=true&include_entities=false&skip_status=true&tweet_mode=extended", function (err, data, res) {
        if (err) {
            console.log(err.message);
            reject();
        }
        for (var i = 0; i < data.length && i < 5; i++) {
            privateMessages.push(data[i]);
        }
        resolve({dm: privateMessages});
    });
    });
    return promise;
}

function getScreenName() {
    var promise = new Promise(function(resolve, reject){
        twit.get("https://api.twitter.com/1.1/account/settings.json", function (err, data, res) {
            if (err) {
                console.log(err.message);
                reject();
            }
            resolve({screen_name: data.screen_name});
        });
    });
    return promise;
}

function getUserInfo(screen_name) {
    var promise = new Promise(function(resolve, reject){
        twit.get("https://api.twitter.com/1.1/users/show.json?screen_name=" + screen_name, function (err, data, res) {
            if (err) {
                console.log(err.message);
                reject();
            }
            resolve({user_basic: data});
        });
    });
    return promise;
}


function getDetailedDataPromiseAry(screenName) {
    var promises = [];
    promises.push(getUserTweets());
    promises.push(getUserFriends());
    promises.push(getPrivateMessages());
    promises.push(getUserInfo(screenName));
    return promises;
}

// Compile Template
const compiledTemplate = pug.compileFile('views/template.pug');

// Setup Static Files
app.use(express.static('public'));

// Main Entry into Site
app.get("/", function (req, res) {
    var collectedData = {};
    // First Stage - Get the Data that Includes Screen Name
    var promiseOne = getScreenName();
    promiseOne.then(function(promiseOneData) {
        collectedData.screenName = promiseOneData.screen_name;
        // Second Stage - Get the Remaining Data
        var promiseTwo = getDetailedDataPromiseAry(collectedData.screenName);
        Promise.all(promiseTwo).then(function(promiseTwoData){
            res.send(compiledTemplate({data: promiseTwoData}));
        }).catch(reason => {console.log(reason);});
    });

});

app.listen(3000);