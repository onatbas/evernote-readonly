var sails = require('sails');
var evernoteService = require('../api/services/EvernoteService');


var checkAllUsersReadOnlyTags = function () {
    sails.models.user.find().then(function (allUsers) {
        var allUpdates = [];
        for (var index in allUsers) {
            allUpdates.push(evernoteService.makeTaggedNotesReadOnly(allUsers[index].token, allUsers[index].shard));
        }

        Promise.all(allUpdates).then((result) => {
            console.log('*** checkAllUsersReadOnlyTags ***');
            console.log(result);
            console.log('**********');
        });
    });
}

var checkAllUsersUnlockTags = function () {
    sails.models.user.find().then(function (allUsers) {
        var allUpdates = [];
        for (var index in allUsers) {
            allUpdates.push(evernoteService.makeUnlockedDuplicates(allUsers[index].token, allUsers[index].shard));
        }

        Promise.all(allUpdates).then((result) => {
            console.log('*** checkAllUsersUnlockTags ***');
            console.log(result);
            console.log('**********');

        });
    });
}

var checkAllUsersRelockedTags = function () {
    sails.models.user.find().then(function (allUsers) {
        var allUpdates = [];
        for (var index in allUsers) {
            allUpdates.push(evernoteService.makeMigrationAndDeleteUnlocked(allUsers[index].token, allUsers[index].shard));
        }

        Promise.all(allUpdates).then((result) => {
            console.log('*** checkAllUsersRelockedTags ***');
            console.log(result);
            console.log('**********');

        });
    });
}


module.exports = {
    beginTasks: function () {
        var schedule = require('node-schedule');
        var j = schedule.scheduleJob('0 * * * * *', function () {
            checkAllUsersReadOnlyTags();
            checkAllUsersUnlockTags();
            checkAllUsersRelockedTags();
            console.log('********** END OF ROUND ***********');

        });
    }
}