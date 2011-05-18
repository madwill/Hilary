/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/*
 * Dependencies
 *
 * /dev/lib/misc/trimpath.template.js (TrimpathTemplates)
 * /dev/lib/jquery/plugins/jquery.threedots.js (ThreeDots)
 */

require(["jquery", "sakai/sakai.api.core"], function($, sakai) {

    /**
     * @name sakai_global.creategroups
     *
     * @class creategroups
     *
     * @description
     * The 'creategroups' widget shows the most recent creategroups item, 
     * including its latest comment and one related creategroups item
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.creategroups = function(tuid, showSettings) {


        /////////////////////////////
        // Configuration variables //
        /////////////////////////////

        // DOM identifiers
        var rootel = $("#" + tuid);
        var fileuploadContainer = "#fileupload_container";
        var creategroupsItemTemplate = "#creategroups_item_template";
        var creategroupsItem = ".creategroups_item";

        ///////////////////////
        // Utility functions //
        ///////////////////////

        /**
         * Parses an individual JSON search result to be displayed in creategroups.html
         * 
         * @param {Object} result - individual result object from JSON data feed
         * @return {Object} object containing item.name, item.path, item.type (mimetype)
         *   and item.type_img_url (URL for mimetype icon) for the given result
         */
        var parseDataResult = function(result) {
            // initialize parsed item with default values
            var item = {
                name: result["sakai:pooled-content-file-name"],
                path: "/p/" + result["jcr:name"],
                type: sakai.api.i18n.General.getValueForKey(sakai.config.MimeTypes.other.description),
                type_img_url: sakai.config.MimeTypes.other.URL,
                size: "",
                _mimeType: sakai.api.Content.getMimeType(result),
                "_mimeType/page1-small": result["_mimeType/page1-small"],
                "jcr:name": result["jcr:name"]
            };
            var mimetypeData = sakai.api.Content.getMimeTypeData(result);
            // set the mimetype and corresponding image
            if(item._mimeType) {
                // we have a recognized file type - set the description and img URL
                item.type = sakai.api.i18n.General.getValueForKey(sakai.config.MimeTypes[item._mimeType].description);
                item.type_img_url = sakai.config.MimeTypes[item._mimeType].URL;
            }

            // set file name without the extension
            // be aware that links don't have an extension
            var lastDotIndex = result["sakai:pooled-content-file-name"].lastIndexOf(".");
            if(lastDotIndex !== -1) {
                if (item["_mimeType"] !== "x-sakai/link") {
                    // extension found
                    item.name = result["sakai:pooled-content-file-name"].slice(0, lastDotIndex);
                }
            }
            item.name = sakai.api.Util.applyThreeDots(item.name, $(".mycreatecontent_widget .s3d-widget-createcontent").width() - 80, {max_rows: 1,whole_word: false}, "s3d-bold");

            // set the file size
            if(result.hasOwnProperty("_length") && result["_length"]) {
                item.size = "(" + sakai.api.Util.convertToHumanReadableFileSize(result["_length"]) + ")";
            }

            return item;
        };



        /**
         * This AJAX callback function handles the search result data returned from
         * /var/search/pool/me/manager.json.  If the call was successful, up to 5 of
         * the most recently created files are presented to the user.
         * @param {Object} success - indicates the status of the AJAX call
         * @param {Object} data - JSON data from /var/search/pool/me/manager.json
         * @return None
         */
        var handlecreategroupsData = function(success, data) {
            if(success && data.entry && data.entry.length > 0) {
                getGroupInfo(data);
            }
        };

        /*
         * Bind Events
         */
        var addBinding = function (){
            $(".creategroups_button", rootel).die("click");
            $(".creategroups_button", rootel).live("click", function(ev){
                $(window).trigger("sakai.overlays.createGroup"); 
            });
        };

        /**
         * This function will replace all
         * @param {String} term The search term that needs to be converted.
         */
        var prepSearchTermForURL = function(term) {
            // Filter out http:// as it causes the search feed to break
            term = term.replace(/http:\/\//ig, "");
            // taken this from search_main until a backend service can get related content
            var urlterm = "";
            var split = $.trim(term).split(/\s/);
            if (split.length > 1) {
                for (var i = 0; i < split.length; i++) {
                    if (split[i]) {
                        urlterm += split[i] + " ";
                        if (i < split.length - 1) {
                            urlterm += "OR ";
                        }
                    }
                }
            }
            else {
                urlterm = "*" + term + "*";
            }
            return urlterm;
        };

        /**
         * Retrieve the manager render it.
         */
        var getMembers = function (newjson){
            sakai.api.Groups.getMembers(newjson.entry[0].groupid, "", function(success, memberList){
                if (success && memberList.Manager.results[0]) {
                    newjson.entry[0].manager = memberList.Manager.results[0];
                    var item = {
                        member: {
                            memberId: memberList.Manager.results[0].userid,
                            memberName: sakai.api.User.getDisplayName(memberList.Manager.results[0])
                        },
                        group: newjson.entry[0]
                    };
                    $("#creategroups_item_member_container").html(sakai.api.Util.TemplateRenderer("#creategroups_item_member_template", item));
                }
            });
        };

        /**
         * Fetches the related content
         */
        var getGroupInfo = function(newjson){
            $(creategroupsItem, rootel).html(sakai.api.Util.TemplateRenderer(creategroupsItemTemplate,newjson));

            // get related content for group
            var params = {
                "userid" : newjson.entry[0].groupid,
                "page" : 0,
                "items" : 1,
                "sortOn" :"_lastModified",
                "sortOrder":"desc"
            };
            var url = sakai.config.URL.POOLED_CONTENT_SPECIFIC_USER;
            $.ajax({
                url: url,
                data: params,
                success: function(latestContent){
                    if(latestContent.results.length > 0){
                        newjson.entry[0].latestContent = parseDataResult(latestContent.results[0]);
                        // get latest content author and render latest content template
                        sakai.api.User.getUser(latestContent.results[0]["sakai:pool-content-created-for"],function(success, data){
                            var item = {
                                author: {
                                    authorId: data.userid,
                                    authorName: sakai.api.User.getDisplayName(data)
                                },
                                content: latestContent.results[0],
                                group: newjson.entry[0],
                                sakai: sakai
                            };
                            $("#creategroups_latest_content_container").html(sakai.api.Util.TemplateRenderer("#creategroups_latest_content_template",item));
                        });
                    }
                }
            });

            // get member information and render member template
            getMembers(newjson);
        };

        /////////////////////////////
        // Initialization function //
        /////////////////////////////

        /**
         * Initiates fetching creategroups data to be displayed in the My creategroups widget
         * @return None
         */
        var init = function() {
            addBinding();
            var data = sakai.api.Groups.getMemberships(sakai.data.me.groups);
            handlecreategroupsData(true, data);
        };

        // run init() function when sakai.creategroups object loads
        init();
    };

    sakai.api.Widgets.widgetLoader.informOnLoad("creategroups");
});
