/**
 * PostController
 *
 * @description :: Server-side logic for managing posts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Evernote = require('evernote');


module.exports = {
    notebooks: function (req, res) {
        // oauthAccessToken is the token you need;
        var authenticatedClient = new Evernote.Client({
            token: req.user.token,
            sandbox: false,
            china: false,
            shard: req.user.shard
        });
        var noteStore = authenticatedClient.getNoteStore();
        noteStore.listTags().then(function(tags){
       //     res.send(tags);
       var readonly = null;
        for (tag in tags){
            if(tags[tag].name === 'readonly'){
                readonly = tags[tag];
                break;
            }
        }

        res.send(readonly);

        });
    }
};

