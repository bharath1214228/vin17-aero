/*
 * Recommendation engine helper scripts
 */
/*jslint browser: true, devel: true */

/*
 * Create dummy function if console is missing
 */
if (!window.console) {window.console = {}; }
if (!window.console.log) {window.console.log = function () { }; }
if (!window.console.error) {window.console.error = function () { }; }
if (!window.console.debug) {window.console.debug = function () { }; }

function removeURLParameter(url, parameter) {
    //prefer to use l.search if you have a location/link object
    var urlparts = url.split('?');
    if (urlparts.length >= 2) {

        var prefix = encodeURIComponent(parameter) + '=';
        var pars = urlparts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (var i = pars.length; i-- > 0;) {
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }
        if (pars.length > 0) {
            url = urlparts[0] + '?' + pars.join('&');
        } else {
            url = urlparts[0];
        }
        return url;
    } else {
        return url;
    }
}

function removeQueryParameter(query, parameter) {
    //prefer to use l.search if you have a location/link object
    if (query && query.charAt(0)==='?') {
        query = query.substring(1);
        var prefix = encodeURIComponent(parameter) + '=';
        var pars = query.split(/[&;]/g);
        //reverse iteration as may be destructive
        for (var i = pars.length; i-- > 0;) {
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }
        if (pars.length > 0) {
            query = '?' + pars.join('&');
        } else {
            query = '';
        }
        return query;
    } else {
        return query;
    }
}

/**
 * Register a page view with the recommendation engine
 * @param contentId
 * @param targetUrl
 * @param descr
 * @param type
 */
function registerRecommendationView(contentId, targetUrl, descr, type) {
    var strippedUrl = removeURLParameter(targetUrl, "termin"); //register only landing pages.
    var args = {
        //userId:jsessionid,
        itemId: contentId,       // itemId is kurskod
        itemUrl: strippedUrl,
        itemDescription: descr,
        itemType: type,           // type is KURS or PROG
        actionCallback: "easyrecLog"
    };
    easyrec_view(args);
}

/**
 * Callback from "registerRecommendationView"
 * @param response
 */
function easyrecLog(response) {
    //console.debug("easyrecLog", JSON.stringify(response, null, 4));
}


/**
 * Request rendering of "other users also viewed"
 * @param itemId
 * @param itemType
 */
function requestOtherUsersAlsoViewedRendering(itemId, itemType) {
    var args = {
        itemId: itemId,
        drawingCallback: "renderOtherUsersAlsoViewed",
        //drawingCallback: "drawRecommendationList",
        itemType: itemType,
        requestedItemType: itemType,
        //basedOnActionType: itemType,
        numberOfResults: 3,
        timeRange: "MONTH"
    };
    easyrec_otherUsersAlsoViewed(args);
}

/**
 * Render "other users also viewed"
 * @param json
 */
function renderOtherUsersAlsoViewed(json) {

    var otherUsersAlsoViewedHeader = $("#otherUsersAlsoViewedHeader"),
        metalang = document.documentElement.lang,
        recommendationHTML = "",
        x,
        i,
        query = location.search;
    query = removeQueryParameter(query, "termin");
    query = encodeURIComponent(query);

    otherUsersAlsoViewedHeader.hide();

    if (json.error) {
        console.error('Error fetching recommendation links', json.error);
        return;
    }

    var items = json.recommendeditems && json.recommendeditems.item;

    if (items == null) {
        console.log('No recommendations found');
        return;
    }

    try {
        if (items.length == null) { // !Array.isArray(items)
            items = [items];
        }
        if (items.length > 0) {
            for (x = 0; x < items.length; x++) {
                // Descriptions are formatted as "sv<Swedish description>||en<English description>"
                var langSplit = items[x].description.split("||");

                for (i = 0; i < langSplit.length; i++) {
                    var desc = langSplit[i];
                    var lang = desc.substr(0, 2);
                    if (metalang === lang) {
                        recommendationHTML += "<span>" +
                            "<i class='fa fa-caret-right' aria-hidden='true'></i>" +
                            "<a class='utbDocumentLink' href='" + items[x].url + (query || "") + "'>" +
                            // Descriptions are HTML escaped twice, so we need to replace "&amp;" with "&" (hackish test..)
                            // Slight improvement: replacing only &amp;s that are followed by a letter, instead of just replaceAll("&amp;", "&")
                            // (A lonely &amp; was probably only escaped once)
                            desc.substr(2, desc.length - 2).replace(/&amp;(?=\w)/g, "&") +
                            "</a></span>";
                    }
                }
            }
            $("#otherUsersAlsoViewed").html(recommendationHTML);
            otherUsersAlsoViewedHeader.show();
        }
    } catch (e) {
        console.error('Error rendering recommendation links', e);
    }
}


/**
 * Request rendering of "most viewed items"
 * @param itemType
 */
function requestMostViewedItemsRendering(itemType) {
    var args = {
        //drawingCallback: "drawRecommendationList",
        drawingCallback: "renderMostViewedItems",
        itemType: itemType,
        requestedItemType: itemType,
        numberOfResults: 3,
        timeRange: "MONTH"
    };
    easyrec_mostViewedItems(args);
}


/**
 * Render "most viewed items"
 * @param json
 */
function renderMostViewedItems(json) {

    /*
     TODO: Update or remove this function!
     This function should probably also be updated to handle double-escaped HTML, as renderOtherUsersAlsoViewed above.
     Or should it just be removed? requestMostViewedItemsRendering seems to be unused...
     */

    var otherUsersAlsoViewedHeader = $("#otherUsersAlsoViewedHeader"),
        recommendationHTML = "<ul class='utbildningsKategoriLista'>",
        x,
        query = location.search;
    query = removeQueryParameter(query, "termin");
    query = encodeURIComponent(query);

    otherUsersAlsoViewedHeader.hide();

    if ("undefined" === typeof(json.error)) { // if no error show recommendations

        try {
            var items = json.recommendeditems.item;
            /* if the object is already in array format, this block will not execute */
            if ("undefined" === typeof(items.length)) {
                items = new Array(items);
            }
            if (items.length > 0) {
                for (x = 0; x < items.length; x++) {
                    //send actions of a known item
                    recommendationHTML += "<li><a href='" + items[x].url + (query || "") + "'><span style='font-weight: normal;'>" +
                        items[x].description + "</span></a></li>";
                }
                recommendationHTML += "</ul>";
                $("#mostViewedItems").html(recommendationHTML);
                otherUsersAlsoViewedHeader.show();
            }
        } catch (e) {
            return;
        }

    }
}
