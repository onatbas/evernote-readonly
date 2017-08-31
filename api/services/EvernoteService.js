'use strict';

var Evernote = require('evernote');
var sails = require('sails');
var StringOperations = require('./StringOperations');

var readonlyTagName = 'readonly';
var unlockTagName = 'unlock';
var makeMigrationTagName = 'makemigration';

var yoService = require("./YoService");

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
    return createNoteStore(token, shard);
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
    return new Promise(function (resolve, reject) {
        var noteStore = getNoteStore(token, shard);
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
        var noteFilter = {
            tagGuids: [tagGuid]
        };

        var resultSpec = {
            includeTagGuids: true,
            includeAttributes: true,
            includeTitle: true
        };

        var noteStore = getNoteStore(token, shard);
        return noteStore.findNotesMetadata(noteFilter, 0, 10, resultSpec); // notes
}

function getNoteByGuid(token, shard, guid){
 var resultSpec = {
            includeTagGuids: true,
            includeAttributes: true,
            includeTitle: true
        };

        var noteStore = getNoteStore(token, shard);
        return noteStore.getNoteWithResultSpec(guid, resultSpec); // notes
}

function makeNoteReadOnly(token, shard, tagGuid, note){
        var noteStore = getNoteStore(token, shard);
    var update = makeReadOnlyUpdateObject(note, tagGuid);
    return noteStore.updateNote(update);
}

function makeNotesReadOnly(token, shard, tagGuid, notes) {
    return new Promise(function (resolve, reject) {
        var noteStore = getNoteStore(token, shard);

        var updateCalls = [];
        for (var index in notes) {
            var note = notes[index];
            updateCalls.push(new Promise(function (innerResolve, innerReject) {
                makeNoteReadOnly(token, shard, tagGuid, note).then((updatedNote) => innerResolve(updatedNote));

                setTimeout(function () {
                    innerResolve('Promise timed out after 5s');
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
                makeNotesReadOnly(token, shard, tag.guid, notes.notes).then(function (result) {
                    resolve(result);
                });
            });
        });
    });
}

async function getGuidFromTags(token, shard, list) {
    var noteStore = getNoteStore(token, shard);

    const original_text = "original_";
        var alltags = await noteStore.listTags();
        var filtered = alltags
        .filter((tag)=>{return list.indexOf(tag.guid) >= 0;})
        .filter((tag)=>{return tag.name.indexOf(original_text) >= 0;});

        if (filtered.length > 0) {
            return {
                noteGuid: filtered[0].name.replace(original_text, ''),
                tagGuid: filtered[0].guid,
                tag: filtered[0]
            };
        }else{
            return '';
        }

}

async function getTargetGuidIfApplicable(token, shard, note){

    var migrator = await sails.models.post.findOne({from: note.guid});
    if (migrator){
        return migrator.to;
    }else{
        return ""
    }

    //var noteContents = await getNoteContents(token, shard, note.guid);
    //try{
    //    return await getGuidFromTags(token, shard, note.tagGuids);
    //}catch(e){ 
    //    return ''; 
    //}
}

function cleanMigrator(from)
{
    return sails.models.post.destroy({from: from});
}


async function migrateIfApplicableAndDelete(token, shard, note) {
    var guid = await getTargetGuidIfApplicable(token, shard, note);
    if (guid === "")
        return "";
    
    var noteStore = getNoteStore(token, shard);
    var noteContents = await getNoteContents(token, shard, note.guid);

    var updateNoteObject = {
        title: note.title,
        guid: guid,
        content: noteContents.content,
        resources: noteContents.resources
    };

    for (var index in updateNoteObject.resources)
        updateNoteObject.resources[index].noteGuid = guid;

    var clean = await cleanMigrator(note.guid);

    var deletion = noteStore.deleteNote(note.guid);
    var update = noteStore.updateNote(updateNoteObject);
    var waitFor = [await update, await results];

    return "ok";
}

async function createUnlockedNote(token, shard, originalNote, originalContent){
        var note = {
            title: originalNote.title,
            content: originalContent.content,
            resources: originalContent.resources
        }

        for (var index in note.resources) {
            note.resources[index].noteGuid = null;
        }
        var noteStore = getNoteStore(token, shard);
       // findTagByName(token, shard, 'original_' + originalNote.guid).then((newtag) => {
       //     note.tagGuids = [newtag.guid];

       // });

	
       var result = null;
	try{
		var note = await noteStore.createNote(note);
		var migrator = await sails.models.post.create({
			from: note.guid,
			to: originalNote.guid
		});
		result = note;
	}catch(e){			
        console.log(e);
	}

	return result;
}

async function unlockNote(token, shard, note, tagGuid){
    var contents = await getNoteContents(token, shard, note.guid);

    var unlockedNote = createUnlockedNote(token, shard, note, contents);
    var updatedNote = deleteTagFromNoteAndUpdate(token, shard, note, tagGuid);

    return [await unlockedNote, await updatedNote];
}

function findAndMakeAllUnlockedDuplicates(token, shard)
{
    return new Promise((resolve, reject)=>{
        getUnlockTag(token, shard).then((tag)=>{
            getNotesByTag(token, shard, tag.guid).then((notes)=>{
                notes = notes.notes;

                var allUpdates = [];

                for (var index in notes) {
                    allUpdates.push(unlockNote(token, shard, notes[index], tag.guid));
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



function checkUsersEverything(user){

        Promise.all([
            makeTaggedNotesReadOnly(user.token, user.shard),
            findAndMakeAllUnlockedDuplicates(user.token, user.shard),
            makeMigrationAndDeleteUnlocked(user.token, user.shard)
        ]).then(
            (result) => console.log('*** Checking user - ' + user.uid + ' ***'),
            (error) => console.log(error)
        );
}

function checkAllUsersReadOnlyTags() {
    sails.models.user.find().then(function (allUsers) {
        var allUpdates = [];
        for (var index in allUsers) {
            allUpdates.push(makeTaggedNotesReadOnly(allUsers[index].token, allUsers[index].shard));
        }

        Promise.all(allUpdates).then((result) => {
            console.log('*** checkAllUsersReadOnlyTags ***');
            console.log(result);
            console.log('**********');
        }, (err)=>console.log(err));
    });
}

function checkAllUsersUnlockTags() {
    sails.models.user.find().then(function (allUsers) {
        var allUpdates = [];
        for (var index in allUsers) {
            allUpdates.push(findAndMakeAllUnlockedDuplicates(allUsers[index].token, allUsers[index].shard));
        }

        Promise.all(allUpdates).then((result) => {
            console.log('*** checkAllUsersUnlockTags ***');
            console.log(result);
            console.log('**********');

        }, (err)=>console.log(err));
    });
}

function checkAllUsersRelockedTags() {
    sails.models.user.find().then(function (allUsers) {
        var allUpdates = [];
        for (var index in allUsers) {
            allUpdates.push(makeMigrationAndDeleteUnlocked(allUsers[index].token, allUsers[index].shard));
        }

        Promise.all(allUpdates).then((result) => {
            console.log('*** checkAllUsersRelockedTags ***');
            console.log(result);
            console.log('**********');

        }, (err)=>console.log(err));
    });
}

async function checkTagsForInterestedTags(token, shard, tags, interestedOnes){
    var noteStore = getNoteStore(token, shard);
    var allTags;
    try{
        allTags = await noteStore.listTags();
    }catch(e){
        if (e.errorCode == 19){
            console.log("Rate limit.. Wait for retry: " + e.rateLimitDuration );
        }
        return e;
    };

    var filteredTags = allTags
    .filter((tag)=>{return tag != null;})
    .filter((tag)=>{return interestedOnes.indexOf(tag.name) >= 0;})
    .filter((tag)=>{return (tags || []).indexOf(tag.guid) >= 0;});

    var obj = {};

    for (var tag in filteredTags){
        obj[filteredTags[tag].name] = filteredTags[tag].guid;
    }

    return obj;
}

async function checkNoteForEverything(token, shard, noteGuid) {
try{
        //Get tags of note. 
        var noteStore = getNoteStore(token, shard);
        var note;
        try {
        note = await getNoteByGuid(token, shard, noteGuid);
        }catch(e){
            console.log(e);
            throw e;
        }

        var tagMatches = await checkTagsForInterestedTags(token, shard, note.tagGuids, 
        [readonlyTagName, unlockTagName, makeMigrationTagName]
        );

        var actions = 0;
        if (tagMatches[readonlyTagName]){
            actions++;
            await makeNoteReadOnly(token, shard, tagMatches[readonlyTagName], note);
        }if(tagMatches[unlockTagName]){
            actions++;
            await unlockNote(token, shard, note, tagMatches[unlockTagName]);
        }if(tagMatches[makeMigrationTagName]){
            actions++;
            await migrateIfApplicableAndDelete(token, shard, note);
        }
        
        var result = tagMatches;
        result.title = note.title;
        return actions > 0 ? result : null;

}catch(e){
    if (e.errorCode == 19){
        e.hello = "Yes this is the same!";

        //Double the time and add half an hour.
        var duration = e.rateLimitDuration * 1000 * 2 + 1800000; 

        console.log("Rate limit happening.." + duration);
        yoService.sendYoToMe("Rate limit.. Waiting for " + duration / 1000);
        setTimeout(()=>{
            yoService.sendYoToMe("Retrying now.." + duration / 1000);
            checkNoteForEverything(token, shard, noteGuid);
        }, duration);
    }
}

//    });
}

module.exports = {
    checkNoteForEverything: checkNoteForEverything,
    makeReadOnlyUpdateObject: makeReadOnlyUpdateObject,
    getReadOnlyTag: getReadOnlyTag,
    getNotesByTag: getNotesByTag,
    makeNotesReadOnly: makeNotesReadOnly,
    makeTaggedNotesReadOnly: makeTaggedNotesReadOnly,
    makeMigrationAndDeleteUnlocked: makeMigrationAndDeleteUnlocked,
    checkAllUsersRelockedTags: checkAllUsersRelockedTags,
    checkAllUsersUnlockTags: checkAllUsersUnlockTags,
    checkAllUsersReadOnlyTags: checkAllUsersReadOnlyTags,
    checkUsersEverything: checkUsersEverything
};
