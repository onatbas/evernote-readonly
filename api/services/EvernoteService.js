'use strict';

var Evernote = require('evernote');

var readonlyTagName = 'readonly';
var unlockTagName = 'unlock';

var guidRegex = '.{8}-(.{4}-){3}.{12}';
var headerSearch = '<div><b>Original Note: </b>' + guidRegex + '</div><div><br/></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">Please do not modify anything above the line </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">below as this header is a crucial part of the </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">reversion process. Once you\'re done with </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">editing the note, please add &quot;relock&quot; tag </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">to this note. After a while this note will </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">be deleted and the original note will be </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">modified.</font></i></div><div><hr/></div>';

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


function getNoteResultSpecObject() {
    var obj = {
        includeContent: true,
        includeResourcesData: true,
        includeResourcesRecognition: true
      //  includeResourcesAlternateData: true,
      //  includeSharedNotes: true,
      //  includeNoteAppDataValues: true,
      //  includeResourceAppDataValues: true
      //  includeAccountLimits: true
    };

    return obj;
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


function findTagByName(token, shard, name)
{
  var noteStore = getNoteStore(token, shard);
    return new Promise(function (resolve, reject) {
        noteStore.listTags().then(function (tags) {
            for (var tag in tags) {
                if (tags[tag].name === name) {
                    resolve(tags[tag]);
                    return;
                }
            }
            noteStore.createTag({ name: name }).then((newtag) => {
                resolve(newtag);
            });
        });
    });
}

function getNoteContents(token, shard, guid) {
    return new Promise((resolve, reject) => {
        var resultSpec = getNoteResultSpecObject();
        var noteStore = getNoteStore(token, shard);
        noteStore.getNoteWithResultSpec(guid, resultSpec).then((result) => {
            console.log(result);
            resolve(result);
        }, (err)=>reject(err));
    });
}

function getReadOnlyTag(token, shard) {
    return findTagByName(token, shard, readonlyTagName);
}


function getUnlockTag(token, shard) {
    return findTagByName(token, shard, unlockTagName);
}

function getNotesByTag(token, shard, tagGuid) {
    return new Promise(function (resolve, reject) {
        var noteFilter = {
            tagGuids: [tagGuid]
        };

        var resultSpec = {
            includeTagGuids: true,
            includeAttributes: true,
            includeTitle: true,

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
            updateCalls.push(new Promise(function (innerResolve, innerReject) {
                noteStore.updateNote(updateObject).then((note) => innerResolve(note));

                setTimeout(function () {
                    innerResolve('Promise timed out after 5000 ms');
                }, 5000);
            }));
        }

        Promise.all(updateCalls).then(function (result) {
            resolve(result);
        });
    });
}

function makeTaggedNotesReadOnly(token, shard) {
    return new Promise(function (resolve, reject) {
        getReadOnlyTag(token, shard).then((tag) => {
            getNotesByTag(token, shard, tag.guid).then(function (notes) {

                notes = notes.notes;


                var updateObjects = [];
                for (var index in notes) {
                    var note = notes[index];
                    var update = makeReadOnlyUpdateObject(note, tag.guid);
                    updateObjects.push(update);
                }

                updateNotes(token, shard, updateObjects).then(function (result) {
                    resolve(result);
                });
            });
        });
    });
}

function makeUnlockedDuplicates(token, shard)
{
    return new Promise((resolve, reject)=>{
        getUnlockTag(token, shard).then((tag)=>{
            getNotesByTag(token, shard, tag.guid).then((notes)=>{
                notes = notes.notes;


                for (var index in notes) {
                    var note = notes[index];
                    getNoteContents(token, shard, note.guid).then((contents)=>{
                        console.log(contents);
                    }, (err)=>{
                        console.log(err);
                    });
                }

            });
        });
    });
}

function makeMigrationAndDeleteUnlocked(token, shard)
{

}

module.exports = {
    makeReadOnlyUpdateObject: makeReadOnlyUpdateObject,
    getReadOnlyTag: getReadOnlyTag,
    getNotesByTag: getNotesByTag,
    updateNotes: updateNotes,
    makeTaggedNotesReadOnly: makeTaggedNotesReadOnly,
    makeUnlockedDuplicates: makeUnlockedDuplicates
};