/**
 * WebhookController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var evernoteService = require('../services/EvernoteService');
var yoService = require('../services/YoService');

module.exports = {
	incoming: function(req, res){

//GET /incoming?userId=44167596&guid=f5439cde-abc1-4ec9-a54c-3232fde41213&notebookGuid=2d8f8772-2be4-49ee-ba81-c1203be8eed7&reason=create

        const userId = req.query.userId;
        const noteGuid = req.query.guid;

        res.send('ok');

        sails.models.user.findOne({uid : userId}).then(function (user) {
            if (!user)
                return ;

            evernoteService.checkNoteForEverything(user.token, user.shard, noteGuid).then((result)=>{
                if (result){
                    console.log(result);    
                    yoService.sendYoToMe("Update: " + JSON.stringify(result));
                }
            });
        });



    }
};

