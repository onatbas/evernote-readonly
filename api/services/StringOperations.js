'use strict';


var guidRegex = '.{8}-(.{4}-){3}.{12}';
var originalNoteText = '<b>Original Note:</b>';
var headerSearch = '<div>' + originalNoteText + guidRegex + '</div><div><br/></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">Please do not modify anything above the line </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">below as this header is a crucial part of the </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">reversion process. Once you\'re done with </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">editing the note, please add &quot;makemigration&quot; tag </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">to this note. After a while this note will </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">be deleted and the original note will be </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">modified.</font></i></div><div><hr/></div>';

var headerMatcher = /<en-note[\s\S]+?<hr ?\/><\/div>/g;

function appendToContent(originalContent, guidToAppend)
{
    var headerText = headerSearch.replace(guidRegex, guidToAppend);
    var modifiedContent = originalContent.replace('<en-note>', '<en-note>' + headerText);
    return modifiedContent;
}

function getHeaderString(replacedText){
    var replaced = headerSearch.replace(guidRegex, replacedText);
    return replaced;
}

function getGuidFromHeader(text){
    var match1 = text.match(originalNoteText + guidRegex) || [];
    if(match1.length < 1)
        return '';

    var match2 = match1[0].match(guidRegex) || [];
    if (match2.length < 1)
        return '';

    return match2[0];
}

function removeHeaderFromText(text){
    var replaced = text.replace(headerMatcher, '<en-note>');
    return replaced;
}

module.exports = {
    appendToContent: appendToContent,
    getHeaderString: getHeaderString,
    getGuidFromHeader: getGuidFromHeader,
    removeHeaderFromText: removeHeaderFromText
}