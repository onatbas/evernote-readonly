'use strict';

var Evernote = require('evernote');

var readonlyTagName = 'readonly';


function getNoteStore(token, shard) {
    var authenticatedClient = new Evernote.Client({
        token: token,
        sandbox: false,
        china: false,
        shard: shard
    });

    return authenticatedClient.getNoteStore();
}


function getReadOnlyNoteAttributesObject(attributes) {
        attributes.contentClass = 'com.onatbas.readonly';
        return attributes;
}


function makeReadOnlyUpdateObject(note, readonlyTagGuid) {
    var result = {
        guid: note.guid,
        title: note.title,
        attributes: getReadOnlyNoteAttributesObject(note.attributes),
        tagGuids: []
    };

    for (var index in note.tagGuids) {
        var tagGuid = note.tagGuids[index];
        if (tagGuid !== readonlyTagGuid) {
            result.tagGuids.push(tagGuid);
        }
    }

    return result;
}


function getReadOnlyTag(token, shard) {
    var noteStore = getNoteStore(token, shard);
    return new Promise(function (resolve, reject) {
        noteStore.listTags().then(function (tags) {
            for (var tag in tags) {
                if (tags[tag].name === readonlyTagName) {
                    resolve(tags[tag]);
                    return;
                }
            }
            noteStore.createTag({ name: readonlyTagName }).then((newtag) => {
                resolve(newtag);
            });
        });
    });
}

function getNotesByTag(token, shard, tagGuid) {
    return new Promise(function (resolve, reject) {
        var noteFilter = {
            tagGuids: [tagGuid]
        };

        var resultSpec = {
            includeTagGuids: true,
            includeAttributes: true,
            includeTitle: true
        };

        var noteStore = getNoteStore(token, shard);
        noteStore.findNotesMetadata(noteFilter, 0, 10, resultSpec).then((notes) => resolve(notes));

    });
}

function updateNotes(token, shard, updateObjects) {
    return new Promise(function (resolve, reject) {
        var noteStore = getNoteStore(token, shard);

        var updateCalls = [];
        for (var index in updateObjects) {
            var updateObject = updateObjects[index];
            updateCalls.push(new Promise(function(innerResolve, innerReject){
                noteStore.updateNote(updateObject).then((note)=>innerResolve(note)); 
            }));
        }

        Promise.all(updateCalls).then(function(result){
            resolve(result);
        });
    });
}

function makeTaggedNotesReadOnly(token, shard){
    return new Promise(function(resolve, reject){
        getReadOnlyTag(token, shard).then((tag) => {
            getNotesByTag(token, shard, tag.guid).then(function(notes){
               
                notes = notes.notes;


                var updateObjects = [];
                for (var index in notes)
                {
                    var note = notes[index];
                    var update = makeReadOnlyUpdateObject(note, tag.guid);
                    updateObjects.push(update);
                }
                
                updateNotes(token, shard, updateObjects).then(function(result){
                    resolve(result);
                } );
            });
        });
    });
}

module.exports = {
    makeReadOnlyUpdateObject, makeReadOnlyUpdateObject,
    getReadOnlyTag: getReadOnlyTag,
    getNotesByTag: getNotesByTag,
    updateNotes: updateNotes,
    makeTaggedNotesReadOnly: makeTaggedNotesReadOnly
};