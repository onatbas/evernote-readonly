'use strict';


var guidRegex = '.{8}-(.{4}-){3}.{12}';
var headerSearch = '<div><b>Original Note: </b>' + guidRegex + '</div><div><br/></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">Please do not modify anything above the line </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">below as this header is a crucial part of the </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">reversion process. Once you\'re done with </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">editing the note, please add &quot;relock&quot; tag </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">to this note. After a while this note will </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">be deleted and the original note will be </font></i></div><div><i><font style=\"font-size: 10px;\" color=\"#a9a9a9\">modified.</font></i></div><div><hr/></div>';


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
    var match1 = text.match(headerSearch);
    if(match1.length < 1)
        return '';

    var match2 = match1[0].match(guidRegex);
    if (match2.length < 1)
        return '';

    return match2[0];
}



module.exports = {
    appendToContent: appendToContent,
    getHeaderString: getHeaderString,
    getGuidFromHeader: getGuidFromHeader
}