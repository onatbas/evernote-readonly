'use strict';

var Evernote = require('evernote');
var StringOperations = require('./StringOperations');

var readonlyTagName = 'readonly';
var unlockTagName = 'unlock';
var makeMigrationTagName = 'makemigration';


var noteStores = {};
function createNoteStore(token, shard) {
    var authenticatedClient = new Evernote.Client({
        token: token,
        sandbox: false,
        china: false,
        shard: shard
    });

    noteStores[token] = authenticatedClient.getNoteStore();
    return noteStores[token];
}

function getNoteStore(token, shard) {
    return noteStores[token] || createNoteStore(token, shard);
}


function getReadOnlyNoteAttributesObject(attributes) {
    attributes.contentClass = 'com.onatbas.readonly';
    return attributes;
}


function getNoteResultSpecObject() {
    var obj = {
        includeContent: true,
        includeResourcesData: true,
        includeResourcesRecognition: true,
        includeResourcesAlternateData: true
      //  includeSharedNotes: true,
      //  includeNoteAppDataValues: true,
      //  includeResourceAppDataValues: true
      //  includeAccountLimits: true
    };

    return obj;
}

function deleteTagFromList(tagGuids, toBeRemovedGuid)
{
    var list = [];

    for (var index in tagGuids) {
        var tagGuid = tagGuids[index];
        if (tagGuid !== toBeRemovedGuid) 
            list.push(tagGuid);
    }

    return list;
}


function deleteTagFromNoteAndUpdate(token, shard, note, toBeRemovedGuid)
{
        note.tagGuids = deleteTagFromList(note.tagGuids, toBeRemovedGuid);
        var noteFilter = getNoteStore(token, shard);
        return noteFilter.updateNote(note); // promise
}

function makeReadOnlyUpdateObject(note, readonlyTagGuid) {
    var result = {
        guid: note.guid,
        title: note.title,
        attributes: getReadOnlyNoteAttributesObject(note.attributes),
        tagGuids: []
    };

    result.tagGuids = deleteTagFromList(note.tagGuids, readonlyTagGuid);

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

function getMigrationTag(token, shard) {
    return findTagByName(token, shard, makeMigrationTagName);
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

function migrateIfApplicableAndDelete(token, shard, note)
{
    return new Promise((resolve, reject)=>{
        var noteStore = getNoteStore(token, shard);
        getNoteContents(token, shard, note.guid).then((noteContents)=>{

            var originalGuid = StringOperations.getGuidFromHeader(noteContents.content);

            var updateNoteObject = {
                title: note.title,
                guid: originalGuid,
                content: StringOperations.removeHeaderFromText(noteContents.content),
                resources: noteContents.resources
            };

            for (var index in updateNoteObject.resources)
                updateNoteObject.resources[index].noteGuid = originalGuid;

            noteStore.updateNote(updateNoteObject).then((updatedObject)=>{
                noteStore.deleteNote(note.guid).then((ok)=>resolve(ok), (err)=>reject(err));
            });
        });
    });

}

function createUnlockedNote(token, shard, originalNote, originalContent){
    var note = {
        title: originalNote.title,
        content: StringOperations.appendToContent(originalContent.content, originalNote.guid),
        resources: originalContent.resources
    }

    for (var index in note.resources) {
        note.resources[index].noteGuid = null;
    }

    var noteStore = getNoteStore(token, shard);
    return noteStore.createNote(note); // promise.
}

function makeUnlockedDuplicates(token, shard)
{
    return new Promise((resolve, reject)=>{
        getUnlockTag(token, shard).then((tag)=>{
            getNotesByTag(token, shard, tag.guid).then((notes)=>{
                notes = notes.notes;

                var allUpdates = [];

                for (var index in notes) {
                    var note = notes[index];
                    getNoteContents(token, shard, note.guid).then((contents)=>{

                        allUpdates.push(createUnlockedNote(token, shard, note, contents));
                        allUpdates.push(deleteTagFromNoteAndUpdate(token, shard, note, tag.guid));

                    }, (err)=>{
                        reject(err);
                    });
                }

                Promise.all(allUpdates).then(() => resolve(notes.length), (err)=>reject(err));

            });
        });
    });
}

function makeMigrationAndDeleteUnlocked(token, shard)
{
    return new Promise((resolve, reject)=>{
        getMigrationTag(token, shard).then((tag)=>{
            getNotesByTag(token, shard, tag.guid).then((notes)=>{
                notes = notes.notes;
                var allUpdates = [];

                for (var index in notes) {
                    var note = notes[index];
                    allUpdates.push(migrateIfApplicableAndDelete(token, shard, note));
                }

                Promise.all(allUpdates).then((ok)=>resolve(ok), (err)=>reject(err));
            });
        });
    });
}

module.exports = {
    makeReadOnlyUpdateObject: makeReadOnlyUpdateObject,
    getReadOnlyTag: getReadOnlyTag,
    getNotesByTag: getNotesByTag,
    updateNotes: updateNotes,
    makeTaggedNotesReadOnly: makeTaggedNotesReadOnly,
    makeUnlockedDuplicates: makeUnlockedDuplicates,
    makeMigrationAndDeleteUnlocked: makeMigrationAndDeleteUnlocked
};