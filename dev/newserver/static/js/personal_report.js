/// <reference path="d3.d.ts" />
/// <reference path="jquery.d.ts" />
/// <reference path="jqueryui.d.ts" />

var VMail;
(function (VMail) {
    //Presentation Layout module
    (function (App) {
        // ********** CONSTANTS **********
        var FRICTION = 0.5;
        var LINKDISTANCE = 50;
        var NTOPCONTACTS = 15;

        //number of nodes to precompute graph for
        var NNODES_PRECOMPUTE = (App.type=="multi"? 100:300);//400;
        //default network viz parameters
        var NNODES_DEFAULT = (App.type=="multi"? 50:150);//200;
//        var CHARGE_DEFAULT = -300;
        var CHARGE_DEFAULT = (App.type=="multi"? -Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 0.5 * 1.1:-Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 0.15 * 1.1);
        
        App.team_id = null;
        App.studyDone = new Array();
        App.studyDone_morality = new Array();
        App.studyDone_demographic = new Array();
        App.initAutocomplete_done = 0;
        App.personality = {};
        // App.personality = new Array(5);
        // App.personality['Open-Mindedness'] = new Array(); App.personality['Conscientiousness'] = new Array();
        // App.personality['Extraversion'] = new Array(); App.personality['Agreeableness'] = new Array();
        // App.personality['Negative Emotionality'] = new Array();
        App.morality = {};
        // App.morality = new Array();
        // App.morality['Fairness'] = new Array(); App.morality['Harm'] = new Array();
        // App.morality['Loyalty'] = new Array(); App.morality['Authority'] = new Array();
        // App.morality['Purity'] = new Array();
        App.demographic = new Array();
        App.demographic['gender'] = new Array(); App.demographic['yob'] = new Array(); App.demographic['nationality'] = new Array();
        App.demographic['degree'] = new Array(); App.demographic['major_college'] = new Array(); App.demographic['major_graduate'] = new Array();
        App.demographic['ethnicity'] = new Array(); App.demographic['position'] = new Array();
        App.demographic['office'] = new Array(); App.demographic['neighbors'] = new Array(); App.demographic['languages'] = new Array();
        App.color_personality = -1;
        App.panel_shown = 0;
        App.personal_shown = 0;
        App.member_selected = 0; //0 for all, 1 for shared contacts, 3 for members only
        App.rightPanel = 0; //0 for members, 1 for stats, 2 for shortest paths
        App.init_time = 0;
        App.init_times = new Array();
        App.idSwitch_before = new Array();
        App.idSwitch_after = new Array();
        App.domainToid = {};
        App.verisonTowaitTime = new Array();
        App.charge_default = new Array(3);

        App.org_domains = {};
        App.the_orgs = {};

        App.components = null;
        App.org_components = null;
        App.density = null;
        App.org_density = null;

        App.removed = [];
        App.people_we_lost = []; App.org_we_lost = [];
        App.orgs = [];
        App.not_orgs = ["gmail.com", "hotmail", "yahoo", "googlegroups.com", "googlemail.com", "noreply@google.com", "docs.google.com", "amazon.com", "linkedin.com", "github.com", "facebookmail.com", "163.com", "uber.com", "msn.com", "aol.com", "ets.org", "qq.com", "windowslive.com", "yahoogroups.com", "ebay.com", "time4education.com", "comcast.net", "outlook.com"];
        App.not_aliases = ["group.facebook.com", "docs.google.com", "github.com", "facebookmail.com", "noreply", "googlegroups.com", "googlemail.com", "webex.com", "yahoogroups.com", "comcast.net", "dropbox.com", "doodle.com", "buzz+"];
        App.node_as_org = 0;
        App.hideMembers = 0;
        App.centerNodeView = 0;

        App.fixedNNodes = 30;
        App.selectedTwoNodes = [];
        App.shortestPaths = [];
        App.memberNodesPosition = [];
        App.memberThresForFixedPosition = 20;

        App.egvct_centrality = null;
        App.egvct_centrality_old = null;
        App.org_egvct_centrality = null;
        App.org_egvct_centrality_old = null;
        App.betweenness_centrality = null;
        App.induced_betweenness_centrality = {};
        App.induced_betweenness_centrality_old = null;
        App.personal_stats = -1;

        App.thresholdForText = 9;
        App.thresholdForOrgText = 8;
        App.colorMethod = 1; //1 for color by people, 2 for color by community detection result

        App.G = [];
        App.ave_degree = [];
        App.density = [];
        App.ave_SPL = [];
        App.num_cliques = [];
        App.ave_btw_centrality = [];
        App.timeline = []
        App.mergeTime = [];
        var flag_timeline = 0;

        //***********************************
        var fict_names = ['Tony Stark', 'Lex Luthor', 'Will Hunting', 'Howard Wolowitz'];
        var fict_name = fict_names[Math.floor(Math.random() * fict_names.length)];
        var fict_email = fict_name.split(" ")[0].toLowerCase() + "@fict.mit.edu";

        //In-memory database object holding all the contacts and emails,
        // visible to outside for debuging purposes (e.g. testing in browser console)
        App.db = null;
        App.userinfo = null;
        App.usersinfo = null;
        App.type = null;
        App.version = null;
        App.demo = null;
        App.versions = new Array();
        App.setupDBdone = new Array();
        App.working = null;
        App.waittime = null;
        App.aliases = null;

        // ****** CURRENT STATE OF PRESENTATION LAYER *********
        App.viz = null;
        App.graph = null;

        var viz = null, org_viz = null;

        App.isWithinRange = true;
        App.isContactDetails = false;
        App.isUserStats = true;
        App.wasUserStats = true;

        var color = function(i){
//            var colors = ["#E61616", "#E65917", "#E6B517", "#E1E616", "#95E616", "#25E617", "#16DCE6", "#1692E6", "#1721E6", "#6817E6"];
            if(App.userinfo.email == "data.immersion@gmail.com" || App.userinfo.email == "data.immersion.2016@gmail.com"){
                var colors = ["#D82020", "#D83A20", "#D85B20", "#D88520", "#D8AD20", "#E1C320", "#D4D820", "#C2D820", "#90D820", "#5ED820", "#2CD820", "#26CB79", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"
                              ];
                if(App.type != "multi" || App.colorMethod == 2){
                    i = i%colors.length;
                    if(i%2 == 0) i = i/2;
                    else i = colors.length - 1 - (i - 1)/2;
                    return colors[i];
                }
                return colors[Math.round(i * (colors.length - 1) / (App.usersinfo.length - 1))];
            }
            else{
                var colors_2 = ["#D82020", "#D83A20", "#D85B20", "#D88520", "#D8AD20", "#E1C320", "#D4D820", "#C2D820", "#90D820", "#5ED820", "#2CD820", "#26CB79", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
                var colors = ["#D82020", "#D85B20", "#D8AD20", "#D4D820", "#90D820", "#2CD820", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
                if(App.type != "multi" || App.colorMethod == 2){
                    i = i%colors_2.length;
                    if(i%2 == 0) i = i/2;
                    else i = colors_2.length - 1 - (i - 1)/2;
                    return colors_2[i];
                }
                return colors[Math.round(i * (colors.length - 1) / (App.usersinfo.length - 1))];
            }
        };
//        var color = d3.scale.category10();
        var colorMember = function (i) {
            return "rgba(170,170,170,0)";
        };
        var colorPersonality = function (member, personality) {
            if(member && personality != -1){
                var colors = ["#D82020", "#D88520", "#D4D820", "#5ED820", "#20CFD8"];
                return colors[personality];
            }
            else{
                return "#000";
            }
        };

        var currentContact = undefined;
        var the_one_node = undefined;

        //current dates of the range
        var start = undefined;
        var end = undefined;

        //current number of nodes
        var nnodes = NNODES_DEFAULT;
        var nlinks = 1000000000;

        //*****************************************************
        var timedelta = function (seconds) {
            var minutes = seconds / 60;
            var hours = minutes / 60;
            var days = hours / 24;
            var months = days / 30.42;
            var years = days / 365;
            return {
                seconds: seconds,
                minutes: minutes,
                hours: hours,
                days: days,
                months: months,
                years: years
            };
        };

        // calcualtes the timespan between two dates
        var timespan = function (a, b) {
            if(typeof(a) == undefined || typeof(b) == undefined) return 0;
            return (a.getTime() - b.getTime()) / 1000;
        };

        var longAgo = function (a, b) {
            return timespanPretty(timespan(a, b));
        };

        // returns the timespan between the two dates in human-friendly format
        var timespanPretty = function (seconds) {
            var diff = timedelta(seconds);
            var result = "";
            var postfix = "";
            if (diff.seconds < 70) {
                result = diff.seconds.toFixed(1);
                postfix = "second";
            } else if (diff.minutes < 70) {
                result = diff.minutes.toFixed(1);
                postfix = "minute";
            } else if (diff.hours < 24) {
                result = diff.hours.toFixed(1);
                postfix = "hour";
            } else if (diff.days < 61) {
                result = diff.days.toFixed(1);
                postfix = "day";
            } else if (diff.months < 12) {
                result = diff.months.toFixed(1);
                postfix = "month";
            } else {
                result = diff.years.toFixed(1);
                postfix = "year";
            }
            if (parseFloat(result) > 1) {
                postfix += "s";
            }
            return result + " " + postfix;
        };

        // show a list of the topN contacts on the page using only information
        //(emails) between start and end date
        var showTopContacts = function (topN) {
            //update the UI state
            App.isContactDetails = false;
            App.isUserStats = false;
            App.wasUserStats = false;

            if(App.type != "multi" && App.type != "single"){ 
                if (!App.isWithinRange) {
                    $('#allTimesLink').addClass('selectedlink');
                    $('#thisYearLink').removeClass('selectedlink');
                } else {
                    $('#allTimesLink').removeClass('selectedlink');
                    $('#thisYearLink').addClass('selectedlink');
                }
                var container = d3.select("#rankings").select("#rankings-content");
            }
            else{ 
                if (!App.isWithinRange) {
                    $('#rankings_' + App.personal_stats + ' #allTimesLink').addClass('selectedlink');
                    $('#rankings_' + App.personal_stats + ' #thisYearLink').removeClass('selectedlink');
                } else {
                    $('#rankings_' + App.personal_stats + ' #allTimesLink').removeClass('selectedlink');
                    $('#rankings_' + App.personal_stats + ' #thisYearLink').addClass('selectedlink');
                }
                var container = d3.select("#rankings_" + App.personal_stats).select("#rankings-content");
            }
            container.html('');

            //retrieve topN contacts from the database
            if (!App.isWithinRange) {
                var topContacts = (App.db[0].getTopContacts(topN, undefined, undefined));
            } else {
                var topContacts = (App.db[0].getTopContacts(topN, start, end));
            }

            container = container.append("table").attr("class", "ranking");
            topContacts.forEach(function (value, i) {
                var contact = value.contact;
                var tr = container.append("tr").style("cursor", "pointer").on("mouseover", function () {
                    var nodes = App.graph.nodes.filter(function (node) {
                        return !node.skip && node.id === contact.id;
                    });
                    if (nodes.length === 0) {
                        return;
                    }
                    App.viz.mouseoverNode(nodes[0]);
                }).on("mouseout", function () {
                    var nodes = App.graph.nodes.filter(function (node) {
                        return !node.skip && node.id === contact.id;
                    });
                    if (nodes.length === 0) {
                        return;
                    }
                    App.viz.mouseoutNode(nodes[0]);
                }).on("click", function () {
                    var nodes = App.graph.nodes.filter(function (node) {
                        return !node.skip && node.id === contact.id;
                    });
                    if (nodes.length === 0) {
                        return;
                    }
                    App.viz.clickNode(nodes[0]);
                });

                //tr.append("td").style("background","#ccc").html(i+1);
                tr.append("td").attr("class", "num").html(i + 1);
                tr.append("td").html(contact.name);
            });

            //switch to ranking view
            if(App.type != "multi" && App.type != "single"){
                $("#user_stats").hide();
                $('#contactDetails').hide();
                $('#userinfopanel').fadeIn();
                $('#rankings').fadeIn();
            }
            else{
                $("#user_stats_" + App.personal_stats).hide();
                $('#rankings_' + App.personal_stats).fadeIn();
            }
        };


        // show details about a particular contact on the page using information
        // (emails) between start and end date
        var showContactDetails = function (node, contact, start, end) {
            currentContact = contact;
            the_one_node = node;
            App.isContactDetails = true;
            App.isUserStats = false;

            d3.select("#contactDetails-content").selectAll("*").remove();

            if (App.node_as_org == 0) { //nodes as contacts
                if (the_one_node.owns.length > 1) {
                    var connection_score_length = 0;
                    for(var ii = 0; ii < the_one_node.owns.length; ii++){
                        if(typeof(the_one_node.owns_before_ids[ii]) != "undefined") connection_score_length++;
                    }
                    var connection_score = new Array(connection_score_length);
                    for (var t = 0; t < connection_score.length; t++) {
                        var contactDetails = (App.db[the_one_node.owns[t]].getContactDetails(start, end));
                        var the_id = the_one_node.owns_before_ids[t];//console.log(contactDetails);
                        if (typeof (contactDetails[the_id]) == "undefined") {
                            var shouldnt = 1;
                            for (var i1 = 0; i1 < VMail.App.usersinfo.length; i1++) {
                                if (VMail.App.usersinfo[i1].name == the_one_node.attr.contact.name) {
                                    var contactDetails2 = (App.db[i1].getContactDetails(start, end));
                                    var the_id2 = the_one_node.id;
                                    connection_score[t] = {score: (contactDetails2[the_id2].nSentEmails + contactDetails2[the_id2].nRcvEmails), ind: t};
                                    shouldnt = 0;
                                    break;
                                }
                            }
                            if (shouldnt == 1)
                                console.log("nonono");
                        }
                        else if(typeof (the_id) == "undefined"){
                            console.log("error. t = "+t);
                        }
                        else{
                            connection_score[t] = {score: (contactDetails[the_id].nSentEmails + contactDetails[the_id].nRcvEmails), ind: t};
                        }
                    }
                    var comp = function (a, b) {
                        if (a.score !== b.score) {
                            return b.score - a.score;
                        }
                        return 0;
                    };
                    connection_score.sort(comp);

                    d3.range(connection_score.length).forEach(function (t) {
                        var tt = the_one_node.owns[connection_score[t].ind];
                        //                    if(the_one_node.owns.indexOf(the_one_node.owns[tt]) != -1){
                        ContactInfo(tt, t + 1, the_one_node);
                        //                    }
                    });
                }
                else {
                    d3.range(App.db.length).forEach(function (t) {
                        if (the_one_node.owns.indexOf(t) != -1) {
                            ContactInfo(t, 1, the_one_node);
                        }
                    });
                }
            }
            else {//for org nodes, owns is always the length of members, and owns[i] is the number of contacts belong to member i
                if(App.type == "multi"){
                    var connection_score = new Array(the_one_node.owns.length);
                    for (var t = 0; t < connection_score.length; t++) {
                        connection_score[t] = {score: the_one_node.owns[t], ind: t};
                    }
                    var comp = function (a, b) {
                        if (a.score !== b.score) {
                            return b.score - a.score;
                        }
                        return 0;
                    };
                    connection_score.sort(comp);
                    d3.range(connection_score.length).forEach(function (t) {
                        var num = the_one_node.owns[connection_score[t].ind];
    //                    if(the_one_node.owns.indexOf(the_one_node.owns[tt]) != -1){
                        if (num != 0)
                            OrgInfo(connection_score[t].ind, num, t + 1, the_one_node);
    //                    }
                    });
                }
                else{
                    OrgInfo(0, the_one_node.member_size, 1, the_one_node);
                }
            }

            function OrgInfo(t, count, rank, the_node) {
                var org = contact;
                var container = d3.select("#contactDetails-content");//.html('');
                var content = '';
                content += "<div>" + org.domain + "</div>";

                if (container.select(".person_name")[0][0] == null) {
                    var person_left = container.append("div").html(contact.name).attr("class", "person_name").attr("id", "person_name_left").attr('title', '').node();
                    $(person_left).tooltip({content: content});
                    if (App.type == "multi" || App.type == "single") {
                        container.append("br");
                        container.append("div").html('<b>' + org.member_size + ' people | ' + (org.email_rcv + org.email_sent) + ' emails</b>');
//                        container.append("div").html('<b>' + org.member_size + ' people</b>');
//                        container.append("div").html('<b>' + (org.email_rcv + org.email_sent) + ' emails</b>');
                        container.append("br");
                        
                        //retrieve a list of timestamps of emails exchanged with this particular contact
                        var getEmailDatesByOrg = function (org) {
                            var dates = [];
                            for(var k = 0; k < App.db.length; k++){
                                for (var i = App.db[k].start; i < App.db[k].end; i++) {
                                    var ev = App.db[k].emails[i];

                                    //var isSent = (ev.f == undefined);
                                    var isSent = !(ev.hasOwnProperty('source'));
                                    if (isSent) {
                                        for (var j = 0; j < ev.destinations.length; j++) {
                                            if (ev.destinations_org[j] === org.domain) {
                                                var weight = 1.0;
                                                dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                                            }
                                        }
                                    } else if (ev.source_org.toString() === org.domain) {
                                        var weight = 1.0;
                                        dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                                    }
                                }
                            }
                            return dates;
                        };
                        var timestamps = (getEmailDatesByOrg(org));

                        var a = +start;
                        var b = +end;
                        //settings for the histogram of interaction volume
                        var histSettings = {
                            width: 280,
                            height: 150,
                            start: start,
                            end: end,
                            interval: d3.time.month,
                            ylabel: '',
                            position: undefined,
                            dateformat: "%b \n \n %y",
                            nTicks: 5,
                            prediction: false
                        };
                        container.append("div").html("<b>Interaction volume</b>");
                        histSettings.position = container.append("div");
                        //plot a histogram with the interaction volume
                        VMail.Viz.plotTimeHistogram(timestamps, histSettings);
                        container.selectAll("svg").style("stroke", "white").style("fill", "white");
                        container.selectAll("line").attr("stroke", "white");
                        container.selectAll("path").style("stroke", "white");
                        
                        if(App.type == "multi") container.append("div").html('<b>Contacts contributed by </b>');
                        else if(App.type == "single") container.append("div").html('<b>Contacts in the organization </b>');
                    }
                }
                else {
//                    container.append("br"); container.append("br");
                }
                if (App.type == "multi" || App.type == "single") {
                    container.append("hr");
                }
                if (App.type == "multi") {
//                  container.append("div").html('<b><i>with ' + ((App.usersinfo)? App.usersinfo[t].name:App.userinfo.name) + '</i></b>');
                    var outer_container = container.append("div").attr("id", "container_" + rank);
                    outer_container.append("div").attr("id", "contact_" + rank)//.style("cursor", "pointer")
                        .style("line-height", "20px").style("padding-bottom", "4px")
                        .html('<b><i>' + rank + '. ' + ((App.usersinfo) ? App.usersinfo[t].name : App.userinfo.name) + '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp' + count + ' people</i></b>');
                    outer_container.on("click", function () {
//                            var rank = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length));
////                            if (d3.select(".contact_" + rank).style("display") == "none") {
//                            if (d3.select(".contact_rank_outer_" + rank).style("display") == "none") {
////                                container.selectAll(".contact_rank").style("display", "none");
////                                container.selectAll(".contact_" + rank).style("display", "block");
//                                outer_container.selectAll(".contact_rank_outer").style("display", "none");
//                                outer_container.selectAll(".contact_rank_outer_" + rank).style("display", "block");
//                            }
//                            else {
////                                container.selectAll(".contact_rank").style("display", "none");
////                                container.selectAll(".contact_" + rank).style("display", "none");
//                                outer_container.selectAll(".contact_rank_outer").style("display", "none");
//                                outer_container.selectAll(".contact_rank_outer_" + rank).style("display", "none");
//                            }
                        })
                        .on("mouseover", function () {
                            var rank = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length));
                            var the_id = outer_container.select(".contact_rank_outer_" + rank).attr("id");
                            var contatc_num = the_id.substring(the_id.indexOf("outer_") + 6, the_id.length);
//                            outer_container.selectAll(".contact_rank_outer").style("height", "100px");
                            if(contatc_num >= 15) outer_container.select(".contact_rank_outer_" + rank).style("height", "300px");
                            else if(contatc_num >= 5) outer_container.select(".contact_rank_outer_" + rank).style("height", (20 * contatc_num) + "px");
//                            outer_container.selectAll(".contact_rank_outer_" + rank).style("height", "300px");
//                            d3.range(VMail.App.usersinfo.length).forEach(function (ii) {
//                                outer_container.selectAll("#contact_" + (ii + 1)).style("background-color", "rgba(0,0,0,0)");
//                            });
//                            outer_container.select("#contact_" + rank).style("background-color", "rgb(200,200,200)");
                        })
                        .on("mouseout", function () {
                            var rank = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length));
                            var the_id = outer_container.select(".contact_rank_outer_" + rank).attr("id");
                            var contatc_num = the_id.substring(the_id.indexOf("outer_") + 6, the_id.length);
                            if(contatc_num < 5) outer_container.select(".contact_rank_outer_" + rank).style("height", (sortable.length * 20) + "px");
                            else outer_container.select(".contact_rank_outer_" + rank).style("height", "100px");
//                            outer_container.selectAll(".contact_rank_outer").style("height", "100px");
//                            d3.range(VMail.App.usersinfo.length).forEach(function (ii) {
//                                outer_container.selectAll("#contact_" + (ii + 1)).style("background-color", "rgba(0,0,0,0)");
//                            });
                        });
                    var comp = function (a, b) {
                        if (a[1] !== b[1]) {
                            return b[1] - a[1];
                        }
                        return 0;
                    };
                    var sortable = [];
                    for (var ind = 0; ind < the_node.owns_contacts[t].length; ind ++) {//[0]-is, [1]-centrality, [2]-name
//                        sortable.push([the_node.owns_contacts[t][ind].id, App.egvct_centrality[the_node.owns_contacts[t][ind].id], the_node.owns_contacts[t][ind].name]);
                        sortable.push([the_node.owns_contacts[t][ind].id, (App.db[t].contacts[the_node.owns_contacts[t][ind].id].rcv + App.db[t].contacts[the_node.owns_contacts[t][ind].id].sent), the_node.owns_contacts[t][ind].name]);
                    }
                    sortable.sort(comp);
                    var the_container = outer_container.append("div").attr("class", "contact_rank_outer contact_rank_outer_" + rank).attr("id", "contact_rank_outer_" + sortable.length);//.style("display", "none");
                    if(sortable.length < 5) the_container.style("height", (sortable.length * 20) + "px");
                    var index = 1;
                    var emails_all = 0;
                    for(var ind in sortable){
                        //var results = $.grep(App.graph.nodes, function (e) { return e.id == sortable[ind][0]; });
                        var contact_line = the_container.append("div").attr("class", "contact_rank").attr("class","contact_line contact_" + rank)
//                                .style("display", "none")
                                .attr("id","ind_" + sortable[ind][0]);
                        var results = $.grep(App.graph.nodes, function (e) { return e.owns_before_ids[e.owns.indexOf(t)] == sortable[ind][0]; });
                        contact_line.append("div").attr("class", sortable[ind][0]).attr("id", "contact_line_name").text(sortable[ind][2] + " " + (App.db[t].contacts[results[0].owns_before_ids[results[0].owns.indexOf(t)]].rcv + App.db[t].contacts[results[0].owns_before_ids[results[0].owns.indexOf(t)]].sent))
                            .on("mouseover", function(){ 
                                var ind = d3.select(this).attr("class");
                                d3.select(this).style("z-index", "999"); 
                                d3.select("#ind_" + ind).select("#contact_email").style("z-index", "998");
                            });
                        emails_all += (App.db[t].contacts[results[0].owns_before_ids[results[0].owns.indexOf(t)]].rcv + App.db[t].contacts[results[0].owns_before_ids[results[0].owns.indexOf(t)]].sent);
                        if(results.length > 0){
                            contact_line.append("a").attr("id", "contact_email_icon").attr("href", "mailto:" + results[0].attr.contact.aliases[0])
                                .append("img").attr("src", "/static/images/icon_mail.png").style("background", "#2f3140")
                                .on("mouseover", function(){ d3.select(this).style("opacity", 0.8); });
                            //aliases should match the organization
                            var email_to_show = results[0].attr.contact.aliases[0];
                            for(var hh = 0; hh < results[0].attr.contact.aliases.length; hh++){
                                if(results[0].attr.contact.aliases[hh].indexOf(the_node.domain) != -1){
                                    email_to_show = results[0].attr.contact.aliases[hh]; break;
                                }
                            }
                            contact_line.append("div").attr("class", sortable[ind][0]).attr("id", "contact_email").text(email_to_show)
                                .on("mouseover", function(){ 
                                    var ind = d3.select(this).attr("class");
                                    d3.select(this).style("z-index", "999");
                                    d3.select("#ind_" + ind).select("#contact_line_name").style("z-index", "998"); 
                                })
                                .on("mouseout", function(){ 
                                    var ind = d3.select(this).attr("class");
                                    d3.select(this).style("z-index", "998"); 
                                    d3.select("#ind_" + ind).select("#contact_line_name").style("z-index", "999"); 
                                });
                            
                            contact_line.on("mouseover", function(){ d3.select(this).select("a").style("opacity", 0.8); })
                                .on("mouseout", function(){ d3.select(this).select("a").style("opacity", 0); });
                        }
                        index++;
                    }
                }
                else if(App.type == "single"){
                    var outer_container = container.append("div").attr("id", "container_" + rank).style("height", "300px");

                    var comp = function (a, b) {
                        if (a[1] !== b[1]) {
                            return b[1] - a[1];
                        }
                        return 0;
                    };
                    var sortable = [];
                    for (var ind = 0; ind < the_node.nodes.length; ind ++) {//[0]-is, [1]-centrality, [2]-name
//                        sortable.push([the_node.owns_contacts[t][ind].id, App.egvct_centrality[the_node.owns_contacts[t][ind].id], the_node.owns_contacts[t][ind].name]);
                        sortable.push([the_node.nodes[ind].id, (App.db[t].contacts[the_node.nodes[ind].id].rcv + App.db[t].contacts[the_node.nodes[ind].id].sent), the_node.nodes[ind].attr.contact.name]);
                    }
                    sortable.sort(comp);
                    var the_container = outer_container.append("div").attr("class", "contact_rank_outer contact_rank_outer_" + rank).attr("id", "contact_rank_outer_" + sortable.length).style("height", "300px");
//                    if(sortable.length < 5) the_container.style("height", (sortable.length * 20) + "px");
                    var index = 1;
                    var emails_all = 0;
                    for(var ind in sortable){
                        //var results = $.grep(App.graph.nodes, function (e) { return e.id == sortable[ind][0]; });
                        var contact_line = the_container.append("div").attr("class", "contact_rank").attr("class","contact_line contact_" + rank)
//                                .style("display", "none")
                                .attr("id","ind_" + sortable[ind][0]);
                        var results = $.grep(App.graph.nodes, function (e) { return e.id == sortable[ind][0]; });
                        contact_line.append("div").attr("class", sortable[ind][0]).attr("id", "contact_line_name").text(sortable[ind][2] + " " + (App.db[t].contacts[results[0].owns_before_ids[results[0].owns.indexOf(t)]].rcv + App.db[t].contacts[results[0].owns_before_ids[results[0].owns.indexOf(t)]].sent))
                            .on("mouseover", function(){ 
                                var ind = d3.select(this).attr("class");
                                d3.select(this).style("z-index", "999"); 
                                d3.select("#ind_" + ind).select("#contact_email").style("z-index", "998");
                            });
                        emails_all += (App.db[t].contacts[results[0].owns_before_ids[results[0].owns.indexOf(t)]].rcv + App.db[t].contacts[results[0].owns_before_ids[results[0].owns.indexOf(t)]].sent);
                        if(results.length > 0){
                            contact_line.append("a").attr("id", "contact_email_icon").attr("href", "mailto:" + results[0].attr.contact.aliases[0])
                                .append("img").attr("src", "/static/images/icon_mail.png").style("background", "#2f3140")
                                .on("mouseover", function(){ d3.select(this).style("opacity", 0.8); });
                            //aliases should match the organization
                            var email_to_show = results[0].attr.contact.aliases[0];
                            for(var hh = 0; hh < results[0].attr.contact.aliases.length; hh++){
                                if(results[0].attr.contact.aliases[hh].indexOf(the_node.domain) != -1){
                                    email_to_show = results[0].attr.contact.aliases[hh]; break;
                                }
                            }
                            contact_line.append("div").attr("class", sortable[ind][0]).attr("id", "contact_email").text(email_to_show)
                                .on("mouseover", function(){ 
                                    var ind = d3.select(this).attr("class");
                                    d3.select(this).style("z-index", "999");
                                    d3.select("#ind_" + ind).select("#contact_line_name").style("z-index", "998"); 
                                })
                                .on("mouseout", function(){ 
                                    var ind = d3.select(this).attr("class");
                                    d3.select(this).style("z-index", "998"); 
                                    d3.select("#ind_" + ind).select("#contact_line_name").style("z-index", "999"); 
                                });
                            
                            contact_line.on("mouseover", function(){ d3.select(this).select("a").style("opacity", 0.8); })
                                .on("mouseout", function(){ d3.select(this).select("a").style("opacity", 0); });
                        }
                        index++;
                    }
                }
                $('#user_stats').hide();
                $('#rankings').hide();
                if (App.type == "multi" || App.type == "single") {
                    d3.selectAll(".userinfopanel").style("display", "none");
                    d3.select("#members").style("display", "none");
                    d3.select("#stats").style("display", "none");
                    d3.select("#paths").style("display", "none");
                    d3.selectAll(".for_paths").style("display", "none");
                    $('#contactDetails').fadeIn();
                }
                else {
                    $('#userinfopanel').hide();
                    d3.select("#members").style("display", "none");
                    d3.select("#stats").style("display", "none");
                    d3.select("#paths").style("display", "none");
                    $('#contactDetails').fadeIn();//commented below
                }
            }

            //retrieve the details object from the database
            function ContactInfo(t, rank, the_node) {console.time('contactDetails');
                var contactDetails = (App.db[t].getContactDetails(start, end));console.timeEnd('contactDetails');
                var container = d3.select("#contactDetails-content");//.html('');
                var content = '';
                contact.aliases.forEach(function (alias) {
                    content += "<div>" + alias + "</div>";
                });
                var the_id = node.owns_before_ids[node.owns.indexOf(t)];//contact.id;
                var the_id_before = node.owns_before_ids[node.owns.indexOf(t)];
                if (container.select(".person_name")[0][0] == null) {
                    var person_left = container.append("div").html(contact.name).attr("class", "person_name").attr("id", "person_name_left").attr('title', '').node();
                    $(person_left).tooltip({content: content});
                    if (App.type == "multi") {
                        //hist for the selected contact
                        //retrieve a list of timestamps of emails exchanged with this particular contact
                        var connection_score_length = 0;
                        for(var ii = 0; ii < the_node.owns.length; ii++){
                            if(typeof(the_node.owns_before_ids[ii]) != "undefined") connection_score_length++;
                        }
                        var timestamps = new Array(connection_score_length);
                        for (var i1 = 0; i1 < connection_score_length; i1++) {
                            timestamps[i1] = (App.db[the_node.owns[i1]].getEmailDatesByContactMulti(node.owns_before_ids[node.owns.indexOf(the_node.owns[i1])]));
                        }
                        var a = +start;
                        var b = +end;
                        //settings for the histogram of interaction volume
                        var histSettings = {
                            width: 280,
                            height: 150,
                            start: start,
                            end: end,
                            interval: d3.time.month,
                            ylabel: '',
                            position: undefined,
                            dateformat: "%b \n \n %y",
                            nTicks: 5,
                            prediction: false
                        };
                        var ranking = 1, value = App.egvct_centrality[the_node.id], ending = "th";
                        for(var ind in App.egvct_centrality){
                            if(App.egvct_centrality[ind] > value) ranking++;
                        }
                        var the_end = ranking % 10;
                        switch(the_end){
                            case 1: ending = "st"; break;
                            case 2: ending = "nd"; break;
                            case 3: ending = "rd"; break;
                            default: ending = "th"; 
                        }
                        container.append("br");
                        container.append("div").html('<b>Centrality: </b>' + ranking + ending  + " among " + App.graph.nodes.length + " contacts");
                        container.append("br");
                        container.append("div").html("<b>Interaction volume</b>");
                        histSettings.position = container.append("div");
                        VMail.Viz.plotAccumuTimeHistogram(timestamps, histSettings);
                        container.selectAll("svg").style("stroke", "white").style("fill", "white");
                        container.selectAll("line").attr("stroke", "white");
                        container.selectAll("path").style("stroke", "white");
                        
                        container.append("div").html('<b>Connection Ranking: </b>');

                    }
                }
                else {
//                    container.append("br"); container.append("br");
                }
                if (App.type == "multi") {
                    container.append("hr");
                }

                if (App.type == "multi") {
//                  container.append("div").html('<b><i>with ' + ((App.usersinfo)? App.usersinfo[t].name:App.userinfo.name) + '</i></b>');
                    container.append("div").attr("id", "contact_" + rank).style("cursor", "pointer")
                            .html('<b><i>' + rank + '. ' + ((App.usersinfo) ? App.usersinfo[t].name : App.userinfo.name) + '</i></b>')
                            .on("click", function () {
                                var rank = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length));
                                if (d3.select(".contact_" + rank).style("display") == "none") {
                                    container.selectAll(".contact_rank").style("display", "none");
                                    container.selectAll(".contact_" + rank).style("display", "block");
                                }
                                else {
                                    container.selectAll(".contact_rank").style("display", "none");
                                    container.selectAll(".contact_" + rank).style("display", "none");
                                }
                            })
                            .on("mouseover", function () {
                                var rank = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length));
                                d3.range(VMail.App.usersinfo.length).forEach(function (ii) {
                                    container.selectAll("#contact_" + (ii + 1)).style("background-color", "rgba(0,0,0,0)");
                                });
                                container.select("#contact_" + rank).style("background-color", "rgb(200,200,200)");
                            })
                            .on("mouseout", function () {
                                d3.range(VMail.App.usersinfo.length).forEach(function (ii) {
                                    container.selectAll("#contact_" + (ii + 1)).style("background-color", "rgba(0,0,0,0)");
                                });
                            });
                    container.append("div").attr("id", "for_select_" + rank).attr("class", "contact_rank").style("display", "none").attr("class", "contact_" + rank).html('<b>First email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id_before].firstEmail)) + " ago").attr("id", "firstemail");
//                    container.append("hr").attr("class", "contact_rank").attr("class", "contact_" + rank).style("display", "none");
//                    container.append("br").attr("class", "contact_rank").attr("class", "contact_" + rank).style("display", "none");
                    container.append("div").attr("class", "contact_rank").attr("class", "contact_" + rank).style("display", "none").html('<b>Last email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id_before].lastEmail)) + " ago");

                    var details = contactDetails[the_id];//console.log(the_id+","+the_id_before);console.log(contactDetails);console.log(contactDetails[the_id]);console.log(contactDetails[the_id_before]);
                    if (details === undefined) {
                        return;
                    }
//                    container.append("br").attr("class", "contact_rank").attr("class", "contact_" + rank);
                    container.append("div").attr("class", "contact_rank").attr("class", "contact_" + rank).html("<b>Sent (private):</b>  " + numParser(details.nSentEmails) + "  (" + numParser(details.nSentEmailsPvt) + ")");
//                    container.append("br").attr("class", "contact_rank").attr("class", "contact_" + rank);
                    container.append("div").attr("class", "contact_rank").attr("class", "contact_" + rank).html("<b>Received (private):</b>  " + numParser(details.nRcvEmails) + "  (" + numParser(details.nRcvEmailsPvt) + ")");
//                    container.append("br").attr("class", "contact_rank").attr("class", "contact_" + rank);

                    //retrieve a list of timestamps of emails exchanged with this particular contact
                    var timestamps = (App.db[t].getEmailDatesByContactMulti(node.owns_before_ids[node.owns.indexOf(t)]));

                    var a = +start;
                    var b = +end;

                    //settings for the histogram of interaction volume
                    var histSettings = {
                        width: 280,
                        height: 150,
                        start: start,
                        end: end,
                        interval: d3.time.month,
                        ylabel: '',
                        position: undefined,
                        dateformat: "%b \n \n %y",
                        nTicks: 5,
                        prediction: false
                    };

                    container.append("div").attr("class", "contact_rank").attr("class", "contact_" + rank).html("<b>Interaction volume</b>");
                    histSettings.position = container.append("div").attr("class", "contact_rank").attr("class", "contact_" + rank);
                    container.selectAll(".contact_" + rank).style("display", "none");
                }
                else {
//                    container.append("div").html('<b><i>with ' + ((App.usersinfo)? App.usersinfo[t].name:App.userinfo.name) + '</i></b>');
                    container.append("div").html('<b>First email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id_before].firstEmail)) + " ago").attr("id", "firstemail");
                    container.append("hr");
                    container.append("div").html('<b>Last email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id_before].lastEmail)) + " ago");

                    var details = contactDetails[the_id];
                    if (details === undefined) {
                        return;
                    }
                    container.append("hr");
                    container.append("div").html("<b>Sent (private):</b>  " + numParser(details.nSentEmails) + "  (" + numParser(details.nSentEmailsPvt) + ")");
                    container.append("hr");
                    container.append("div").html("<b>Received (private):</b>  " + numParser(details.nRcvEmails) + "  (" + numParser(details.nRcvEmailsPvt) + ")");
                    container.append("hr");

                    //retrieve a list of timestamps of emails exchanged with this particular contact
                    var timestamps = (App.db[t].getEmailDatesByContact(contact));

                    var a = +start;
                    var b = +end;

                    //settings for the histogram of interaction volume
                    var histSettings = {
                        width: 280,
                        height: 150,
                        start: start,
                        end: end,
                        interval: d3.time.month,
                        ylabel: '',
                        position: undefined,
                        dateformat: "%b \n \n %y",
                        nTicks: 5,
                        prediction: false
                    };

                    container.append("div").html("<b>Interaction volume</b>");
                    histSettings.position = container.append("div");
                }



                //plot a histogram with the interaction volume
                VMail.Viz.plotTimeHistogram(timestamps, histSettings);
                container.selectAll("svg").style("stroke", "white").style("fill", "white");
                container.selectAll("line").attr("stroke", "white");
                container.selectAll("path").style("stroke", "white");

                //retrieve introduction information from the database for this contact
                var introductions = (App.db[t].getIntroductions(contact));

                //list of contacts we introduced
                var children = introductions.children;

                //list of contacts this contact was introduced by sorted in chronological order
                if (App.type != "multi") {
                    container.append("hr");
                    var fathers = introductions.fathers;
                    var tmpstr = "<b>Introduced you to:</b><br/><br/>";
                    children.forEach(function (contact) {
                        tmpstr += "- " + contact.name + "<br/>";
                    });
                    if (tmpstr == "<b>Introduced you to:</b><br/><br/>")
                        tmpstr += "None<br/><br/>";
                    container.append("div").html(tmpstr);
                    container.append("hr");

                    var tmpstr = "<b>Introduced by:</b><br/><br/>";
                    fathers.forEach(function (contact) {
                        tmpstr += "- " + contact.name + "<br/>";
                    });
                    if (tmpstr == "<b>Introduced by:</b><br/><br/>")
                        tmpstr += "None<br/><br/>";
                    container.append("div").html(tmpstr);
                }

                //switch to 'contact details' view
                $('#user_stats').hide();
                $('#rankings').hide();
                if (App.type == "multi" || App.type == "single") {
                    d3.selectAll(".userinfopanel").style("display", "none");
                    d3.select("#members").style("display", "none");
                    d3.select("#stats").style("display", "none");
                    d3.select("#paths").style("display", "none");
                    d3.selectAll(".for_paths").style("display", "none");
                    $('#contactDetails').fadeIn();
                }
                else {
                    $('#userinfopanel').hide();
                    d3.select("#members").style("display", "none");
                    d3.select("#stats").style("display", "none");
                    d3.select("#paths").style("display", "none");
                    $('#contactDetails').fadeIn();//commented below
                }
                container.append("div").attr("id", "person_name_right")
                        .attr("height", document.getElementById("person_name_left").offsetHeight + "px")
                        .append("a").attr("href", "#").attr("id", "invite").text("Invite")
                        .style("display", function () {
                            if (App.type != "multi") {
                                return "none"; //"block"
                            }
                            else {
                                return "none";
                            }
                        })
                        .on("click", function () {
                            var invitation_email = {
                                email: (VMail.App.userinfo.email),
                                name: (VMail.App.userinfo.name),
                                toField: (contact.aliases[contact.aliases.length - 1]),
                                toField_name: (contact.name),
                                link: ("http://hobbit.media.mit.edu:8001/viz_multi/add=" + VMail.App.userinfo.email + "&add=" + contact.aliases[contact.aliases.length - 1])
                            };
                            $.post('/invite_name', {'json': JSON.stringify(invitation_email)}) //contact.name
                                    .success(function () {
//                                 $.ajax({
//                                     type: "POST",
//                                     //dataType : 'json',
//                                     async: false,
//                                     url: '/static/email.php',
//                                     data: { data: JSON.stringify(invitation_email) },
//                                     error: function() {alert("Error!");},
//                                     complete: function(){}
//                                 });


                                        alert("Invite " + contact.name + " for a joined network");
//                                 window.location.replace("/invite_name");
                                    }
                                    );
                        });
            }
        };


        //call this only after you have induced a new network
        var initLinksSlider = function () {
            nlinks = App.graph.links.length;
            if ($("#slider-links").slider()) {
                $("#slider-links").slider("destroy");
            }
            $("#slider-links").slider({
                //range: "min",
                min: 0,
                max: App.graph.links.length,
                value: nlinks,
                step: 15,
                slide: function (event, ui) {
                    nlinks = ui.value;
                    updateNetwork(false, 0, 1, -1);
                },
                change: function (event, ui) {
                    nlinks = ui.value;
                    updateNetwork(false, 0, 1, -1);
                }
            });
            $(".ui-slider-handle").css("width", "0.8em").css("height", "0.8em").css("border-radius", "20px").css("top", "-.4em");
        };

        var initNetworkSliders = function () {
            $("#slider-charge").slider({
                //range: "min",
                min: CHARGE_DEFAULT * 2, //-600, default used to be -300
                max: 0,
                value: CHARGE_DEFAULT,
                step: 20, //100
                slide: function (event, ui) {
                    if(App.node_as_org == 1){
                        App.viz.org_settings.forceParameters.charge = ui.value;
                    }
                    else App.viz.settings.forceParameters.charge = ui.value;

                    //updateNetwork(false);
                    App.viz.draw();
                    //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
                }
            });
//            if(App.usersinfo) NNODES_PRECOMPUTE = 400+(App.usersinfo.length -1)*200;

            $("#slider-nodes").slider({
                //range: "min",
                min: 0,
                max: (NNODES_PRECOMPUTE * App.usersinfo.length > 800 ? 800 : NNODES_PRECOMPUTE * App.usersinfo.length),
                value: (NNODES_DEFAULT * App.usersinfo.length > 400 ? 400 : NNODES_DEFAULT * App.usersinfo.length),
                step: 10, //5
                slide: function (event, ui) {
                    nnodes = ui.value;
                    updateNetwork(false, 0, 1, -1);
                },
                change: function (event, ui) {
                    nnodes = ui.value;
                    updateNetwork(false, 0, 1, -1);
                    //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
                }
            });
            $("#node_max").text((NNODES_PRECOMPUTE * App.usersinfo.length > 800 ? 800 : NNODES_PRECOMPUTE * App.usersinfo.length));

            //var inc = function(slider) {slider.slider("value", slider.slider("value") - slider.slider("option","step"));};
            //var dec = (slider) => {slider.slider("value", slider.slider("value") - slider.slider("option","step"));};
            // //nodes binding
            // $(document).bind('keydown.a', function () {
            //     var slider = $("#slider-nodes");
            //     slider.slider("value", slider.slider("value") - slider.slider("option", "step"));
            // });

            // $(document).bind('keydown.s', function () {
            //     var slider = $("#slider-nodes");
            //     slider.slider("value", slider.slider("value") + slider.slider("option", "step"));
            // });

            // //links binding
            // $(document).bind('keydown.q', function () {
            //     var slider = $("#slider-links");
            //     slider.slider("value", slider.slider("value") - slider.slider("option", "step") * 2);
            // });
            // $(document).bind('keydown.w', function () {
            //     var slider = $("#slider-links");
            //     slider.slider("value", slider.slider("value") + slider.slider("option", "step"));
            // });

            // $(document).bind('keydown.f', function () {
            //     App.viz.draw();
            //     //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
            // });
            
            $(document).bind('keydown.p', function () {
                App.viz.stop();
            });

            $(document).bind('keydown.t', function () {
                App.viz.toggleLabelVisibility();
            });
            
            //hide key nodes
            $(document).bind('keydown.h', function () {
                if(App.type != "multi"){
                    App.hideMembers = 0;
                }
                else{
                    App.hideMembers = 1 - App.hideMembers;
                    updateNetwork(false, 0, 0, -1);
                }
            });
            
            $(".ui-slider-handle").css("width", "0.8em").css("height", "0.8em").css("border-radius", "20px").css("top", "-.4em");
        };


        var updateNetwork = function (type, induceNetwork, member, sliderChanged, member_to_process) {
            //nnodes = NNODES_DEFAULT * App.usersinfo.length;
            if (induceNetwork) {
                console.time('App.graph');
                App.graph = VMail.Graph.induceOrgNetwork(App.db, NNODES_PRECOMPUTE, start, end, member_to_process); //NNODES_PRECOMPUTE
                console.timeEnd('App.graph');
                initLinksSlider();
                
                
                VMail.Graph.filterNodes(App.graph, function (nodeAttr, idx) {//may need to look at later
                    return idx < nnodes;
                });
                VMail.Graph.filterLinks(App.graph, function (linkAttr, idx) {
                    return idx < nlinks;
                });
                console.time('network analysis');
                // d3.select("#loader").html('Analyzing metadata: analyzing the network.');
                $("#loader").css("display", "none");
                $("#runway").css("display", "none");
                d3.selectAll(".runway").style("display", "none");
                setTimeout(function(){
                    //network analysis
                    var nodes_spl = [], links_spl = [], orgnodes_spl = [], orglinks_spl = [];
                    var filteredNodes = App.graph.nodes.filter(function (node) {
                        return !node.skip;
                    });
                    var filteredLinks = App.graph.links.filter(function (link) {
                        return !link.skip && !link.source.skip && !link.target.skip;
                    });
                    var filteredOrgNodes = App.graph.org_nodes.filter(function (node) {
                        return !node.skip;
                    });
                    var filteredOrgLinks = App.graph.org_links.filter(function (link) {
                        return !link.skip && !link.source.skip && !link.target.skip;
                    });
                    for (var id in filteredNodes) { //App.graph.nodes
                        //nodes_spl.push({node: nodes[id].id, weight: nodes[id].attr.size});
                        nodes_spl.push([filteredNodes[id].id, {weight: filteredNodes[id].attr.size, name: filteredNodes[id].attr.contact.name}]);
                    }
                    for (var id in filteredLinks) { //App.graph.links
                        //links_spl.push({src: links[id].source.id, trg: links[id].target.id, weight: links[id].attr.weight});
                        links_spl.push([filteredLinks[id].source.id, filteredLinks[id].target.id, {weight: filteredLinks[id].attr.weight}]);
                    }
                    var network_data = {nodes: nodes_spl,
                        links: links_spl};
                    for (var id in filteredOrgNodes) { //App.graph.org_nodes
                        orgnodes_spl.push([App.graph.org_nodes[id].id, {weight: App.graph.org_nodes[id].email_size, name: App.graph.org_nodes[id].name}]);
                    }
                    for (var id in filteredOrgLinks) { //App.graph.org_links
                        orglinks_spl.push([App.graph.org_links[id].source.id, App.graph.org_links[id].target.id, {weight: App.graph.org_links[id].weight}]);
                    }
                    var orgnetwork_data = {nodes: orgnodes_spl,
                        links: orglinks_spl};
//                    try {
                        //var jsnx = require('jsnetworkx');
                        var G = new jsnx.Graph(), orgG = new jsnx.Graph();
                        G.addNodesFrom(nodes_spl); G.addEdgesFrom(links_spl);
                        orgG.addNodesFrom(orgnodes_spl); orgG.addEdgesFrom(orglinks_spl);

                        if(App.type == "single"){
                            $.post('/networkx_report', {'json': JSON.stringify({network: {nodes: nodes_spl, links: links_spl}, org_network: {nodes: orgnodes_spl, links: orglinks_spl}})}) //contact.name
                            .success(function (returned_data) {
                                // console.log(returned_data);
                                // for(var id in returned_data['b']){
                                //     if(!isNaN(returned_data['b'][id])){ 
                                //         // console.log(id+" "+returned_data['b'][id]);
                                //         if($.grep(filteredNodes, function (e) { return e.id == id; }).length != 0)
                                //             App.egvct_centrality['n' + id.toString()] = returned_data['b'][id];
                                //     }
                                // }
                                // for(var id in returned_data['org_b']){
                                //     if(!isNaN(returned_data['org_b'][id])) App.org_egvct_centrality['o' + id.toString()] = returned_data['org_b'][id];
                                // }
                                App.components = returned_data['components'];
                                App.org_components = returned_data['org_components'];
                                App.density = returned_data['density'];
                                App.org_density = returned_data['org_density'];
                                // var convex_hulls = [];
                                // d3.range(3).forEach(function(k){
                                //     var node_ids = returned_data['components'][k];
                                //     var the_nodes = [];
                                //     for(var l = 0; l < App.graph.nodes.length; l++){
                                //         if(node_ids.indexOf(App.graph.nodes[l].id) != -1){
                                //             the_nodes.push({'id': App.graph.nodes[l].id, 'x': App.graph.nodes[l].x, 'y': App.graph.nodes[l].y});
                                //             if(the_nodes.length == node_ids.length) break;
                                //         }
                                //     }
                                //     convex_hulls.push(convexHulls(k, the_nodes, 15));
                                // });
                                // function convexHulls(group, nodes, offset) {
                                //     var hulls = [];
                                //     // create point sets
                                //     for (var k=0; k<nodes.length; k++) {
                                //       var n = nodes[k];
                                //       hulls.push([n.x-offset, n.y-offset]);
                                //       hulls.push([n.x-offset, n.y+offset]);
                                //       hulls.push([n.x+offset, n.y-offset]);
                                //       hulls.push([n.x+offset, n.y+offset]);
                                //     }
                                //     return {'group': group, 'path': d3.geom.hull(hulls)};
                                // }

                                // function drawCluster(d) {
                                //     return curve(d.path); // 0.8
                                // }
                                // var curve = d3.svg.line()
                                //     .interpolate("cardinal-closed")
                                //     .tension(.85);
                                // console.log(convex_hulls);
                                // var hullg = d3.select("#network_contacts").append("g");
                                // var hull = hullg.selectAll("path.hull")
                                //   .data(convex_hulls)
                                // .enter().append("path")
                                //   .attr("class", "hull")
                                //   .attr("d", drawCluster)
                                //   .style("fill", function(d) { return "rgba(150,150,150,0.3)"; });
                            });
                        }

                        //people we lose
                        if(App.type == "multi" && App.removed.indexOf(1) != -1){
                            App.people_we_lost = []; App.org_we_lost = [];
                            for(var jj = 0; jj < filteredNodes.length; jj++){
                                //only owned by one member and the member is removed
                                if(filteredNodes[jj].owns.length == 1 && App.removed[filteredNodes[jj].owns[0]] == 1){
                                    //if there is a path between him/her and a member that hasn't been removed
                                    for(var kk = 0; kk < App.usersinfo.length; kk++){
                                        var member_ind = $.map(App.graph.member_nodes, function(obj, index){ 
                                            if(obj.attr.contact.name == App.usersinfo[kk].name)
                                                return index;
                                        });
                                        if(App.removed[kk] == 0 && !jsnx.hasPath(G, {source: filteredNodes[jj].id, target: App.graph.member_nodes[member_ind].id})){

                                        }
                                        else if(App.removed[kk] == 0){ break; }
                                        if(kk == App.usersinfo.length - 1){
                                            App.people_we_lost.push(filteredNodes[jj]);
                                        }
                                    }
                                }
                            }
                            for(var jj = 0; jj < filteredOrgNodes.length; jj++){
                                //only owned by one member and the member is removed
                                var ones = 0, ind = -1;
                                for(var kk = 0; kk < App.usersinfo.length; kk++){
                                    if(filteredOrgNodes[jj].owns[kk] != 0){ ones++; ind = kk; }
                                    if(ones > 1) break; 
                                }
                                if(ones == 0 || ones > 1 || App.removed[ind] == 0) continue;
                                //now we see if this org is connected to any orgs that connected to an unremoved member
                                var connected = 0;
                                for(var kk = 0; kk < App.usersinfo.length; kk++){
                                    if(App.removed[kk] == 0){
                                        var member_ind = $.map(App.graph.member_nodes, function(obj, index){ 
                                            if(obj.attr.contact.name == App.usersinfo[kk].name)
                                                return index;
                                        });
                                        var node_ind = $.grep(filteredNodes, function(e){ return e.id == App.graph.member_nodes[member_ind].id; })[0];
                                        for(var tt = 0; tt < node_ind.orgs.length; tt++){
                                            if(jsnx.hasPath(orgG, {source: filteredOrgNodes[jj].id, target: node_ind.orgs[tt]})){
                                                connected = 1; break;
                                            }
                                        }
                                    }
                                    if(connected == 1) break;
                                    if(kk == App.usersinfo.length - 1){
                                        App.org_we_lost.push(filteredOrgNodes[jj]);
                                    }
                                }
                            }
                        }

                        try {
                            //eigenvector centrality
                            App.egvct_centrality = jsnx.eigenvectorCentrality(G)._stringValues;
                            App.org_egvct_centrality = jsnx.eigenvectorCentrality(orgG)._stringValues;
                        }
                        catch(err) {
                            App.egvct_centrality = jsnx.betweennessCentrality(G)._stringValues;
                            App.org_egvct_centrality = jsnx.betweennessCentrality(orgG)._stringValues;
                            console.log("ERROR: " + err.message);
                        }
                        
                        var comp = function (a, b) {
                            if (a[1] !== b[1]) {
                                return b[1] - a[1];
                            }
                            return 0;
                        };
                        var sortable = [], org_sortable = [];
                        for (var ind in App.egvct_centrality) {
                            sortable.push([ind, App.egvct_centrality[ind]]);
                        }
                        sortable.sort(comp);

                        if(App.egvct_centrality_old == null) App.egvct_centrality_old = sortable;

                        for (var ind in App.org_egvct_centrality) {
                            org_sortable.push([ind, App.org_egvct_centrality[ind]]);
                        }
                        org_sortable.sort(comp);
                        if(App.org_egvct_centrality_old == null) App.org_egvct_centrality_old = org_sortable;

                        var container = d3.select("#influence_ranking");
                        container.selectAll("*").remove();
        //                container.append("br");
                        if(App.type == "single") 
                            container.append("div").style("height", "26px").html('<b>Betweenness Centrality</b>')
                                .append("div").attr("id", "ranking_method");
                        else
                            container.append("div").style("height", "26px").html('<b>Eigenvector Centrality</b>')
                                .append("div").attr("id", "ranking_method");
                        container.select("#ranking_method").append("img").attr("id", "ranking_ascending")
                                .attr("src", "/static/images/arrow_up.png").style("cursor", "pointer")
                                .on("click", function(){
                                    show_centrality_ranking(1);
                                });
                        container.select("#ranking_method").append("img").attr("id", "ranking_descending")
                                .attr("src", "/static/images/arrow_down.png").style("cursor", "pointer")
                                .on("click", function(){
                                    show_centrality_ranking(0);
                                });
                        show_centrality_ranking(1);
                        
                        
                    console.timeEnd('network analysis');

                    function show_centrality_ranking(ascending){
                        container.selectAll(".centrality_ranking").remove();
                        var index = 1;
                        if(ascending){
                            if(App.node_as_org == 0){
                                for(var ind in sortable){
                                    if(index <= 30){
                                        var flag = 0;
                                        var results = $.grep(App.graph.nodes, function (e) { return e.id == sortable[ind][0]; });
                                        var the_div = container.append("div").attr("class", "centrality_ranking").attr("id","ind_" + sortable[ind][0]).style("cursor", "pointer");
                                        //if some members have been removed, use up/down arrows to show centrality ranking change
                                        if(App.removed.indexOf(1) != -1){
                                            var result = $.grep(App.egvct_centrality_old, function (e) { return e[0] == sortable[ind][0]; });
                                            if(result.length != 0 && App.egvct_centrality_old.indexOf(result[0]) != ind){
                                                the_div.append("img").attr("class", "ranking_change").attr("src", function(){ 
                                                    if(ind < App.egvct_centrality_old.indexOf(result[0])) return "/static/images/arrow_up_green.png";
                                                    return "/static/images/arrow_down_red.png";
                                                });
                                                flag = 1;
                                            }
                                        }
                                        the_div.append("p").attr("id", "to_catch_height_" + sortable[ind][0]).attr("class", "p_ranking").text(index + '   ' + results[0].attr.contact.name)
                                            .style("top", function(){ return flag == 1? "-19px" : "0px"; });
                                        the_div.on("mouseover", function(){
                                            //highlight corresponding nodes
                                            d3.select(this).style("background","#888");
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.mouseoverNode(the_node[0]);
                                        })
                                        .on("mouseout",function(){
                                            d3.select(this).style("background","rgba(0,0,0,0)");
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.mouseoutNode(the_node[0]);
                                        }).on("click",function(){
                                            d3.select(this).style("background","rgba(0,0,0,0)");
                                            $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.clickNode(the_node[0]);
                                        });
                                        index++;
                                    }
                                }
                            }
                            else{
                                for(var ind in org_sortable){
                                    if(index <= 30){
                                        var flag = 0;
                                        var results = $.grep(App.graph.org_nodes, function (e) { return e.id == org_sortable[ind][0]; });
                                        var the_div = container.append("div").attr("class", "centrality_ranking").attr("id","ind_" + org_sortable[ind][0]).style("cursor", "pointer");
                                        //if some members have been removed, use up/down arrows to show centrality ranking change
                                        if(App.removed.indexOf(1) != -1){
                                            var result = $.grep(App.org_egvct_centrality_old, function (e) { return e[0] == org_sortable[ind][0]; });
                                            if(result.length != 0 && App.org_egvct_centrality_old.indexOf(result[0]) != ind){
                                                the_div.append("img").attr("class", "ranking_change").attr("src", function(){ 
                                                    if(ind < App.org_egvct_centrality_old.indexOf(result[0])) return "/static/images/arrow_up_green.png";
                                                    return "/static/images/arrow_down_red.png";
                                                });
                                                flag = 1;
                                            }
                                        }
                                        the_div.append("p").attr("id", "to_catch_height_" + org_sortable[ind][0]).attr("class", "p_ranking").text(index + '   ' + results[0].name)
                                            .style("top", function(){ return flag == 1? "-19px" : "0px"; });
                                        the_div.on("mouseover", function(){
                                            //highlight corresponding nodes
                                            d3.select(this).style("background","#888");
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.org_nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.mouseoverNode(the_node[0]);
                                        }).on("mouseout",function(){
                                            d3.select(this).style("background","rgba(0,0,0,0)");
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.org_nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.mouseoutNode(the_node[0]);
                                        }).on("click",function(){
                                            d3.select(this).style("background","rgba(0,0,0,0)");
                                            $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.org_nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.clickNode(the_node[0]);
                                        });
                                        index++;
                                    }
                                }
                            }
                        }
                        else{
                            if(App.node_as_org == 0){
                                for(var ind = sortable.length - 1; ind >= sortable.length - 30; ind--){
                                    if(index <= 30){
                                        var flag = 0;
                                        var results = $.grep(App.graph.nodes, function (e) { return e.id == sortable[ind][0]; });
                                        var the_div = container.append("div").attr("class", "centrality_ranking").attr("id","ind_" + sortable[ind][0]).style("cursor", "pointer").style("height", "19px");
                                        //if some members have been removed, use up/down arrows to show centrality ranking change
                                        if(App.removed.indexOf(1) != -1){
                                            var result = $.grep(App.egvct_centrality_old, function (e) { return e[0] == sortable[ind][0]; });
                                            if(result.length != 0 && App.egvct_centrality_old.indexOf(result[0]) != ind){
                                                the_div.append("img").attr("class", "ranking_change").attr("src", function(){ 
                                                    if(ind < App.egvct_centrality_old.indexOf(result[0])) return "/static/images/arrow_up_green.png";
                                                    return "/static/images/arrow_down_red.png";
                                                });
                                                flag = 1;
                                            }
                                        }
                                        the_div.append("p").attr("id", "to_catch_height_" + sortable[ind][0]).attr("class", "p_ranking").text((ind + 1) + '   ' + results[0].attr.contact.name)
                                            .style("top", function(){ return flag == 1? "-19px" : "0px"; });
                                        the_div.on("mouseover", function(){
                                            //highlight corresponding nodes
                                            d3.select(this).style("background","#888");
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.mouseoverNode(the_node[0]);
                                        })
                                        .on("mouseout",function(){
                                            d3.select(this).style("background","rgba(0,0,0,0)");
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.mouseoutNode(the_node[0]);
                                        }).on("click",function(){
                                            d3.select(this).style("background","rgba(0,0,0,0)");
                                            $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.clickNode(the_node[0]);
                                        });
                                        index++;
                                    }
                                }
                            }
                            else{
                                for(var ind = org_sortable.length - 1; ind >= org_sortable.length - 30; ind--){
                                    if(index <= 30){
                                        var flag = 0;
                                        var results = $.grep(App.graph.org_nodes, function (e) { return e.id == org_sortable[ind][0]; });
                                        var the_div = container.append("div").attr("class", "centrality_ranking").attr("id","ind_" + org_sortable[ind][0]).style("cursor", "pointer").style("height", "19px");
                                        //if some members have been removed, use up/down arrows to show centrality ranking change
                                        if(App.removed.indexOf(1) != -1){
                                            var result = $.grep(App.org_egvct_centrality_old, function (e) { return e[0] == org_sortable[ind][0]; });
                                            if(result.length != 0 && App.org_egvct_centrality_old.indexOf(result[0]) != ind){
                                                the_div.append("img").attr("class", "ranking_change").attr("src", function(){ 
                                                    if(ind < App.org_egvct_centrality_old.indexOf(result[0])) return "/static/images/arrow_up_green.png";
                                                    return "/static/images/arrow_down_red.png";
                                                });
                                                flag = 1;
                                            }
                                        }
                                        the_div.append("p").attr("id", "to_catch_height_" + org_sortable[ind][0]).attr("class", "p_ranking").text((ind + 1) + '   ' + results[0].name)
                                            .style("top", function(){ return flag == 1? "-19px" : "0px"; });
                                        the_div.on("mouseover", function(){
                                            //highlight corresponding nodes
                                            d3.select(this).style("background","#888");
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.org_nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.mouseoverNode(the_node[0]);
                                        }).on("mouseout",function(){
                                            d3.select(this).style("background","rgba(0,0,0,0)");
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.org_nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.mouseoutNode(the_node[0]);
                                        }).on("click",function(){
                                            d3.select(this).style("background","rgba(0,0,0,0)");
                                            $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                                            var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                            var the_node = $.grep(App.graph.org_nodes, function (e) {
                                                return e.id == the_id;
                                            });
                                            App.viz.clickNode(the_node[0]);
                                        });
                                        index++;
                                    }
                                }
                            }
                        }
                        d3.select("#influence_ranking").selectAll(".centrality_ranking").style("height", function(){ 
                            return document.getElementById(d3.select(this).select("p").attr("id")).offsetHeight + "px"; 
                        });
                    }
                }, 20);
            }
            setTimeout(function(){
                //no matter induce network or not
                if(App.type == "multi" && App.removed.indexOf(1) != -1 && sliderChanged == 0){
                    var we_lost_container = d3.select("#we_lost_them");
                    we_lost_container.selectAll("*").remove();
                    if(App.node_as_org == 0){
                        if(App.people_we_lost.length * 19 < $(window).height() * 0.37){
                            we_lost_container.style("height", (App.people_we_lost.length * 19 + (App.people_we_lost.length == 0? 0:26)) + "px");
                        }
                        else{
                            we_lost_container.style("height", "37%");
                        }
                        if(App.people_we_lost.length != 0){
                            we_lost_container.append("div").style("height", "26px").html('<b>Who we lost</b>');
                            show_who_we_lost();
                        }
                    }
                    else{
                        if(App.org_we_lost.length * 19 < $(window).height() * 0.37){
                            we_lost_container.style("height", (App.org_we_lost.length * 19 + (App.people_we_lost.length == 0? 0:26)) + "px");
                        }
                        else{
                            we_lost_container.style("height", "37%");
                        }
                        if(App.org_we_lost.length != 0){
                            we_lost_container.append("div").style("height", "26px").html('<b>Who we lost</b>');
                            show_who_we_lost();
                        }
                    }


                    function show_who_we_lost(){
    //                    console.log(people_we_lost);
    //                    console.log(org_we_lost);
                        we_lost_container.selectAll(".we_lost").remove();
                        if(App.node_as_org == 0){
                            for(var ind in App.people_we_lost){
                                var the_div = we_lost_container.append("div").attr("class", "we_lost").attr("id","ind_" + App.people_we_lost[ind].id).style("cursor", "pointer");
                                the_div.append("p").attr("id", "to_catch_height_" + App.people_we_lost[ind].id).attr("class", "p_ranking").text(App.people_we_lost[ind].attr.contact.name)
                                    .style("top", function(){ return "0px"; });
                                the_div.on("mouseover", function(){
                                    //highlight corresponding nodes
                                    d3.select(this).style("background","#888");
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.mouseoverNode(the_node[0]);
                                })
                                .on("mouseout",function(){
                                    d3.select(this).style("background","rgba(0,0,0,0)");
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.mouseoutNode(the_node[0]);
                                }).on("click",function(){
                                    d3.select(this).style("background","rgba(0,0,0,0)");
                                    $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.clickNode(the_node[0]);
                                });
                            }
                        }
                        else{
                            for(var ind in App.org_we_lost){
                                var the_div = we_lost_container.append("div").attr("class", "we_lost").attr("id","ind_" + App.org_we_lost[ind].id).style("cursor", "pointer");
                                the_div.append("p").attr("id", "to_catch_height_" + App.org_we_lost[ind].id).attr("class", "p_ranking").text(App.org_we_lost[ind].name)
                                    .style("top", function(){ return "0px"; });
                                the_div.on("mouseover", function(){
                                    //highlight corresponding nodes
                                    d3.select(this).style("background","#888");
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.org_nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.mouseoverNode(the_node[0]);
                                }).on("mouseout",function(){
                                    d3.select(this).style("background","rgba(0,0,0,0)");
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.org_nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.mouseoutNode(the_node[0]);
                                }).on("click",function(){
                                    d3.select(this).style("background","rgba(0,0,0,0)");
                                    $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.org_nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.clickNode(the_node[0]);
                                });
                            }
                        }
                    }
                }

                //if not induce network, we still need to filter nodes
                if(!induceNetwork){
                    VMail.Graph.filterNodes(App.graph, function (nodeAttr, idx) {//may need to look at later
                        return idx < nnodes;
                    });
                    VMail.Graph.filterLinks(App.graph, function (linkAttr, idx) {
                        return idx < nlinks;
                    });
                }

                //run community detection on the network
                VMail.Graph.communityDetection(App.graph);

                //update skip
                if(App.userinfo.email == "data.immersion@gmail.com" || App.userinfo.email == "data.immersion.2016@gmail.com"){
                    if(App.type == "multi"){
                        App.graph.nodes.forEach(function(node){
                            if(VMail.App.hideMembers == 1){
                                 for(var t = 0; t < VMail.App.graph.member_nodes.length; t++){
                                     if(node.id == VMail.App.graph.member_nodes[t].id){
                                         node.skip = 1; 
                                     }
                                 }
                             }
                             else{
                                 for(var t = 0; t < VMail.App.graph.member_nodes.length; t++){
                                     if(node.id == VMail.App.graph.member_nodes[t].id){
                                         node.skip = 0;
                                     }
                                 }
                             } 
                         });
                     }
                 }
                 App.graph.links.forEach(function(link){
                    if(VMail.App.hideMembers == 1){
                        if(link.skipcommunity == true) link.skip = 1;
                    }
                    else{
                         if(link.skipcommunity == true) link.skip = 0;
                    } 
                });

                //if node slider changed, we need to recalculate the peopl_we_lost 
                if(!induceNetwork && App.type == "multi" && App.removed.indexOf(1) != -1 && sliderChanged == 1){
                    //network analysis
                    var nodes_spl = [], links_spl = [];
                    var filteredNodes = App.graph.nodes.filter(function (node) {
                        return !node.skip;
                    });
                    var filteredLinks = App.graph.links.filter(function (link) {
                        return !link.skip && !link.source.skip && !link.target.skip;
                    });
                    for (var id in filteredNodes) { //App.graph.nodes
                       nodes_spl.push([filteredNodes[id].id, {weight: filteredNodes[id].attr.size, name: filteredNodes[id].attr.contact.name}]);
                    }
                    for (var id in filteredLinks) { //App.graph.links
                        links_spl.push([filteredLinks[id].source.id, filteredLinks[id].target.id, {weight: filteredLinks[id].attr.weight}]);
                    }
                    var network_data = {nodes: nodes_spl,
                        links: links_spl};

                    var G = new jsnx.Graph(), orgG = new jsnx.Graph();
                    G.addNodesFrom(nodes_spl); G.addEdgesFrom(links_spl);

                    //people we lose
                    App.people_we_lost = [];
                    for(var jj = 0; jj < filteredNodes.length; jj++){
                        //only owned by one member and the member is removed
                        if(filteredNodes[jj].owns.length == 1 && App.removed[filteredNodes[jj].owns[0]] == 1){
                            //if there is a path between him/her and a member that hasn't been removed
                            for(var kk = 0; kk < App.usersinfo.length; kk++){
                                var member_ind = $.map(App.graph.member_nodes, function(obj, index){ 
                                    if(obj.attr.contact.name == App.usersinfo[kk].name)
                                        return index;
                                });
                                if(App.removed[kk] == 0 && !jsnx.hasPath(G, {source: filteredNodes[jj].id, target: App.graph.member_nodes[member_ind].id})){

                                }
                                else if(App.removed[kk] == 0){ break; }
                                if(kk == App.usersinfo.length - 1){
                                    App.people_we_lost.push(filteredNodes[jj]);
                                }
                            }
                        }
                    }

                    var we_lost_container = d3.select("#we_lost_them");
                    we_lost_container.selectAll("*").remove();
                    if(App.node_as_org == 0){
                        if(App.people_we_lost.length * 19 < $(window).height() * 0.37){
                            we_lost_container.style("height", (App.people_we_lost.length * 19 + (App.people_we_lost.length == 0? 0:26)) + "px");
                        }
                        else{
                            we_lost_container.style("height", "37%");
                        }
                        if(App.people_we_lost.length != 0){
                            we_lost_container.append("div").style("height", "26px").html('<b>Who we lost</b>');
                            show_who_we_lost();
                        }
                    }
                    else{
                        if(App.org_we_lost.length * 19 < $(window).height() * 0.37){
                            we_lost_container.style("height", (App.org_we_lost.length * 19 + (App.people_we_lost.length == 0? 0:26)) + "px");
                        }
                        else{
                            we_lost_container.style("height", "37%");
                        }
                        if(App.org_we_lost.length != 0){
                            we_lost_container.append("div").style("height", "26px").html('<b>Who we lost</b>');
                            show_who_we_lost();
                        }
                    }

                    function show_who_we_lost(){
    //                    console.log(people_we_lost);
    //                    console.log(org_we_lost);
                        we_lost_container.selectAll(".we_lost").remove();
                        if(App.node_as_org == 0){
                            for(var ind in App.people_we_lost){
                                var the_div = we_lost_container.append("div").attr("class", "we_lost").attr("id","ind_" + App.people_we_lost[ind].id).style("cursor", "pointer");
                                the_div.append("p").attr("id", "to_catch_height_" + App.people_we_lost[ind].id).attr("class", "p_ranking").text(App.people_we_lost[ind].attr.contact.name)
                                    .style("top", function(){ return "0px"; });
                                the_div.on("mouseover", function(){
                                    //highlight corresponding nodes
                                    d3.select(this).style("background","#888");
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.mouseoverNode(the_node[0]);
                                })
                                .on("mouseout",function(){
                                    d3.select(this).style("background","rgba(0,0,0,0)");
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.mouseoutNode(the_node[0]);
                                }).on("click",function(){
                                    d3.select(this).style("background","rgba(0,0,0,0)");
                                    $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.clickNode(the_node[0]);
                                });
                            }
                        }
                        else{
                            for(var ind in App.org_we_lost){
                                var the_div = we_lost_container.append("div").attr("class", "we_lost").attr("id","ind_" + App.org_we_lost[ind].id).style("cursor", "pointer");
                                the_div.append("p").attr("id", "to_catch_height_" + App.org_we_lost[ind].id).attr("class", "p_ranking").text(App.org_we_lost[ind].name)
                                    .style("top", function(){ return "0px"; });
                                the_div.on("mouseover", function(){
                                    //highlight corresponding nodes
                                    d3.select(this).style("background","#888");
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.org_nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.mouseoverNode(the_node[0]);
                                }).on("mouseout",function(){
                                    d3.select(this).style("background","rgba(0,0,0,0)");
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.org_nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.mouseoutNode(the_node[0]);
                                }).on("click",function(){
                                    d3.select(this).style("background","rgba(0,0,0,0)");
                                    $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                                    var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                    var the_node = $.grep(App.graph.org_nodes, function (e) {
                                        return e.id == the_id;
                                    });
                                    App.viz.clickNode(the_node[0]);
                                });
                            }
                        }
                    }
                }

                var sizeExtent = d3.extent(App.graph.nodes, function (node) {
                    if(App.userinfo.email == "data.immersion@gmail.com" || App.userinfo.email == "data.immersion.2016@gmail.com"){
                        for(var t = 0; t < VMail.App.graph.member_nodes.length; t++){
                            if(node.id == VMail.App.graph.member_nodes[t].id){
                                return 0; 
                            }
                        }
                    }
                    if(node.skip != 1) return node.attr.size;
                    else return 0;
                });
                var org_sizeExtent = d3.extent(App.graph.org_nodes, function (node) {
                    return node.email_size;
                });
                var sizeExtentMember = d3.extent(App.graph.member_nodes, function (node) {
                    return node.attr.size;
                });
    //            var nodeRadius = d3.scale.linear().range([3, 50]).domain(sizeExtent);
                var nodeRadius = d3.scale.linear().range([4, 52]).domain(sizeExtent); // for demo
                var org_nodeRadius = d3.scale.linear().range([4, 52]).domain(org_sizeExtent);
    //            var textSize = d3.scale.linear().range([11, 20]).domain(sizeExtent);
                var textSize = d3.scale.linear().range([11, 18]).domain(sizeExtent); //for demo
                var textMemberSize = d3.scale.linear().range([18, 25]).domain(sizeExtentMember);
    //            var org_textSize = d3.scale.linear().range([11, 20]).domain(org_sizeExtent);
                var org_textSize = d3.scale.linear().range([11, 18]).domain(org_sizeExtent); //for demo
                var nodeMemberRadius = d3.scale.linear().range([14, 50]).domain(sizeExtentMember);
                var textSpecialSize = d3.scale.linear().range([18, 25]).domain(sizeExtent);
                var nodeSpecialRadius = d3.scale.linear().range([14, 30]).domain(sizeExtentMember);
                var linkSizeExtent = d3.extent(App.graph.links, function (link) {
                    return link.attr.weight;
                });
                var linkSizeMemberExtent = d3.extent(App.graph.member_links, function (link) {
                    return link.attr.weight;
                });
                var org_linkSizeExtent = d3.extent(App.graph.org_links, function (link) {
                    return link.weight;
                });
                var linkWidth = d3.scale.linear().range([1, 12]).domain(linkSizeExtent);
                var linkMemberWidth = d3.scale.linear().range([2, 20]).domain(linkSizeMemberExtent);
                var org_linkWidth = d3.scale.linear().range([1, 18]).domain(org_linkSizeExtent);

                if (App.node_as_org == 0) {
                    App.viz.settings.nodeSizeFunc = function (attr) {
                        return nodeRadius(attr.size);
                    };
                    App.viz.settings.nodeSizeFuncSpecial = function (attr) {
    //                    return nodeSpecialRadius(attr.size);
                        return "30px";
                    };
                    App.viz.settings.textSizeFunc = function (attr) {
                        return textSize(attr.size);
                    };
                    App.viz.settings.textSizeFuncSpecial = function (attr) {
    //                    return textSpecialSize(attr.size);
                        return 20;
                    };
                    App.viz.settings.nodeMemberSizeFunc = function (attr) {
                        return nodeMemberRadius(attr.size);
                    };
                    App.viz.settings.textMemberSizeFunc = function (attr) {
                        return textMemberSize(attr.size);
                    };
                    App.viz.settings.linkSizeFunc = function (attr) {
                        return linkWidth(attr.weight);
                    };
                    App.viz.settings.linkSizeMemberFunc = function (attr) {
                        return linkMemberWidth(attr.weight);
                    };
                }
                else {
                    App.viz.org_settings.nodeSizeFunc = function (size) {
                        return org_nodeRadius(size);
                    };
                    App.viz.org_settings.textSizeFunc = function (size) {
                        return org_textSize(size);
                    };
                    App.viz.org_settings.nodeMemberSizeFunc = function (size) {
                        return nodeMemberRadius(size);
                    };
                    App.viz.org_settings.linkSizeFunc = function (weight) {
                        return org_linkWidth(weight);
                    };
                }

                if (member == 1)
                    App.viz.updateMemberNetwork(App.graph);
                else
                    App.viz.updateNetwork(App.graph);

                var comp = function (a, b) {
                    if (a[1] !== b[1]) {
                        return b[1] - a[1];
                    }
                    return 0;
                };
                var report = d3.select("#whole_report");
                report.select("#intro_contacts_title").html('Contact Network');
                report.select("#intro_p1").html('There are <b>' + App.db[0].nCollaborators + ' contacts</b> in your contact network, which contains ' 
                    + (App.components['nodes'].length == 0? 'no connected component with more than 1 node. ' : '<b>' + (App.components['nodes'].length == 1? (App.components['nodes'].length + ' connected component</b> with more than 2 nodes. '):(App.components['nodes'].length + ' connected components</b> with more than 2 nodes. ')))
                    + 'The density of your contact network is ' + App.density.toFixed(3) + ' (density is the proportion of direct links in a network relative to the total number of links possible).');
                for(var k = 0; k < 3; k++){
                    if(k < App.components['nodes'].length){
                        if(App.components['nodes'][k].length >= 3){
                            var sortable = [], org_sortable = [];
                            for (var ind in App.egvct_centrality) {
                                if(App.components['nodes'][k].indexOf(ind) != -1)
                                    sortable.push([ind, App.egvct_centrality[ind]]);
                            }
                            sortable.sort(comp);
                            var names = '', count = 0;
                            for(var l = 0; l < 3; l++){
                                for(var kk = 0; kk < App.graph.nodes.length; kk++){
                                    if(sortable[l][0] ==App.graph.nodes[kk].id){ 
                                        count++;
                                        names += App.graph.nodes[kk].attr.contact.name;
                                        break;
                                    }
                                }
                                if(count == 3){
                                    break;
                                }
                                else if(count == 2) names += ', and '
                                else names += ', ';
                            }

                            report.select("#intro_p" + (k + 2)).html('The <b>' + (k==0? '':(k==1? 'second ':'third ')) + 'largest</b> connected component consists of <b>' + App.components['nodes'][k].length + ' contacts</b> with the most central 3 contacts being ' + names + '. The density of the component is ' + (App.components['density'][k] == 1 ? App.components['density'][k].toFixed(0) + ', which means every contact in the component is connected with each other.' :App.components['density'][k].toFixed(3) + '.'));
                        }
                        else if(App.components['nodes'][k].length == 2){
                            var names = '', count = 0;
                            for(var kk = 0; kk < App.graph.nodes.length; kk++){
                                if(App.components['nodes'][k].indexOf(App.graph.nodes[kk].id) != -1){ 
                                    count++;
                                    names += App.graph.nodes[kk].attr.contact.name;
                                    if(count == 2){
                                        break;
                                    }
                                    else names += ' and ';
                                }
                            }
                            report.select("#intro_p" + (k + 2)).html('The <b>' + (k==0? '':(k==1? 'second ':'third ')) + 'largest</b> connected component consists of <b>' + App.components['nodes'][k].length + ' contacts</b>: ' + names);
                        }
                    }
                }
                report.select("#intro_orgs_title").html('Organization Network');
                report.select("#intro_p5").html('There are <b>' + App.graph.org_nodes.length + ' organizations</b> in your organization network, which contains ' 
                    + (App.org_components['nodes'].length == 0? 'no connected component with more than 1 node. ' : '<b>' + (App.org_components['nodes'].length == 1? (App.org_components['nodes'].length + ' connected component</b> with more than 2 nodes. '):(App.org_components['nodes'].length + ' connected components</b> with more than 2 nodes. ')))
                    + 'The density of your organization network is ' + App.org_density.toFixed(3) +' (density is the proportion of direct links in a network relative to the total number of links possible).');
                for(var k = 0; k < 3; k++){
                    if(k < App.org_components['nodes'].length){
                        if(App.org_components['nodes'][k].length >= 3){
                            var org_sortable = [];
                            for (var ind in App.org_egvct_centrality) {
                                if(App.org_components['nodes'][k].indexOf(ind) != -1)
                                    org_sortable.push([ind, App.org_egvct_centrality[ind]]);
                            }
                            org_sortable.sort(comp);
                            var names = '', count = 0;
                            for(var l = 0; l < 3; l++){
                                for(var kk = 0; kk < App.graph.org_nodes.length; kk++){
                                    if(org_sortable[l][0] ==App.graph.org_nodes[kk].id){ 
                                        count++;
                                        names += App.graph.org_nodes[kk].name;
                                        break;
                                    }
                                }
                                if(count == 3){
                                    break;
                                }
                                else if(count == 2) names += ', and '
                                else names += ', ';
                            }

                            report.select("#intro_p" + (k + 6)).html('The <b>' + (k==0? '':(k==1? 'second ':'third ')) + 'largest</b> connected component consists of <b>' + App.org_components['nodes'][k].length + ' organizations</b> with the most central 3 organizations being ' + names + '. The density of the component is ' + (App.org_components['density'][k] == 1 ? App.org_components['density'][k].toFixed(0) + ', which means every organization in the component is connected with each other.' : App.org_components['density'][k].toFixed(3) + '.'));
                        }
                        else if(App.org_components['nodes'][k].length == 2){
                            var names = '', count = 0;
                            for(var kk = 0; kk < App.graph.org_nodes.length; kk++){
                                if(App.org_components['nodes'][k].indexOf(App.graph.org_nodes[kk].id) != -1){ 
                                    count++;
                                    names += App.graph.org_nodes[kk].name;
                                    if(count == 2){
                                        break;
                                    }
                                    else names += ' and ';
                                }
                            }
                            report.select("#intro_p" + (k + 6)).html('The <b>' + (k==0? '':(k==1? 'second ':'third ')) + 'largest</b> connected component consists of <b>' + App.org_components['nodes'][k].length + ' organizations</b>: ' + names);
                        }
                    }
                }
                report.selectAll(".pointing").attr("stroke-opacity", 0.8);
            }, 20);
        };

        // slider where users selects time-sliced view of the data
        var initTimeSlider = function () {
            $("#slider-ytd").click(function () {
                var init_start = 100000000000, init_end = 0;
                for (var t = 0; t < App.db.length; t++) {
                    if (App.db[t].emails[0].timestamp < init_start) {
                        init_start = App.db[t].emails[0].timestamp;
                    }
                    if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                        init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                    }
                }
                init_start = new Date(init_start * 1000);
                init_end = new Date(init_end * 1000);
                end = init_end;
                start = d3.time.year.offset(end, -1);
//                var current_db = (App.db[0]);
//                var c = current_db.emails[current_db.emails.length - 1].timestamp * 1000;
//                end = new Date(c);
//                start = d3.time.year.offset(end, -1);
                $("#slider-range").slider('option', "values", [+start, +end]);
                $('#slider-text').html(formatter(start) + " - " + formatter(end));
                $('#slider-duration').html(longAgo(end, start));
                updateNetwork(true, 0, 0, -1);
                if (!App.isContactDetails && !App.isUserStats) {
                    showTopContacts(NTOPCONTACTS);
                }
                if (App.isContactDetails) {
                    showContactDetails(the_one_node, currentContact, start, end);
                }
            });

            $("#slider-all").click(function () {
                var init_start = 100000000000, init_end = 0;
                for (var t = 0; t < App.db.length; t++) {
                    if (App.db[t].emails[0].timestamp < init_start) {
                        init_start = App.db[t].emails[0].timestamp;
                    }
                    if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                        init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                    }
                }
                init_start = new Date(init_start * 1000);
                init_end = new Date(init_end * 1000);
                end = init_end;
                start = init_start;

                $("#slider-range").slider('option', "values", [+start, +end]);
                $('#slider-text').html(formatter(start) + " - " + formatter(end));
                $('#slider-duration').html(longAgo(end, start));
                updateNetwork(true, 0, 0, -1);
                if (!App.isContactDetails && !App.isUserStats) {
                    showTopContacts(NTOPCONTACTS);
                }
                if (App.isContactDetails) {
                    showContactDetails(the_one_node, currentContact, start, end);
                }
            });

            $("#slider-pastmonth").click(function () {
                var init_start = 100000000000, init_end = 0;
                for (var t = 0; t < App.db.length; t++) {
                    if (App.db[t].emails[0].timestamp < init_start) {
                        init_start = App.db[t].emails[0].timestamp;
                    }
                    if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                        init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                    }
                }
                init_start = new Date(init_start * 1000);
                var c = init_end * 1000;
                end = new Date(init_end * 1000);
                start = d3.time.month.offset(end, -1);

//                var current_db = (App.db[0]);
//                var c = current_db.emails[current_db.emails.length - 1].timestamp * 1000;
//                end = new Date(c);
//                start = d3.time.month.offset(end, -1);
                $("#slider-range").slider('option', "values", [+start, +end]);
                $("#slider-range").slider('values', 1, c);
                $('#slider-text').html(formatter(start) + " - " + formatter(end));
                $('#slider-duration').html(longAgo(end, start));
                updateNetwork(true, 0, 0, -1);
                if (!App.isContactDetails && !App.isUserStats) {
                    showTopContacts(NTOPCONTACTS);
                }
                if (App.isContactDetails) {
                    showContactDetails(the_one_node, currentContact, start, end);
                }
            });

            $("#slider-pastweek").click(function () {
                var init_start = 100000000000, init_end = 0;
                for (var t = 0; t < App.db.length; t++) {
                    if (App.db[t].emails[0].timestamp < init_start) {
                        init_start = App.db[t].emails[0].timestamp;
                    }
                    if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                        init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                    }
                }
                init_start = new Date(init_start * 1000);
                var c = init_end * 1000;
                end = new Date(init_end * 1000);
                start = d3.time.week.offset(end, -1);

//                var current_db = (App.db[0]);
//                var c = current_db.emails[current_db.emails.length - 1].timestamp * 1000;
//                end = new Date(c);
//                start = d3.time.week.offset(end, -1);
                $("#slider-range").slider('option', "values", [+start, +end]);
                $("#slider-range").slider('values', 1, c);
                $('#slider-text').html(formatter(start) + " - " + formatter(end));
                $('#slider-duration').html(longAgo(end, start));
                updateNetwork(true, 0, 0, -1);
                if (!App.isContactDetails && !App.isUserStats) {
                    showTopContacts(NTOPCONTACTS);
                }
                if (App.isContactDetails) {
                    showContactDetails(the_one_node, currentContact, start, end);
                }
            });

            var play_timeline;
            $("#play_button").click(function () {//play the timeline
                var init_start = 100000000000, init_end = 0;
                for (var t = 0; t < App.db.length; t++) {
                    if (App.db[t].emails[0].timestamp < init_start) {
                        init_start = App.db[t].emails[0].timestamp;
                    }
                    if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                        init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                    }
                }
                init_start = start; //new Date(init_start * 1000);
                init_end = new Date(init_end * 1000);
                var c = init_end * 1000;
                start = init_start;
                end = start;

                flag_timeline = 1 - flag_timeline;
                if (flag_timeline == 1) {
                    play_timeline = setInterval(function () {
                        start = start;
                        end = ((d3.time.month.offset(end, 6) > init_end) ? init_end : d3.time.month.offset(end, 6));
                        if (end == init_end) { //end of the timeline, stop the interval
                            clearInterval(play_timeline);
                            flag_timeline = 0;
                        }
                        else { //move one month forward in the timeline
                            $("#slider-range").slider('option', "values", [+start, +end]);
                            //                        $("#slider-range").slider('values', 1, c);
                            $('#slider-text').html(formatter(start) + " - " + formatter(end));
                            $('#slider-duration').html(longAgo(end, start));
                            //                        updateNetwork(false, 0);
                            //                        if (!App.isContactDetails && !App.isUserStats) {
                            //                            showTopContacts(NTOPCONTACTS);
                            //                        }
                            //                        if (App.isContactDetails) {
                            //                            showContactDetails(the_one_node, currentContact, start, end);
                            //                        }
                        }
                    }, 5000);
                }
                else {
                    clearInterval(play_timeline);
                }
            });

            // date formatter for the slider text
            var init_start = 100000000000, init_end = 0;
            for (var t = 0; t < App.db.length; t++) {
                if (App.db[t].emails[0].timestamp < init_start) {
                    init_start = App.db[t].emails[0].timestamp;
                }
                if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                    init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                }
            }
            var a = init_start * 1000, c = init_end * 1000;
            end = new Date(init_end * 1000);
            start = new Date(init_start * 1000);

//            var current_db = (App.db[0]);
            var formatter = d3.time.format('%d %b %Y');
//            var a = current_db.emails[0].timestamp * 1000;
//
//            //var b = +new Date(2005,0,1);
//            var c = current_db.emails[current_db.emails.length - 1].timestamp * 1000;
//            start = new Date(a);
//            end = new Date(c);

            //fixed member node position
            if (App.type == "multi" && App.usersinfo.length <= App.memberThresForFixedPosition) {
                App.memberNodesPosition = new Array(App.db.length);
                var the_R = ($(window).height() - 50) / 3.0, theta = Math.PI * 2 / App.usersinfo.length; // /4.6
                for (var ii = 0; ii < App.db.length; ii++)
                    App.memberNodesPosition[ii] = {
                        x: -1 * the_R * Math.cos(theta * ii),
                        y: -1 * the_R * Math.sin(theta * ii)
                    };
            }

            //put lines to represent when each member join the timeline
            App.init_times = new Array(App.db.length);
            App.removed = new Array(App.db.length);
            for (var ii = 0; ii < App.db.length; ii++)
                App.removed[ii] = 0;
            
            var year_start = start.getFullYear(), year_end = end.getFullYear(); 
            var long_short = 1;
            for (var t = year_start + 1; t <= year_end; t++) {
                var slice_date = new Date(t, 1, 1);
                long_short = 1- long_short;
                d3.select("#timeline").append("div").attr("class", "timeline_slice").attr("id", "slice_" + (t-year_start))
                   .style("height", function(){
                       if(long_short == 1) return "7px";
                       return "16px";
                   });
                d3.select("#timeline").append("div").attr("class", "text_slice").attr("id", "textslice_" + (t-year_start));
            }
            for (var t = 0; t < App.db.length; t++) {//init time for each member
                App.init_times[t] = App.db[t].emails[0].timestamp;
                d3.select("#timeline").append("div").attr("class", "emerge_time").attr("id", "em_" + t)
                        .style("border-left", "4px solid " + color(t))
                        .style("height", "9px");
            }

            //initialize the slider text
            $('#slider-text').html(formatter(start) + " - " + formatter(end));
            $('#slider-duration').html(longAgo(end, start));

            //initialize the slider
            $("#slider-range").slider({
                range: true,
                min: a,
                max: c,
                values: [a, c],
                slide: function (event, ui) {
                    start = new Date(ui.values[0]);
                    end = new Date(ui.values[1]);
                    $('#slider-text').html(formatter(start) + " - " + formatter(end));
                    $('#slider-duration').html(longAgo(end, start));
                },
                change: function (event, ui) {
                    start = new Date(ui.values[0]);
                    end = new Date(ui.values[1]);
                    if (flag_timeline == 1)
                        updateNetwork(true, 0, 0, -1);
                    else
                        updateNetwork(true, 0, 0, -1);
                    if (!App.isContactDetails && !App.isUserStats) {
                        showTopContacts(NTOPCONTACTS);
                    }
                    if (App.isContactDetails) {
                        showContactDetails(the_one_node, currentContact, start, end);
                    }
                }
            });
        };

        //populate the left column with some basic info and aggregate statistics
        var initBasicInfo = function (aliases, userinfo) {
            var column = d3.select("#userinfopanel");

            //show user's name and all aliases in tooltip
            var content = "";

            if (App.type == "multi" || App.type == "single") {
                d3.select("#userinfopanel").style("display", "none");
                d3.range(App.db.length).forEach(function (t) {
                    var panel = d3.select("#rightcolumn").append("div").attr("class", "userinfopanel").attr("id", "userinfopanel_" + t).style("height", "98px");

                    panel.on("click", function(){ 
                        App.personal_stats = t; 
                        if(d3.select("#infolevel3_" + t).style("display") != "none"){
                            d3.selectAll(".infolevel3").style("display", "none");
                            d3.selectAll(".rankings").style("display", "none");
                            d3.selectAll(".histograms_container").style("display", "none");
                        }
                        else{
                            d3.selectAll(".infolevel3").style("display", "none");
                            d3.select("#infolevel3_" + t).style("display", "block");
                            d3.selectAll(".rankings").style("display", "none");
                            d3.select("#rankings_" + t).style("display", "block");
                            d3.selectAll(".histograms_container").style("display", "none");
                            d3.select("#user_stats_" + t).style("display", "block");
                            App.toggleinfo(true, false);
                        }
                    })
                    .on("mouseover", function () {
                        var t = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length));
                        if (App.removed[t] != 1) {
                            d3.selectAll(".userinfopanel").style("opacity", 0.2)
                                    .style("-webkit-transition", "opacity 0.3s ease-in-out")
                                    .style("-moz-transition", "opacity 0.3s ease-in-out");
                            d3.select(this).style("opacity", 1);
                            
                            for (var ii = 0; ii < App.graph.nodes.length; ii++) {
                                if (App.graph.nodes[ii].attr.contact.name == App.usersinfo[t].name) {
                                    App.viz.mouseoverNode(App.graph.nodes[ii]); break;
                                }
                            }
                        }
                    })
                    .on("mouseout", function () {
                        var t = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length));
                        if (App.removed[t] != 1) {
                            for (var ii = 0; ii < App.removed.length; ii++) {
                                if (App.removed[ii] == 1)
                                    d3.select("#userinfopanel_" + ii).style("opacity", 0.2);
                                else
                                    d3.select("#userinfopanel_" + ii).style("opacity", 1);
                            }
                            
                            for (var ii = 0; ii < App.graph.nodes.length; ii++) {
                                if (App.graph.nodes[ii].attr.contact.name == App.usersinfo[t].name) {
                                    App.viz.mouseoutNode(App.graph.nodes[ii]); break;
                                }
                            }
                        }
                    });
                    
                    var top_layer = panel.append("div").attr("class","top_layer");
                    top_layer.append("div").attr("class", "leftstack_img")//.style("position", "absolute")
                         .append("img").attr("id", "userpic").attr("class", "userpic_circle")
                         .style("border-color", color(t));
                    if (App.usersinfo[t].name != "Kevin Hu" && App.usersinfo[t]['picture'] !== undefined) {
                        panel.select("#userpic").attr("src", App.usersinfo[t]['picture']);
                    } else {
                        if(App.usersinfo[t].name == "Almaha Almalki") panel.select("#userpic").attr("src", "/static/images/demo_maha.png");
                        else if(App.usersinfo[t].name == "Sanjay Guruprasad") panel.select("#userpic").attr("src", "/static/images/demo_sanjay.png")
                        else if(App.usersinfo[t].name == "Jingxian Zhang") panel.select("#userpic").attr("src", "/static/images/demo_jingxian.png")
                        else if(App.usersinfo[t].name == "Cesar Hidalgo" || App.usersinfo[t].name == "Cesar A. Hidalgo") panel.select("#userpic").attr("src", "/static/images/demo_cesar.png")
                        else if(App.usersinfo[t].name == "Kevin Hu" || App.usersinfo[t].name == "Kevin Zeng Hu") panel.select("#userpic").attr("src", "/static/images/demo_kevin.png")
                        else panel.select("#userpic").attr("src", "/static/images/default_user_pic.jpg");
                    }
                    
                    top_layer.append("div").attr("id", "name").attr("class", "person_name").attr("class", "p_" + t)
                            .style("width", "85%")
                            .html(function(){ 
                                var str = App.usersinfo[t]['given_name'] + " " + App.usersinfo[t]['family_name'];
                                if(str.length > 17) return str.substring(0, 16) + "...";
                                return App.usersinfo[t]['given_name'] + " " + App.usersinfo[t]['family_name'];
                            });
                    if(App.type == "multi"){
                        top_layer.append("div").attr("class", "icons")
                                .append("img")
                                .attr("src", "/static/images/remove_new.png")
                                .style("opacity", 0.2)
                                .on("mouseover", function () {
                                    d3.select(this).style("opacity", 1);
                                })
                                .on("mouseout", function () {
                                    d3.select(this).style("opacity", 0.2);
                                })
                                .on("click", function () {//remove the person from the group
                                    App.removed[t] = 1 - App.removed[t];
                                    if (App.removed[t] == 1) {
                                        d3.select(this).attr("src", "/static/images/add_new.png");
                                        panel.style("opacity", 0.3);
                                        for (var ii = 0; ii < App.removed.length; ii++) {
                                            if (App.removed[ii] == 0)
                                                d3.select("#userinfopanel_" + ii).style("opacity", 1);
                                        }
                                        d3.selectAll(".node").style("opacity", 1);
                                        if (VMail.App.viz.labelsVisible) {
                                            d3.selectAll("use").style("opacity", 1);
                                        }
                                        //remove nodes of the member
                                        updateNetwork(true, 0, 0, t);

                                    }
                                    else {
                                        d3.select(this).attr("src", "/static/images/remove_new.png");
                                        panel.style("opacity", 1);
                                        //readd nodes of the member
                                        updateNetwork(true, 0, 0, t);
                                    }
                                });
                            }
                    panel.style("height", function () {
                        if (panel.select("#name").style("height").substring(0, panel.select("#name").style("height").indexOf("px")) > 30) {
                            return (80 + 29) + "px";
                        }
                        return "98px";
                    });

                    var infolevel = panel.append("div").attr("class", "leftstack");
                    infolevel.append("div").attr("class", "infolevel2").attr("id", "ncontacts")
                            .html(numParser((App.db[t].nCollaborators)) + ' collaborators');
                    infolevel.append("div").attr("class", "infolevel2").attr("id", "totalemails")
                            .html(numParser((App.db[t].emails.length)) + ' emails');
                    
                    //histograms for each member
                    var infolevel3 = d3.select("#rightcolumn").append("div").attr("class", "infolevel3").attr("id", "infolevel3_" + t).style('display', 'none');
                    var the_div = infolevel3.append("div");
                    the_div.append("a").attr("href", "#").attr("id", "my_stats").attr("class", "my_stats_" + t).text("My Stats");
                    the_div.append("a").attr("href", "#").attr("id", "top_collaborators").attr("class", "top_collaborators_" + t).text("Top Collaborators");
//                    .html("<div><a href=\"#\" id=\"my_stats\" id=\"my_stats_" + t +"\" >My Stats</a>   <a id=\"top_collaborators\" id=\"top_collaborators_" + t +"\" href=\"#\" >Top Collaborators</a></div>");
                    $('.my_stats_' + t).addClass('selectedlink');
                    $('.top_collaborators_' + t).removeClass('selectedlink');
                    infolevel3.select("#my_stats").on("click", function(){
                        var t = parseInt(d3.select(this).attr("class").substring(d3.select(this).attr("class").indexOf("stats_") + 6, d3.select(this).attr("class").length));
                        App.personal_stats = t;
                        App.toggleinfo(true, false);
                    });
                    infolevel3.select("#top_collaborators").on("click", function(){
                        var t = parseInt(d3.select(this).attr("class").substring(d3.select(this).attr("class").indexOf("ators_") + 6, d3.select(this).attr("class").length));
                        App.personal_stats = t;
                        App.toggleinfo(false, true);
                    });
                    var ranking = d3.select("#rightcolumn").append("div").attr("class", "rankings").attr("id", "rankings_" + t).style('display', 'none')
                            .html("<div class=\"rankingschoice\"><a href=\"#\" id=\"allTimesLink\">All-time</a><a id=\"thisYearLink\" href=\"#\">Within time-range</a></div><div id=\"rankings-content\"></div>")
                            .style("display", "none");
                    var container = d3.select("#rightcolumn").append("div").attr("id", "user_stats").attr("class", "histograms_container").attr("id", "user_stats_" + t).style('display', 'none');
                    initHistograms(t);
                });
            }
            else {

                if (userinfo['name'] === 'Demo User') {
                    $("#name").html(fict_name);
                    content = "<div>" + fict_email + "</div>";
                } else {
                    $("#name").html(userinfo['given_name'] + " " + userinfo['family_name']);
                    aliases.forEach(function (alias) {
                        content += "<div>" + alias + "</div>";
                    });
                }

                $("#name").attr("title", '').tooltip({content: content});

                //show user's picture
                if (userinfo['picture'] !== undefined) {
                    $("#userpic").attr("src", userinfo['picture']);
                } else {
                    $("#userpic").attr("src", "/static/images/default_user_pic.jpg");
                }

                //get the total number of email contacts
                $('#ncontacts').html(numParser((App.db[0].nCollaborators)) + ' collaborators');
                $('#totalemails').html(numParser((App.db[0].emails.length)) + ' emails');

            }
        };
        

        var numParser = function (num) {
            var digits = num.toString().split("");
            var len = digits.length;
            var commas = 0;
            if (len > 3) {
                if (len % 3 == 0)
                    commas = (len / 3) - 1;
                else
                    commas = Math.floor(len / 3);
                for (var i = 0; i < commas; i++) {
                    digits.splice(len - (3 * (i + 1)), 0, ',');
                }
                return digits.join("");
            } else
                return num;
        };

        App.snapshot = function (notext) {
            $('#loader').html("Taking a snapshot of your network...");
            $('#loader').fadeIn('fast');
            if (notext) {
                d3.select("svg#network").selectAll("text").style("display", "none");
            }
            var html = d3.select("svg#network").node().parentNode.innerHTML;
            if (notext) {
                d3.select("svg#network").selectAll("text").style("display", null);
            }

            //var b64 = 'data:image/svg+xml;base64,' + Base64.encode(html);
            canvg('networkcanvas', html, {renderCallback: function () {
                    var canvas = document.getElementById('networkcanvas');
                    var b64 = canvas.toDataURL("image/png");
                    b64 = b64.substring(22);
                    $.post('/snapshot', {'b64': b64}, function (response) {
                        $('#loader').fadeOut();
                        $('#open_snapshot').remove();
                        jQuery('<a/>', {
                            id: 'open_snapshot',
                            href: response.url,
                            target: '_blank',
                            text: 'open shapshot'
                        }).appendTo('#snapshot_holder');
                        $('#open_snapshot').effect("highlight", 1000);
                    });
                }});
        };

        var initHistograms = function (t) {
//            if (App.type != "multi") {

                var timestampsSent = (App.db[t].getEmailDatesSent());
                var timestampsRcv = (App.db[t].getEmailDatesRcv());
                var a = +new Date((App.db[t].emails[0].timestamp) * 1000);

                //var b = + new Date(2005,0,1);
                var histSettings = {
                    width: 250,
                    height: 150,
                    start: new Date(a),
                    end: new Date(),
                    interval: d3.time.year,
                    position: undefined,
                    dateformat: "'%y",
                    nTicks: 5,
                    prediction: true
                };
                var container = d3.select("#user_stats_" + t);
                histSettings.position = d3.select("#user_stats_" + t);

                //histSettings.ylabel = "Emails Sent";
                container.append("div").html("<b>Emails Sent</b>");
                VMail.Viz.plotTimeHistogram(timestampsSent, histSettings);

                //histSettings.ylabel="Emails Received";
                container.append("div").html("<b>Emails Received</b>");
                VMail.Viz.plotTimeHistogram(timestampsRcv, histSettings);

                var timestampsNewContacts = (App.db[t]).getTimestampsNewContacts();

                //histSettings.ylabel="New Collaborators";
                container.append("div").html("<b>New Collaborators</b>");
                VMail.Viz.plotTimeHistogram(timestampsNewContacts, histSettings);
                container.selectAll("svg").style("stroke", "white").style("fill", "white");
                container.selectAll("line").attr("stroke", "white");
                container.selectAll("path").style("stroke", "white");

//            }
        };
        
        App.charge_minus = function(){ $("#slider-charge").slider("value", $("#slider-charge").slider("value") - $("#slider-charge").slider("option", "step")); };
        App.charge_plus = function(){ $("#slider-charge").slider("value", $("#slider-charge").slider("value") + $("#slider-charge").slider("option", "step")); };
        App.nodes_minus = function(){ $("#slider-nodes").slider("value", $("#slider-nodes").slider("value") - $("#slider-nodes").slider("option", "step")); };
        App.nodes_plus = function(){ $("#slider-nodes").slider("value", $("#slider-nodes").slider("value") + $("#slider-nodes").slider("option", "step")); };
        App.links_minus = function(){ $("#slider-links").slider("value", $("#slider-links").slider("value") - $("#slider-links").slider("option", "step")); };
        App.links_plus = function(){ $("#slider-links").slider("value", $("#slider-links").slider("value") + $("#slider-links").slider("option", "step")); };
        App.personality_done = function(){
//            App.studyDone = 1;
            d3.select("#settings").style("display", "none");
            App.viz.recolorNodes();
            //save data to db
        };
        
        App.show_settings = function(show){
            if(show == 1){//settings clicked
                d3.select("#settings").style("display", "block");
            }
            else if(show == 0){//close clicked
                d3.select("#settings_back").style("display", "none");
                d3.select("#settings_panel").style("display", "block");
                
                d3.select("#settings").style("display", "none");
            }
            else{//back clicked
                d3.select("#settings_back").style("display", "none");
                d3.select("#settings_panel").style("display", "block");
            }
        };
        App.show_surveys = function(show){
            if(show == 1){//surveys clicked
                d3.select("#surveys").style("display", "block");
            }
            else if(show == 0){//close clicked
                d3.select("#surveys_back").style("display", "none");
                d3.select("#surveys_panel").style("display", "block");
                d3.select("#study_questions_inner").style("display", "none");
                d3.select("#results").style("display", "none");
                d3.select("#study_questions_inner2").style("display", "none");
                d3.select("#results_morality").style("display", "none");
                d3.select("#study_questions_inner3").style("display", "none");
                d3.select("#results_demographic").style("display", "none");
                d3.select("#sources").style("display", "none");
                
                d3.select("#surveys").style("display", "none");
            }
            else{//back clicked
                d3.select("#surveys_back").style("display", "none");
                d3.select("#surveys_panel").style("display", "block");
                d3.select("#study_questions_inner").style("display", "none");
                d3.select("#results").style("display", "none");
                d3.select("#study_questions_inner2").style("display", "none");
                d3.select("#results_morality").style("display", "none");
                d3.select("#study_questions_inner3").style("display", "none");
                d3.select("#results_demographic").style("display", "none");
                d3.select("#sources").style("display", "none");
            }
        };
        App.show_personality_results = function(){
            d3.select("#personality_svg_cover").select("svg").selectAll("*").remove();
            d3.select("#personality_svg_cover").style("display", "block");
            var p_margin = {top: 40, right: 80, bottom: 80, left: 80};
            var p_width = 600 - p_margin.left - p_margin.right, p_height = 500 - p_margin.top - p_margin.bottom;
            var p_svg = d3.select("#personality_svg")
                .attr("width", p_width + p_margin.left + p_margin.right).attr("height", p_height + p_margin.top + p_margin.bottom)
                .append("g").attr("transform", "translate(" + p_margin.left + "," + p_margin.top + ")");
            var xValue = function(d) { return d['Open-Mindedness'];}, // data -> value
                xScale = d3.scale.linear().range([0, p_width]), // value -> display
                xMap = function(d) { return xScale(xValue(d));}, // data -> display
                xAxis = d3.svg.axis().scale(xScale).orient("bottom")
                        .tickValues([0, 20, 40, 60, 80, 100]);

            // setup y
            var yValue = function(d) { return d['Conscientiousness'];}, // data -> value
                yScale = d3.scale.linear().range([p_height, 0]), // value -> display
                yMap = function(d) { return yScale(yValue(d));}, // data -> display
                yAxis = d3.svg.axis().scale(yScale).orient("left")
                        .tickValues([0, 20, 40, 60, 80, 100]);
            var p_data = new Array(App.usersinfo.length);
            for(var p = 0; p < App.usersinfo.length; p++){
                p_data[p] = {'Open-Mindedness': 0,
                             'Conscientiousness': 0,
                             'Extraversion': 0,
                             'Agreeableness': 0,
                             'Negative Emotionality': 0};
            }
            // for(var p = 0; p < App.usersinfo.length; p++){
            //     p_data[p]['Open-Mindedness'] = App.personality['Open-Mindedness'][p];
            //     p_data[p]['Conscientiousness'] = App.personality['Conscientiousness'][p];
            //     p_data[p]['Extraversion'] = App.personality['Extraversion'][p];
            //     p_data[p]['Agreeableness'] = App.personality['Agreeableness'][p];
            //     p_data[p]['Negative Emotionality'] = App.personality['Negative Emotionality'][p];
            // }
            xScale.domain([0, 100]); //d3.min(p_data, xValue)-1, d3.max(p_data, xValue)+1
            yScale.domain([0, 100]); //d3.min(p_data, yValue)-1, d3.max(p_data, yValue)+1
            p_svg.append("g") //x-axis
                .attr("class", "x axis")
                .attr("transform", "translate(0," + p_height/2 + ")")
                .call(xAxis)
              .append("text")
                .attr("class", "x_label")
                .attr("x", p_width)
                .attr("y", -6)
                .style("text-anchor", "end")
                .text("Open-Mindedness");
            p_svg.append("g") //y-axis
                .attr("class", "y axis")
                .attr("transform", "translate(" + p_width/2 + ", 0)")
                .call(yAxis)
              .append("text")
                .attr("class", "y_label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Conscientiousness");
            p_svg.selectAll(".dot")
                .data(p_data)
              .enter().append("circle")
                .attr("class", "dot")
                .attr("r", 4)
                .attr("cx", xMap)
                .attr("cy", yMap)
                .style("fill", function(d) { return "#ffffff";});
            p_svg.selectAll(".dot_text")
                .data(p_data)
              .enter().append("text")
                .attr("class", "dot_text")
                .attr("x", function(d){ return xScale(xValue(d)) - 6; })
                .attr("y", function(d){ return yScale(yValue(d)) - 10; })
                .text(function(d, i){ return App.usersinfo[i].name})
                .style("fill", function(d) { return "#ffffff";})
                .attr("fill", "white");
            p_svg.selectAll("line").attr("stroke", "white");
            p_svg.selectAll("path").style("stroke", "white");

            var selectData = [ { "text" : "Open-Mindedness" },
                { "text" : "Conscientiousness" },
                { "text" : "Extraversion" },
                { "text" : "Agreeableness"},
                { "text" : "Negative Emotionality"}
           ];
           var xInput = d3.select("#xSelect").on('change',xChange)
            .selectAll('option')
              .data(selectData)
              .enter()
            .append('option')
              .attr('value', function (d) { return d.text })
              .text(function (d) { return d.text ;});
           var yInput = d3.select("#ySelect").on('change',yChange)
            .selectAll('option')
              .data(selectData)
              .enter()
            .append('option')
              .attr('value', function (d) { return d.text })
              .text(function (d) { return d.text ;});
           function yChange() {
                var value = this.value; // get the new y value
                d3.select('.y_label') // change the yAxisLabel
                  .transition().duration(500)
                  .text(value);    
                d3.selectAll('.dot') // move the circles
                  .transition().duration(500)
                  .attr('cy',function (d) { return yScale(d[value]) });
                d3.selectAll('.dot_text') // move the circles
                  .transition().duration(500)
                  .attr('y',function (d) { return yScale(d[value]) - 10 });
           }

           function xChange() {
                var value = this.value; // get the new x value
                d3.select('.x_label') // change the xAxisLabel
                  .transition().duration(500)
                  .text(value);
                d3.selectAll('.dot') // move the circles
                  .transition().duration(500)
                  .attr('cx',function (d) { return xScale(d[value]); });
                d3.selectAll('.dot_text') // move the circles
                  .transition().duration(500)
                  .attr('x',function (d) { return xScale(d[value]) - 6; });
            }
            document.getElementById("ySelect").selectedIndex = "1";
        };
        App.show_test = function(test){
            if(test == 0){//demographic survey
                d3.select("#surveys_panel").style("display", "none");
                d3.select("#surveys_back").style("display", "block");
                d3.select("#sources").style("display", "block");
                if(App.studyDone_demographic[0] == 1){ //test done already
                    d3.select("#results").style("display", "block");
                    // App.show_personality_results();
                }
                else{
                    d3.select("#study_questions_inner3").style("display", "block");
                    if(App.initAutocomplete_done == 0) initAutocomplete();
                }
            }
            else if(test == 1){//personality test
                d3.select("#surveys_panel").style("display", "none");
                d3.select("#surveys_back").style("display", "block");
                d3.select("#sources").style("display", "block");
                if(App.studyDone[0] == 1){ //test done already
                    d3.select("#results").style("display", "block");
                    // App.show_personality_results();
                }
                else{
                    d3.select("#study_questions_inner").style("display", "block");
                }
                d3.select("#sources").select("a")
                  .attr("href", "https://www.outofservice.com/bigfive/")
                  .text("The Big Five Project Personality Test");
            }
            else if(test == 2){
                d3.select("#surveys_panel").style("display", "none");
                d3.select("#surveys_back").style("display", "block");
                d3.select("#sources").style("display", "block");
                if(App.studyDone_morality[0] == 1){ //test done already
                    d3.select("#results_morality").style("display", "block");
                    //App.show_morality_results();
                }
                else{
                    d3.select("#study_questions_inner2").style("display", "block");
                }
                d3.select("#sources").select("a")
                  .attr("href", "http://www.yourpersonality.net/political/griffin1.pl")
                  .text("The Moral Foundations Questionnaire");
            }
        };
        
        //nodes as organizations or people
        App.org_or_person = function (as_orgs, as_people) {
            if (as_orgs) {
                $('#as_orgs').addClass('selectedlink');
                $('#as_people').removeClass('selectedlink');
                App.node_as_org = 1;

                $("#members").fadeIn();
                $("#stats").fadeIn();
                d3.select("#paths").style("display", "none");
                d3.select("#influence_ranking").style("display", "none");
                d3.select("#we_lost_them").style("display", "none");
                d3.select("#contactDetails-content").selectAll("*").remove();
                d3.selectAll(".userinfopanel").style("display", "block");
                App.toggleMemberStats(true, false, false);
                document.getElementById("ranking_ascending").click();

                //disable see all/shared/members
                d3.select("#see_members").style("pointer-events", 'none');
                //disable coloring nodes by
//                d3.select("#color_method").style("pointer-events", 'none');
                //search box: look up orgs
                d3.select("label.heading2").html("Lookup Organizations");

                if (App.viz) {
                    App.viz = org_viz;
                    d3.selectAll(".for_ppl").style("display", "none");
                    d3.selectAll(".for_org").style("display", "block");
                    for (var t = 0; t < App.db.length; t++) {
                        if(App.colorMethod == 2){
                            d3.select("#userinfopanel_" + t).select("#userpic").style("border-color", "#8C8C8C");
                            d3.select("#em_" + t)
                                    .style("border-left", function () {
                                        return "3px solid #5a5854";
                                    });
                        }
                    }
                    updateNetwork(false, 0, 0,-1);
                }
            }
            if (as_people) {
                $('#as_people').addClass('selectedlink');
                $('#as_orgs').removeClass('selectedlink');
                App.node_as_org = 0;

                $("#members").fadeIn();
                $("#stats").fadeIn();
                $("#paths").fadeIn();
//                d3.select("#influence_ranking").style("display", "none");
//                d3.select("#we_lost_them").style("display", "none");
                d3.select("#contactDetails-content").selectAll("*").remove();
                App.toggleMemberStats(true, false, false);

                d3.select("#see_members").style("pointer-events", 'all');
//                d3.select("#color_method").style("pointer-events", 'all');
                d3.select("label.heading2").html("Lookup Contacts");

                if (App.viz) {
                    App.viz = viz;
                    d3.selectAll(".for_org").style("display", "none");
                    d3.selectAll(".for_ppl").style("display", "block");
                    for (var t = 0; t < App.db.length; t++) {
                        if(App.colorMethod == 1){
                            d3.select("#userinfopanel_" + t).select("#userpic").style("border-color", color(t));
                            d3.select("#em_" + t)
                                    .style("border-left", function () {
                                        return "3px solid " + color(t);
                                    });
                        }
                        
                    }
                    updateNetwork(false, 0, 0, -1);
                }
            }
        };

        //only show nodes of members in the group
        App.see_members = function (as_yes, as_half, as_no) {
            if (as_yes) {
                $('#as_yes').addClass('selectedlink');
                $('#as_half').removeClass('selectedlink');
                $('#as_no').removeClass('selectedlink');
                App.member_selected = 1;
                
                $("#slider-charge").slider("option", "min", VMail.App.charge_default[0] * (VMail.App.member_selected == 1 ? 10 : 1));
                $("#slider-charge").slider("option", "max", VMail.App.charge_default[2] * (VMail.App.member_selected == 1 ? 10 : 1));
                $("#slider-charge").slider("value", VMail.App.charge_default[1] * (VMail.App.member_selected == 1 ? 10 : 1));
                App.viz.settings.forceParameters.charge = VMail.App.charge_default[1] * (VMail.App.member_selected == 1 ? 10 : 1);
//                d3.select("#influence_ranking").style("display", "none");
//                d3.select("#we_lost_them").style("display", "none");
                d3.select("#contactDetails-content").selectAll("*").remove();
                App.toggleMemberStats(true, false, false);
                if(App.viz != null) App.viz.undoCenterNode();
                
                updateNetwork(false, 1, 0, -1);
            }
            if (as_half) {
                $('#as_half').addClass('selectedlink');
                $('#as_no').removeClass('selectedlink');
                $('#as_yes').removeClass('selectedlink');
                App.member_selected = 2;
                
//                d3.select("#influence_ranking").style("display", "none");
//                d3.select("#we_lost_them").style("display", "none");
                d3.select("#contactDetails-content").selectAll("*").remove();
                App.toggleMemberStats(true, false, false);
                if(App.viz != null) App.viz.undoCenterNode();
                
                if (App.graph){
                    $("#slider-charge").slider("option", "min", VMail.App.charge_default[0] * (VMail.App.member_selected == 1 ? 10 : 1));
                    $("#slider-charge").slider("option", "max", VMail.App.charge_default[2] * (VMail.App.member_selected == 1 ? 10 : 1));
                    $("#slider-charge").slider("value", VMail.App.charge_default[1] * (VMail.App.member_selected == 1 ? 10 : 1));
                    App.viz.settings.forceParameters.charge = VMail.App.charge_default[1] * (VMail.App.member_selected == 1 ? 10 : 1);
                    updateNetwork(false, 2, 0, -1);
                }
            }
            if (as_no) {
                $('#as_no').addClass('selectedlink');
                $('#as_half').removeClass('selectedlink');
                $('#as_yes').removeClass('selectedlink');
                App.member_selected = 0;
                
//                d3.select("#influence_ranking").style("display", "none");
//                d3.select("#we_lost_them").style("display", "none");
                d3.select("#contactDetails-content").selectAll("*").remove();
                App.toggleMemberStats(true, false, false);
                if(App.viz != null) App.viz.undoCenterNode();
                
                if (App.graph){
                    $("#slider-charge").slider("option", "min", VMail.App.charge_default[0] * (VMail.App.member_selected == 1 ? 10 : 1));
                    $("#slider-charge").slider("option", "max", VMail.App.charge_default[2] * (VMail.App.member_selected == 1 ? 10 : 1));
                    $("#slider-charge").slider("value", VMail.App.charge_default[1] * (VMail.App.member_selected == 1 ? 10 : 1));
                    App.viz.settings.forceParameters.charge = VMail.App.charge_default[1] * (VMail.App.member_selected == 1 ? 10 : 1);
                    updateNetwork(false, 0, 0, -1);
                }
            }
        };

        App.color_method = function (communities, people, personality) {
            if (communities) {
                App.colorMethod = 2; App.color_personality = -1;
//                $('#communities').addClass('selectedlink');
//                $('#people').removeClass('selectedlink');
                if(App.type == "multi"){
                    if(document.getElementById("for_personality_coloring") != null) document.getElementById("for_personality_coloring").checked = false;
                    d3.select("#personality_dropdown").select("label").text("Personality");
                }
                for (var t = 0; t < App.db.length; t++) {
                    d3.select("#userinfopanel_" + t).select("#userpic").style("border-color", "#8C8C8C");
                    d3.select("#em_" + t)
                            .style("border-left", function () {
                                return "3px solid #5a5854";
                            });
                }
                App.viz.recolorNodes();
            }
            if (people) {
                App.colorMethod = 1; App.color_personality = -1;
//                $('#people').addClass('selectedlink');
//                $('#communities').removeClass('selectedlink');
                if(App.type == "multi"){
                    if(document.getElementById("for_personality_coloring") != null) document.getElementById("for_personality_coloring").checked = false;
                    d3.select("#personality_dropdown").select("label").text("Personality");
                    for (var t = 0; t < App.db.length; t++) {
                        d3.select("#userinfopanel_" + t).select("#userpic").style("border-color", color(t));
                        d3.select("#em_" + t)
                            .style("border-left", function () {
                                return "3px solid " + color(t);
                            });
                    }
                    App.viz.recolorNodes();
                }
            }
            if(personality != -1){ //by personality
                document.getElementById("radio-member").checked = false;
                document.getElementById("radio-community").checked = false;
                if(document.getElementById("for_personality_coloring") != null) document.getElementById("for_personality_coloring").checked = true;
                App.colorMethod = 3;
                if(App.studyDone.indexOf(0) != -1){//not all users have finished study
                    var emails = "";
                    var emails_list = [];
                    for(var k = 0; k < VMail.App.usersinfo.length; k++){
                        if(App.studyDone[k] == 0){
                            emails = emails + VMail.App.usersinfo[k]['email'] + "&";
                            emails_list.push(k);
                        }
                    }
                    emails = emails.substring(0, emails.length - 1);
                    //console.log(emails);
                    // $.ajax({
                    //     dataType: "json",
                    //     url: "/get_personality/&json=" + emails,
                    //     success: function (personalities) {
                    //         //console.log();
                    //         console.log(personalities);
                    //         for(var ii = 0; ii < emails_list.length; ii ++){
                    //             if(JSON.stringify(personalities[ii]) != JSON.stringify({})){
                    //                 var k = emails_list[ii];
                    //                 VMail.App.studyDone[k] = 1;
                    //                 VMail.App.personality['Open-Mindedness'][k] = parseInt(personalities[ii]['personality']['Open-Mindedness']);
                    //                 VMail.App.personality['Conscientiousness'][k] = parseInt(personalities[ii]['personality']['Conscientiousness']);
                    //                 VMail.App.personality['Extraversion'][k] = parseInt(personalities[ii]['personality']['Extraversion']);
                    //                 VMail.App.personality['Agreeableness'][k] = parseInt(personalities[ii]['personality']['Agreeableness']);
                    //                 VMail.App.personality['Negative Emotionality'][k] = parseInt(personalities[ii]['personality']['Negative Emotionality']);
                    //             }
                    //         }
                    //         if(App.colorMethod == 3) App.viz.recolorNodes();
                    //     }
                    // });
                }
                App.color_personality = personality;
                for (var t = 0; t < App.db.length; t++) {
                    d3.select("#userinfopanel_" + t).select("#userpic").style("border-color", "#8C8C8C");
                    d3.select("#em_" + t)
                            .style("border-left", function () {
                                return "3px solid #5a5854";
                            });
                }
                d3.select("#personality_dropdown").select("label").text(function(){
                    switch(App.color_personality){
                        case 0: return 'Open-Mindedness'; break;
                        case 1: return 'Conscientiousness'; break;
                        case 2: return 'Extraversion'; break;
                        case 3: return 'Agreeableness'; break;
                        case 4: return 'Negative Emotionality'; break;
                        default: return "Personality"; 
                    }
                });
                App.viz.recolorNodes();
            }
        };

        App.toggleMemberStats = function (show_members, show_stats, show_paths) {
            $("#members").css("display", "block");
            $("#stats").css("display", "block");
            if(App.node_as_org == 0) $("#paths").css("display", "block");
            if (show_members) {
                //highlight the selected link
                $('#members').addClass('selectedrightheader'); 
                $('#members').css("border-bottom", "2px solid rgb(255,255,255)"); $('#members').css("font-weight", 400);
//                $('#stats').css("border-bottom", "2px solid rgb(255,255,255)"); $('#stats').css("font-weight", 400);
                $('#stats').removeClass('selectedrightheader'); 
                $('#stats').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#stats').css("font-weight", 300);
                $('#paths').removeClass('selectedrightheader'); 
                $('#paths').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#paths').css("font-weight", 300);
                App.rightPanel = 0;

                //update UI state
                d3.select("#contactDetails-content").selectAll("*").remove();
                if (App.type != "multi" && App.type != "single") {
//                    $('#userinfopanel').fadeIn();
//                    $('#user_stats').fadeIn();
                }
                else {
                    d3.selectAll(".userinfopanel").style("display", "block");
                    d3.selectAll(".for_paths").style("display", "none");
                    $("#influence_ranking").css("display", "none"); $("#we_lost_them").css("display", "none");
                }
            }
            if (show_stats) {
                //highlight the selected link
                $('#stats').addClass('selectedrightheader'); 
                $('#stats').css("border-bottom", "2px solid rgb(255,255,255)"); $('#stats').css("font-weight", 400);
                $('#members').removeClass('selectedrightheader'); 
                $('#members').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#members').css("font-weight", 300);
                $('#paths').removeClass('selectedrightheader'); 
                $('#paths').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#paths').css("font-weight", 300);
                App.rightPanel = 1;

                if (App.type != "multi" && App.type != "single") {
//                    $('#userinfopanel').hide();
//                    $('#user_stats').hide();
                }
                else {
                    d3.selectAll(".userinfopanel").style("display", "none");
                    d3.selectAll(".for_paths").style("display", "none");
                    if(App.removed.indexOf(1) != -1) $("#we_lost_them").css("display", "block");
                    $("#influence_ranking").css("display", "block");
                    d3.select("#influence_ranking").selectAll(".centrality_ranking").style("height", function(){ 
                        return document.getElementById(d3.select(this).select("p").attr("id")).offsetHeight + "px"; 
                    });
                }
            }
            if (show_paths) {
            }
        };
        
        App.toggleinfo = function (show_mystats, show_topcollab) {
            if(App.type != "multi" && App.type != "single"){
                if (show_mystats) {
                    //highlight the selected link
                    $('#my_stats').addClass('selectedlink');
                    $('#top_collaborators').removeClass('selectedlink');

                    //hide rankings and contactDetails and show user_stats
                    //update UI state
                    App.isUserStats = true;
                    App.wasUserStats = true;
                    App.isContactDetails = false;
                    $('#rankings').hide();
                    $("#contactDetails").hide();
                    d3.select("#contactDetails-content").selectAll("*").remove();
                    if (App.type != "multi" && App.type != "single") {
                        $('#userinfopanel').fadeIn();
                        $('#user_stats').fadeIn();
                    }
                    else {
                        d3.selectAll(".userinfopanel").style("display", "block");
                    }
                }
                if (show_topcollab) {
                    //highlight the selected link
                    $('#top_collaborators').addClass('selectedlink');
                    $('#my_stats').removeClass('selectedlink');

                    //hide user_stats and contactDetails and show rankings
                    //$("#contactDetails").fadeOut();
                    //$('#user_stats').fadeOut(400, function() {
                    showTopContacts(NTOPCONTACTS);
                    //});
                }
            }
            else if(App.personal_stats != -1){//type is "multi"
                if (show_mystats) {
                    //highlight the selected link
                    $('.my_stats_' + App.personal_stats).addClass('selectedlink');
                    $('.top_collaborators_' + App.personal_stats).removeClass('selectedlink');

                    //hide rankings and contactDetails and show user_stats
                    //update UI state
                    App.isUserStats = true;
                    App.wasUserStats = true;
                    App.isContactDetails = false;
                    $('#rankings_' + App.personal_stats).hide();
                    $("#contactDetails").hide();
                    d3.select("#contactDetails-content").selectAll("*").remove();
                    if (App.type != "multi" && App.type != "single") {
                        $('#userinfopanel').fadeIn();
                        $('#user_stats').fadeIn();
                    }
                    else {
                        $('#user_stats_' + App.personal_stats).fadeIn();
                        d3.selectAll(".userinfopanel").style("display", "block");
                    }
                }
                if (show_topcollab) {
                    //highlight the selected link
                    $('.top_collaborators_' + App.personal_stats).addClass('selectedlink');
                    $('.my_stats_' + App.personal_stats).removeClass('selectedlink');
                    
                    //hide user_stats and contactDetails and show rankings
                    //$("#contactDetails").fadeOut();
                    //$('#user_stats').fadeOut(400, function() {
                    showTopContacts(NTOPCONTACTS);
                    //});
                }
            }
        };

        var sendStatsToServer = function (ind) {
            var data = {};//alert("ind="+ind);
            data['ncollaborators'] = (App.db[ind]).nCollaborators;
            data['nsent'] = (App.db[ind]).nSent;
            data['nrcv'] = (App.db[ind]).nRcv;

            // reply times
            var myReplyTimes = (App.db[ind]).myReplyTimes;
            var othersReplyTimes = (App.db[ind]).othersReplyTimes;
            data['replyTimesMedian'] = {
                'my': {
                    'all': d3.median(myReplyTimes.all),
                    'pastYear': d3.median(myReplyTimes.pastYear),
                    'pastMonth': d3.median(myReplyTimes.pastMonth),
                    'pastWeek': d3.median(myReplyTimes.pastWeek)
                },
                'others': {
                    'all': d3.median(othersReplyTimes.all),
                    'pastYear': d3.median(othersReplyTimes.pastYear),
                    'pastMonth': d3.median(othersReplyTimes.pastMonth),
                    'pastWeek': d3.median(othersReplyTimes.pastWeek)
                }
            };
            $.post('/sendstats', {'json': JSON.stringify(data)});
        };


        var show_response_time = function(){
            var colors = ['rgb(171, 43, 43)', 'rgb(27, 70, 108)'];
            var color = d3.scale.category10().range(colors);

            // d3.select("#responsetime1").selectAll("*").remove();
            
            var p_margin = {top: 20, right: 30, bottom: 40, left: 120};
            var p_svg = d3.select("#responsetime2")
                .attr("width", $(".viz_responsetime").width() + "px").attr("height", "300px")
                .append("g").attr("transform", "translate(" + p_margin.left + "," + p_margin.top + ")");
            var svg_width = $("#responsetime2").width(), svg_height = $("#responsetime2").height();
            var p_width = svg_width - p_margin.left - p_margin.right, p_height = svg_height - p_margin.top - p_margin.bottom;
            
            var new_data = [], aves = {}, ave_data = [];
            var name_domains = [], responseTime = [];

            for(var name in App.db[0].responseTime['contacts']){
                var time_data = App.db[0].responseTime['contacts'][name];
                var empty = 1;
                ave_data.push({'name': App.db[0].responseTime['contacts'][name], 'ave': null, 'median': null});
                aves[name] = [];
                name_domains.push(name);
                responseTime.push({'name': name, 'time': App.db[0].responseTime['contacts'][name]});
            }
            var min_median = 10000000, min_median_index = 0;
            var reducer = function(a, b) { return a + b; };
            for(var name in App.db[0].responseTime['contacts']){
                var time_data = App.db[0].responseTime['contacts'][name];
                
                if(time_data.length != 0){
                    // all_data = all_data.concat(time_data[member]);
                    var ave = time_data.reduce(reducer) / time_data.length,
                        square = time_data.map(function(d) { return Math.pow(d - ave, 2); }).reduce(reducer) / time_data.length,
                        ci0 = ave - 1.96 * Math.sqrt(square) / Math.sqrt(time_data.length),
                        ci1 = ave + 1.96 * Math.sqrt(square) / Math.sqrt(time_data.length);
                    new_data.push({"to": App.usersinfo[0].name, "from": name, "times": time_data, "mean": parseFloat(ave.toFixed(2)), "max": d3.max(time_data), "min": d3.min(time_data), "ci0": parseFloat(ci0.toFixed(2)), "ci1": parseFloat(ci1.toFixed(2)), "median": d3.quantile(time_data.sort(d3.ascending), 0.5), "quartile1": d3.quantile(time_data.sort(d3.ascending), 0.25), "quartile3": d3.quantile(time_data.sort(d3.ascending), 0.75)});
                }
            }

            for(var k = 0; k < new_data.length; k++){
                if(new_data[k].median < min_median){
                    min_median = new_data[k].median;
                    min_median_index = k;
                }
            }
            
            var x = d3.scale.ordinal()     
                .domain(name_domains)  
                .rangeRoundBands([0 , p_height * 0.78], 0.7, 0.3);        

            var time_max = Math.pow(2, Math.ceil(Math.log(d3.max(new_data, function(d){ return d.quartile3;}) + 60) / Math.log(2)));
            max_contact_response_time = time_max;
            var formatNumber = d3.format(",.0f");
            var min_for_x = 1;
            var y = d3.scale.linear()
                .domain([0, time_max]) 
                .range([0, p_width]),
                y_log = d3.scale.log().base(2)
                .domain([min_for_x, time_max])
                .range([0, p_width]);
            
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("left");
            var yAxis = d3.svg.axis()
                .scale(y_log).ticks(6, function(d) { return formatNumber(d) })
                .orient("bottom");

            //draw y axis
            p_svg.append("g")
                .attr("class", "x axis")
                .call(xAxis);
                // .append("text") // and text1
                  // .attr("transform", "rotate(-90)")
                  // .attr("y", 6)
                  // .attr("dy", ".71em")
                  // .style("text-anchor", "end")
                  // .style("font-size", "16px")
                  // .text("Members");        
            // draw x axis  
            p_svg.append("g")
              .attr("class", "y axis")
              .attr("transform", "translate(0," + (p_height * 0.78) + ")")
              .call(yAxis)
              .append("text")             // text label for the x axis
                .attr("x", (p_width - 50))
                .attr("y",  26 )
                .attr("dy", ".71em")
                // .style("text-anchor", "start")
                .style("font-size", "15px") 
                .attr("font-size", "15px").attr("font-weight", 300)
                .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                .style("fill", "white").style("font-family", "'Lato', sans-serif")
                .text("Minutes"); 

            function make_y_axis2() {        
                return d3.svg.axis()
                    .scale(x)
                     .orient("left")
                     .ticks(Object.keys(App.db[0].responseTime['contacts']).length);
            }
            p_svg.append("g")         
                .attr("class", "grid")
                .call(make_y_axis2()
                    .tickSize(-p_width, 0, 0)
                    .tickFormat("")
                );
            p_svg.select(".grid").selectAll("path").style("opacity", 0);
            p_svg.select(".grid").selectAll("line").style("stroke", "rgba(255,255,255,0.4)");
            p_svg.select(".x.axis").selectAll("line").style("stroke", "rgba(255,255,255,0.4)");
            p_svg.select(".x.axis").selectAll("path").style("opacity", 0);
            p_svg.select(".x.axis").selectAll("text")
                .style("fill", "white").attr("fill", "white")
                .attr("font-family", "'Lato', sans-serif").style("font-family", "'Lato', sans-serif")
                .style("font-size", "12px").attr("font-size", "12px").style("font-weight", 300);
            p_svg.select(".y.axis").selectAll("text")
                .style("fill", "white").attr("fill", "white")
                .attr("font-family", "'Lato', sans-serif").style("font-family", "'Lato', sans-serif")
                .style("font-size", "15px").attr("font-size", "15px").style("font-weight", 300);

            p_svg.select(".y.axis").select("path").style("fill", "none").attr("fill", "none").style("stroke", "white").attr("stroke", "white");
            p_svg.select(".y.axis").selectAll("line").attr("stroke", "white").attr("stroke-width", '1px').attr("fill", "white");

            var color = function(name){
                // var i = 0;
                // for(var member in App.db[0].responseTime['contacts']){
                //     if(name == member){
                //         break;
                //     }
                //     i++;
                // }
                // var colors = ["#D82020", "#D83A20", "#D85B20", "#D88520", "#D8AD20", "#E1C320", "#D4D820", "#C2D820", "#90D820", "#5ED820", "#2CD820", "#26CB79", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
                // return colors[Math.round(i * (colors.length - 1) / (Object.keys(App.db[0].responseTime).length - 1))];
                return "#E1C320";
            };
            var size_scale =d3.scale.linear().domain([d3.min(new_data, function(d){ return d.times.length;}), d3.max(new_data, function(d){ return d.times.length;})]).range([5, 15]);
            var baseY = p_height * 0.78 / responseTime.map(function(d) { return d['name'];}).length * 0.157;
            var box = p_svg.selectAll(".box")      
              .data(new_data)
              .enter().append("g")
              .attr("class", "box")
              // .attr("transform", function(d) { return "translate(" +  y(d["mean"])  + "," + x(d["from"]) + ")"; })
              .attr("transform", function(d) { return "translate(" +  y_log(d["median"])  + "," + x(d["from"]) + ")"; })
              .style("opacity", 0.85);
            box.append("line").attr("class", "box_line")
               // .attr("x1", function(d){ return (y(d["ci0"]<0? 0:(d["ci0"]>time_max? time_max:d["ci0"])) - y(d["mean"]));}).attr("y1", baseY)
               // .attr("x2", function(d){ return (y(d["ci1"]>time_max? time_max:(d["ci1"]<0? 0:d["ci1"])) - y(d["mean"]));}).attr("y2", baseY)
               .attr("x1", function(d){ return (y_log(d["quartile1"]<min_for_x? min_for_x:(d["quartile1"]>time_max? time_max:d["quartile1"])) - y_log(d["median"]));}).attr("y1", baseY)
               .attr("x2", function(d){ return (y_log(d["quartile3"]>time_max? time_max:(d["quartile3"]<min_for_x? min_for_x:d["quartile3"])) - y_log(d["median"]));}).attr("y2", baseY)
               .attr("stroke", function(d){ return color(d["to"]); })
               .attr("stroke-width", "2").attr("opacity", 0.85);
            box.append("circle").attr("class", "box_circle")
               .attr("cx", 0).attr("cy", baseY)
               .attr("stroke", null)
               .attr("fill", function(d){ return color(d["to"]); })
               .attr("r", function(d){
                    return size_scale(d.times.length);
               })
               .attr("opacity", function(d){ return (d['median']<min_for_x? 0:(d['median']>time_max? 0:1));})
               .on("mouseover", function(d){
                    var t = d3.transform(d3.select(this.parentNode).attr("transform")),
                        tx = t.translate[0],
                        ty = t.translate[1];
                    p_svg.select("#cursor_line").attr("opacity", 1)
                        .attr("x1", parseFloat(d3.select(this).attr("cx")) + tx)
                        .attr("y1", parseFloat(d3.select(this).attr("cy")) + ty + size_scale(d.times.length))
                        .attr("x2", parseFloat(d3.select(this).attr("cx")) + tx)
                        .attr("y2", p_height * 0.78);
               })
               .on("mouseout", function(d){
                    p_svg.select("#cursor_line").attr("opacity", 0);
               });
            box.append("rect").attr("class", "box_rect1")
               .attr("x", function(d){ return (y_log(d["quartile1"]) - y_log(d["median"])) - 1;})
               .attr("width", function(d){ return (d["quartile1"]<0? 0:2);})
               .attr("y", baseY - 10)
               .attr("opacity", function(d){ return (d['quartile1']<min_for_x? 0:(d['quartile1']>time_max? 0:0.4));})
               .attr("height", 20).attr("opacity", 0.85)
               .attr("fill", function(d){ return color(d["to"]); });
            box.append("rect").attr("class", "box_rect2")
               .attr("x", function(d){ return (y_log(d["quartile3"]) - y_log(d["median"])) - 1;})
               .attr("width", function(d){ return (d["quartile3"]>time_max? 0:2);})
               .attr("y", baseY - 10)
               .attr("opacity", function(d){ return (d['quartile3']>time_max? 0:(d['quartile3']<min_for_x? 0:0.4));})
               .attr("height", 20).attr("opacity", 0.85)
               .attr("fill", function(d){ return color(d["to"]); });
            
            p_svg.append("line").attr("id", "cursor_line")
                .style("stroke-dasharray", ("4, 4"))
                .attr("stroke", "rgba(230,230,230,0.9)")
                .attr("opacity", 0);

            var report = d3.select("#whole_report");
            report.select("#report_p8").html('Here is how your top 5 contacts respond to you. Among the five contacts, ' 
                + new_data[min_median_index].from + ' had the <b>shortest median response time</b> to you. ' 
                + new_data[min_median_index].from + '\'s median response time is ' + new_data[min_median_index].median 
                + ' mins, the first quartile (Q1) is ' + new_data[min_median_index].quartile1 
                + ' mins, and third quartile (Q3) is ' + new_data[min_median_index].quartile3 + ' mins.');
        };

        var max_contact_response_time = 1000;
        var show_my_response_time = function(){
            var colors = ['rgb(171, 43, 43)', 'rgb(27, 70, 108)'];
            var color = d3.scale.category10().range(colors);

            // d3.select("#responsetime1").selectAll("*").remove();
            
            var p_margin = {top: 20, right: 30, bottom: 60, left: 120};
            var p_svg = d3.select("#responsetime1")
                .attr("width", $(".viz_responsetime").width() + "px").attr("height", "180px")
                .append("g").attr("transform", "translate(" + p_margin.left + "," + p_margin.top + ")");
            var svg_width = $("#responsetime1").width(), svg_height = $("#responsetime1").height();
            var p_width = svg_width - p_margin.left - p_margin.right, p_height = svg_height - p_margin.top - p_margin.bottom;
            
            var new_data = [];
            var name_domains = [], responseTime = [];

            name_domains.push(App.usersinfo[0].name);
            responseTime.push({'name': App.usersinfo[0].name, 'time': App.db[0].responseTime['my']});
            var reducer = function(a, b) { return a + b; };
            
            var time_data = App.db[0].responseTime['my'];
            var return_date = []
            if(time_data.length != 0){
                var ave = time_data.reduce(reducer) / time_data.length,
                    square = time_data.map(function(d) { return Math.pow(d - ave, 2); }).reduce(reducer) / time_data.length,
                    ci0 = ave - 1.96 * Math.sqrt(square) / Math.sqrt(time_data.length),
                    ci1 = ave + 1.96 * Math.sqrt(square) / Math.sqrt(time_data.length);
                new_data.push({"from": App.usersinfo[0].name, "times": time_data, "mean": parseFloat(ave.toFixed(2)), "max": d3.max(time_data), "min": d3.min(time_data), "ci0": parseFloat(ci0.toFixed(2)), "ci1": parseFloat(ci1.toFixed(2)), "median": d3.quantile(time_data.sort(d3.ascending), 0.5), "quartile1": d3.quantile(time_data.sort(d3.ascending), 0.25), "quartile3": d3.quantile(time_data.sort(d3.ascending), 0.75)});
                return_data = [new_data[0]['median'], new_data[0]['mean'], new_data[0]['quartile1'], new_data[0]['quartile3']];
            }
            
            var x = d3.scale.ordinal()     
                .domain(name_domains)  
                .rangeRoundBands([0 , p_height * 0.78], 0.7, 0.3);        

            var time_max = Math.pow(2, Math.ceil(Math.log(d3.max(new_data, function(d){ return d.quartile3;}) + 60) / Math.log(2)));
            var formatNumber = d3.format(",.0f");
            var min_for_x = 1;
            var y = d3.scale.linear()
                .domain([0, max_contact_response_time]) 
                .range([0, p_width]),
                y_log = d3.scale.log().base(2)
                .domain([min_for_x, max_contact_response_time])
                .range([0, p_width]);
            
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("left");
            var yAxis = d3.svg.axis()
                .scale(y_log).ticks(6, function(d) { return formatNumber(d) })
                .orient("bottom");

            //draw y axis
            p_svg.append("g")
                .attr("class", "x axis")
                .call(xAxis);        
            // draw x axis  
            p_svg.append("g")
              .attr("class", "y axis")
              .attr("transform", "translate(0," + (p_height * 0.78) + ")")
              .call(yAxis)
              .append("text")             // text label for the x axis
                .attr("x", (p_width - 50))
                .attr("y",  26 )
                .attr("dy", ".71em")
                // .style("text-anchor", "start")
                .style("font-size", "15px") 
                .style("fill", "white").style("font-family", "'Lato', sans-serif")
                .attr("font-size", "15").attr("font-weight", 300)
                .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                .text("Minutes"); 

            function make_y_axis2() {        
                return d3.svg.axis()
                    .scale(x)
                     .orient("left")
                     .ticks(Object.keys(App.db[0].responseTime['my']).length);
            }
            p_svg.append("g")         
                .attr("class", "grid")
                .call(make_y_axis2()
                    .tickSize(-p_width, 0, 0)
                    .tickFormat("")
                );
            p_svg.select(".grid").selectAll("path").style("opacity", 0);
            p_svg.select(".grid").selectAll("line").style("stroke", "rgba(255,255,255,0.4)");
            p_svg.select(".x.axis").selectAll("line").style("stroke", "rgba(255,255,255,0.4)");
            p_svg.select(".x.axis").selectAll("path").style("opacity", 0);
            p_svg.select(".x.axis").selectAll("text")
                .style("fill", "white").attr("fill", "white")
                .attr("font-family", "'Lato', sans-serif").style("font-family", "'Lato', sans-serif")
                .style("font-size", "12px").attr("font-size", "12px").style("font-weight", 300);
            p_svg.select(".y.axis").selectAll("text")
                .style("fill", "white").attr("fill", "white")
                .attr("font-family", "'Lato', sans-serif").style("font-family", "'Lato', sans-serif")
                .style("font-size", "15px").attr("font-size", "15px").style("font-weight", 300);

            p_svg.select(".y.axis").select("path").style("fill", "none").attr("fill", "none").style("stroke", "white").attr("stroke", "white");
            p_svg.select(".y.axis").selectAll("line").attr("stroke", "white").attr("stroke-width", '1px').attr("fill", "white");

            var color = function(name){
                return "#D83A20";
            };
            var size_scale =d3.scale.linear().domain([d3.min(new_data, function(d){ return d.times.length;}), d3.max(new_data, function(d){ return d.times.length;})]).range([5, 15]);
            var baseY = p_height * 0.78 / responseTime.map(function(d) { return d['name'];}).length * 0.157;
            var box = p_svg.selectAll(".box")      
              .data(new_data)
              .enter().append("g")
              .attr("class", "box")
              // .attr("transform", function(d) { return "translate(" +  y(d["mean"])  + "," + x(d["from"]) + ")"; })
              .attr("transform", function(d) { return "translate(" +  y_log(d["median"])  + "," + (x(d["from"])+1) + ")"; })
              .style("opacity", 0.85);
            box.append("line").attr("class", "box_line")
               // .attr("x1", function(d){ return (y(d["ci0"]<0? 0:(d["ci0"]>time_max? time_max:d["ci0"])) - y(d["mean"]));}).attr("y1", baseY)
               // .attr("x2", function(d){ return (y(d["ci1"]>time_max? time_max:(d["ci1"]<0? 0:d["ci1"])) - y(d["mean"]));}).attr("y2", baseY)
               .attr("x1", function(d){ return (y_log(d["quartile1"]<min_for_x? min_for_x:(d["quartile1"]>time_max? time_max:d["quartile1"])) - y_log(d["median"]));}).attr("y1", baseY)
               .attr("x2", function(d){ return (y_log(d["quartile3"]>time_max? time_max:(d["quartile3"]<min_for_x? min_for_x:d["quartile3"])) - y_log(d["median"]));}).attr("y2", baseY)
               .attr("stroke", function(d){ return color(d["to"]); })
               .attr("stroke-width", "2").attr("opacity", 0.85);
            box.append("circle").attr("class", "box_circle")
               .attr("cx", 0).attr("cy", baseY)
               .attr("stroke", null)
               .attr("fill", function(d){ return color(d["to"]); })
               .attr("r", 8)
               .attr("opacity", function(d){ return (d['median']<min_for_x? 0:(d['median']>time_max? 0:1));})
               .on("mouseover", function(d){
                    var t = d3.transform(d3.select(this.parentNode).attr("transform")),
                        tx = t.translate[0],
                        ty = t.translate[1];
                    p_svg.select("#cursor_line").attr("opacity", 1)
                        .attr("x1", parseFloat(d3.select(this).attr("cx")) + tx)
                        .attr("y1", parseFloat(d3.select(this).attr("cy")) + ty + size_scale(d.times.length))
                        .attr("x2", parseFloat(d3.select(this).attr("cx")) + tx)
                        .attr("y2", p_height * 0.78);
               })
               .on("mouseout", function(d){
                    p_svg.select("#cursor_line").attr("opacity", 0);
               });
            box.append("rect").attr("class", "box_rect1")
               .attr("x", function(d){ return (y_log(d["quartile1"]) - y_log(d["median"])) - 1;})
               .attr("width", function(d){ return (d["quartile1"]<0? 0:2);})
               .attr("y", baseY - 10)
               .attr("opacity", function(d){ return (d['quartile1']<min_for_x? 0:(d['quartile1']>time_max? 0:0.4));})
               .attr("height", 20).attr("opacity", 0.85)
               .attr("fill", function(d){ return color(d["to"]); });
            box.append("rect").attr("class", "box_rect2")
               .attr("x", function(d){ return (y_log(d["quartile3"]) - y_log(d["median"])) - 1;})
               .attr("width", function(d){ return (d["quartile3"]>time_max? 0:2);})
               .attr("y", baseY - 10)
               .attr("opacity", function(d){ return (d['quartile3']>time_max? 0:(d['quartile3']<min_for_x? 0:0.4));})
               .attr("height", 20).attr("opacity", 0.85)
               .attr("fill", function(d){ return color(d["to"]); });
            
            p_svg.append("line").attr("id", "cursor_line")
                .style("stroke-dasharray", ("4, 4"))
                .attr("stroke", "rgba(230,230,230,0.9)")
                .attr("opacity", 0);

            return return_data;
        };

        var timestamps_hours = null, timestamps_days = null;
        var show_time_pattern = function(){
            var sendHour_data = [], sendDay_data = [];
            var reducer = function(a, b) { return a + b; };
            var days_map = ["1(Mon)", "2(Tue)", "3(Wed)", "4(Thu)", "5(Fri)", "6(Sat)", "7(Sun)"], hours_map = [];
            var days_full_map = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            var the_scale = "normalized_value";
            var current_data = "hour";
            var colors = ["#759143", "#993F88"];

            var start_year = Object.keys(timestamps_hours)[0], end_year = Object.keys(timestamps_hours)[0];
            for(var year in timestamps_hours){
                if(year < start_year) start_year = year;
                if(year > end_year) end_year = year;
            }
            var name = App.usersinfo[0].name;
            var max_hour_index, max_hour = 0, max_day_index, max_day = 0;
            for(var year in timestamps_hours){
                for(var jj = 0; jj < timestamps_hours[year].length; jj++){
                    var the_time = (jj*2 < 10 ? '0' + (jj*2).toString() : (jj*2).toString()) + ":00 - " + ((jj+1)*2 < 10 ? '0' + ((jj+1)*2).toString() : ((jj+1)*2).toString()) + ":00";
                    // var the_time = (jj*2 <= 12 ? (jj*2).toString() : (jj*2 - 12).toString()) + " - " + ((jj+1)*2 <= 12 ? ((jj+1)*2).toString() + "am" : ((jj+1)*2 - 12).toString() + "pm");
                    sendHour_data.push({'hour': jj * 2, 'color': colors[0], 'name': name, 'volume': timestamps_hours[year][jj], 'year': year, 'normalized_volume': timestamps_hours[year][jj] / App.usersinfo[0]['use_length'], 'time': the_time});
                    hours_map.push(the_time);
                }
            }
            for(var k = 0; k < 12; k++){
                var count = 0;
                for(var l = 0; l < sendHour_data.length; l++){
                    if(sendHour_data[l].hour == k * 2){
                        count += sendHour_data[l].normalized_volume;
                    }
                }
                if(count > max_hour){
                    max_hour = count;
                    max_hour_index = k;
                }
            }
            for(var year in timestamps_days){
                for(var jj = 0; jj < timestamps_days[year].length; jj++)
                    sendDay_data.push({'day': jj, 'color': colors[1], 'name': name, 'volume': timestamps_days[year][jj], 'year': year, 'normalized_volume': timestamps_days[year][jj] / App.usersinfo[0]['use_length'], 'time': days_map[jj]});
            }
            for(var k = 0; k < 7; k++){
                var count = 0;
                for(var l = 0; l < sendDay_data.length; l++){
                    if(sendDay_data[l].day == k){
                        count += sendDay_data[l].normalized_volume;
                    }
                }
                if(count > max_day){
                    max_day = count;
                    max_day_index = k;
                }
            }
            d3.select("#time_patterns").style("height", $('#time_patterns').width() / 2 / 2 + "px");
            var visualization_hours = d3plus.viz()
                .container("#viz_hours")
                .data(sendHour_data)
                .type("stacked")
                .id("name")
                .text("name")
                .color("color")
                .y("normalized_volume")
                .y({"ticks": {"font": {"color": "#fff"}}, "label": {"value": "Emails per day", "padding": 5, "font": {"color": "#fff", "size": 12}}})
                .x({"value": "time", "label": {"value": "Email sent hours", "padding": 6}})
                .x({"ticks": {"font": {"color": "#fff", "size": 10}}})
                .tooltip(['volume', 'normalized_volume', 'time'])
                // .font({ "size": 12 })
                .background("#2f3140")
                .axes({"background": {"color": "#2f3140"}})
                .draw();
            var visualization_days = d3plus.viz()
                .container("#viz_days")
                .data(sendDay_data)
                .type("stacked")
                .id("name")
                .text("name")
                .color("color")
                .y("normalized_volume")
                .y({"ticks": {"font": {"color": "#fff"}}, "label": {"value": "Emails per day", "padding": 5, "font": {"color": "#fff", "size": 12}}})
                .x({"value": "time", "label": {"value": "Email sent days", "padding": 6}})
                .x({"ticks": {"font": {"color": "#fff", "size": 14}}})
                .tooltip(['volume', 'normalized_volume', 'percentage', 'time'])
                // .font({ "size": 12 })
                .background("#2f3140")
                .axes({"background": {"color": "#2f3140"}})
                .draw();

            var report = d3.select("#whole_report");
            report.select("#report_p9").html('Visualization below present your time pattern in sending emails. Your most avtive hours in sending emails is <b>' 
                + ((max_hour_index*2 < 10 ? '0' + (max_hour_index*2).toString() : (max_hour_index*2).toString()) + ":00 - " + ((max_hour_index+1)*2 < 10 ? '0' + ((max_hour_index+1)*2).toString() : ((max_hour_index+1)*2).toString()) + ":00") + '</b>. '
                + 'Your most active day in a week is <b>' + days_full_map[max_day_index] + '</b>.');

            d3.select("#whole_report_cover").style("height", $('#whole_report').height() + 100 + "px");
            setTimeout(function(){
                d3.select("#footer_analysis").style("display", "block");
                d3.select("#generate_pdf").style("display", "block");
                d3.select("#info").style("display", "block");
            }, 200);
            
            // d3.select("#viz_hours").select("#viz_single").attr("display", "block").style("display", "block")
            //   .style("height", $(".viz_two").height() + "px").attr("height", $(".viz_two").height());
            // d3.select("#viz_hours").select("svg#d3plus").attr("display", "block").style("display", "block")
            //   .style("height", $(".viz_two").height() + "px").attr("height", $(".viz_two").height());
                        
        };

        // show initial data including our own details (left column),
        // the unfiltered network (center column), and the ranking list (right column).
        // This function gets called once the server has fetched the inital batch of emails
        var showData = function () {
            var init_start = App.db[0].emails[0].timestamp, init_end = 0;
            for (var t = 0; t < App.db.length; t++) {
                if (App.db[t].emails[0].timestamp < init_start) {
                    init_start = App.db[t].emails[0].timestamp;
                }
                if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                    init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                }
            }
            start = new Date((init_start) * 1000);
            end = new Date();
            start_year = new Date(init_start * 1000); end_year = new Date(init_end * 1000);
            start_year = start_year.getFullYear(); end_year = end_year.getFullYear(); 

            d3.select("#whole_report_cover").style("display", "block");
            var report = d3.select("#whole_report");
            report.select("#header_pic").style("display", "block")
            setTimeout(function(){
                report.select("#header_pic").style("width", $('#whole_report').width() * 0.26 + "px");
                report.select("#header_pic").style("height", $('#header_pic').width() * 354/944 + "px").attr("src", "/static/images/basic-url-logo2_horizontal.png");
                report.select("#report_title").text(App.usersinfo[0].name + "'s Personal Report");
            }, 1200);

            setTimeout(function(){
                var user_orgs = [];
                if('aliases' in App.usersinfo[0]){
                    for(var k = 0; k < App.usersinfo[0].aliases.length; k++){
                        var domain = App.usersinfo[0].aliases[k].substring(App.usersinfo[0].aliases[k].indexOf("@") + 1, App.usersinfo[0].aliases[k].length);
                        var search_or_not = 1;
                        for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                            if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                                search_or_not = 0; break;
                            }
                        }
                        if(domain in VMail.App.org_domains){
                            search_or_not = 0;
                            if(user_orgs.indexOf(VMail.App.org_domains[domain].name) == -1 && VMail.App.org_domains[domain].name != VMail.App.org_domains[domain].domain){
                                user_orgs.push(VMail.App.org_domains[domain].name);
                            }
                        }
                        if(search_or_not == 1){
                            var the_domain = domain;
                            while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                if(the_domain in VMail.App.org_domains){
                                    if(user_orgs.indexOf(VMail.App.org_domains[the_domain].name) == -1 && VMail.App.org_domains[the_domain].name != VMail.App.org_domains[the_domain].domain){
                                        user_orgs.push(VMail.App.org_domains[the_domain].name);
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }

                var org_string = user_orgs[0];
                for(var k = 1; k < user_orgs.length; k++){
                    if(k != user_orgs.length - 1) org_string += ", " + user_orgs[k];
                    else org_string += ", and " + user_orgs[k];
                }
                report.select("#report_p1").html("You've been using <span style='font-weight:400;'>" + App.usersinfo[0].email + "</span> for " 
                    + (App.usersinfo[0].use_length / 365 > 1 ? ((App.usersinfo[0].use_length / 365).toFixed(1) + " years") : ((App.usersinfo[0].use_length / 30).toFixed(0) + " months")) + ".");
                if(org_string != undefined) report.select("#report_p2").html("Your email aliases show that you may be or have been in <span style='font-weight:400;'>" + org_string + "</span>.");
                report.select("#report_p3").html("You have <span style='font-weight:400;'>" + App.db[0].emails.length + "</span> emails in total and <span style='font-weight:400;'>" + App.db[0].nCollaborators + "</span> contacts (here contacts are defined as people who sent you more than 2 emails and received more than 2 emails from you).");
                
                report.select("#network_contacts").attr("height", $('#network_contacts').width()).attr("width", $('#network_contacts').width());
                report.select("#network_orgs").attr("height", $('#network_contacts').width()).attr("width", $('#network_contacts').width());

                report.select("#emails_and_contacts").style("height", $('#emails_and_contacts').width() / 2 / 2 + "px");
                var timestampsSent = (App.db[0].getEmailDates_plus());
                var visualization_emails = d3plus.viz()
                    .container("#viz_emails")
                    .data(timestampsSent)
                    .type("stacked")
                    .id("direction")
                    .text("direction")
                    .y("volume")
                    .x("date")
                    .x({"label": {"value": "Emails Sent and Received", "padding": 4}, "ticks": {"font": {"color": "#fff", "size": 14}}})
                    .y({"ticks": {"font": {"color": "#fff"}}, "label": {"value": "Emails per day", "padding": 5, "font": {"color": "#fff", "size": 12}}})
                    .tooltip(['date', 'volume'])
                    .background("#2f3140")
                    .axes({"background": {"color": "#2f3140"}})
                    .draw();
                var timestampsContact = (App.db[0]).getTimestampsNewContacts_plus();
                var visualization_contacts = d3plus.viz()
                    .container("#viz_contacts")
                    .data(timestampsContact)
                    .type("bar")
                    .id("name")
                    .y("volume")
                    .x("date")
                    .x({"label": {"value": "New Contacts", "padding": 4}, "ticks": {"font": {"color": "#fff", "size": 14}}})
                    .y({"ticks": {"font": {"color": "#fff"}}, "label": {"value": "Emails per day", "padding": 5, "font": {"color": "#fff", "size": 12}}})
                    .tooltip(['date', 'volume'])
                    .background("#2f3140")
                    .axes({"background": {"color": "#2f3140"}})
                    .draw();

                report.selectAll("#intro_contacts").style("height", $('#network_contacts').width() + "px");
                report.selectAll("#intro_orgs").style("height", $('#network_orgs').width() + "px");
                report.selectAll(".intro_p").style("height", (($('#intro_contacts').height() - 40) / 4 - 30) + "px");
                // report.selectAll(".intro_p").style("height", (($('#intro_contacts').height() - 40) / 4 - 30) + "px");
                report.selectAll(".viz_network").style("height", $('#network_contacts').height() + "px");
                
                report.select("#top_contacts").attr("height", $('#report_p4').width() / 5 * 2).attr("width", $('#report_p4').width());
                report.select("#year_top_contacts").attr("height", $('#report_p4_2').width() / 5 * 2).attr("width", $('#report_p4_2').width());

                report.select("#top_orgs").attr("height", $('#report_p5').width() / 5 * 2).attr("width", $('#report_p5').width());
                report.select("#year_top_orgs").attr("height", $('#report_p5_2').width() / 5 * 2).attr("width", $('#report_p5_2').width());

                report.select("#top_contacts_cover").style("height", $('#top_contacts').height() + "px");
                report.select("#report_p4").html("The top 5 contacts in your network in <b>all time</b> (based on the generalized mean of the number of emails you two exchanged):");
                report.select("#year_top_contacts_cover").style("height", $('#year_top_contacts').height() + "px");
                report.select("#report_p4_2").html("The top 5 contacts in your network in <b>last year</b> (based on the generalized mean of the number of emails you two exchanged):");

                report.select("#top_orgs_cover").style("height", $('#top_orgs').height() + "px").style("margin-bottom", "50px;");
                report.select("#report_p5").html("The top 5 organizations in your network in <b>all time</b> (based on the number of emails you received from an organization):");
                report.select("#year_top_orgs_cover").style("height", $('#top_orgs').height() + "px").style("margin-bottom", "50px;");
                report.select("#report_p5_2").html("The top 5 organizations in your network in <b>last year</b> (based on the number of emails you received from an organization):");

                // d3.select("#viz_emails").select(".viz_single").attr("display", "block").style("display", "block")
                //   .style("height", $(".viz_two").height() + "px").attr("height", $(".viz_two").height());
                // d3.select("#viz_emails").select("svg#d3plus").attr("display", "block").style("display", "block")
                //   .style("height", $(".viz_two").height() + "px").attr("height", $(".viz_two").height());
                // d3.select("#viz_contacts").select(".viz_single").attr("display", "block").style("display", "block")
                //   .style("height", $(".viz_two").height() + "px").attr("height", $(".viz_two").height());
                // d3.select("#viz_contacts").select("svg#d3plus").attr("display", "block").style("display", "block")
                //   .style("height", $(".viz_two").height() + "px").attr("height", $(".viz_two").height());

                
                if('personality' in App.personality || 'Harm' in App.morality){
                    if('personality' in App.personality && 'Harm' in App.morality){
                        report.select("#report_p6").html("Visualizations below show your personality and morality survey results. Please note they are not professional psychological surveys, so the interpretation below may not define your real personality and morality.");
                    }
                    else if('personality' in App.personality){
                        report.select("#report_p6").html("Visualization below shows your personality survey result. Please note it is not a professional psychological survey, so the interpretation below may not define your real personality.");
                    }
                    else{
                        report.select("#report_p6").html("Visualization below shows your morality survey result. Please note it is not a professional psychological survey, so the interpretation below may not define your real morality.");
                    }
                }
                if('personality' in App.personality){
                    report.select("#viz_radar1").select(".radar_title").text("Personality");
                    report.select("#viz_radar_personality").style("height", ($('#viz_radar_personality').width() * 0.42 + 40) + "px");
                    report.select("#viz_radar_personality").selectAll(".the_radar").style("height", $('#viz_radar_personality').width() * 0.42 + "px");
                    report.select("#viz_radar_personality").select("#radar_intro").style("height", $('#viz_radar_personality').width() * 0.42 + 40 + "px");
                    report.select("#viz_radar_personality").select("#radar1_intro")
                        .style("border-top", "1px solid white")
                        .style("border-right", "1px solid white")
                        .style("border-bottom", "1px solid white")
                        .style("border-top-right-radius", "25px")
                        .style("border-bottom-right-radius", "25px");

                    var intro = report.select("#radar1_intro");
                    intro.append("div").style("padding-top", "15px").html('Source for the personality survey: <a href="https://www.outofservice.com/bigfive/" style="text-decoration: underline;" target="_blank">The Big Five Project</a>');
                    intro.append("br");
                    intro.append("div").html('Your results in personality dimensions are ' + parseFloat(App.personality['personality']['Open-Mindedness']) + ' (Open-Mindedness), ' 
                        + parseFloat(App.personality['personality']['Conscientiousness']) + ' (Conscientiousness), ' 
                        + parseFloat(App.personality['personality']['Agreeableness']) + ' (Agreeableness), ' 
                        + parseFloat(App.personality['personality']['Extraversion']) + ' (Extraversion), and '
                        + parseFloat(App.personality['personality']['Negative Emotionality']) + ' (Negative Emotionality).');
                    intro.append("br");
                    intro.append("div").html('Explanation for personality dimensions:');
                    intro.append("div").style("padding-left", "20px").html('<b>Open-Mindedness</b>: appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.');
                    intro.append("div").style("padding-left", "20px").html('<b>Conscientiousness</b>: a tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.');
                    intro.append("div").style("padding-left", "20px").html('<b>Agreeableness</b>: a tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.');
                    intro.append("div").style("padding-left", "20px").html('<b>Extraversion</b>: energy, positive emotions, surgency, assertiveness, sociability and the tendency to seek stimulation in the company of others, and talkativeness.');
                    intro.append("div").style("padding-left", "20px").html('<b>Negative Emotionality</b>: the tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.');

                    var sample_data1 = [
                        // {"type": "personality", "name": "CI(95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][1])},
                        // {"type": "personality", "name": "CI(95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][1])},
                        // {"type": "personality", "name": "CI(95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][1])},
                        // {"type": "personality", "name": "CI(95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][1])},
                        // {"type": "personality", "name": "CI(95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][1])},
                        // {"type": "personality", "name": "Average", "dimension": "Extra..", "value": parseFloat(average_personality['Extraversion'])},
                        // {"type": "personality", "name": "Average", "dimension": "Agree..", "value": parseFloat(average_personality['Agreeableness'])},
                        // {"type": "personality", "name": "Average", "dimension": "Neg-Emo..", "value": parseFloat(average_personality['Negative Emotionality'])},
                        // {"type": "personality", "name": "Average", "dimension": "Open-Mind", "value": parseFloat(average_personality['Open-Mindedness'])},
                        // {"type": "personality", "name": "Average", "dimension": "Conscie..", "value": parseFloat(average_personality['Conscientiousness'])},
                        // {"type": "personality", "name": "CI(-95%)", "dimension": "Extra..", "value": parseFloat(ci_personality['Extraversion'][0])},
                        // {"type": "personality", "name": "CI(-95%)", "dimension": "Agree..", "value": parseFloat(ci_personality['Agreeableness'][0])},
                        // {"type": "personality", "name": "CI(-95%)", "dimension": "Neg-Emo..", "value": parseFloat(ci_personality['Negative Emotionality'][0])},
                        // {"type": "personality", "name": "CI(-95%)", "dimension": "Open-Mind", "value": parseFloat(ci_personality['Open-Mindedness'][0])},
                        // {"type": "personality", "name": "CI(-95%)", "dimension": "Conscie..", "value": parseFloat(ci_personality['Conscientiousness'][0])},
                        {"type": "personality", "name": (App.usersinfo[0].name), "dimension": "Extra..", "value": parseFloat(App.personality['personality']['Extraversion'])},
                        {"type": "personality", "name": (App.usersinfo[0].name), "dimension": "Agree..", "value": parseFloat(App.personality['personality']['Agreeableness'])},
                        {"type": "personality", "name": (App.usersinfo[0].name), "dimension": "Neg-Emo..", "value": parseFloat(App.personality['personality']['Negative Emotionality'])},
                        {"type": "personality", "name": (App.usersinfo[0].name), "dimension": "Open-Mind", "value": parseFloat(App.personality['personality']['Open-Mindedness'])},
                        {"type": "personality", "name": (App.usersinfo[0].name), "dimension": "Conscie..", "value": parseFloat(App.personality['personality']['Conscientiousness'])}
                      ];

                    var visualization1 = d3plus.viz()
                        .container("#viz_radar1")
                        .data({
                            "value": sample_data1, 
                            "opacity": 0.5,
                            "stroke": {"width": 1}
                        })
                        .id(["name", "dimension"])
                        .size("value")
                        .type("radar")
                        .background("rgba(0,0,0,0)")
                        .axes({"background": {"color": "rgba(0,0,0,0)"}, "mirror": true})
                        .tooltip({"children":5, "size":false})
                        .draw();
                }
                if('Harm' in App.morality){
                    report.select("#viz_radar2").select(".radar_title").text("Morality");
                    report.select("#viz_radar_morality").style("height", ($('#viz_radar_morality').width() * 0.42 + 70) + "px");
                    report.select("#viz_radar_morality").selectAll(".the_radar").style("height", $('#viz_radar_personality').width() * 0.42 + "px");
                    report.select("#viz_radar_morality").selectAll("#radar_intro").style("height", $('#viz_radar_personality').width() * 0.42 + 40 + "px");
                    report.select("#viz_radar_morality").select("#radar2_intro")
                        .style("border-top", "1px solid white")
                        .style("border-left", "1px solid white")
                        .style("border-bottom", "1px solid white")
                        .style("border-bottom-left-radius", "25px")
                        .style("border-top-left-radius", "25px");

                    var intro = report.select("#radar2_intro");
                    intro.append("div").style("padding-top", "15px").html('Source for the morality survey: <a href="http://www.yourpersonality.net/political/griffin1.pl" style="text-decoration: underline;" target="_blank">The Moral Foundations Questionnaire</a>');
                    intro.append("br");
                    intro.append("div").html('Your results in personality dimensions are ' + App.morality['Fairness'].toFixed(2) + ' (Fairness), ' 
                        + App.morality['Harm'].toFixed(2) + ' (Harm), ' 
                        + App.morality['Loyalty'].toFixed(2) + ' (Loyalty), ' 
                        + App.morality['Authority'].toFixed(2) + ' (Authority), and '
                        + App.morality['Purity'].toFixed(2) + ' (Purity).');
                    intro.append("br");
                    var liberals_dim = [], conservatives_dim = [];
                    var liberals = {"Fairness": 3.8, "Harm": 3.7, "Loyalty": 2.2, "Authority": 2.1, "Purity": 1.4}, 
                        conservatives = {"Fairness": 3.1, "Harm": 3.1, "Loyalty": 3.1, "Authority": 3.3, "Purity": 3.0};
                    for(var dim in App.morality){
                        if(Math.abs(App.morality[dim] - liberals[dim]) < Math.abs(App.morality[dim] - conservatives[dim])){
                            liberals_dim.push([dim, App.morality[dim] - liberals[dim]]);
                        }
                        else{
                            conservatives_dim.push([dim, App.morality[dim] - conservatives[dim]]);
                        }
                    }
                    var comp = function (a, b) {
                        if (a[1] !== b[1]) {
                            return b[1] - a[1];
                        }
                        return 0;
                    };
                    liberals_dim.sort(comp);
                    conservatives_dim.sort(comp);

                    if(liberals_dim.length == 5){
                        var lib_string = liberals_dim[0][0];
                        intro.append("div").html('The red and blue polygons show the scores for all liberals and conservatives who have taken the survey in <a href="http://www.yourpersonality.net/political/griffin1.pl" style="text-decoration: underline;" target="_blank">The Moral Foundations Questionnaire</a>. Based on your survey scores, you are more close to liberals in all dimensions with the most close dimension being ' + lib_string + ' (you: ' + App.morality[liberals_dim[0][0]].toFixed(2) + ', conservatives: ' + liberals[liberals_dim[0][0]].toFixed(2) + ').');
                    }
                    else if(conservatives_dim.length == 5){
                        var cons_string = conservatives_dim[0][0];
                        intro.append("div").html('The red and blue polygons show the scores for all liberals and conservatives who have taken the survey in <a href="http://www.yourpersonality.net/political/griffin1.pl" style="text-decoration: underline;" target="_blank">The Moral Foundations Questionnaire</a>. Based on your survey scores, you are more close to conservatives in all dimensions with the most close dimension being ' + cons_string + ' (you: ' + App.morality[conservatives_dim[0][0]].toFixed(2) + ', conservatives: ' + conservatives[conservatives_dim[0][0]].toFixed(2) + ').');
                    }
                    else{
                        var lib_string = "", cons_string = "";
                        if(liberals_dim.length == 1) lib_string = liberals_dim[0][0];
                        else if(liberals_dim.length == 2) lib_string = liberals_dim[0][0] + " and " + liberals_dim[1][0];
                        else{
                            for(var kk = 0; kk < liberals_dim.length; kk++){
                                if(kk == 0){
                                    lib_string += liberals_dim[kk][0] + ", ";
                                }
                                else if(kk == liberals_dim.length - 1){
                                    lib_string += "and " + liberals_dim[kk][0];
                                }
                                else{
                                    lib_string += liberals_dim[kk][0] + ", ";
                                }
                            }
                        }
                        if(conservatives_dim.length == 1) cons_string = conservatives_dim[0][0];
                        else if(conservatives_dim.length == 2) cons_string = conservatives_dim[0][0] + " and " + conservatives_dim[1][0];
                        else{
                            for(var kk = 0; kk < conservatives_dim.length; kk++){
                                if(kk == 0){
                                    cons_string += conservatives_dim[kk][0] + ", ";
                                }
                                else if(kk == conservatives_dim.length - 1){
                                    cons_string += "and " + conservatives_dim[kk][0];
                                }
                                else{
                                    cons_string += conservatives_dim[kk][0] + ", ";
                                }
                            }
                        }
                        intro.append("div").html('The red and blue polygons show the scores for all liberals and conservatives who have taken the survey in <a href="http://www.yourpersonality.net/political/griffin1.pl" style="text-decoration: underline;" target="_blank">The Moral Foundations Questionnaire</a>. Based on your survey scores, you are more close to liberals in ' + lib_string + ', and more close to conservatives in ' + cons_string + '.');
                    }
                    
                    intro.append("br");
                    intro.append("div").html('Explanation for morality dimensions:');
                    intro.append("div").style("padding-left", "35px").html('<b>Fairness</b>: rendering justice according to shared rules.');
                    intro.append("div").style("padding-left", "35px").html('<b>Harm</b>: cherishing and protecting others.');
                    intro.append("div").style("padding-left", "35px").html('<b>Loyalty</b>: standing with your group, family, nation.');
                    intro.append("div").style("padding-left", "35px").html('<b>Authority</b>: submitting to tradition and legitimate authority.');
                    intro.append("div").style("padding-left", "35px").html('<b>Purity</b>: abhorrence for disgusting things, foods, actions.');

                    var sample_data2 = [
                        // {"type": "morality", "name": "CI(95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][1])},
                        // {"type": "morality", "name": "CI(95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][1])},
                        // {"type": "morality", "name": "CI(95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][1])},
                        // {"type": "morality", "name": "CI(95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][1])},
                        // {"type": "morality", "name": "CI(95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][1])},
                        // {"type": "morality", "name": "Average", "dimension": "Fairness", "value": parseFloat(average_morality['Fairness'])},
                        // {"type": "morality", "name": "Average", "dimension": "Harm", "value": parseFloat(average_morality['Harm'])},
                        // {"type": "morality", "name": "Average", "dimension": "Loyalty", "value": parseFloat(average_morality['Loyalty'])},
                        // {"type": "morality", "name": "Average", "dimension": "Authority", "value": parseFloat(average_morality['Authority'])},
                        // {"type": "morality", "name": "Average", "dimension": "Purity", "value": parseFloat(average_morality['Purity'])},
                        // {"type": "morality", "name": "CI(-95%)", "dimension": "Fairness", "value": parseFloat(ci_morality['Fairness'][0])},
                        // {"type": "morality", "name": "CI(-95%)", "dimension": "Harm", "value": parseFloat(ci_morality['Harm'][0])},
                        // {"type": "morality", "name": "CI(-95%)", "dimension": "Loyalty", "value": parseFloat(ci_morality['Loyalty'][0])},
                        // {"type": "morality", "name": "CI(-95%)", "dimension": "Authority", "value": parseFloat(ci_morality['Authority'][0])},
                        // {"type": "morality", "name": "CI(-95%)", "dimension": "Purity", "value": parseFloat(ci_morality['Purity'][0])},
                        {"type": "morality", "name": "Conservatives", "color": "#b22200", "dimension": "Fairness", "value": 3.1}, 
                        {"type": "morality", "name": "Conservatives", "color": "#b22200", "dimension": "Harm", "value": 3.1}, 
                        {"type": "morality", "name": "Conservatives", "color": "#b22200", "dimension": "Loyalty", "value": 3.1}, 
                        {"type": "morality", "name": "Conservatives", "color": "#b22200", "dimension": "Authority", "value": 3.3}, 
                        {"type": "morality", "name": "Conservatives", "color": "#b22200", "dimension": "Purity", "value": 3.0},
                        {"type": "morality", "name": "Liberals", "color": "#282F6B", "dimension": "Fairness", "value": 3.8}, 
                        {"type": "morality", "name": "Liberals", "color": "#282F6B", "dimension": "Harm", "value": 3.7}, 
                        {"type": "morality", "name": "Liberals", "color": "#282F6B", "dimension": "Loyalty", "value": 2.2}, 
                        {"type": "morality", "name": "Liberals", "color": "#282F6B", "dimension": "Authority", "value": 2.1}, 
                        {"type": "morality", "name": "Liberals", "color": "#282F6B", "dimension": "Purity", "value": 1.4},
                        {"type": "morality", "name": (App.usersinfo[0].name), "color": "#EACE3F", "dimension": "Fairness", "value": App.morality['Fairness']}, //personalities[p]['morality']['Fairness']
                        {"type": "morality", "name": (App.usersinfo[0].name), "color": "#EACE3F", "dimension": "Harm", "value": App.morality['Harm']}, //personalities[p]['morality']['Harm']
                        {"type": "morality", "name": (App.usersinfo[0].name), "color": "#EACE3F", "dimension": "Loyalty", "value": App.morality['Loyalty']}, //personalities[p]['morality']['Loyalty']
                        {"type": "morality", "name": (App.usersinfo[0].name), "color": "#EACE3F", "dimension": "Authority", "value": App.morality['Authority']}, //personalities[p]['morality']['Authority']
                        {"type": "morality", "name": (App.usersinfo[0].name), "color": "#EACE3F", "dimension": "Purity", "value": App.morality['Purity']} //personalities[p]['morality']['Purity']
                      ];

                      var visualization2 = d3plus.viz()
                        .container("#viz_radar2")
                        .data({
                            "value": sample_data2, 
                            "opacity": 0.5,
                            "stroke": {"width": 1}
                        })
                        .id(["name", "dimension"])
                        .size("value")
                        .type("radar")
                        .color("color")
                        .legend(false)
                        .background("rgba(0,0,0,0)")
                        .axes({"background": {"color": "rgba(0,0,0,0)"}, "mirror": true})
                        .tooltip({"children":5, "size":false})
                        .draw();

                      setTimeout(function(){
                        d3.select("#viz_radar1").selectAll("text")
                            .style("fill", "white").style("font-size", "12px").style("font-family", "'Lato', sans-serif")
                            .attr("fill", "white").attr("font-size", "12px").attr("font-family", "'Lato', sans-serif");
                        d3.select("#viz_radar2").selectAll("text")
                            .style("fill", "white").style("font-size", "12px").style("font-family", "'Lato', sans-serif")
                            .attr("fill", "white").attr("font-size", "12px").attr("font-family", "'Lato', sans-serif");
                      }, 1000);
                }

                d3.select("#generate_pdf").on("click", function(){
                    var isChrome = !!window.chrome && !!window.chrome.webstore;
                    if(isChrome){
                        d3.select("#processing").text("Genrating the image for your personal report");
                        // d3.select("#processing").style("display", "block");
                        $("#processing").fadeIn();

                        function startPrintProcess(canvasObj, fileName, callback) {
                          var pdf = new jsPDF('p', 'pt', 'a4'),
                            pdfConf = {
                              pagesplit: true,
                              background: '#2f3140' //#2f3140
                            };
                          document.body.appendChild(canvasObj); //appendChild is required for html to add page in pdf
                          // d3.select(".html2canvas-container")
                          //   .style("width", $('#whole_report').width() + "px !important")
                          //   .style("height", $('#whole_report').height() + "px !important");
                          pdf.addHTML(canvasObj, 0, 0, pdfConf, function() {
                            // document.body.removeChild(canvasObj);
                            // pdf.addPage();
                            pdf.save(fileName + '.pdf');
                            callback();
                          });
                        }

                        var sheet = (function() {
                            // Create the <style> tag
                            var style = document.createElement("style");

                            // Add a media (and/or media query) here if you'd like!
                            // style.setAttribute("media", "screen")
                            // style.setAttribute("media", "only screen and (max-width : 1024px)")

                            // WebKit hack :(
                            style.appendChild(document.createTextNode(""));

                            // Add the <style> element to the page
                            document.head.appendChild(style);

                            return style.sheet;
                        })();
                        sheet.insertRule(".html2canvas-container { width: " + $('#whole_report').width() 
                            + "px !important; height: " + $('#whole_report').height() 
                            +"px !important; font-family: 'Lato', sans-serif !important; }", 0);

                        
                        // html2canvas(document.getElementById('whole_report'), {
                        //    background:'#2f3140',
                        //     allowTaint: true,
                        //     onrendered: function(canvasObj) {
                        //       startPrintProcess(canvasObj, 'printedPDF',function (){
                        //         // alert('PDF saved');
                        //       });
                        //       //save this object to the pdf
                        //     }
                        // });
                        document.documentElement.scrollTop = 0;
                        document.body.scrollTop = 0;
                        // var kk = 1;
                        // var set_time = setInterval(function(){ scroll_down() }, 400);
                        // function scroll_down() {
                        //     document.documentElement.scrollTop = $('#whole_report').height() / 5 * kk;
                        //     document.body.scrollTop = $('#whole_report').height() / 5 * kk;
                        //     kk++;
                        //     if(kk == 6) clearInterval(set_time);
                        // }

                        html2canvas($("#whole_report"), { 
                            background: '#2f3140', 
                            allowTaint: true,
                            scale: 2,
                            onrendered: function(canvas) { 
                                // canvas.toBlob(function(blob) {
                                //     saveAs(blob, "Dashboard.png");
                                //     alert("Done");
                                // });
                                // function saveAs(data, name){
                                //     var a = document.createElement('a'); 
                                //     a.href = blob.toDataURL("image/png"); 
                                //     a.download = name; 
                                //     // a.href = canvas.toDataURL("image/jpeg", 0.9).replace("image/jpeg", "image/octet-stream"); 
                                //     // a.download = 'snapshot.jpg'; 
                                //     a.click(); 
                                // }

                                var a = document.createElement('a'); 
                                a.href = canvas.toDataURL("image/png"); 
                                a.download = 'snapshot.png'; 
                                // a.href = canvas.toDataURL("image/jpeg", 0.9).replace("image/jpeg", "image/octet-stream"); 
                                // a.download = 'snapshot.jpg'; 
                                a.click(); 
                                d3.select("#processing").text("Done! Image downloaded.");
                                setTimeout(function(){ 
                                    // d3.select("#processing").style("display", "none");
                                    $("#processing").fadeOut();
                                }, 1500);
                                // var can = document.getElementById('testcanvas');
                                // var ctx = can.getContext('2d');
                                // var img = new Image();
                                // var svg = document.getElementById('network_orgs');
                                // var xml = (new XMLSerializer).serializeToString(svg);
                                // img.src = "data:image/svg+xml;charset=utf-8,"+xml;

                                // ctx.drawImage(img, 0, 0, 600, 600, 0, 0, 600, 600);

                            } 
                        });
                    }
                    else{
                        // d3.select("#processing").text("Currently this feature only works in Chrome");
                        // d3.select("#processing").transition(500).style("display", "block");
                        // setTimeout(function(){
                        //     $("#processing").transition(500).style("display", "none");
                        // }, 1500);
                        alert("Currently this feature only works in Chrome.");
                    }



                    // var PIXEL_RATIO = (function () {
                    //     var ctx = document.createElement("canvas").getContext("2d"),
                    //         dpr = window.devicePixelRatio || 1,
                    //         bsr = ctx.webkitBackingStorePixelRatio ||
                    //               ctx.mozBackingStorePixelRatio ||
                    //               ctx.msBackingStorePixelRatio ||
                    //               ctx.oBackingStorePixelRatio ||
                    //               ctx.backingStorePixelRatio || 1;

                    //     return dpr / bsr;
                    // })();

                    // createHiDPICanvas = function(w, h, ratio) {
                    //     if (!ratio) { ratio = PIXEL_RATIO; }
                    //     var can = document.createElement("canvas");
                    //     can.width = w * ratio;
                    //     can.height = h * ratio;
                    //     can.style.width = w + "px";
                    //     can.style.height = h + "px";
                    //     can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
                    //     return can;
                    // }

                    // //Create canvas with the device resolution.
                    // var testcanvas = createHiDPICanvas($('#whole_report').width(), $('#whole_report').height());

                    // var w = 1000; //$('#whole_report').width();
                    // var h = 500; //$('#whole_report').height();
                    // var div = document.getElementById('whole_report');
                    // // var testcanvas = document.createElement('canvas');//document.getElementById('generate_canvas'); //document.createElement('canvas');
                    // // testcanvas.width = w;
                    // // testcanvas.height = h;
                    // // testcanvas.style.width = $('#whole_report').width() + 'px';
                    // // testcanvas.style.height = $('#whole_report').height() + 'px';
                    // // var context = canvas.getContext('2d');
                    // // context.scale(2,2);
                    // html2canvas(div, { 
                    //     canvas: testcanvas,
                    //     background:'#2f3140',
                    //     // useCORS: true,
                    //     allowTaint: true,
                    //     // letterRendering: true,
                    //     // width: $('#whole_report').width(),
                    //     // height: $('#whole_report').height(),
                    //     onrendered: function(canvas) { 
                    //         // var img = canvas.toDataURL("image/png");
                    //         // download(img, "snapshot.png", "image/png");
                    //         document.body.appendChild(canvas);
                    //         var a = document.createElement('a'); 
                    //         // a.href = canvas.toDataURL("image/jpeg", 0.9).replace("image/jpeg", "image/octet-stream"); 
                    //         // a.download = 'snapshot.jpg'; 
                    //         a.href = canvas.toDataURL("image/png"); 
                    //         a.download = 'snapshot.png'; 
                    //         a.click(); 
                    //     }
                    // });



                    // html2canvas($("#whole_report"), {
                    //     background:'#2f3140',
                    //     useCORS: true,
                    //     allowTaint: true,
                    //     letterRendering: true,
                    //     onrendered: function(canvas) {
                    //         var ctx = canvas.getContext('2d');
                    //         ctx.webkitImageSmoothingEnabled = false;
                    //         ctx.mozImageSmoothingEnabled = false;
                    //         ctx.imageSmoothingEnabled = false;
                    //         theCanvas = canvas;
                    //         document.body.appendChild(canvas);

                    //         // Convert and download as image 
                    //         Canvas2Image.saveAsPNG(canvas); 
                    //         // var png = canvas.toDataURL("image/png");
                    //         // document.body.appendChild('<img id="canvas_test" src="'+png+'"/>');
                    //         // $("#whole_report_cover").append(canvas);
                    //         $(body).append(canvas);
                    //         // Clean up 
                    //         //document.body.removeChild(canvas);
                    //     }
                    // });
                });
                



                // $("#data").fadeIn();
                CHARGE_DEFAULT = CHARGE_DEFAULT * 2000 / (NNODES_DEFAULT * App.usersinfo.length); // * 800
                App.charge_default[1] = CHARGE_DEFAULT; App.charge_default[0] = CHARGE_DEFAULT * 2; App.charge_default[2] = 0;
                var init_start = App.db[0].emails[0].timestamp, init_end = 0;
                for (var t = 0; t < App.db.length; t++) {
                    if (App.db[t].emails[0].timestamp < init_start) {
                        init_start = App.db[t].emails[0].timestamp;
                    }
                    if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                        init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                    }
                }
                start = new Date((init_start) * 1000);
                end = new Date();

                //populate the left column with some basic info and aggregate statistics
                initBasicInfo((App.db[0]).aliases, App.userinfo);
                
                //setup the setttings for the network vizualization
                //var sizeExtent = d3.extent(graph.nodes, function(node) { return node.attr.size; });
                //var nodeRadius = d3.scale.linear().range([5, 20]).domain(sizeExtent);
                var settings = {
                    svgHolder: "#network_contacts",
                    size: {
                        width: $('#network_contacts').width(),
                        height: $('#network_contacts').height()
                    },
                    forceParameters: {
                        friction: FRICTION,
                        gravity: 0.9,
                        linkDistance: LINKDISTANCE,
                        charge: CHARGE_DEFAULT / 2,
                        live: true
                    },
                    nodeLabelFunc: function (attr) {
                        var namefield = attr.contact.name;
                        if (namefield.indexOf('@') >= 0) {
                            return namefield.split('@')[0];
                        } else {
                            return namefield.split(' ')[0];
                        }
                    },
                    nodeLabelFuncHover: function (attr) {
                        var namefield = attr.contact.name;
                        if (namefield.indexOf('@') >= 0) {
                            return namefield.split('@')[0];
                        } else {
                            return namefield;
                        }
                    },
                    nodeSizeFunc: null,
                    nodeMemberSizeFunc: null,
                    linkSizeFunc: null,
                    colorFunc: function (attr) {
                        return color(attr.color);
                    },
                    colorPeopleFunc: function (owns) {
                        return color(owns);
                    },
                    colorMemberFunc: function (owns) {
                        return colorMember(owns);
                    },
                    colorPersonalityFunc: function (member, personality) {
                        return colorPersonality(member, personality);
                    },
                    clickHandler: function (node) {
                        if (node === null) {
                            App.isContactDetails = false;
                            App.isUserStats = true;
                            d3.select("#contactDetails-content").selectAll("*").remove();
                            if (App.rightPanel == 0)
                                App.toggleMemberStats(true, false, false);
                            else if (App.rightPanel == 1)
                                App.toggleMemberStats(false, true, false);
    //                        if (App.wasUserStats)
    //                            App.toggleinfo(true, false);
    //                        else
    //                            App.toggleinfo(false, true);
                        } else if (App.rightPanel != 2) { // not in the shortest path mode
                            $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                            if (App.node_as_org == 0)
                                showContactDetails(node, node.attr.contact, start, end);
                            else
                                showContactDetails(node, node, start, end);
                        }
                        else {//shortest paths
                            if (App.selectedTwoNodes.length < 2) {
                                App.selectedTwoNodes.push(node);
                            }
                        }
                    }
                };

                var org_settings = {
                    svgHolder: "#network_orgs",
                    size: {
                        width: $('#network_orgs').width(),
                        height: $('#network_orgs').height()
                    },
                    forceParameters: {
                        friction: FRICTION,
                        gravity: 0.9,
                        linkDistance: LINKDISTANCE,
                        charge: CHARGE_DEFAULT / 2,
                        live: true
                    },
                    nodeLabelFunc: function (name) {
                        return name;
                    },
                    nodeLabelFuncHover: function (name) {
                        return name;
                    },
                    nodeSizeFunc: null,
                    nodeMemberSizeFunc: null,
                    linkSizeFunc: null,
                    colorFunc: function (attr) {
                        return color(attr.color);
                    },
                    colorPeopleFunc: function (owns) {
                        return color(owns);
                    },
                    clickHandler: function (node) {
                        if (node === null) {
                            d3.select("#contactDetails-content").selectAll("*").remove();
                            if (App.rightPanel == 0)
                                App.toggleMemberStats(true, false, false);
                            else if (App.rightPanel == 1)
                                App.toggleMemberStats(false, true, false);
                        } else {
                            d3.select("#influence_ranking").style("display", "none");
                            d3.select("#we_lost_them").style("display", "none");
                            if (App.node_as_org == 0)
                                showContactDetails(node, node.attr.contact, start, end);
                            else
                                showContactDetails(node, node, start, end);
                        }
                    }
                };

                //initialize slider
                initTimeSlider();
                initNetworkSliders();

                //init panel hovering
                d3.select("#panel").on("mouseover", function () {
                    d3.select("#panel_img").attr("src", "/static/images/arrow_right.png");
                }).on("mouseout", function () {
                    d3.select("#panel_img").attr("src", "/static/images/arrow_left.png");
                });
                
                // $('#loader').html('Analyzing metadata: constructing the network.');
                setTimeout(function(){
                    //vizualize the network
                    viz = new VMail.Viz.NetworkViz(settings, false);
                    org_viz = new VMail.Viz.OrgNetworkViz(org_settings, false);
                    App.viz = viz;
                    nnodes = NNODES_DEFAULT * App.usersinfo.length;
                    updateNetwork("contacts", true, 0, 0, -1);
                    var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
                    
                    setTimeout(function(){
                        App.node_as_org = 0;
                        //top contacts in all time
                        d3.range(5).forEach(function (k) {
                            var the_g = report.select("#top_contacts").append("g").attr("transform", function () {
                                return "translate(" + $('#top_contacts').width() / 5 * k + "," + 0 + ")"; 
                            });
                            the_g.append("circle").attr("id", "contact_" + k)
                                .attr("cx", $('#top_contacts').width() / 5 / 2)
                                .attr("cy", 70)
                                .attr("r", function () {
                                    return App.viz.settings.nodeSizeFunc(App.graph.nodes[k].attr);
                                }).attr("fill", function () {
                                    return App.viz.settings.colorFunc(App.graph.nodes[k].attr);
                                }).style("opacity", "0.8").attr("stroke", App.viz.baseNodeStrokeColor).attr("stroke-opacity", 1).attr("stroke-width", 0.5);  
                            the_g.append("text").attr("id", "contact_text_" + k).attr("text-anchor", "middle")
                                .attr("x", $('#top_contacts').width() / 5 / 2) 
                                .style("font-weight", 300).style("font-size", 13)
                                .attr("font-weight", 300).attr("font-size", 13)
                                .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                                .attr("y", 70 + 6).text(App.graph.nodes[k].attr.contact.name);

                            var timestamps = (App.db[0].getEmailDatesByContact(App.db[0].contacts[App.graph.nodes[k].id]));
                            var a = +start;
                            var b = +end;
                            //settings for the histogram of interaction volume
                            var histSettings = {
                                width: $('#top_contacts').width() / 5 + 20,
                                height: $('#top_contacts').width() / 5 * 0.6,
                                start: start,
                                end: end,
                                interval: d3.time.month,
                                ylabel: '',
                                position: undefined,
                                dateformat: "%b \n \n %y",
                                nTicks: 4,
                                prediction: false
                            };
                            
                            // container.append("div").html("<b>Interaction volume</b>");
                            histSettings.position = report.select("#top_contacts").append("g").attr("transform", function () {
                                return "translate(" + ($('#top_contacts').width() / 5 * k + $('#top_contacts').width() / 5 * 0.1) + "," + 250 + ")"; 
                            });
                            var top_dates = VMail.Viz.plotTimeHistogram_report(timestamps, histSettings);
                            var peak_dates = "";
                            for(var kk = 0; kk < 3; kk++){
                                if(top_dates[0][kk].value != 0){
                                    peak_dates += month[top_dates[0][kk].date.getMonth()] + " " + top_dates[0][kk].date.getFullYear();
                                    if(kk == 1) peak_dates += ", and ";
                                    else if(kk == 0) peak_dates += ", ";
                                }
                                
                            }
                            var contact_first_name = App.graph.nodes[k].attr.contact.name.substring(0, App.graph.nodes[k].attr.contact.name.indexOf(" ") == -1 ? App.graph.nodes[k].attr.contact.name.length : App.graph.nodes[k].attr.contact.name.indexOf(" "));
                            report.select("#top_contacts").append("g").attr("transform", function () {
                                return "translate(" + ($('#top_contacts').width() / 5 * k + $('#top_contacts').width() / 5 * 0.1) + "," + 70 + ")"; 
                            }).append("text").attr("text-anchor", "left").attr("id", "contact_p_" + k)
                            .attr("x", 0)
                            .style("font-weight", 300).style("font-size", 13)
                            .attr("font-weight", 300).attr("font-size", 13)
                            .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                            .attr("y", 70 + 6).html("You have " + (App.graph.nodes[k].attr.contact.rcv + App.graph.nodes[k].attr.contact.sent) + " emails with " + contact_first_name 
                                + " from " + App.db[0].contactDetails[App.graph.nodes[k].id].firstEmail.getFullYear() + " to " + App.db[0].contactDetails[App.graph.nodes[k].id].lastEmail.getFullYear() 
                                + " with the peak months being " + peak_dates + ".");
                            d3plus.textwrap()
                                .container(d3.select('#top_contacts').select("#contact_p_" + k))
                                .width($('#top_contacts').width() / 5 * 0.8)
                                .height(90)
                                .draw();  

                            histSettings.position.selectAll("svg").style("stroke", "white").style("fill", "white");
                            histSettings.position.selectAll("line").attr("stroke", "white");
                            histSettings.position.selectAll("path").style("stroke", "white");
                            histSettings.position.selectAll("rect").style("fill", "white");
                        });
                        
                        //top contacts in last year
                        var init_start = 100000000000, init_end = 0;
                        for (var t = 0; t < App.db.length; t++) {
                            if (App.db[t].emails[0].timestamp < init_start) {
                                init_start = App.db[t].emails[0].timestamp;
                            }
                            if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                                init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                            }
                        }
                        init_start = new Date(init_start * 1000);
                        init_end = new Date(init_end * 1000);
                        var the_end = init_end;
                        var the_start = d3.time.year.offset(the_end, -1);
                        var topContacts = App.db[0].getTopContacts(5, the_start, the_end);
                        var contactDetails = App.db[0].getContactDetails(the_start, the_end);
                        topContacts.forEach(function (value, k){
                            var contact = value.contact;
                            var nodes = App.graph.nodes.filter(function (node) {
                                return !node.skip && node.id === contact.id;
                            });
                            if (nodes.length != 0) {
                                var the_g = report.select("#year_top_contacts").append("g").attr("transform", function () {
                                    return "translate(" + $('#year_top_contacts').width() / 5 * k + "," + 0 + ")"; 
                                });
                                the_g.append("circle").attr("id", "contact_" + k)
                                    .attr("cx", $('#year_top_contacts').width() / 5 / 2)
                                    .attr("cy", 70)
                                    .attr("r", function () {
                                        var attr = {size: value.scores[0]};
                                        return App.viz.settings.nodeSizeFunc(attr);
                                    }).attr("fill", function () {
                                        return App.viz.settings.colorFunc(nodes[0].attr);
                                    }).style("opacity", "0.8").attr("stroke", App.viz.baseNodeStrokeColor).attr("stroke-opacity", 1).attr("stroke-width", 0.5);  
                                the_g.append("text").attr("id", "contact_text_" + k).attr("text-anchor", "middle")
                                    .attr("x", $('#year_top_contacts').width() / 5 / 2)
                                    .style("font-weight", 300).style("font-size", 13)
                                    .attr("font-weight", 300).attr("font-size", 13)
                                    .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                                    .attr("y", 70 + 6).text(nodes[0].attr.contact.name);

                                var timestamps = (App.db[0].getEmailDatesByContact(App.db[0].contacts[nodes[0].id]));
                                var a = +the_start;
                                var b = +the_end;
                                //settings for the histogram of interaction volume
                                var histSettings = {
                                    width: $('#year_top_contacts').width() / 5 + 20,
                                    height: $('#year_top_contacts').width() / 5 * 0.6,
                                    start: the_start,
                                    end: the_end,
                                    interval: d3.time.month,
                                    ylabel: '',
                                    position: undefined,
                                    dateformat: "%b \n \n %y",
                                    nTicks: 3,
                                    prediction: false
                                };
                                
                                // container.append("div").html("<b>Interaction volume</b>");
                                histSettings.position = report.select("#year_top_contacts").append("g").attr("transform", function () {
                                    return "translate(" + ($('#year_top_contacts').width() / 5 * k + $('#year_top_contacts').width() / 5 * 0.1) + "," + 250 + ")"; 
                                });
                                var top_dates = VMail.Viz.plotTimeHistogram_report(timestamps, histSettings);
                                var peak_dates = "";
                                for(var kk = 0; kk < 3; kk++){
                                    if(top_dates[0][kk].value != 0){
                                        peak_dates += month[top_dates[0][kk].date.getMonth()] + " " + top_dates[0][kk].date.getFullYear();
                                        if(kk == 1) peak_dates += ", and ";
                                        else if(kk == 0) peak_dates += ", ";
                                    }
                                    
                                }
                                var contact_first_name = nodes[0].attr.contact.name.substring(0, nodes[0].attr.contact.name.indexOf(" ") == -1 ? nodes[0].attr.contact.name.length : nodes[0].attr.contact.name.indexOf(" "));
                                report.select("#year_top_contacts").append("g").attr("transform", function () {
                                    return "translate(" + ($('#year_top_contacts').width() / 5 * k + $('#year_top_contacts').width() / 5 * 0.1) + "," + 70 + ")"; 
                                }).append("text").attr("text-anchor", "left").attr("id", "contact_p_" + k)
                                .attr("x", 0)
                                .style("font-weight", 300).style("font-size", 13)
                                .attr("font-weight", 300).attr("font-size", 13)
                                .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                                .attr("y", 70 + 6).html("You have " + (contactDetails[nodes[0].id].nRcvEmails + contactDetails[nodes[0].id].nSentEmails) + " emails with " + contact_first_name 
                                    + " from " + month[the_start.getMonth()] + " " + the_start.getFullYear() + " to " + month[the_end.getMonth()] + " " + the_end.getFullYear() 
                                    + " with the peak months being " + peak_dates + ".");
                                d3plus.textwrap()
                                    .container(d3.select('#year_top_contacts').select("#contact_p_" + k))
                                    .width($('#year_top_contacts').width() / 5 * 0.8)
                                    .height(90)
                                    .draw();  

                                histSettings.position.selectAll("svg").style("stroke", "white").style("fill", "white");
                                histSettings.position.selectAll("line").attr("stroke", "white");
                                histSettings.position.selectAll("path").style("stroke", "white");
                                histSettings.position.selectAll("rect").style("fill", "rgb(230,230,230)");
                            }
                        });
                        
                        show_response_time();
                        var response_my_time = show_my_response_time();
                        report.select("#report_p7").html('Your median <b>reponse time</b> to your contacts is ' + response_my_time[0] 
                            + ' mins with the first quartile (Q1) and third quartile (Q3) being ' + response_my_time[2] + ' mins and ' + response_my_time[3] + ' mins respectively.');
                        
                    }, 500);
                    d3.selectAll("#logo").style("display", "none");
                    setTimeout(function(){
                        App.viz = org_viz;
                        App.node_as_org = 1;
                        updateNetwork("orgs", false, 0, 0, -1);

                        setTimeout(function(){
                            for(var k = 0; k < 5; k++){
                                var the_g = report.select("#top_orgs").append("g").attr("transform", function () {
                                    return "translate(" + $('#top_orgs').width() / 5 * k + "," + 0 + ")"; 
                                });
                                the_g.append("circle").attr("id", "org_" + k)
                                    .attr("cx", $('#top_orgs').width() / 5 / 2)
                                    .attr("cy", 70)
                                    .attr("r", function () {
                                        return App.viz.org_settings.nodeSizeFunc(App.graph.org_nodes[k].email_size);
                                    }).attr("fill", function () {
                                        return App.viz.org_settings.colorFunc(App.graph.org_nodes[k].attr);
                                    }).style("opacity", "0.8").attr("stroke", App.viz.baseNodeStrokeColor).attr("stroke-opacity", 1).attr("stroke-width", 0.5);  
                                the_g.append("text").attr("id", "org_text_" + k).attr("text-anchor", "middle")
                                .attr("x", $('#top_orgs').width() / 5 / 2)
                                .style("font-weight", 300).style("font-size", 13) //App.viz.org_settings.textSizeFunc(App.graph.org_nodes[k].email_size)
                                .attr("font-weight", 300).attr("font-size", 13)
                                .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                                .attr("y", 70 + 6).text(App.graph.org_nodes[k].name);

                                var timestamps = (App.db[0].getEmailDatesByOrg(App.graph.org_nodes[k]));
                                //settings for the histogram of interaction volume
                                var histSettings = {
                                    width: $('#top_orgs').width() / 5 + 20,
                                    height: $('#top_orgs').width() / 5 * 0.6,
                                    start: start,
                                    end: end,
                                    interval: d3.time.month,
                                    ylabel: '',
                                    position: undefined,
                                    dateformat: "%b \n \n %y",
                                    nTicks: 4,
                                    prediction: false
                                };

                                // container.append("div").html("<b>Interaction volume</b>");
                                histSettings.position = report.select("#top_orgs").append("g").attr("transform", function () {
                                    return "translate(" + ($('#top_orgs').width() / 5 * k + $('#top_orgs').width() / 5 * 0.15) + "," + 280 + ")"; 
                                });
                                var top_dates = VMail.Viz.plotTimeHistogram_report(timestamps, histSettings);
                                var peak_dates = "";
                                for(var kk = 0; kk < 3; kk++){
                                    if(top_dates[0][kk].value != 0){
                                        peak_dates += month[top_dates[0][kk].date.getMonth()] + " " + top_dates[0][kk].date.getFullYear();
                                        if(kk == 1){ 
                                            if(top_dates[0][2].value != 0)
                                                peak_dates += ", and ";
                                        }
                                        else if(kk == 0){ 
                                            if(top_dates[0][2].value != 0)
                                                peak_dates += ", ";
                                            else
                                                peak_dates += " and ";
                                        }
                                    }
                                    
                                }
                                report.select("#top_orgs").append("g").attr("transform", function () {
                                    return "translate(" + ($('#top_orgs').width() / 5 * k + $('#top_orgs').width() / 5 * 0.1) + "," + 70 + ")"; 
                                }).append("text").attr("text-anchor", "left").attr("id", "org_p_" + k)
                                .attr("x", 0)
                                .style("font-weight", 300).style("font-size", 13)
                                .attr("font-weight", 300).attr("font-size", 13)
                                .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                                .attr("y", 70 + 6).html("You have " + (App.graph.org_nodes[k].member_size) + " contacts in " + App.graph.org_nodes[k].name + ". "
                                    + "You have " + (App.graph.org_nodes[k].email_rcv + App.graph.org_nodes[k].email_sent) + " emails with people in the organization from " + (top_dates[1][0].getFullYear()) + " to " + (top_dates[1][1].getFullYear()) 
                                    + " with the peak months being " + peak_dates + ".");
                                d3plus.textwrap()
                                    .container(d3.select('#top_orgs').select("#org_p_" + k))
                                    .width($('#top_orgs').width() / 5 * 0.8)
                                    .height(120)
                                    .draw();  
                                histSettings.position.selectAll("svg").style("stroke", "white").style("fill", "white");
                                histSettings.position.selectAll("line").attr("stroke", "white");
                                histSettings.position.selectAll("path").style("stroke", "white");
                                histSettings.position.selectAll("rect").style("fill", "white");
                            }

                            var init_start = 100000000000, init_end = 0;
                            for (var t = 0; t < App.db.length; t++) {
                                if (App.db[t].emails[0].timestamp < init_start) {
                                    init_start = App.db[t].emails[0].timestamp;
                                }
                                if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                                    init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                                }
                            }
                            init_start = new Date(init_start * 1000);
                            init_end = new Date(init_end * 1000);
                            var the_end = init_end;
                            var the_start = d3.time.year.offset(the_end, -1);
                            var orgDetails = App.db[0].getOrgDetails(the_start, the_end);
                            var results = [];
                            for (var id in orgDetails) {
                                var scores = orgDetails[id].nRcvEmails;
                                if (scores === null) {
                                    continue;
                                }
                                results.push({ org: orgDetails[id], scores: scores });
                            }
                            var comp = function (a, b) {
                                return b.scores - a.scores;
                            };
                            results.sort(comp);//console.log(results.length);console.log(results);

                            var k = 0, total_num = 0;
                            while(total_num < 5){
                                if(k < results.length){
                                    var nodes = App.graph.org_nodes.filter(function (node) {
                                        return !node.skip && node.id === results[k].org.id;
                                    });
                                    if (nodes.length === 0) {
                                        k++;
                                        continue;
                                    }
                                    var the_g = report.select("#year_top_orgs").append("g").attr("transform", function () {
                                        return "translate(" + $('#year_top_orgs').width() / 5 * total_num + "," + 0 + ")"; 
                                    });
                                    the_g.append("circle").attr("id", "org_" + k)
                                        .attr("cx", $('#year_top_orgs').width() / 5 / 2)
                                        .attr("cy", 70)
                                        .attr("r", function () {
                                            return App.viz.org_settings.nodeSizeFunc(Math.sqrt(results[k].org.nRcvEmails + results[k].org.nSentEmails));
                                        }).attr("fill", function () {
                                            return App.viz.org_settings.colorFunc(nodes[0].attr);
                                        }).style("opacity", "0.8").attr("stroke", App.viz.baseNodeStrokeColor).attr("stroke-opacity", 1).attr("stroke-width", 0.5);  
                                    the_g.append("text").attr("id", "org_text_" + k).attr("text-anchor", "middle")
                                    .attr("x", $('#year_top_orgs').width() / 5 / 2)
                                    .style("font-weight", 300).style("font-size", 13) //App.viz.org_settings.textSizeFunc(App.graph.org_nodes[k].email_size)
                                    .attr("font-weight", 300).attr("font-size", 13)
                                    .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                                    .attr("y", 70 + 6).text(nodes[0].name);

                                    var timestamps = (App.db[0].getEmailDatesByOrg(nodes[0]));
                                    //settings for the histogram of interaction volume
                                    var histSettings = {
                                        width: $('#year_top_orgs').width() / 5 + 20,
                                        height: $('#year_top_orgs').width() / 5 * 0.6,
                                        start: the_start,
                                        end: the_end,
                                        interval: d3.time.month,
                                        ylabel: '',
                                        position: undefined,
                                        dateformat: "%b \n \n %y",
                                        nTicks: 4,
                                        prediction: false
                                    };

                                    // container.append("div").html("<b>Interaction volume</b>");
                                    histSettings.position = report.select("#year_top_orgs").append("g").attr("transform", function () {
                                        return "translate(" + ($('#year_top_orgs').width() / 5 * total_num + $('#top_orgs').width() / 5 * 0.15) + "," + 280 + ")"; 
                                    });
                                    var top_dates = VMail.Viz.plotTimeHistogram_report(timestamps, histSettings);
                                    var peak_dates = "";
                                    for(var kk = 0; kk < 3; kk++){
                                        if(top_dates[0][kk].value != 0){
                                            peak_dates += month[top_dates[0][kk].date.getMonth()] + " " + top_dates[0][kk].date.getFullYear();
                                            if(kk == 1){ 
                                                if(top_dates[0][2].value != 0)
                                                    peak_dates += ", and ";
                                            }
                                            else if(kk == 0){ 
                                                if(top_dates[0][2].value != 0)
                                                    peak_dates += ", ";
                                                else
                                                    peak_dates += " and ";
                                            }
                                        }
                                        
                                    }
                                    report.select("#year_top_orgs").append("g").attr("transform", function () {
                                        return "translate(" + ($('#year_top_orgs').width() / 5 * total_num + $('#year_top_orgs').width() / 5 * 0.1) + "," + 70 + ")"; 
                                    }).append("text").attr("text-anchor", "left").attr("id", "org_p_" + k)
                                    .attr("x", 0)
                                    .style("font-weight", 300).style("font-size", 13)
                                    .attr("font-weight", 300).attr("font-size", 13)
                                    .attr("fill", "white").attr("font-family", "'Lato', sans-serif")
                                    .attr("y", 70 + 6).html("You have " + (nodes[0].member_size) + " contacts in " + nodes[0].name + ". "
                                        + "You have " + (results[k].org.nRcvEmails + results[k].org.nSentEmails) + " emails with people in the organization from " + (top_dates[1][0].getFullYear()) + " to " + (top_dates[1][1].getFullYear()) 
                                        + " with the peak months being " + peak_dates + ".");
                                    d3plus.textwrap()
                                        .container(d3.select('#year_top_orgs').select("#org_p_" + k))
                                        .width($('#year_top_orgs').width() / 5 * 0.8)
                                        .height(120)
                                        .draw();  
                                    histSettings.position.selectAll("svg").style("stroke", "white").style("fill", "white");
                                    histSettings.position.selectAll("line").attr("stroke", "white");
                                    histSettings.position.selectAll("path").style("stroke", "white");
                                    histSettings.position.selectAll("rect").style("fill", "rgb(230,230,230)");
                                    total_num++;
                                    k++;
                                }
                            }


                            var timestamps_pattern = (App.db[0].getEmailDatesPattern(start_year, end_year));
                            var hours_data = timestamps_pattern.hours;
                            var days_data = timestamps_pattern.days;
                            var histSettings = {
                                width: 250,
                                height: 150,
                                position: undefined,
                                nTicks: 5
                            };
                            timestamps_hours = VMail.Viz.plotTimeDistributionHistogram(hours_data, histSettings, "hours");
                            timestamps_days = VMail.Viz.plotTimeDistributionHistogram(days_data, histSettings, "days");
                            show_time_pattern();
                        }, 500);
                    }, 2000);

                    // var year_start = start.getFullYear(), year_end = end.getFullYear();
                    // var long_short = 1;
                    // for (var t = year_start + 1; t <= year_end; t++) {
                    //     var slice_date = new Date(t, 1, 1);
                    //     long_short = 1- long_short;
                    //     d3.select("#slice_" + (t-year_start))
                    //         .style("left", function () {
                    //             var left = $(".ui-slider-range").offset().left - 12 + (slice_date - start) / (end - start) * (parseInt(d3.select("body").select("#slider-range").style("width"))); 
                    //             return left + "px";
                    //         })
                    //         .style("top", function () {
                    //             if(long_short == 0) return ($("#timeline").offset().top - 6) + "px";
                    //             return ($("#timeline").offset().top - 2) + "px";
                    //         });
                    //     d3.select("#textslice_" + (t-year_start))
                    //         .style("left", function () {
                    //             var left = $(".ui-slider-range").offset().left - 12 + (slice_date - start) / (end - start) * (parseInt(d3.select("body").select("#slider-range").style("width"))) -13; 
                    //             return left + "px";
                    //         })
                    //         .style("top", function () {
                    //             if(long_short == 0) return ($("#timeline").offset().top - 6 + 22) + "px";
                    //             return ($("#timeline").offset().top - 2 + 22) + "px";
                    //         }).text(function(){
                    //             if(long_short == 0) return t;
                    //             return "";
                    //         });
                    // }
                    // for (var t = 0; t < App.db.length; t++) {//init time for each member
                    //     d3.select("#timeline").select("#em_" + t)
                    //             .style("left", function () {
                    //                 var left = $(".ui-slider-range").offset().left - 12 + (App.init_times[t] - init_start) / (init_end - init_start) * (parseInt(d3.select("body").select("#slider-range").style("width"))); //whole time length
                    //                 return left + "px";
                    //             })
                    //             .style("top", function () {
                    //                 return ($("#timeline").offset().top - 7) + "px";
                    //             });
                    // }

                    //initialize the aggregate histrograms
        //            initHistograms(0);

    //                 //show initial ranking
    //                 //showTopContacts(NTOPCONTACTS, start, end)
    //                 //setup click handlers for rankings
    //                 if(App.type != "multi" && App.type != "single"){
    //                     $('#allTimesLink').click(function () {
    //                         App.isWithinRange = false;
    //                         showTopContacts(NTOPCONTACTS);
    //                     });
    //                     $('#thisYearLink').click(function () {
    //                         App.isWithinRange = true;
    //                         showTopContacts(NTOPCONTACTS);
    //                     });
    //                 }
    //                 else{
    //                     for(var i = 0; i < App.db.length; i++){
    //                         $('#rankings_' + i + ' #allTimesLink').click(function () {
    //                             App.isWithinRange = false;
    //                             showTopContacts(NTOPCONTACTS);
    //                         });
    //                         $('#rankings_' + i + ' #thisYearLink').click(function () {
    //                             App.isWithinRange = true;
    //                             showTopContacts(NTOPCONTACTS);
    //                         });
    //                     }
    //                 }
                    
    //                 if(App.type != "multi"){ 
    // //                    $('#communities').addClass('selectedlink');
    // //                    $('#people').addClass('selectedlink');
    // //                    App.color_method(true, false, -1);
    //                     document.getElementById("radio-community").click();
    //                 }
                }, 10);
            }, 1000);
        };

        //analysis chart in dashboard
        var flag_ana_chart = 1;
        var initAnalysisCharts = function () {
            if (VMail.App.type == "multi") {
                var init_start = 100000000000, init_end = 0;
                for (var t = 0; t < App.db.length; t++) {
                    if (App.db[t].emails[0].timestamp < init_start) {
                        init_start = App.db[t].emails[0].timestamp;
                    }
                    if (App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end) {
                        init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp;
                    }
                }
                var aa = +new Date(init_start * 1000);
                var bb = +new Date(init_end * 1000);
                init_start = new Date(init_start * 1000);
                init_end = new Date(init_end * 1000);
                var c = init_end * 1000;
                var start = init_start;
                var end = start;
                var merge_num = 1;

                var histSettings = {
                    width: 250,
                    height: 150,
                    start: new Date(aa),
                    end: new Date(bb),
                    interval: d3.time.month, //d3.time.month,
                    position: undefined,
//                    dateformat: "'%y",
                    dateformat: "%b \n \n %y",
                    nTicks: 4,
                    prediction: false
                };
                var container = d3.select("#ana_stats");
                histSettings.position = d3.select("#ana_stats");


                App.ave_degree = [];
                App.density = [];
                App.ave_SPL = [];
                App.num_cliques = [];
                App.ave_btw_centrality = [];

                var for_ana_chart;
                if (flag_ana_chart == 1) {
                    for_ana_chart = setInterval(function () {
                        start = start;
                        end = ((d3.time.month.offset(end, 1) > init_end) ? init_end : d3.time.month.offset(end, 1));
                        if (end == init_end) { //end of the timeline, stop the interval

                        }
                        else { //move one month forward in the timeline

                        }
                    }, 500);
                }
                else {
                    clearInterval(for_ana_chart);
                }
            }
        };
//        initAnalysisCharts();

        var nscheduled = null;
        var queuesize = null;
        var logout_flag = 0, logout_flag2 = 0;
        $(document).ready(function () {
            var univ_data;
            d3.json("/static/world_universities_and_domains.json", function (u_data) {
                univ_data = u_data;

                $('#email_net_notext_link').click(function () {
                    VMail.App.snapshot(true);
                });
                $('#email_net_link').click(function () {
                    VMail.App.snapshot(false);
                });

                $('#slider-range').css("width", $(window).width() - 288 - 40 - 30 - 21 - 50).css("left", "50px");
                App.toggleinfo(true, false);
                App.toggleMemberStats(true, false, false);
//                App.toggleAnaStats(true, false);
                App.org_or_person(false, true);
                App.see_members(false, false, true);
                
                var dataIsShown = false;

                if (App.userinfo['name'] === 'Demo User') {
                    d3.select("#user_name").html(fict_name);
                    d3.select("#user_email").html(fict_email);
                } else {
                    d3.select("#user_name").html(App.userinfo['name']);
                    d3.select("#user_email").html(App.userinfo['email']);
                }
                if (App.userinfo['picture'] !== undefined) {
                    $("#user_pic").attr("src", App.userinfo['picture']);
                } else {
                    $("#user_pic").attr("src", "/static/images/default_user_pic.jpg");
                }
                // $("#runway").css("display", "block");
                // d3.select("#processing").style("display", "block");
                $("#processing").fadeIn();

                if (App.version < 0) {
                    d3.select("#greetings").style("display", null);
                    return;
                }
                $("#runway").css("display", "none");
                $("#rightlogout").css("display", "block");

                if (App.type == "multi" || App.type == "single") {
                    App.versions = new Array(App.usersinfo.length);
                    App.setupDBdone = new Array(App.usersinfo.length);
                    App.studyDone = new Array(App.usersinfo.length);
//                    App.induced_betweenness_centrality = new Array(App.usersinfo.length);
                    // App.personality['Open-Mindedness'] = new Array(VMail.App.usersinfo.length);
                    // App.personality['Conscientiousness'] = new Array(VMail.App.usersinfo.length);
                    // App.personality['Extraversion'] = new Array(VMail.App.usersinfo.length);
                    // App.personality['Agreeableness'] = new Array(VMail.App.usersinfo.length);
                    // App.personality['Negative Emotionality'] = new Array(VMail.App.usersinfo.length);
                    for(var i = 0; i < App.usersinfo.length; i++){ 
                        App.studyDone[i] = 0; App.studyDone_morality[i] = 0; App.studyDone_demographic[i] = 0;
                        App.setupDBdone[i] = 0; 
//                        App.induced_betweenness_centrality[i] = 0;
                    }

                    var totalWidth = parseInt(d3.select("body").style("width").substring(0, d3.select("body").style("width").indexOf("px")));
                    // d3.range(App.usersinfo.length).forEach(function (i) {
                    //     var runway = d3.select("body").append("div").attr("class", "runway").attr("id", "runway_" + i);
                    //     var line = Math.ceil(App.usersinfo.length / 6);
                    //     if (App.usersinfo.length > 6) {

                    //     }
                    //     runway.style("display", "none").style("text-align", "center")
                    //             .style("position", "relative").style("float", "left").style("left", "20px").style("top", "15%")
                    //             .style("margin", "0 auto 0 auto").style("width", (totalWidth - 40) / App.usersinfo.length + "px");
                    //     runway.html('<img id="user_pic" class="runway_item"></img>    <div id="user_name" class="runway_item"></div>    <div id="user_email" class="runway_item"></div>    <div id="user_totalemails" class="runway_item"></div>    <div id="user_fetchedcount" class="runway_item"></div>    <div id="user_queue" class="runway_item"></div>');
                    //     if (App.usersinfo[i]['name'] === 'Demo User') {
                    //         runway.select("#user_name").html(fict_name);
                    //         runway.select("#user_email").html(fict_email);
                    //     } else {
                    //         runway.select("#user_name").html(App.usersinfo[i]['name']);
                    //         runway.select("#user_email").html(App.usersinfo[i]['email']);
                    //     }
                    //     if (App.usersinfo[i].name != "Kevin Hu" && App.usersinfo[i]['picture'] !== undefined) {
                    //         runway.select("#user_pic").attr("src", App.usersinfo[i]['picture']);
                    //     } else {
                    //         if(App.usersinfo[i].name == "Almaha Almalki") runway.select("#user_pic").attr("src", "/static/images/demo_maha.png");
                    //         else if(App.usersinfo[i].name == "Sanjay Guruprasad") runway.select("#user_pic").attr("src", "/static/images/demo_sanjay.png")
                    //         else if(App.usersinfo[i].name == "Jingxian Zhang") runway.select("#user_pic").attr("src", "/static/images/demo_jingxian.png")
                    //         else if(App.usersinfo[i].name == "Cesar Hidalgo" || App.usersinfo[i].name == "Cesar A. Hidalgo") runway.select("#user_pic").attr("src", "/static/images/demo_cesar.png")
                    //         else if(App.usersinfo[i].name == "Kevin Hu" || App.usersinfo[i].name == "Kevin Zeng Hu") runway.select("#user_pic").attr("src", "/static/images/demo_kevin.png")
                    //         else runway.select("#user_pic").attr("src", "/static/images/default_user_pic.jpg");
                    //     }
                    // });
                    // d3.selectAll(".runway").style("display", "block");

                }


                // $("#loader").css("display", "block");

                // fetch all email files
                // d3.select("#loader").html('Downloading emails to browser.. 0%');
                // $("#loader").css("display", "block");
                var versions_done = 0;
                var allemails = [];
                if (!App.usersinfo || App.type == "single") {//alert("version"+App.version);
                    d3.range(App.usersinfo.length).forEach(function (k) {
                        $.ajax({
                            //                            type: "POST",
                            dataType: "json",
                            url: "/get_one_personality/&json=" + App.usersinfo[k].email,
                            success: function (personality) {
                                if(JSON.stringify(personality) != JSON.stringify({})){
                                    VMail.App.studyDone[k] = 1;
                                    VMail.App.personality['personality']['Open-Mindedness'][k] = parseInt(personality['personality']['Open-Mindedness']);
                                    VMail.App.personality['personality']['Conscientiousness'][k] = parseInt(personality['personality']['Conscientiousness']);
                                    VMail.App.personality['personality']['Extraversion'][k] = parseInt(personality['personality']['Extraversion']);
                                    VMail.App.personality['personality']['Agreeableness'][k] = parseInt(personality['personality']['Agreeableness']);
                                    VMail.App.personality['personality']['Negative Emotionality'][k] = parseInt(personality['personality']['Negative Emotionality']);
                                    if(k == 0){
                                        d3.select("#personality_test").append("img").attr("class", "team_admin")
                                                .attr("src", "/static/images/done_icon.png");
                                        d3.select(".tg").selectAll("#round").style("left", function(d, i){
                                            switch(i){
                                                case 0: return ((380 - 16) / 100 * parseInt(personality['personality']['Open-Mindedness'])) + "px"; break;
                                                case 1: return ((380 - 16) / 100 * parseInt(personality['personality']['Conscientiousness'])) + "px"; break;
                                                case 2: return ((380 - 16) / 100 * parseInt(personality['personality']['Extraversion'])) + "px"; break;
                                                case 3: return ((380 - 16) / 100 * parseInt(personality['personality']['Agreeableness'])) + "px"; break;
                                                case 4: return ((380 - 16) / 100 * parseInt(personality['personality']['Negative Emotionality'])) + "px"; break;
                                            }
                                        }).style("top", "1px");
                                        d3.select(".tg").selectAll(".tg-baqh").text(function(d, i){
                                            switch(i){
                                                case 1: return personality['personality']['Open-Mindedness']; break;
                                                case 2: return personality['personality']['Conscientiousness']; break;
                                                case 3: return personality['personality']['Extraversion']; break;
                                                case 4: return personality['personality']['Agreeableness']; break;
                                                case 5: return personality['personality']['Negative Emotionality']; break;
                                                default: return "Percentile";
                                            }
                                        });
                                    }
                                }
                            }
                        });

                        $.ajax({
                            //                            type: "POST",
                            dataType: "json",
                            url: "/get_one_morality/&json=" + App.usersinfo[k].email,
                            success: function (morality) {
                                if(JSON.stringify(morality) != JSON.stringify({})){
                                    VMail.App.studyDone_morality[k] = 1;
                                    VMail.App.morality['Fairness'][k] = parseFloat(morality['morality']['Fairness']);
                                    VMail.App.morality['Harm'][k] = parseFloat(morality['morality']['Harm']);
                                    VMail.App.morality['Loyalty'][k] = parseFloat(morality['morality']['Loyalty']);
                                    VMail.App.morality['Authority'][k] = parseFloat(morality['morality']['Authority']);
                                    VMail.App.morality['Purity'][k] = parseFloat(morality['morality']['Purity']);


                                    if(k == 0){
                                        d3.select("#morality_test").append("img").attr("class", "team_admin")
                                            .attr("src", "/static/images/done_icon.png");
                                        
                                        var margin = {top: (parseInt(d3.select('body').style('width'), 10)/8), right: (parseInt(d3.select('body').style('width'), 10)/5), bottom: (parseInt(d3.select('body').style('width'), 10)/5), left: (parseInt(d3.select('body').style('width'), 10)/5)},
                                            width = parseInt(d3.select('body').style('width'), 10) - margin.left - margin.right,
                                            height = parseInt(d3.select('body').style('height'), 10) - margin.top - margin.bottom;

                                        var x0 = d3.scale.ordinal()
                                            .rangeRoundBands([0, width], .1);

                                        var x1 = d3.scale.ordinal();

                                        var y = d3.scale.linear()
                                            .range([height, 0]);

                                        var colorRange = d3.scale.category20();
                                        var color = d3.scale.ordinal()
                                            .domain(["You", "Liberals", "Conservatives"])
                                            .range(["#ffffff", "#1b466c", "#ab2b2b"]);

                                        var xAxis = d3.svg.axis()
                                            .scale(x0)
                                            .orient("bottom");

                                        var yAxis = d3.svg.axis()
                                            .scale(y)
                                            .orient("left")
                                            .ticks(5);

                                        var divTooltip = d3.select("body").append("div").attr("class", "toolTip");

                                        d3.select("#morality_histo").selectAll("*").remove();
                                        var svg = d3.select("#morality_histo")
                                            .attr("width", width + margin.left + margin.right)
                                            .attr("height", height + margin.top + margin.bottom)
                                            .append("g")
                                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                                        dataset = [
                                            {label:"Fairness", "You": VMail.App.morality['Fairness'][k], "Liberals": 3.8, "Conservatives": 3.1},
                                            {label:"Harm", "You": VMail.App.morality['Harm'][k], "Liberals": 3.7, "Conservatives": 3.1},
                                            {label:"Loyalty", "You": VMail.App.morality['Loyalty'][k], "Liberals": 2.2, "Conservatives": 3.1},
                                            {label:"Authority", "You": VMail.App.morality['Authority'][k], "Liberals": 2.1, "Conservatives": 3.3},
                                            {label:"Purity", "You": VMail.App.morality['Purity'][k], "Liberals": 1.4, "Conservatives": 3.0}
                                        ];


                                        var options = d3.keys(dataset[0]).filter(function(key) { return key !== "label"; });

                                        dataset.forEach(function(d) {
                                            d.valores = options.map(function(name) { return {name: name, value: +d[name]}; });
                                        });

                                        x0.domain(dataset.map(function(d) { return d.label; }));
                                        x1.domain(options).rangeRoundBands([0, x0.rangeBand()]);
                                        y.domain([0, 5]);

                                        svg.append("g")
                                            .attr("class", "x axis")
                                            .attr("transform", "translate(0," + height + ")")
                                            .call(xAxis);

                                        svg.append("g")
                                            .attr("class", "y axis")
                                            .call(yAxis)
                                            .append("text")
                                            .attr("transform", "rotate(-90)")
                                            .attr("y", 6)
                                            .attr("dy", ".71em")
                                            .style("text-anchor", "end")
                                            .text("Score");

                                        var bar = svg.selectAll(".bar")
                                            .data(dataset)
                                            .enter().append("g")
                                            .attr("class", "rect")
                                            .attr("transform", function(d) { return "translate(" + x0(d.label) + ",0)"; });

                                        bar.selectAll("rect")
                                            .data(function(d) { return d.valores; })
                                            .enter().append("rect")
                                            .attr("width", x1.rangeBand())
                                            .attr("x", function(d) { return x1(d.name); })
                                            .attr("y", function(d) { return y(d.value); })
                                            .attr("value", function(d){return d.name;})
                                            .attr("height", function(d) { return height - y(d.value); })
                                            .style("fill", function(d) { return color(d.name); });

                                        bar
                                            .on("mousemove", function(d){
                                                divTooltip.style("left", d3.event.pageX+10+"px");
                                                divTooltip.style("top", d3.event.pageY-25+"px");
                                                divTooltip.style("display", "inline-block");
                                                var x = d3.event.pageX, y = d3.event.pageY
                                                var elements = document.querySelectorAll(':hover');
                                                l = elements.length
                                                l = l-1
                                                elementData = elements[l].__data__
                                                divTooltip.html((d.label)+"<br>"+elementData.name+"<br>"+elementData.value+"%");
                                            });
                                        bar
                                            .on("mouseout", function(d){
                                                divTooltip.style("display", "none");
                                            });


                                        var legend = svg.selectAll(".legend")
                                            .data(options.slice())
                                            .enter().append("g")
                                            .attr("class", "legend")
                                            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

                                        legend.append("rect")
                                            .attr("x", width - 18)
                                            .attr("width", 18)
                                            .attr("height", 18)
                                            .style("fill", color);

                                        legend.append("text")
                                            .attr("x", width - 24)
                                            .attr("y", 9)
                                            .attr("dy", ".35em")
                                            .style("text-anchor", "end")
                                            .text(function(d) { return d; });
                                    }
                                }
                            }
                        });

                        $.ajax({
                            dataType: "json",
                            url: "/get_one_demographic/&json=" + App.usersinfo[k].email,
                            success: function (demographic) {console.log(demographic);
                                if(JSON.stringify(demographic) != JSON.stringify({})){
                                    for(var key in demographic)
                                        VMail.App.demographic[key][k] = demographic[key];
                                    VMail.App.studyDone_demographic[k] = 1;
                                    if(k == 0){
                                        d3.select("#demographic_test").append("img").attr("class", "team_admin")
                                            .attr("src", "/static/images/done_icon.png");
                                        
                                    }
                                }
                            }
                        });
                    });
                    //get teams the loggedin user are in
                    $.ajax({
                        dataType: "json",
                        url: "/getteams/&json=" + App.userinfo.email,
                        cache: true,
                        success: function (my_teams) {
                            d3.range(my_teams.length).forEach(function (k) {
                                if(my_teams[k]['admin']['email'] == App.userinfo.email){
                                    d3.select("#setting_teams").append("div").attr("class", "one_team admin").attr("id", "oneteam_" + k)
                                        .text(my_teams[k].id)
                                        .on("click", function(){
                                            window.open(
                                              window.document.location.protocol + '//' + window.document.location.host + '/teamviz/' + my_teams[k].id,
                                              '_blank' 
                                            );
                                    });
                                    d3.select("#setting_teams").select("#oneteam_" + k).append("img").attr("class", "team_admin")
                                      .attr("src", "/static/images/admin.png");
                                }
                                else{
                                    d3.select("#setting_teams").append("div").attr("class", "one_team nonadmin").attr("id", "oneteam_" + k)
                                        .text(my_teams[k].id)
                                        .on("click", function(){
                                            window.open(
                                              window.document.location.protocol + '//' + window.document.location.host + '/teamviz/' + my_teams[k].id,
                                              '_blank' 
                                            );
                                    });
                                }
                            });
                            
                        }
                    });

                    $.ajax({
    //                            type: "POST",
                        dataType: "json",
                        url: "/getversion/&json=" + App.userinfo.email,
                        cache: true,
                        success: function (returned_version) {
                            App.version = returned_version;
                            d3.range(App.version + 1).forEach(function (i) {
                                $.ajax({
                                    dataType: "json",
                                    url: "/getemails/" + i + "&"  + "json=" + App.userinfo.email,
                                    cache: true,
                                    complete: function () {
                                        versions_done++;
                                        // $("#loader").html('Downloading email metadata to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
                                        console.log('Downloading emails to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
                                        if (versions_done === App.version + 1) {
                                            console.log("fetching of emails files done!!");
                                            // d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
                                            d3.json("/getstats/&", function (error, stats) {
                                                //                                    App.db = VMail.DB.setupDB(App.userinfo, allemails, stats);
                                                App.db = new Array(1); 
                                                App.db[0] = VMail.DB.setupDB(App.userinfo, allemails, stats, univ_data);
                                                console.log("done setting up the db");
                                                if (App.working == 1) {
                                                    // $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
                                                } else {
                                                    $("#loader").css("display", "none");
                                                    // d3.select("#processing").style("display", "none");
                                                    $("#processing").fadeOut();
                                                }
                                                $("#runway").css("display", "none");
                                                d3.selectAll(".runway").style("display", "none");
                                                for(var mm in VMail.App.orgs){
                                                    App.domainToid[VMail.App.orgs[mm].domain] = mm;
                                                }
                                                dataIsShown = true;
                                                showData();
                                                sendStatsToServer(0);
                                            });
                                        }
                                    },
                                    success: function (emails) {
                                        allemails = allemails.concat(emails);
                                    }
                                });
                            });
                        }
                    });
                }
                else {
                    var theVersion = App.version;
                    var is_ocp = 0;
                    if(App.userinfo.email == "data.immersion@gmail.com" || App.userinfo.email == "data.immersion.2016@gmail.com"){
                        if(App.userinfo.email == "data.immersion@gmail.com" && App.usersinfo.length == 1){
                            App.usersinfo = [
                                {email: "kfrauscher@worldbank.org", given_name: "Kathrin", family_name: "Frauscher", name: "Kathrin Frauscher"},
                                {email: "ghayman@open-contracting.org", given_name: "Gavin", family_name: "Hayman", name: "Gavin Hayman"},
                                {email: "info@open-contracting.org", given_name: "OCP", family_name: "", name: "OCP"},
                                {email: "lmarchessault@worldbank.org", given_name: "Lindsey", family_name: "Marchessault", name: "Lindsey Marchessault"},
                                {email: "gneumann@open-contracting.org", given_name: "Georg", family_name: "Neumann", name: "Georg Neumann"},
                                {email: "sramirez@open-contracting.org", given_name: "Sierra", family_name: "Ramirez", name: "Sierra Ramirez"},
                                {email: "jrmacdonald@open-contracting.org", given_name: "J.", family_name: "Macdonald", name: "J. Macdonald"}
                            ];
                        }
                        else if(App.userinfo.email == "data.immersion@gmail.com" && App.usersinfo.length == 2){
                            App.usersinfo = [
                                {email: "kfrauscher@worldbank.org", given_name: "Kathrin", family_name: "Frauscher", name: "Kathrin Frauscher"},
                                {email: "ghayman@open-contracting.org", given_name: "Gavin", family_name: "Hayman", name: "Gavin Hayman"},
                                {email: "info@open-contracting.org", given_name: "OCP", family_name: "", name: "OCP"},
                                {email: "lindsey.marchessault@gmail.com", given_name: "Lindsey", family_name: "Marchessault", name: "Lindsey Marchessault"},
                                {email: "gneumann@open-contracting.org", given_name: "Georg", family_name: "Neumann", name: "Georg Neumann"},
                                {email: "sramirez@open-contracting.org", given_name: "Sierra", family_name: "Ramirez", name: "Sierra Ramirez"},
                                {email: "jrmacdonald@open-contracting.org", given_name: "J.", family_name: "Macdonald", name: "J. Macdonald"},
                                {email: "kwikrent@developmentgateway.org", given_name: "Katherine", family_name: "Wikrent", name: "Katherine Wikrent"},
                                {email: "ckluttz@open-contracting.org", given_name: "Carey", family_name: "Kluttz", name: "Carey Kluttz"},
                                {email: "karolis@open-contracting.org", given_name: "Karolis", family_name: "Granickas", name: "Karolis Granickas"},
                                {email: "mdiop@open-contracting.org", given_name: "Marie", family_name: "Diop", name: "Marie Diop"}
                            ];
                            is_ocp = 1;
                        }
                        else{
                            App.usersinfo = [
                                {email: "kfrauscher@gmail.com", given_name: "Kathrin", family_name: "Frauscher", name: "Kathrin Frauscher"},
                                {email: "haymangavin@gmail.com", given_name: "Gavin", family_name: "Hayman", name: "Gavin Hayman"},
                                {email: "info@open-contracting.org", given_name: "OCP", family_name: "", name: "OCP"},
                                {email: "lindsey.marchessault@gmail.com", given_name: "Lindsey", family_name: "Marchessault", name: "Lindsey Marchessault"},
                                {email: "georgneu@gmail.com", given_name: "Georg", family_name: "Neumann", name: "Georg Neumann"},
                                {email: "sramirez@open-contracting.org", given_name: "Sierra", family_name: "Ramirez", name: "Sierra Ramirez"},
                                {email: "jrmacdonald@law.gwu.edu", given_name: "J.", family_name: "Macdonald", name: "J. Macdonald"},
                                {email: "katherine.wikrent@gmail.com", given_name: "Katherine", family_name: "Wikrent", name: "Katherine Wikrent"},
                                {email: "careykluttz@gmail.com", given_name: "Carey", family_name: "Kluttz", name: "Carey Kluttz"},
                                {email: "k.granickas@gmail.com", given_name: "Karolis", family_name: "Granickas", name: "Karolis Granickas"},
                                {email: "mariediop08@gmail.com", given_name: "Marie", family_name: "Diop", name: "Marie Diop"}
                            ];
                        }
                        $.ajax({
    //                            type: "POST",
                            dataType: "json",
                            url: "/getversion/&json=" + App.userinfo.email,
                            cache: true,
                            success: function (returned_version) {
                                App.version = returned_version;
                                d3.range(App.version + 1).forEach(function (i) {
                                    $.ajax({
                                        dataType: "json",
                                        url: "/getemails/" + i + "&",
                                        cache: true,
                                        complete: function () {
                                            versions_done++;
                                            // $("#loader").html('Downloading email metadata to browser.. ' + Math.floor((100 * versions_done) / (App.version + 5 + 1)) + "%");
                                            console.log('Downloading emails to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
                                            if (versions_done === App.version + 1) {
                                                if(is_ocp == 1){
                                                    theVersion = 5;
                                                    $.ajax({
                                                        dataType: "json",
                                                        url: "/getversion/&json=data.immersion.2016@gmail.com",
                                                        cache: true,
                                                        success: function (returned_version) {
                                                            App.version = returned_version;
                                                            d3.range(App.version + 1).forEach(function (i) {
                                                                $.ajax({
                                                                    dataType: "json",
                                                                    url: "/getemails/" + i + "&json=data.immersion.2016@gmail.com",
                                                                    cache: true,
                                                                    complete: function () {
                                                                        versions_done++;
                                                                        // $("#loader").html('Downloading email metadata to browser.. ' + Math.floor((100 * versions_done) / (App.version +5 + 1)) + "%");
                                                                        console.log('Downloading emails to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
                                                                        if (versions_done === App.version + 1) {
                                                                            console.log("fetching of emails files done!!");
                                                                            // d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
                                                                            d3.json("/getstats/&", function (error, stats) {
                                                                                allemails = VMail.DB.modifyMails(App.userinfo, allemails);
                                                                                App.db = new Array(App.usersinfo.length);
                                                                                for(var m = 0; m < App.usersinfo.length; m++){
                                                                                    App.db[m] = VMail.DB.setupDB(App.usersinfo[m], allemails, stats, univ_data);
                                                                                }
                                                                                console.log("done setting up the db");
                                                                                if (App.working == 1) {
                                                                                    // $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
                                                                                } else {
                                                                                    $("#loader").css("display", "none");
                                                                                }
                                                                                $("#runway").css("display", "none");
                                                                                d3.selectAll(".runway").style("display", "none");
                                                                                dataIsShown = true;
                                                                                for(var mm in VMail.App.orgs){
                                                                                    App.domainToid[VMail.App.orgs[mm].domain] = mm;
                                                                                }
                                                                                showData();
                                                                                sendStatsToServer(0);
                                                                            });
                                                                        }
                                                                    },
                                                                    success: function (emails) {
                                                                        allemails = allemails.concat(emails);
                                                                    }
                                                                });
                                                            });
                                                        }
                                                    });
                                                }
                                                else{
                                                    console.log("fetching of emails files done!!");
                                                    // d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
                                                    d3.json("/getstats/&", function (error, stats) {
                                                        allemails = VMail.DB.modifyMails(App.userinfo, allemails);
                                                        App.db = new Array(App.usersinfo.length);
                                                        for(var m = 0; m < App.usersinfo.length; m++){
                                                            App.db[m] = VMail.DB.setupDB(App.usersinfo[m], allemails, stats, univ_data);
                                                        }
                                                        console.log("done setting up the db");
                                                        if (App.working == 1) {
                                                            // $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
                                                        } else {
                                                            $("#loader").css("display", "none");
                                                        }
                                                        $("#runway").css("display", "none");
                                                        d3.selectAll(".runway").style("display", "none");
                                                        dataIsShown = true;
                                                        for(var mm in VMail.App.orgs){
                                                            App.domainToid[VMail.App.orgs[mm].domain] = mm;
                                                        }
                                                        showData();
                                                        sendStatsToServer(0);
                                                    });
                                                }
                                            }
                                        },
                                        success: function (emails) {
                                            allemails = allemails.concat(emails);
                                        }
                                    });
                                });
                            }
                        });
                    }
                    else{
                        App.db = new Array(App.usersinfo.length);
                        App.verisonTowaitTime = new Array(App.usersinfo.length);
        //                var time = 0;personality_survey_answer
                        d3.range(App.usersinfo.length).forEach(function (k) {
                            $.ajax({
                                    //                            type: "POST",
                                    dataType: "json",
                                    url: "/getversion/&json=" + App.usersinfo[k].email,
                                    cache: true,
                                    success: function (returned_version) {
                                        App.verisonTowaitTime[k] = returned_version;
                                    }
                                });
                        });
                        //get teams the loggedin user are in
                        $.ajax({
                            dataType: "json",
                            url: "/getteams/&json=" + App.userinfo.email,
                            cache: true,
                            success: function (my_teams) {
                                d3.range(my_teams.length).forEach(function (k) {
                                    if(my_teams[k]['admin']['email'] == App.userinfo.email){
                                        d3.select("#setting_teams").append("div").attr("class", "one_team admin").attr("id", "oneteam_" + k)
                                            .text(my_teams[k].id)
                                            .on("click", function(){
                                                window.open(
                                                  window.document.location.protocol + '//' + window.document.location.host + '/teamviz/' + my_teams[k].id,
                                                  '_blank' 
                                                );
                                        });
                                        d3.select("#setting_teams").select("#oneteam_" + k).append("img").attr("class", "team_admin")
                                          .attr("src", "/static/images/admin.png");
                                    }
                                    else{
                                        d3.select("#setting_teams").append("div").attr("class", "one_team nonadmin").attr("id", "oneteam_" + k)
                                            .text(my_teams[k].id)
                                            .on("click", function(){
                                                window.open(
                                                  window.document.location.protocol + '//' + window.document.location.host + '/teamviz/' + my_teams[k].id,
                                                  '_blank' 
                                                );
                                        });
                                    }
                                });
                                
                            }
                        });

                        d3.range(App.usersinfo.length).forEach(function (k) {
                            $.ajax({
                                //                            type: "POST",
                                dataType: "json",
                                url: "/get_one_personality/&json=" + App.usersinfo[k].email,
                                success: function (personality) {
                                    if(JSON.stringify(personality) != JSON.stringify({})){
                                        VMail.App.studyDone[k] = 1;
                                        VMail.App.personality['Open-Mindedness'][k] = parseInt(personality['personality']['Open-Mindedness']);
                                        VMail.App.personality['Conscientiousness'][k] = parseInt(personality['personality']['Conscientiousness']);
                                        VMail.App.personality['Extraversion'][k] = parseInt(personality['personality']['Extraversion']);
                                        VMail.App.personality['Agreeableness'][k] = parseInt(personality['personality']['Agreeableness']);
                                        VMail.App.personality['Negative Emotionality'][k] = parseInt(personality['personality']['Negative Emotionality']);
                                        if(k == 0){
                                            d3.select("#personality_test").append("img").attr("class", "team_admin")
                                                .attr("src", "/static/images/done_icon.png");
                                            d3.select(".tg").selectAll("#round").style("left", function(d, i){
                                                switch(i){
                                                    case 0: return ((380 - 16) / 100 * parseInt(personality['personality']['Open-Mindedness'])) + "px"; break;
                                                    case 1: return ((380 - 16) / 100 * parseInt(personality['personality']['Conscientiousness'])) + "px"; break;
                                                    case 2: return ((380 - 16) / 100 * parseInt(personality['personality']['Extraversion'])) + "px"; break;
                                                    case 3: return ((380 - 16) / 100 * parseInt(personality['personality']['Agreeableness'])) + "px"; break;
                                                    case 4: return ((380 - 16) / 100 * parseInt(personality['personality']['Negative Emotionality'])) + "px"; break;
                                                }
                                            }).style("top", "1px");
                                            d3.select(".tg").selectAll(".tg-baqh").text(function(d, i){
                                                switch(i){
                                                    case 1: return personality['personality']['Open-Mindedness']; break;
                                                    case 2: return personality['personality']['Conscientiousness']; break;
                                                    case 3: return personality['personality']['Extraversion']; break;
                                                    case 4: return personality['personality']['Agreeableness']; break;
                                                    case 5: return personality['personality']['Negative Emotionality']; break;
                                                    default: return "Percentile";
                                                }
                                            });
                                        }
                                    }
                                }
                            });

                            $.ajax({
                                //                            type: "POST",
                                dataType: "json",
                                url: "/get_one_morality/&json=" + App.usersinfo[k].email,
                                success: function (morality) {
                                    if(JSON.stringify(morality) != JSON.stringify({})){
                                        VMail.App.studyDone_morality[k] = 1;
                                        VMail.App.morality['Fairness'][k] = parseFloat(morality['morality']['Fairness']);
                                        VMail.App.morality['Harm'][k] = parseFloat(morality['morality']['Harm']);
                                        VMail.App.morality['Loyalty'][k] = parseFloat(morality['morality']['Loyalty']);
                                        VMail.App.morality['Authority'][k] = parseFloat(morality['morality']['Authority']);
                                        VMail.App.morality['Purity'][k] = parseFloat(morality['morality']['Purity']);


                                        if(k == 0){
                                            d3.select("#morality_test").append("img").attr("class", "team_admin")
                                                .attr("src", "/static/images/done_icon.png");
                                            
                                            var margin = {top: (parseInt(d3.select('body').style('width'), 10)/8), right: (parseInt(d3.select('body').style('width'), 10)/5), bottom: (parseInt(d3.select('body').style('width'), 10)/5), left: (parseInt(d3.select('body').style('width'), 10)/5)},
                                                width = parseInt(d3.select('body').style('width'), 10) - margin.left - margin.right,
                                                height = parseInt(d3.select('body').style('height'), 10) - margin.top - margin.bottom;

                                            var x0 = d3.scale.ordinal()
                                                .rangeRoundBands([0, width], .1);

                                            var x1 = d3.scale.ordinal();

                                            var y = d3.scale.linear()
                                                .range([height, 0]);

                                            var colorRange = d3.scale.category20();
                                            var color = d3.scale.ordinal()
                                                .domain(["You", "Liberals", "Conservatives"])
                                                .range(["#ffffff", "#1b466c", "#ab2b2b"]);

                                            var xAxis = d3.svg.axis()
                                                .scale(x0)
                                                .orient("bottom");

                                            var yAxis = d3.svg.axis()
                                                .scale(y)
                                                .orient("left")
                                                .ticks(5);

                                            var divTooltip = d3.select("body").append("div").attr("class", "toolTip");

                                            d3.select("#morality_histo").selectAll("*").remove();
                                            var svg = d3.select("#morality_histo")
                                                .attr("width", width + margin.left + margin.right)
                                                .attr("height", height + margin.top + margin.bottom)
                                                .append("g")
                                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                                            dataset = [
                                                {label:"Fairness", "You": VMail.App.morality['Fairness'][k], "Liberals": 3.8, "Conservatives": 3.1},
                                                {label:"Harm", "You": VMail.App.morality['Harm'][k], "Liberals": 3.7, "Conservatives": 3.1},
                                                {label:"Loyalty", "You": VMail.App.morality['Loyalty'][k], "Liberals": 2.2, "Conservatives": 3.1},
                                                {label:"Authority", "You": VMail.App.morality['Authority'][k], "Liberals": 2.1, "Conservatives": 3.3},
                                                {label:"Purity", "You": VMail.App.morality['Purity'][k], "Liberals": 1.4, "Conservatives": 3.0}
                                            ];


                                            var options = d3.keys(dataset[0]).filter(function(key) { return key !== "label"; });

                                            dataset.forEach(function(d) {
                                                d.valores = options.map(function(name) { return {name: name, value: +d[name]}; });
                                            });

                                            x0.domain(dataset.map(function(d) { return d.label; }));
                                            x1.domain(options).rangeRoundBands([0, x0.rangeBand()]);
                                            y.domain([0, 5]);

                                            svg.append("g")
                                                .attr("class", "x axis")
                                                .attr("transform", "translate(0," + height + ")")
                                                .call(xAxis);

                                            svg.append("g")
                                                .attr("class", "y axis")
                                                .call(yAxis)
                                                .append("text")
                                                .attr("transform", "rotate(-90)")
                                                .attr("y", 6)
                                                .attr("dy", ".71em")
                                                .style("text-anchor", "end")
                                                .text("Score");

                                            var bar = svg.selectAll(".bar")
                                                .data(dataset)
                                                .enter().append("g")
                                                .attr("class", "rect")
                                                .attr("transform", function(d) { return "translate(" + x0(d.label) + ",0)"; });

                                            bar.selectAll("rect")
                                                .data(function(d) { return d.valores; })
                                                .enter().append("rect")
                                                .attr("width", x1.rangeBand())
                                                .attr("x", function(d) { return x1(d.name); })
                                                .attr("y", function(d) { return y(d.value); })
                                                .attr("value", function(d){return d.name;})
                                                .attr("height", function(d) { return height - y(d.value); })
                                                .style("fill", function(d) { return color(d.name); });

                                            bar
                                                .on("mousemove", function(d){
                                                    divTooltip.style("left", d3.event.pageX+10+"px");
                                                    divTooltip.style("top", d3.event.pageY-25+"px");
                                                    divTooltip.style("display", "inline-block");
                                                    var x = d3.event.pageX, y = d3.event.pageY
                                                    var elements = document.querySelectorAll(':hover');
                                                    l = elements.length
                                                    l = l-1
                                                    elementData = elements[l].__data__
                                                    divTooltip.html((d.label)+"<br>"+elementData.name+"<br>"+elementData.value+"%");
                                                });
                                            bar
                                                .on("mouseout", function(d){
                                                    divTooltip.style("display", "none");
                                                });


                                            var legend = svg.selectAll(".legend")
                                                .data(options.slice())
                                                .enter().append("g")
                                                .attr("class", "legend")
                                                .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

                                            legend.append("rect")
                                                .attr("x", width - 18)
                                                .attr("width", 18)
                                                .attr("height", 18)
                                                .style("fill", color);

                                            legend.append("text")
                                                .attr("x", width - 24)
                                                .attr("y", 9)
                                                .attr("dy", ".35em")
                                                .style("text-anchor", "end")
                                                .text(function(d) { return d; });
                                        }
                                    }
                                }
                            });
                        });
                        //wait for the get version thing done for all users
                        setTimeout(function () {//console.log(App.verisonTowaitTime);
                            var time = 0;
                            var versions_done = new Array(App.usersinfo.length);
                            d3.range(App.usersinfo.length).forEach(function (k) {
        //                        if (k != 0) time = 13000 * k;
                                if (k != 0){ time += (100 * (App.verisonTowaitTime[k - 1] + 10)); console.log(k +" " +time);}

                                setTimeout(function () {
                                    versions_done[k] = 0;
                                    var allemails = [];
                                            App.versions[k] = App.verisonTowaitTime[k];
                                            setTimeout(function () {
                                                d3.range(App.versions[k] + 1).forEach(function (i) {
                                                    $.ajax({
                                                        //                            type: "POST",
                                                        dataType: "json",
                                                        url: "/getemails/" + i + "&json=" + App.usersinfo[k].email,
                                                        cache: true,
                                                        complete: function () {
                                                            versions_done[k]++;
                                                            console.log(k);
                                                            var process = Math.floor((100 * versions_done[k]) / (App.versions[k] + 1));
                                                            // $("#loader").html('Downloading email metadata to browser.. ' + Math.floor((100 * versions_done[k]) / (App.versions[k] + 1)) + "%");
                                                            d3.select("body").select("#runway_" + k).select("#user_fetchedcount").html(process + "% fetched");
                                                            console.log('Downloading emails to browser.. ' + Math.floor((100 * versions_done[k]) / (App.versions[k] + 1)) + "%");
                                                            if (versions_done[k] === App.versions[k] + 1) {
                                                                console.log("fetching of emails files done!!");
                                                                d3.select("body").select("#runway_" + k).select("#user_fetchedcount").html("Done");
    //                                                            d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
                                                                // d3.select("#loader").html('Analyzing metadata: setting up the DB.');
                                                                setTimeout(function () {
                                                                    d3.json("/getstats/" + "json=" + App.usersinfo[k].email, function (error, stats) {//console.log(stats);
                                                                        if(k == 0) VMail.App.orgs = [];
                                                                        App.db[k] = VMail.DB.setupDB(App.usersinfo[k], allemails, stats, univ_data);//console.log(App.db[k]);
                    //                                                    setTimeout(function(){
                                                                        // d3.select("#loader").html('Analyzing metadata: done setting up the DB.');
                                                                        console.log("done setting up the db");
                                                                        if (App.working == 1) {
                                                                            // $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
                                                                        } else if (k == App.db.length - 1) {
    //                                                                        $("#loader").css("display", "none");
                                                                        }
                                                                        dataIsShown = true;
                                                                        sendStatsToServer(k);
                                                                        for(var ii = 0; ii <= k; ii++){
                                                                            if(App.setupDBdone[ii] == 0 && App.db[ii] != undefined) App.setupDBdone[ii]=1;
                                                                        }
                                                                        if (k == App.usersinfo.length - 1) {
                                                                            for(var mm in VMail.App.orgs){
                                                                                App.domainToid[VMail.App.orgs[mm].domain] = mm;
                                                                            }
//                                                                            var to_wait = 60;
//                                                                            if(App.setupDBdone.indexOf(0) != -1){
//                                                                                to_wait += 1000;
//                                                                            }
                                                                            var wait_to_showdata = setInterval(function(){
                                                                                for(var ii = 0; ii <= k; ii++){
                                                                                    if(App.setupDBdone[ii] == 0 && App.db[ii] != undefined) App.setupDBdone[ii]=1;
                                                                                }
                                                                                if(App.setupDBdone.indexOf(0) == -1){ 
                                                                                    clearInterval(wait_to_showdata); 
                                                                                    showData();
                                                                                    initAnalysisCharts();
                                                                                }
                                                                            }, 1000);
//                                                                            setTimeout(function () {
//                                                                                showData();
//                                                                                initAnalysisCharts();
//                                                                            }, to_wait);
                                                                        }
                                                                    });
                                                                }, 20);
                                                            }
                                                        },
                                                        success: function (emails) {
                                                            allemails = allemails.concat(emails);
                                                        }
                                                    });
                                                });
                                            }, 20);//small time interval after get one version of emails
    //                                    }
    //                                });
                                }, time);//time to process previous user's emails
                            });
                        }, 500);//settimeout for getversion
                    }
                }
            });
        });
    })(VMail.App || (VMail.App = {}));
    var App = VMail.App;
})(VMail || (VMail = {}));
//# sourceMappingURL=app.js.map
