/**
 * PostController
 *
 * @description :: Server-side logic for managing posts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Evernote = require('evernote');
var evernoteService = require('../services/EvernoteService');

module.exports = {
    notebooks: function (req, res) {

        const token = req.user.token;
        const shard = req.user.shard;
        evernoteService.makeTaggedNotesReadOnly(token, shard).then((result) => res.send(result));
    }
};

