var sails = require('sails');
var evernoteService = require('../api/services/EvernoteService');

module.exports = {
    beginTasks: function () {
        var schedule = require('node-schedule');
        var j = schedule.scheduleJob('0 * * * * *', function () {

            sails.models.user.find().then(function(allUsers){
                var allUpdates = [];
                for (var index in allUsers)
                {
                    allUpdates.push(evernoteService.makeTaggedNotesReadOnly(allUsers[index].token, allUsers[index].shard));
                }

                Promise.all(allUpdates).then((result) => {
                    console.log(result);
                });
            });
        });
    }
}