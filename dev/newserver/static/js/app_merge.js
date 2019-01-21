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

//        //number of nodes to precompute graph for
//        var NNODES_PRECOMPUTE = 200;
//        //default network viz parameters
//        var NNODES_DEFAULT = 100;
//        var CHARGE_DEFAULT = -2500;

        //number of nodes to precompute graph for
        var NNODES_PRECOMPUTE = 100;//400;
        //default network viz parameters
        var NNODES_DEFAULT = 50;//200;
//        var CHARGE_DEFAULT = -300;
        var CHARGE_DEFAULT = -Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 0.5 * 1.1;
        
        App.team_ids = null;
        App.studyDone = new Array();
        App.studyDone_morality = new Array();
        App.studyDone_demographic = new Array();
        App.personality = new Array(5);
        App.personality['Open-Mindedness'] = new Array(); App.personality['Conscientiousness'] = new Array();
        App.personality['Extraversion'] = new Array(); App.personality['Agreeableness'] = new Array();
        App.personality['Negative Emotionality'] = new Array();
        App.morality = new Array();
        App.morality['Fairness'] = new Array(); App.morality['Harm'] = new Array();
        App.morality['Loyalty'] = new Array(); App.morality['Authority'] = new Array();
        App.morality['Purity'] = new Array();
        App.demographic = new Array();
        App.demographic['gender'] = new Array(); App.demographic['yob'] = new Array(); App.demographic['nationality'] = new Array();
        App.demographic['degree'] = new Array(); App.demographic['major_college'] = new Array(); App.demographic['major_graduate'] = new Array();
        App.demographic['ethnicity'] = new Array(); App.demographic['position'] = new Array();
        App.demographic['office'] = new Array(); App.demographic['neighbors'] = new Array(); App.demographic['languages'] = new Array();
        App.color_personality = -1;
        App.panel_shown = 0;
        App.personal_shown = 0;
        App.member_selected = 1; //0 for all, 2 for shared contacts, 1 for members only
        App.rightPanel = 0; //0 for members, 1 for stats, 2 for shortest paths
        App.init_time = 0;
        App.init_times = new Array();
        App.idSwitch_before = new Array();
        App.idSwitch_after = new Array();
        App.domainToid = {};
        App.verisonTowaitTime = new Array();
        App.charge_default = new Array(3);
        App.merge_selected = [];
        App.slack_network = 0;
        App.slack_data = null;
        App.data_source = 0;
        App.first_time_graph = 0;
        App.last_time_members = [];

        App.whole_graph = {nodes: [], links: [], member_nodes: [], member_links: [], org_nodes: [], org_links: []};
        App.half_graph = {nodes: [], links: [], member_nodes: [], member_links: [], org_nodes: [], org_links: []};
        App.time_points = [0, 0, 0, 0, 0];

        App.org_domains = {};
        App.the_orgs = {};

        App.removed = [];
        App.people_we_lost = []; App.org_we_lost = []; App.people_each_lost = new Array();
        App.shortest_path_length = null; App.shortest_path_length_delta = new Array();
        App.orgs = [];
        App.not_orgs = ["gmail.com", "hotmail", "yahoo", "googlegroups.com", "googlemail.com", "noreply@google.com", "docs.google.com", "amazon.com", "linkedin.com", "github.com", "facebookmail.com", "163.com", "uber.com", "msn.com", "aol.com", "ets.org", "qq.com", "windowslive.com", "yahoogroups.com", "ebay.com", "time4education.com", "comcast.net", "outlook.com", "dropbox.com", "doodle.com"];
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
        App.colorMethod = 2; //1 for color by people, 2 for color by community detection result

        App.G = [];
        App.ave_degree = [];
        App.density = [];
        App.ave_SPL = [];
        App.num_cliques = [];
        App.ave_btw_centrality = [];
        App.timeline = []
        App.mergeTime = [];
        var flag_timeline = 0;

        App.not_orgs = ["gmail.com", "hotmail", "yahoo", "googlegroups.com", "googlemail.com", "noreply@google.com", "docs.google.com", "amazon.com", "linkedin.com", "github.com", "facebookmail.com", "163.com", "uber.com", "msn.com", "aol.com", "ets.org", "qq.com", "windowslive.com", "yahoogroups.com", "ebay.com", "time4education.com", "comcast.net", "outlook.com", "dropbox.com", "doodle.com"];
        App.not_aliases = ["group.facebook.com", "docs.google.com", "github.com", "facebookmail.com", "noreply", "googlegroups.com", "googlemail.com", "webex.com", "yahoogroups.com", "comcast.net", "dropbox.com", "doodle.com", "buzz+"];

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
            var colors_2 = ["#D82020", "#D83A20", "#D85B20", "#D88520", "#D8AD20", "#E1C320", "#D4D820", "#C2D820", "#90D820", "#5ED820", "#2CD820", "#26CB79", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
            var colors = ["#D82020", "#D85B20", "#D8AD20", "#D4D820", "#90D820", "#2CD820", "#20CFD8", "#208ED8", "#2029D8", "#6820D8"];
            if(App.type != "multi" || App.colorMethod == 2){
                i = i%colors_2.length;
                if(i%2 == 0) i = i/2;
                else i = colors_2.length - 1 - (i - 1)/2;
                return colors_2[i];
            }
            return colors[Math.round(i * (colors.length - 1) / ((App.usersinfo.length == 1? 2:App.usersinfo.length) - 1))];
        };
        var colorMember = function (i) {
            return "rgba(170,170,170,0)";
        };
        var colorPersonality = function (member, personality) {
            if(member && personality != -1){
                var colors = ["#D82020", "#D88520", "#D4D820", "#5ED820", "#20CFD8"]; //if changeed here, need to change createLegend also
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

            if(App.type != "multi"){ 
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
            if(App.type != "multi"){
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
            
            var the_w = $('#rightcolumn').width();
            var the_inner_w = $('#rightcolumn_member').width();
            
            if(App.personal_shown == 0){
                d3.select("#rightcolumn_personal").style("display", "block");
                d3.select("#rightcolumn").style("width", (the_w + 280) + "px");
                d3.select("#rightcolumn_move").style("right", ((App.panel_shown? the_w:the_w-600) + 280) + "px");
                d3.select("#rightcolumn_member").style("width", (the_inner_w + 280) + "px");
            }
            App.personal_shown = 1; 
            
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

            function OrgInfo(t, count, rank, the_node) {
                var org = contact;
                var container = d3.select("#contactDetails-content");//.html('');
                var content = '';
                content += "<div>" + org.domain + "</div>";

                if (container.select(".person_name")[0][0] == null) {
                    var person_left = container.append("div").html(contact.name).attr("class", "person_name").attr("id", "person_name_left").attr('title', '').node();
                    $(person_left).tooltip({content: content});
                    if (App.type == "multi") {
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
                            width: 260,
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
                        
                        container.append("div").html('<b>Contacts contributed by </b>');
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
//                            var text_width = parseInt(contact_line.select("#contact_line_name").attr("width")) + parseInt(contact_line.select("#contact_email").attr("width")) + parseInt(contact_line.select("#contact_email_icon")) + 12;
//                            var text_width = $("#ind_" + sortable[ind][0]).children()[0].offsetWidth + $("#ind_" + sortable[ind][0]).children()[1].offsetWidth + $("#ind_" + sortable[ind][0]).children()[2].offsetWidth + 12;
//                            if(text_width > 288){
//                                var len = results[0].attr.contact.aliases[0].length - parseInt((text_width - 288) / 10);
//                                var visible_text = results[0].attr.contact.aliases[0].substring(0,len) + "...";
//                                contact_line.select("#contact_email").text(visible_text)
//                                        .on("mouseover", function(){
//                                            d3.select(this).text(d3.select(this).attr("class")).style("background", "#2f3140").style("margin-left", "5px");
//                                        })
//                                        .on("mouseout", function(){
//                                            var visible_text = d3.select(this).attr("class").substring(0,len) + "...";
//                                            d3.select(this).text(visible_text).style("background", "rgba(0,0,0,0)");
//                                        });
//                            }
                        }
//                            .on("mouseover", function(){
//                                //highlight corresponding nodes
//                                d3.select(this).style("background","#888");
//                                var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
//                                var the_node = $.grep(App.graph.nodes, function (e) {
//                                    return e.id == the_id;
//                                });
//                                App.viz.mouseoverNode(the_node[0]);
//                            }).on("mouseout",function(){
//                                d3.select(this).style("background","rgba(0,0,0,0)");
//                                var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
//                                var the_node = $.grep(App.graph.nodes, function (e) {
//                                    return e.id == the_id;
//                                });
//                                App.viz.mouseoutNode(the_node[0]);
//                            }).on("click",function(){
//                                d3.select(this).style("background","rgba(0,0,0,0)");
//                                $("#influence_ranking").fadeOut();
//                                var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
//                                var the_node = $.grep(App.graph.nodes, function (e) {
//                                    return e.id == the_id;
//                                });
//                                App.viz.clickNode(the_node[0]);
//                            });
                        index++;
                    }
//                    outer_container.select("#people_emails_" + rank)
//                        .html('<b><i>&nbsp&nbsp' + count + ' people | ' + emails_all + ' emails</i></b>');
                    //container.selectAll(".contact_" + rank).style("display", "none");
                }
                $('#user_stats').hide();
                $('#rankings').hide();
                if (App.type == "multi") {
//                    d3.selectAll(".userinfopanel").style("display", "none");
//                    d3.select("#members").style("display", "none");
//                    d3.select("#stats").style("display", "none");
                    d3.select("#paths").style("display", "none");
                    d3.selectAll(".for_paths").style("display", "none");
                    $('#contactDetails').fadeIn();
                }
                else {
//                    $('#userinfopanel').hide();
//                    d3.select("#members").style("display", "none");
//                    d3.select("#stats").style("display", "none");
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
                            width: 260,
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
                        width: 260,
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
                        width: 260,
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
                if (App.type == "multi") {
//                    d3.selectAll(".userinfopanel").style("display", "none");
//                    d3.select("#members").style("display", "none");
//                    d3.select("#stats").style("display", "none");
                    d3.select("#paths").style("display", "none");
                    d3.selectAll(".for_paths").style("display", "none");
                    $('#contactDetails').fadeIn();
                }
                else {
//                    $('#userinfopanel').hide();
//                    d3.select("#members").style("display", "none");
//                    d3.select("#stats").style("display", "none");
                    d3.select("#paths").style("display", "none");
                    $('#contactDetails').fadeIn();//commented below
                }
                container.append("div").attr("id", "person_name_right")
                        .attr("height", document.getElementById("person_name_left").offsetHeight + "px")
                        .append("a").attr("href", "#").attr("id", "invite").text("Invite")
                        .style("display", function () {
                            if (App.type != "multi") {
                                return "block";
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

        // auto-complete search box allowing searching for contacts
        var initSearchBox = function () {
            var p = -3;
            var getScore = function (a) {
                if(typeof(a.rcv) == undefined || typeof(a.sent) == undefined) return -100;
                return Math.pow((Math.pow(a.rcv, p) + Math.pow(a.sent, p)) / 2.0, 1.0 / p);
            };

            var focusedNode = null;
            var clickedNode = null;
            $("#searchContacts").autocomplete({
                minLength: 2,
                source: function (request, response) {
                    var term = request.term.toLowerCase();
                    var results = [];
                    var ids = [];
                    var c_length = 0;

                    var results_orgs = [];
                    var ids_orgs = [];

                    if (App.node_as_org == 0) { //nodes are contacts
                        for (var t in (App.db)) {
                            for (var id in (App.db[t].contacts)) {
                                var contact = (App.db[t].contacts[id]);
                                if (typeof (contact) != undefined && contact.name.toLowerCase().indexOf(term) !== -1 && typeof (ids[App.idSwitch_after[t][App.idSwitch_before[t].indexOf(id)]]) != undefined) {
                                    var already_in_list = $.grep(results, function (e) {
                                        return e.label == contact.name;
                                    });
                                    if (already_in_list.length == 0) {
                                        results.push({label: contact.name, value: [id], owns: [t]});
                                        ids[App.idSwitch_after[t][App.idSwitch_before[t].indexOf(id)]] = App.idSwitch_after[t][App.idSwitch_before[t].indexOf(id)];
                                    }
                                    else {
                                        if (already_in_list[0].owns.indexOf(t) == -1) {
                                            already_in_list[0].owns.push(t);
                                            already_in_list[0].value.push(id);
                                        }
                                    }
                                }
                            }
                            c_length += App.db[t].contactDetails.length;
                        }

                        //some members may be missing in the search results, add them in: term matching, not in the results 
                        for (var t in App.graph.member_nodes) {
                            if (App.graph.member_nodes[t].attr.contact.name.toLowerCase().indexOf(term) !== -1 && typeof (ids[App.graph.member_nodes[t].id]) != undefined) {
                                var search_result = $.grep(results, function (e) {
                                    return e.label == App.graph.member_nodes[t].attr.contact.name;
                                });
                                if (search_result.length == 0) {
                                    results.push({label: App.graph.member_nodes[t].attr.contact.name, value: [App.graph.member_nodes[t].id], owns: [t]});
                                    ids[App.graph.member_nodes[t].id] = App.graph.member_nodes[t].id;
                                }
                                else {
                                    if (search_result[0].owns.indexOf(t) == -1) {
                                        search_result[0].owns.push(t);
                                        search_result[0].value.push(App.graph.member_nodes[t].id);
                                    }
                                }
                            }
                        }

                        results.sort(function (a, b) {
                            var idx1 = a.label.toLowerCase().indexOf(term);
                            var idx2 = b.label.toLowerCase().indexOf(term);
                            if (idx1 === 0) {
                                if (idx2 === 0) {
                                    var v1 = 0, v2 = 0;
                                    for (var i1 = 0; i1 < a.owns.length; i1++) {
                                        v1 += getScore(App.db[a.owns[i1]].contacts[a.value[i1]]);
                                    }
                                    for (var i1 = 0; i1 < b.owns.length; i1++) {
                                        v2 += getScore(App.db[b.owns[i1]].contacts[b.value[i1]]);
                                    }
                                    return v2 - v1;
//                                    if(a.value < c_length && b.value < c_length) return getScore((App.db[b.owns].contacts[b.value])) - getScore((App.db[a.owns].contacts[a.value]));
//                                    else if(a.value < c_length) return 0.5 - getScore((App.db[a.owns].contacts[a.value]));
//                                    else if(b.value < c_length) return getScore((App.db[b.owns].contacts[b.value])) - 0.5;
//                                    else return 0.01;
                                } else {
                                    return -1;
                                }
                            } else {
                                if (idx2 === 0) {
                                    return 1;
                                } else {
                                    var v1 = 0, v2 = 0;
                                    for (var i1 = 0; i1 < a.owns.length; i1++) {
                                        v1 += getScore(App.db[a.owns[i1]].contacts[a.value[i1]]);
                                    }
                                    for (var i1 = 0; i1 < b.owns.length; i1++) {
                                        v2 += getScore(App.db[b.owns[i1]].contacts[b.value[i1]]);
                                    }
                                    return v2 - v1;
//                                    if(a.value < c_length && b.value < c_length) return getScore((App.db[b.owns].contacts[b.value])) - getScore((App.db[a.owns].contacts[a.value]));
//                                    else if(a.value < c_length) return 0.5 - getScore((App.db[a.owns].contacts[a.value]));
//                                    else if(b.value < c_length) return getScore((App.db[b.owns].contacts[b.value])) - 0.5;
//                                    else return 0.01;
                                }
                            }
                            return a.label.toLowerCase().indexOf(term) - b.label.toLowerCase().indexOf(term);
                        });
                        response(results.slice(0, 15));
                    }
                    else {
                        for (var t in App.graph.org_nodes) {
                            if ((App.graph.org_nodes[t].name.toLowerCase().indexOf(term) !== -1 || App.graph.org_nodes[t].domain.toLowerCase().indexOf(term) !== -1) && typeof (ids_orgs[App.graph.org_nodes[t].id]) !== undefined) {
                                var search_result = $.grep(results_orgs, function (e) {
                                    return e.label == App.graph.org_nodes[t].name;
                                });
                                if (search_result.length == 0) {
                                    results_orgs.push({label: App.graph.org_nodes[t].name, value: App.graph.org_nodes[t].id, member_size: App.graph.org_nodes[t].member_size});
                                    ids[App.graph.org_nodes[t].id] = App.graph.org_nodes[t].id;
                                }
                            }
                        }

                        results_orgs.sort(function (a, b) {
                            var idx1 = a.label.toLowerCase().indexOf(term);
                            var idx2 = b.label.toLowerCase().indexOf(term);
                            if (idx1 === 0) {
                                if (idx2 === 0) {
                                    return (b.member_size - a.member_size);

                                } else {
                                    return -1;
                                }
                            } else {
                                if (idx2 === 0) {
                                    return 1;
                                } else {
                                    return (a.member_size - b.member_size);
                                }
                            }
                            return a.label.toLowerCase().indexOf(term) - b.label.toLowerCase().indexOf(term);
                        });
                        response(results_orgs.slice(0, 15));
                    }

//                    for(var item in results){
//                        for(var the_item in results){
//                            if(results[item].label == results[the_item].label){
//                                delete results[the_item];
//                            }
//                        }
//                    }

                    //limit results to 15
//                    console.log(results);

                },
                focus: function (event, ui) {
                    event.preventDefault();
                    if (focusedNode !== null) {
                        App.viz.mouseoutNode(focusedNode);
                        focusedNode = null;
                    }
                    if (App.node_as_org == 0) {
                        var the_id;
                        for (var i1 = 0; i1 < ui.item.owns.length; i1++) {
                            if (typeof (App.idSwitch_after[ui.item.owns[i1]][App.idSwitch_before[ui.item.owns[i1]].indexOf(ui.item.value[i1])]) != undefined) {
                                the_id = App.idSwitch_after[ui.item.owns[i1]][App.idSwitch_before[ui.item.owns[i1]].indexOf(ui.item.value[i1])];
                            }
                        }
                        var nodes = App.graph.nodes.filter(function (node) {
                            return !node.skip && node.id === the_id;
                        });
                    }
                    else {
                        var nodes = App.graph.org_nodes.filter(function (node) {
                            return node.id === ui.item.value;
                        });
                    }
                    if (nodes.length === 0) {
                        return;
                    } else {
                        $(".tipsy").remove();
                    }
                    App.viz.mouseoverNode(nodes[0]);
                    focusedNode = nodes[0];
                },
                select: function (event, ui) {
                    event.preventDefault();
                    if (focusedNode !== null) {
                        App.viz.mouseoutNode(focusedNode);
                        focusedNode = null;
                    }
                    if (App.node_as_org == 0) {
                        var nodes = App.graph.nodes.filter(function (node) {
                            return !node.skip && node.id === node.id === App.idSwitch_after[ui.item.owns][App.idSwitch_before[ui.item.owns].indexOf(ui.item.value)];
                            ;
                        });
                    }
                    else {
                        var nodes = App.graph.org_nodes.filter(function (node) {
                            return node.id === ui.item.value;
                        });
                    }
                    if (nodes.length === 0) {
                        console.log("node not in graph!");
                        return;
                    }
                    App.viz.clickNode(nodes[0]);
                    clickedNode = nodes[0];
                },
                //make sure the search box is on top of everything else
                open: function (event, ui) {
                    //add tooltips
                    $('ul.ui-autocomplete a').tipsy({gravity: 'w', title: function () {
                            return 'Contact not in time range';
                        }});
                    $(this).autocomplete('widget').css('z-index', 10000).css('background', "#a3a5b7").css("color", "#eeeeee");
                    return false;
                },
                close: function(event, ui) {
                    if (focusedNode !== null) {
                        App.viz.mouseoutNode(focusedNode);
                        focusedNode = null;
                    }
                }
            });
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
                    updateNetwork(false, 1, 1);
                },
                change: function (event, ui) {
                    nlinks = ui.value;
                    updateNetwork(false, 1, 1);
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
                    updateNetwork(false, 1, 1);
                },
                change: function (event, ui) {
                    nnodes = ui.value;
                    updateNetwork(false, 1, 1);
                    //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
                }
            });
            $("#node_max").text((NNODES_PRECOMPUTE * App.usersinfo.length > 800 ? 800 : NNODES_PRECOMPUTE * App.usersinfo.length));

            //var inc = function(slider) {slider.slider("value", slider.slider("value") - slider.slider("option","step"));};
            //var dec = (slider) => {slider.slider("value", slider.slider("value") - slider.slider("option","step"));};
            //nodes binding
            $(document).bind('keydown.a', function () {
                var slider = $("#slider-nodes");
                slider.slider("value", slider.slider("value") - slider.slider("option", "step"));
            });

            $(document).bind('keydown.s', function () {
                var slider = $("#slider-nodes");
                slider.slider("value", slider.slider("value") + slider.slider("option", "step"));
            });

            //links binding
            $(document).bind('keydown.q', function () {
                var slider = $("#slider-links");
                slider.slider("value", slider.slider("value") - slider.slider("option", "step") * 2);
            });
            $(document).bind('keydown.w', function () {
                var slider = $("#slider-links");
                slider.slider("value", slider.slider("value") + slider.slider("option", "step"));
            });

            $(document).bind('keydown.f', function () {
                App.viz.draw();
                //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
            });
            
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
                    updateNetwork(false, 1, 0);
                }
            });
            
            $(".ui-slider-handle").css("width", "0.8em").css("height", "0.8em").css("border-radius", "20px").css("top", "-.4em");
        };

        //remove one node from the netwotk, delete the ode and all its related links
//        var removeNodefromNetwork = function (node_id) {
//            for(var ii = 0; ii< App.graph.links.length; ii++){
//                if(App.graph.links[ii].source.id == node_id || App.graph.links[ii].target.id == node_id){
//                    App.graph.links.splice(ii, 1);
//                }
//            }
//            for(var ii = 0; ii< App.graph.nodes.length; ii++){
//                if(App.graph.nodes[ii].id == node_id){ 
//                    App.graph.nodes.splice(ii, 1);
//                    break;
//                }
//            }
//        };

        var updateNetwork = function (induceNetwork, member, sliderChanged) {
            //nnodes = NNODES_DEFAULT * App.usersinfo.length;
            if (induceNetwork) {
                ////generate a network out of email data
//                d3.select("body").append("div").attr("id","loading").style("display","block")
//                   .append("div").attr("id","myBar").append("div").attr("id","moveBar");
//                var elem = document.getElementById("moveBar");
//                var width = 0.1;
//                var move = setInterval(frame, 100);
//                function frame() {
//                  if (width >= 50) {
//                    clearInterval(move);
//                  } else {
//                    width++;
//                    elem.style.width = width + '%';
//                  }
//                }
//                frame();
                console.time('App.graph');
                App.graph = VMail.Graph.induceOrgNetwork(App.db, NNODES_PRECOMPUTE, start, end, -1); //NNODES_PRECOMPUTE
                console.timeEnd('App.graph');
                initLinksSlider();
                VMail.Graph.filterNodes(App.graph, function (nodeAttr, idx) {//may need to look at later
                    return idx < nnodes;
                });
                VMail.Graph.filterLinks(App.graph, function (linkAttr, idx) {
                    return idx < nlinks;
                });
                
                
            }
            setTimeout(function(){
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
//                App.graph.nodes.forEach(function(node){
//                    if(VMail.App.hideMembers == 1){
//                         for(var t = 0; t < VMail.App.graph.member_nodes.length; t++){
//                             if(node.id == VMail.App.graph.member_nodes[t].id){
//                                 node.skip = 1; 
//                             }
//                         }
//                     }
//                     else{
//                         for(var t = 0; t < VMail.App.graph.member_nodes.length; t++){
//                             if(node.id == VMail.App.graph.member_nodes[t].id){
//                                 node.skip = 0;
//                             }
//                         }
//                     } 
//                });
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
                    App.people_each_lost = new Array(App.usersinfo.length); for(var ii = 0; ii < App.usersinfo.length; ii++) App.people_each_lost[ii] = [];
                    for(var jj = 0; jj < filteredNodes.length; jj++){
                        //only owned by one member and the member is removed
                        var no_path = 1;
                        if(filteredNodes[jj].owns.length == 1 && App.removed[filteredNodes[jj].owns[0]] == 1){
                            //if there is a path between him/her and a member that hasn't been removed
                            for(var kk = 0; kk < App.usersinfo.length; kk++){
                                var member_ind = $.map(App.graph.member_nodes, function(obj, index){ 
                                    if(obj.attr.contact.name == App.usersinfo[kk].name)
                                        return index;
                                });
                                if(App.removed[kk] == 0 && !jsnx.hasPath(G, {source: filteredNodes[jj].id, target: App.graph.member_nodes[member_ind].id})){
                                    App.people_each_lost[kk].push(filteredNodes[jj]);
                                }
                                else if(App.removed[kk] == 0){ no_path = 0; } //look at this part later
                                if(kk == App.usersinfo.length - 1 && no_path == 1){
                                    App.people_we_lost.push(filteredNodes[jj]);
                                }
                            }
                        }
                    }

                    d3.range(App.usersinfo.length).forEach(function (t) {
                        var each_lost_container = d3.select("#rankings_" + t).select(".lost_contacts");
                        each_lost_container.selectAll("*").remove();
                        if(App.node_as_org == 0){
                            if(App.people_each_lost[t].length * 19 < $(window).height() * 0.37){
                                each_lost_container.style("height", (App.people_each_lost[t].length * 19 + (App.people_each_lost[t].length == 0? 0:26)) + "px");
                            }
                            else{
                                each_lost_container.style("height", "37%");
                            }
                            if(App.people_each_lost[t].length != 0){
                                each_lost_container.append("div").style("height", "26px").html('<b>Lost contacts</b>');
                                show_who_each_lost(t);
                            }
                        }
                        function show_who_each_lost(tt){
                            each_lost_container.selectAll(".each_lost").remove();
                            if(App.node_as_org == 0){
                                for(var ind in App.people_each_lost[tt]){
                                    var the_div = each_lost_container.append("div").attr("class", "each_lost").attr("id","ind_" + App.people_each_lost[tt][ind].id).style("cursor", "pointer");
                                    the_div.append("p").attr("id", "to_catch_height_" + App.people_each_lost[tt][ind].id).attr("class", "p_ranking").text(App.people_each_lost[tt][ind].attr.contact.name)
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
//                                        d3.select(this).style("background","rgba(0,0,0,0)");
//                                        $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
//                                        $("#induced_betweenness_ranking").fadeOut(); 
                                        var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                        var the_node = $.grep(App.graph.nodes, function (e) {
                                            return e.id == the_id;
                                        });
                                        App.viz.clickNode(the_node[0]);
                                    });
                                }
                            }
                        }
                    });

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
                                    $("#induced_betweenness_ranking").fadeOut(); 
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
                                    $("#induced_betweenness_ranking").fadeOut(); 
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
                var textSize = d3.scale.linear().range([13, 25]).domain(sizeExtent); //for demo
                var textMemberSize = d3.scale.linear().range([18, 25]).domain(sizeExtentMember);
    //            var org_textSize = d3.scale.linear().range([11, 20]).domain(org_sizeExtent);
                var org_textSize = d3.scale.linear().range([13, 25]).domain(org_sizeExtent); //for demo
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
                
                if (induceNetwork) {
                    console.time('network analysis');
                    d3.select("#loader").html('Analyzing metadata: analyzing the network.');

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
                        
                        //var jsnx = require('jsnetworkx');
                        var G = new jsnx.Graph(), orgG = new jsnx.Graph();
                        G.addNodesFrom(nodes_spl); G.addEdgesFrom(links_spl);
                        orgG.addNodesFrom(orgnodes_spl); orgG.addEdgesFrom(orglinks_spl);
                        
                        if(App.shortest_path_length == null){ 
                            App.shortest_path_length = new Array(App.usersinfo.length);
                            for(var ii = 0; ii < App.usersinfo.length; ii++){
                                App.shortest_path_length[ii] = [];
                                var member_ind = $.map(App.graph.member_nodes, function(obj, index){ 
                                    if(obj.attr.contact.name == App.usersinfo[ii].name)
                                        return index;
                                });
                                var shortest_path = jsnx.shortestPathLength(G, {source: App.graph.member_nodes[member_ind].id});
                                for(var jj = 0; jj < filteredNodes.length; jj++){
                                    if(!Number.isNaN(shortest_path.get(filteredNodes[jj].id))) App.shortest_path_length[ii][filteredNodes[jj].id] = {length: shortest_path.get(filteredNodes[jj].id), name: filteredNodes[jj].attr.contact.name};
                                }
                            }
                        } 

                        //people we lose
                        if(App.type == "multi" && App.removed.indexOf(1) != -1){
                            App.people_we_lost = []; App.org_we_lost = [];
                            App.people_each_lost = new Array(App.usersinfo.length); for(var ii = 0; ii < App.usersinfo.length; ii++) App.people_each_lost[ii] = [];
                            App.shortest_path_length_delta = new Array(App.usersinfo.length); for(var ii = 0; ii < App.usersinfo.length; ii++) App.shortest_path_length_delta[ii] = [];
                            for(var jj = 0; jj < filteredNodes.length; jj++){
                                //only owned by one member and the member is removed
                                var no_path = 1;
                                if(filteredNodes[jj].owns.length == 1 && App.removed[filteredNodes[jj].owns[0]] == 1){
                                    //if there is a path between him/her and a member that hasn't been removed
                                    for(var kk = 0; kk < App.usersinfo.length; kk++){
                                        var member_ind = $.map(App.graph.member_nodes, function(obj, index){ 
                                            if(obj.attr.contact.name == App.usersinfo[kk].name)
                                                return index;
                                        });
                                        if(App.removed[kk] == 0 && !jsnx.hasPath(G, {source: filteredNodes[jj].id, target: App.graph.member_nodes[member_ind].id})){
                                            App.people_each_lost[kk].push(filteredNodes[jj]);
                                        }
                                        else if(App.removed[kk] == 0){ no_path = 0; } //look at this part later
                                        if(kk == App.usersinfo.length - 1 && no_path == 1){
                                            App.people_we_lost.push(filteredNodes[jj]);
                                        }
                                    }
                                }
                            }
                            for(var kk = 0; kk < App.usersinfo.length; kk++){
                                if(App.removed[kk] != 1){
                                    var member_ind = $.map(App.graph.member_nodes, function(obj, index){ 
                                        if(obj.attr.contact.name == App.usersinfo[kk].name)
                                            return index;
                                    });
                                    var shortest_path = jsnx.shortestPathLength(G, {source: App.graph.member_nodes[member_ind].id});
                                    for(var jj = 0; jj < filteredNodes.length; jj++){
                                        if(App.shortest_path_length[kk][filteredNodes[jj].id] != undefined && !Number.isNaN(App.shortest_path_length[kk][filteredNodes[jj].id]['length'] - shortest_path.get(filteredNodes[jj].id)) && App.shortest_path_length[kk][filteredNodes[jj].id]['length'] != shortest_path.get(filteredNodes[jj].id)) 
                                            App.shortest_path_length_delta[kk][filteredNodes[jj].id] = {length: App.shortest_path_length[kk][filteredNodes[jj].id]['length'] - shortest_path.get(filteredNodes[jj].id), name: filteredNodes[jj].attr.contact.name};
                                    }
                                }
                            }
                            
                            d3.range(App.usersinfo.length).forEach(function (t) {
                                var each_lost_container = d3.select("#rankings_" + t).select(".lost_contacts");
                                each_lost_container.selectAll("*").remove();
                                var each_farther_container = d3.select("#rankings_" + t).select(".farther_contacts");
                                each_farther_container.selectAll("*").remove();
                                if(App.node_as_org == 0){
                                    //contacts that are lost
                                    if(App.people_each_lost[t].length * 19 < $(window).height() * 0.37){
                                        each_lost_container.style("height", (App.people_each_lost[t].length * 19 + (App.people_each_lost[t].length == 0? 0:26)) + "px");
                                    }
                                    else{
                                        each_lost_container.style("height", "37%");
                                    }
                                    if(App.people_each_lost[t].length != 0){
                                        each_lost_container.append("div").style("height", "26px").html('<b>Lost contacts</b>');
                                        show_who_each_lost(t);
                                    }
                                    //contacts that are father
                                    if(Object.keys(App.shortest_path_length_delta[t]).length * 19 < $(window).height() * 0.37){
                                        each_farther_container.style("height", (Object.keys(App.shortest_path_length_delta[t]).length * 19 + (Object.keys(App.shortest_path_length_delta[t]).length == 0? 0:26)) + "px");
                                    }
                                    else{
                                        each_farther_container.style("height", "37%");
                                    }
                                    if(Object.keys(App.shortest_path_length_delta[t]).length != 0){
                                        each_farther_container.append("div").style("height", "26px").html('<b>Farther contacts</b>');
                                        App.shortest_path_length_delta[t];
                                        var comp = function (a, b) {
                                            if (a['length'] !== b['length']) {
                                                return a['length'] - b['length'];
                                            }
                                            return 0;
                                        };
                                        App.shortest_path_length_delta[t].sort(comp);
                                        show_who_each_farther(t);
                                    }
                                }
                                function show_who_each_lost(tt){
                                    each_lost_container.selectAll(".each_lost").remove();
                                    if(App.node_as_org == 0){
                                        for(var ind in App.people_each_lost[tt]){
                                            var the_div = each_lost_container.append("div").attr("class", "each_lost").attr("id","ind_" + App.people_each_lost[tt][ind].id).style("cursor", "pointer");
                                            the_div.append("p").attr("id", "to_catch_height_" + App.people_each_lost[tt][ind].id).attr("class", "p_ranking").text(App.people_each_lost[tt][ind].attr.contact.name)
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
        //                                        d3.select(this).style("background","rgba(0,0,0,0)");
        //                                        $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
        //                                        $("#induced_betweenness_ranking").fadeOut(); 
                                                var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                                var the_node = $.grep(App.graph.nodes, function (e) {
                                                    return e.id == the_id;
                                                });
                                                App.viz.clickNode(the_node[0]);
                                            });
                                        }
                                    }
                                }
                                function show_who_each_farther(tt){
                                    each_farther_container.selectAll(".each_farther").remove();
                                    if(App.node_as_org == 0){
                                        for(var ind in App.shortest_path_length_delta[tt]){
                                            var the_div = each_farther_container.append("div").attr("class", "each_farther").attr("id","ind_" + ind).style("cursor", "pointer");
                                            the_div.append("p").attr("id", "to_catch_height_" + ind).attr("class", "p_ranking").text(App.shortest_path_length_delta[tt][ind]['name'] + " " + App.shortest_path_length_delta[tt][ind]['length'])
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
        //                                        d3.select(this).style("background","rgba(0,0,0,0)");
        //                                        $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
        //                                        $("#induced_betweenness_ranking").fadeOut(); 
                                                var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                                var the_node = $.grep(App.graph.nodes, function (e) {
                                                    return e.id == the_id;
                                                });
                                                App.viz.clickNode(the_node[0]);
                                            });
                                        }
                                    }
                                }
                            });

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
                            d3.select("#we_lost_them").style("display", "block");
                        }
                        else if(App.type == "multi"){
                            d3.select("#we_lost_them").style("display", "none");
                        }

                        try {
                            //eigenvector centrality
//                            App.egvct_centrality = jsnx.eigenvectorCentrality(G)._stringValues;
//                            App.org_egvct_centrality = jsnx.eigenvectorCentrality(orgG)._stringValues;
                            App.egvct_centrality = jsnx.betweennessCentrality(G)._stringValues;
                            App.org_egvct_centrality = jsnx.betweennessCentrality(orgG)._stringValues;
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
                        
                        //save degree, betweenness, closeness centrality
                        var centralities = [], max_degree = 0;
                        for(var kk = 0; kk < App.usersinfo.length; kk++){
                            var results = $.grep(App.graph.member_nodes, function (e) { return e.attr.contact.aliases.indexOf(App.usersinfo[kk].email) != -1; });
                            var results2 = $.grep(App.graph.nodes, function (e) { return e.id == results[0].id; });
                            if(results2[0].links.length > max_degree) max_degree = results2[0].links.length;
                            centralities.push({
                                name: App.usersinfo[kk].given_name + " " + App.usersinfo[kk].family_name,
                                degree: results2[0].links.length,
                                betweenness: App.egvct_centrality[results2[0].id]
                            });
                        }
//                        for(var kk = 0; kk < App.graph.member_nodes.length; kk++){
//                            var results = $.grep(App.graph.nodes, function (e) { return e.id == App.graph.member_nodes[kk].id; });
//                            if(results[0].links.length > max_degree) max_degree = results[0].links.length;
//                            centralities.push({
//                                name: App.graph.member_nodes[kk].attr.contact.name,
//                                degree: results[0].links.length,
//                                betweenness: App.egvct_centrality[App.graph.member_nodes[kk].id]
//                            });
//                        }
                        for(var kk = 0; kk < centralities.length; kk++){ centralities[kk].degree /= max_degree; }
                        $.post('/savemergedcentralities', {'json': JSON.stringify(centralities), 'teamid': JSON.stringify({team_id: App.team_id}) });
                        

                        if(App.egvct_centrality_old == null) App.egvct_centrality_old = sortable;

                        for (var ind in App.org_egvct_centrality) {
                            org_sortable.push([ind, App.org_egvct_centrality[ind]]);
                        }
                        org_sortable.sort(comp);
                        if(App.org_egvct_centrality_old == null) App.org_egvct_centrality_old = org_sortable; //look at this later; if time slider changed, we should recalculate _old

                        var container = d3.select("#influence_ranking");
                        container.selectAll("*").remove();
        //                container.append("br");
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


                            //for induced betweenness centrality
//                            App.betweenness_centrality = jsnx.betweennessCentrality(G)._stringValues;
//                            var sum_betweenness = 0;
//                            for(var item in App.betweenness_centrality){
//                                sum_betweenness += App.betweenness_centrality[item];
//                            }
//                            var ii = 0;
//                            var betweenness_sortable = [];
//                            var the_induced = setInterval(function(){
////                            for(var ii = 0; ii < App.usersinfo.length; ii++){
//                                var nodes_induced = [], links_induced = [];
//                                var ind = -1;
//                                var filteredNodes_induced = App.graph.nodes.filter(function (node) {
//                                    var is_this_member = (node.attr.contact.name == App.usersinfo[ii].name);
//                                    if(is_this_member) ind = node.id;
//                                    return !node.skip && !is_this_member;
//                                });
//                                var filteredLinks_induced = App.graph.links.filter(function (link) {
//                                    return !link.skip && !link.source.skip && !link.target.skip && !(link.source.attr.contact.name == App.usersinfo[ii].name) && !(link.target.attr.contact.name == App.usersinfo[ii].name);
//                                });
//                                for (var id in filteredNodes_induced) { //App.graph.nodes
//                                    nodes_induced.push([filteredNodes_induced[id].id, {weight: filteredNodes_induced[id].attr.size, name: filteredNodes_induced[id].attr.contact.name}]);
//                                }
//                                for (var id in filteredLinks_induced) { //App.graph.links
//                                    links_induced.push([filteredLinks_induced[id].source.id, filteredLinks_induced[id].target.id, {weight: filteredLinks_induced[id].attr.weight}]);
//                                }
//                                var network_induced = {nodes: nodes_induced,
//                                    links: links_induced};
//                                var G_induced = new jsnx.Graph();
//                                G_induced.addNodesFrom(nodes_induced); G_induced.addEdgesFrom(links_induced);
//                                var induced_betweenness = jsnx.betweennessCentrality(G_induced)._stringValues;
//                                var sum_induced_betweenness = 0;
//                                for(var item in induced_betweenness){
//                                    sum_induced_betweenness += induced_betweenness[item];
//                                }
//                                App.induced_betweenness_centrality[ind] = sum_betweenness - sum_induced_betweenness;
//                                ii++;
//                                if(ii == App.usersinfo.length){
//                                    clearInterval(the_induced);
//                                    betweenness_sortable = [];
//                                    for (var ind in App.induced_betweenness_centrality) {
//                                        betweenness_sortable.push([ind, App.induced_betweenness_centrality[ind]]);
//                                    }
//                                    betweenness_sortable.sort(comp);
//                                    if(App.induced_betweenness_centrality_old == null) App.induced_betweenness_centrality_old = betweenness_sortable;
//
//                                    var container = d3.select("#induced_betweenness_ranking");
//                                    container.selectAll("*").remove();
//                    //                container.append("br");
//                                    container.append("div").style("height", "26px").html('<b>Induced Betweenness Centrality</b>')
//                                            .append("div").attr("id", "ranking_method").style("left", "237px");
//                                    container.select("#ranking_method").append("img").attr("id", "ranking_ascending")
//                                            .attr("src", "/static/images/arrow_up.png").style("cursor", "pointer")
//                                            .on("click", function(){
//                                                show_induced_betweenness_ranking(1);
//                                            });
//                                    container.select("#ranking_method").append("img").attr("id", "ranking_descending")
//                                            .attr("src", "/static/images/arrow_down.png").style("cursor", "pointer")
//                                            .on("click", function(){
//                                                show_induced_betweenness_ranking(0);
//                                            });
//                                    show_induced_betweenness_ranking(1);
//                                }
////                            }
//                            }, 1500);
//                        }
//                        catch(err) {
//                            console.log("ERROR: " + err.message);
//                        }
                        console.timeEnd('network analysis');

                        function show_centrality_ranking(ascending){
                            container = d3.select("#influence_ranking");
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
                                                $("#induced_betweenness_ranking").fadeOut(); 
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
                                                $("#induced_betweenness_ranking").fadeOut(); 
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
                                                $("#induced_betweenness_ranking").fadeOut(); 
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
                                                $("#induced_betweenness_ranking").fadeOut(); 
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

                        function show_induced_betweenness_ranking(ascending){
                            container = d3.select("#induced_betweenness_ranking");
                            container.selectAll(".induced_betweenness_ranking").remove();
                            var index = 1;
                            var comp = function (a, b) {
                                if (a[1] !== b[1]) {
                                    return b[1] - a[1];
                                }
                                return 0;
                            };
                            var r_comp = function (a, b) {
                                if (a[1] !== b[1]) {
                                    return a[1] - b[1];
                                }
                                return 0;
                            };
                            if(ascending){
                                if(App.node_as_org == 0){
                                    for(var ind in betweenness_sortable){
                                        if(index <= App.usersinfo.length){
                                            var flag = 0;
                                            var results = $.grep(App.graph.nodes, function (e) { return e.id == betweenness_sortable[ind][0]; });
                                            var the_div = container.append("div").attr("class", "induced_betweenness_ranking").attr("id","ind_" + betweenness_sortable[ind][0]).style("cursor", "pointer");
                                            //if some members have been removed, use up/down arrows to show centrality ranking change
                                            if(App.removed.indexOf(1) != -1){
                                                var result = $.grep(App.App.induced_betweenness_centrality_old, function (e) { return e[0] == betweenness_sortable[ind][0]; });
                                                if(result.length != 0 && App.induced_betweenness_centrality_old.indexOf(result[0]) != ind){
                                                    the_div.append("img").attr("class", "ranking_change").attr("src", function(){ 
                                                        if(ind < App.App.induced_betweenness_centrality_old.indexOf(result[0])) return "/static/images/arrow_up_green.png";
                                                        return "/static/images/arrow_down_red.png";
                                                    });
                                                    flag = 1;
                                                }
                                            }
                                            the_div.append("p").attr("id", "to_catch_height_" + betweenness_sortable[ind][0]).attr("class", "p_ranking").text(index + '   ' + results[0].attr.contact.name + ' ' + betweenness_sortable[ind][1].toFixed(3))
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
                                                $("#induced_betweenness_ranking").fadeOut(); 
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
                            }
                            else{
                                if(App.node_as_org == 0){
                                    betweenness_sortable.sort(r_comp);
                                    for(var ind in betweenness_sortable){
                                        if(index <= App.usersinfo.length){
                                            var flag = 0;
                                            var results = $.grep(App.graph.nodes, function (e) { return e.id == betweenness_sortable[ind][0]; });
                                            var the_div = container.append("div").attr("class", "induced_betweenness_ranking").attr("id","ind_" + betweenness_sortable[ind][0]).style("cursor", "pointer").style("height", "19px");
                                            //if some members have been removed, use up/down arrows to show centrality ranking change
                                            if(App.removed.indexOf(1) != -1){
                                                var result = $.grep(App.egvct_centrality_old, function (e) { return e[0] == betweenness_sortable[ind][0]; });
                                                if(result.length != 0 && App.induced_betweenness_centrality_old.indexOf(result[0]) != ind){
                                                    the_div.append("img").attr("class", "ranking_change").attr("src", function(){ 
                                                        if(ind < App.induced_betweenness_centrality_old.indexOf(result[0])) return "/static/images/arrow_up_green.png";
                                                        return "/static/images/arrow_down_red.png";
                                                    });
                                                    flag = 1;
                                                }
                                            }
                                            the_div.append("p").attr("id", "to_catch_height_" + betweenness_sortable[ind][0]).attr("class", "p_ranking").text((App.usersinfo.length-parseInt(ind)) + '   ' + results[0].attr.contact.name)
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
                                                $("#induced_betweenness_ranking").fadeOut(); 
                                                var the_id = d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_") + 1, d3.select(this).attr("id").length);
                                                var the_node = $.grep(App.graph.nodes, function (e) {
                                                    return e.id == the_id;
                                                });
                                                App.viz.clickNode(the_node[0]);
                                            });
                                            index++;
                                        }
                                    }
                                    betweenness_sortable.sort(comp);
                                }
                            }
                            d3.select("#influence_ranking").selectAll(".centrality_ranking").style("height", function(){ 
                                return document.getElementById(d3.select(this).select("p").attr("id")).offsetHeight + "px"; 
                            });
                        }
                    }, 20);
                }
                
                //no matter induce network or not
                setTimeout(function(){
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
    //                                    $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
    //                                    $("#induced_betweenness_ranking").fadeOut(); 
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
    //                                    $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
    //                                    $("#induced_betweenness_ranking").fadeOut(); 
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
                }, 20);
            }, 60);
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
                updateNetwork(true, 1, 0);
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

//                var current_db = (App.db[0]);
//                var a = current_db.emails[0].timestamp * 1000;
//
//                //var b = +new Date(2005,0,1);
//                start = new Date(a);
//                var c = current_db.emails[current_db.emails.length - 1].timestamp * 1000;
//                end = new Date(c);
                $("#slider-range").slider('option', "values", [+start, +end]);
                $('#slider-text').html(formatter(start) + " - " + formatter(end));
                $('#slider-duration').html(longAgo(end, start));
                updateNetwork(true, 1, 0);
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
                updateNetwork(true, 1, 0);
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
                updateNetwork(true, 1, 0);
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
                        updateNetwork(true, 1, 0);
                    else
                        updateNetwork(true, 1, 0);
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

            if (App.type == "multi") {
                d3.select("#userinfopanel").style("display", "none");
                d3.range(App.db.length).forEach(function (t) {
                    var panel = d3.select("#rightcolumn").select("#rightcolumn_memberleft").append("div").attr("class", "userinfopanel").attr("id", "userinfopanel_" + t).style("height", "98px");

                    panel.on("click", function(){ 
                        App.personal_stats = t; 
                        if(d3.select("#infolevel3_" + t).style("display") != "none"){
                            var the_w = $('#rightcolumn').width();
                            var the_inner_w = $('#rightcolumn_member').width();
                            App.personal_shown = 0;
                            d3.select("#rightcolumn").style("width", (the_w - 280) + "px");
                            d3.select("#rightcolumn_member").style("width", (the_inner_w - 280) + "px");
                            d3.select("#rightcolumn_move").style("right", ((App.panel_shown? the_w:the_w-600) - 280) + "px");
                            d3.select("#rightcolumn_personal").style("display", "none");
                            d3.select(this).style("background-color", "#2f3140");
                            
                            d3.selectAll(".infolevel3").style("display", "none");
                            d3.selectAll(".rankings").style("display", "none");
                            d3.selectAll(".histograms_container").style("display", "none");
                        }
                        else{
                            var the_w = $('#rightcolumn').width();
                            var the_inner_w = $('#rightcolumn_member').width();
                            if(App.personal_shown == 1){ //change to another member's data
                                
                            }
                            else{ //
                                App.personal_shown = 1; 
                                d3.select("#rightcolumn_personal").style("display", "block");
                                d3.select("#rightcolumn").style("width", (the_w + 280) + "px");
                                d3.select("#rightcolumn_move").style("right", ((App.panel_shown? the_w:the_w-600) + 280) + "px");
                                d3.select("#rightcolumn_member").style("width", (the_inner_w + 280) + "px");
                            }
                            
                            d3.selectAll(".userinfopanel").style("background-color", "#2f3140");
                            d3.select(this).style("background-color", "#14151b");
                            d3.selectAll(".infolevel3").style("display", "none");
                            d3.select("#infolevel3_" + t).style("display", "block");
                            d3.selectAll(".rankings").style("display", "none");
                            d3.select("#rankings_" + t).style("display", "block");
                            d3.selectAll(".histograms_container").style("display", "none");
                            d3.select("#user_stats_" + t).style("display", "block");
                            if(App.type == "multi" && App.removed.indexOf(1) == -1) App.toggleinfo(true, false);
                            else if(App.type == "multi") App.toggleinfo(false, true);
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
//                            d3.selectAll(".link").style("opacity", 0.2);
                            
//                            d3.selectAll(".node").style("opacity", function () {
//                                var node_id = parseInt(d3.select(this).attr("id"));
//                                if(App.node_as_org == 0){
//                                    for (var ii = 0; ii < App.graph.nodes.length; ii++) {
//                                        if (node_id == parseInt(App.graph.nodes[ii].id)) {
//                                            if (App.graph.nodes[ii].attr.contact.name == App.usersinfo[t].name) {
//                                                d3.select(this).select("circle").attr("stroke-width", 5.0).attr("stroke", function(node){
//                                                    for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
//                                                        if(node.attr.contact.name == VMail.App.usersinfo[i1].name){
//                                                            return App.viz.settings.colorPeopleFunc(i1);
//                                                        }
//                                                    }
//                                                    return App.viz.settings.baseNodeStrokeColor;
//                                                });
//                                                d3.select(this).select(".nodelabeltext").style("opacity", "0.8").style("font-size", "26px");
//                                                return 1;
//                                            }
//                                            if (App.graph.nodes[ii].owns.indexOf(t) != -1) {
//                                                //here
//                                                var the_id = App.graph.nodes[ii].owns_before_ids[App.graph.nodes[ii].owns.indexOf(t)];
//                                                if (App.db[t].contactDetails[the_id] == undefined)
//                                                    return 0.2;
//                                                if (App.db[t].contactDetails[the_id].firstEmail > end)
//                                                    return 0.2;
//                                                return 1;
//                                            }
//                                            break;
//                                        }
//                                    }
//                                    return 0.2;
//                                }
//                                else{
//                                    var results = $.grep(App.graph.org_nodes, function (e) { return e.id == node_id; });
//                                    if (results.length > 0 && results[0].owns[t] != 0) {
//                                        return 1;
//                                    }
//                                    else{
//                                        return 0.2;
//                                    }
//                                }
//                            });
//                            d3.selectAll("use").style("opacity", function () {
//                                if (VMail.App.viz.labelsVisible) {
//                                    var node_id = parseInt(d3.select(this).attr("id").substring(5, d3.select(this).attr("id").length));
//                                    for (var ii = 0; ii < App.graph.nodes.length; ii++) {
//                                        if (node_id == parseInt(App.graph.nodes[ii].id)) {
//                                            if (App.graph.nodes[ii].attr.contact.name == App.usersinfo[t].name) {
//                                                return 1;
//                                            }
//                                            if (App.graph.nodes[ii].owns.indexOf(t) != -1) {
//                                                //here
//                                                var the_id = App.graph.nodes[ii].owns_before_ids[App.graph.nodes[ii].owns.indexOf(t)];
//                                                if (App.db[t].contactDetails[the_id] == undefined)
//                                                    return 0.2;
//                                                if (App.db[t].contactDetails[the_id].firstEmail > end)
//                                                    return 0.2;
//                                                return 1;
//                                            }
//                                            break;
//                                        }
//                                    }
//                                    return 0.2;
//                                }
//                                else {
//                                    return 0;
//                                }
//                            });
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
                            
//                            d3.selectAll(".node").style("opacity", function(){
//                                var node_id = parseInt(d3.select(this).attr("id"));
//                                for (var ii = 0; ii < App.graph.nodes.length; ii++) {
//                                    if (node_id == parseInt(App.graph.nodes[ii].id) && App.graph.nodes[ii].attr.contact.name == App.usersinfo[t].name) {
//                                        d3.select(this).select("circle")
//                                          .attr("stroke", function(node){
//                                              for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
//                                                  if(node.attr.contact.name == VMail.App.usersinfo[i1].name){
//                                                      return App.viz.settings.colorPeopleFunc(i1);
//                                                  }
//                                              }
//                                              return App.viz.settings.baseNodeStrokeColor;
//                                          }).attr("stroke-opacity", 1)
//                                          .attr("stroke-width", function(node){
//                                            for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
//                                                if(node.attr.contact.name == VMail.App.usersinfo[i1].name){
//                                                    return 3;
//                                                }
//                                            }
//                                            return 0.5;
//                                        });
//                                        d3.select(this).select(".nodelabeltext").style("font-size", "20px");
//                                        break;
//                                    }
//                                }
//                                return 1;
//                            });
//                            if (VMail.App.viz.labelsVisible) {
//                                d3.selectAll("use").style("opacity", 1);
//                            }
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
//                            .style("border-left", function () {
//                                return "4px solid " + color(t);
//                            })
                            .style("width", "85%")
                            .html(function(){ 
                                var str = App.usersinfo[t]['given_name'] + " " + App.usersinfo[t]['family_name'];
                                if(str.length > 17) return str.substring(0, 16) + "...";
                                return App.usersinfo[t]['given_name'] + " " + App.usersinfo[t]['family_name'];
                            });
                    top_layer.append("div").attr("class", "icons")
//                            .style("top", function () {
//                                if (panel.select("#name").style("height").substring(0, panel.select("#name").style("height").indexOf("px")) > 30) {
//                                    return (-29 - 29) + "px";
//                                }
//                                return "-29px";
//                            })
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
                                    updateNetwork(true, 1, 0);
                                }
                                else {
                                    d3.select(this).attr("src", "/static/images/remove_new.png");
                                    panel.style("opacity", 1);
                                    //readd nodes of the member
                                    updateNetwork(true, 1, 0);
                                }
                            });
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
                    var infolevel3 = d3.select("#rightcolumn").select("#rightcolumn_personal").append("div").attr("class", "infolevel3").attr("id", "infolevel3_" + t).style('display', 'none');
                    var the_div = infolevel3.append("div");
                    the_div.append("a").attr("href", "#").attr("id", "my_stats").attr("class", "my_stats_" + t).text("My Stats");
                    the_div.append("a").attr("href", "#").attr("id", "top_collaborators").attr("class", "top_collaborators_" + t).text("Contacts");
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
                    var ranking = d3.select("#rightcolumn").select("#rightcolumn_personal").append("div").attr("class", "rankings").attr("id", "rankings_" + t).style('display', 'none')
                            .html("<div class=\"lost_contacts\" style=\"display: none;\"></div><div class=\"farther_contacts\" style=\"display: none;\"></div><div class=\"top_collaborators\">Top Collaborators</div><div class=\"rankingschoice\"><a href=\"#\" id=\"allTimesLink\">All-time</a><a id=\"thisYearLink\" href=\"#\">Within time-range</a></div><div id=\"rankings-content\"></div>")
                            .style("display", "none");
                    var container = d3.select("#rightcolumn").select("#rightcolumn_personal").append("div").attr("id", "user_stats").attr("class", "histograms_container").attr("id", "user_stats_" + t).style('display', 'none');
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

            /*
             var container = d3.select("#user_stats");
             var color = d3.scale.pow().exponent(1.5).domain([0, 100]).range(["red", "green"]);
             
             container.append("div").html("# Emails Sent: " + db.nSent +  " (<span class=\"score\" style=\"color:" + color(db.nSentScore) + "\">" + db.nSentScore.toFixed(1) + "%</span>)");
             container.append("div").html("# Emails Received: " + db.nRcv  + " (<span class=\"score\" style=\"color:" + color(db.nRcvScore) + "\">" + db.nRcvScore.toFixed(1) + "%</span>)");
             container.append("div").html("# Collaborators: " + db.nCollaborators + " (<span class=\"score\" style=\"color:" + color(db.nCollaboratorsScore) + "\">" + db.nCollaboratorsScore.toFixed(1) + "%</span>)");
             
             var myReplyTimes = db.myReplyTimes;
             var othersReplyTimes = db.othersReplyTimes;
             container.append("br")
             container.append("div").html("<span style=\"font-weight:bold; font-size:20px;font-style:normal;\">Median reply time</strong>");
             container.append("div").html("<strong>You to others<strong>");
             container.append("div").html("All: " + timespanPretty(d3.median(myReplyTimes.all)));
             container.append("div").html("Past year: " + timespanPretty(d3.median(myReplyTimes.pastYear)));
             container.append("div").html("Past month: " + timespanPretty(d3.median(myReplyTimes.pastMonth)));
             container.append("div").html("Past week: " + timespanPretty(d3.median(myReplyTimes.pastWeek)));
             container.append("br")
             container.append("div").html("<strong>Others to you<strong>");
             container.append("div").html("All: " + timespanPretty(d3.median(othersReplyTimes.all)));
             container.append("div").html("Past year: " + timespanPretty(d3.median(othersReplyTimes.pastYear)));
             container.append("div").html("Past month: " + timespanPretty(d3.median(othersReplyTimes.pastMonth)));
             container.append("div").html("Past week: " + timespanPretty(d3.median(othersReplyTimes.pastWeek)));
             container.append("br")
             */
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
        App.move_panel = function(){
            App.panel_shown = 1 - App.panel_shown;
            if(App.panel_shown == 1){ //move all panel to screen
                d3.select("#move_img").attr("src", "/static/images/move_right.png");
                d3.select("#cover_viz").style("display", "block");
                var the_w = $('#rightcolumn').width();
                d3.select("#rightcolumn_move").style("right", (the_w) + "px");
                d3.select("#rightcolumn").style("right", "0px");
            }
            else{ //move panel off screen
                d3.select("#move_img").attr("src", "/static/images/move_left.png");
                d3.select("#cover_viz").style("display", "none");
                var the_w = $('#rightcolumn').width();
                d3.select("#rightcolumn_move").style("right", (the_w - 600) + "px");
                d3.select("#rightcolumn").style("right", "-600px");
                
            }
        };
        App.show_settings = function(show){
            if(show == 1){//settings clicked
                d3.select("#settings").style("display", "block");
            }
            else if(show == 0){//close clicked
                d3.select("#settings_back").style("display", "none");
                d3.select("#settings_panel").style("display", "block");
                d3.select("#study_questions_inner").style("display", "none");
                d3.select("#results").style("display", "none");
                d3.select("#sources").style("display", "none");
                
                d3.select("#settings").style("display", "none");
            }
            else{//back clicked
                d3.select("#settings_back").style("display", "none");
                d3.select("#settings_panel").style("display", "block");
                d3.select("#study_questions_inner").style("display", "none");
                d3.select("#results").style("display", "none");
                d3.select("#sources").style("display", "none");
            }
        };
        App.analysis_panel = function(){
            window.open(window.document.location.protocol + '//' + window.document.location.host + '/mergedanalysis/' + App.team_id,'_blank');
        };
        App.show_personality_results = function(){
            d3.select("#personality_svg_cover").select("svg").selectAll("*").remove();
            d3.select("#personality_svg_cover").style("display", "block");
            var p_margin = {top: 40, right: 80, bottom: 80, left: 80};
            var p_width = 600 - p_margin.left - p_margin.right, p_height = 500 - p_margin.top - p_margin.bottom;
            var p_svg = d3.select("#personality_svg")
                .attr("width", p_width + + p_margin.left + p_margin.right).attr("height", p_height + p_margin.top + p_margin.bottom)
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
            for(var p = 0; p < App.usersinfo.length; p++){
                p_data[p]['Open-Mindedness'] = App.personality['Open-Mindedness'][p];
                p_data[p]['Conscientiousness'] = App.personality['Conscientiousness'][p];
                p_data[p]['Extraversion'] = App.personality['Extraversion'][p];
                p_data[p]['Agreeableness'] = App.personality['Agreeableness'][p];
                p_data[p]['Negative Emotionality'] = App.personality['Negative Emotionality'][p];
            }
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
                .text(function(d, i){ return App.usersinfo[i].given_name;})
                .style("fill", function(d) { return "#ffffff";});

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
              .attr('value', function (d) { return d.text; })
              .text(function (d) { return d.text ;});
           var yInput = d3.select("#ySelect").on('change',yChange)
            .selectAll('option')
              .data(selectData)
              .enter()
            .append('option')
              .attr('value', function (d) { return d.text; })
              .text(function (d) { return d.text ;});
           d3.select("#context_for_x").html('<b>Open-Mindedness:</b> appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.');
           d3.select("#context_for_y").html('<b>Conscientiousness:</b> a tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.');
           function yChange() {
                var value = this.value; // get the new y value
                d3.select('.y_label') // change the yAxisLabel
                  .transition().duration(500)
                  .text(value);    
                d3.selectAll('.dot') // move the circles
                  .transition().duration(500)
                  .attr('cy',function (d) { return yScale(d[value]); });
                d3.selectAll('.dot_text') // move the circles
                  .transition().duration(500)
                  .attr('y',function (d) { return yScale(d[value]) - 10; });
                d3.select("#context_for_y").html(function(){
                    switch(value){
                        case 'Open-Mindedness': return '<b>Open-Mindedness:</b> appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.'; break;
                        case 'Conscientiousness': return '<b>Conscientiousness:</b> a tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.'; break;
                        case 'Extraversion': return '<b>Extraversion:</b> energy, positive emotions, surgency, assertiveness, sociability and the tendency to seek stimulation in the company of others, and talkativeness.'; break;
                        case 'Agreeableness': return '<b>Agreeableness:</b> a tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'; break;
                        case 'Negative Emotionality': return '<b>Negative Emotionality:</b> the tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.'; break;
                        default: return ""; 
                    }
                });
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
                d3.select("#context_for_x").text(function(){
                    switch(value){
                        case 'Open-Mindedness': return 'Open-Mindedness: appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.'; break;
                        case 'Conscientiousness': return 'Conscientiousness: a tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.'; break;
                        case 'Extraversion': return 'Extraversion: energy, positive emotions, surgency, assertiveness, sociability and the tendency to seek stimulation in the company of others, and talkativeness.'; break;
                        case 'Agreeableness': return 'Agreeableness: a tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.'; break;
                        case 'Negative Emotionality': return 'Negative Emotionality: the tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.'; break;
                        default: return ""; 
                    }
                });
            }
            document.getElementById("ySelect").selectedIndex = "1";
        };
        App.show_test = function(test){
            if(test == 0){//personality test
                d3.select("#settings_panel").style("display", "none");
                d3.select("#settings_back").style("display", "block");
                d3.select("#sources").style("display", "block");
                if(App.studyDone[0] == 1){ //test done already
                    d3.select("#results").style("display", "block");
                    App.show_personality_results();
                }
                else{
                    d3.select("#study_questions_inner").style("display", "block");
                }
                d3.select("#sources").select("a")
                  .attr("href", "https://www.outofservice.com/bigfive/")
                  .text("The Big Five Project Personality Test");
            }
            else if(test == 1){
                d3.select("#settings_panel").style("display", "none");
                d3.select("#settings_back").style("display", "block");
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
                d3.select("#induced_betweenness_ranking").style("diaplay", "none"); 
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
//                    d3.selectAll(".for_ppl").selectAll("node").style("opacity", 0);
//                    d3.selectAll(".for_ppl").selectAll("text").style("opacity", 0);
//                    d3.selectAll(".for_ppl").selectAll("line").style("opacity", 0);
//                    d3.selectAll(".for_ppl").selectAll("use").style("opacity", 0);
//                    d3.selectAll(".for_org").selectAll("node").style("opacity", 0.7);
//                    d3.selectAll(".for_org").selectAll("text").style("opacity", 0.8);
//                    d3.selectAll(".for_org").selectAll("line").style("opacity", 1);
//                    d3.selectAll(".for_org").selectAll("use").style("opacity", 1);
                    for (var t = 0; t < App.db.length; t++) {
                        if(App.colorMethod == 2){
                            d3.select("#userinfopanel_" + t).select("#userpic").style("border-color", "#8C8C8C");
                            d3.select("#em_" + t)
                                    .style("border-left", function () {
                                        return "3px solid #5a5854";
                                    });
                        }
                    }
                    updateNetwork(false, 0, 0);
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
//                    d3.selectAll(".for_org").selectAll("node").style("opacity", 0);
//                    d3.selectAll(".for_org").selectAll("text").style("opacity", 0);
//                    d3.selectAll(".for_org").selectAll("line").style("opacity", 0);
//                    d3.selectAll(".for_org").selectAll("use").style("opacity", 0);
//                    d3.selectAll(".for_ppl").selectAll("node").style("opacity", 0.7);
//                    d3.selectAll(".for_ppl").selectAll("text").style("opacity", 0.8);
//                    d3.selectAll(".for_ppl").selectAll("line").style("opacity", 1);
//                    d3.selectAll(".for_ppl").selectAll("use").style("opacity", 1);
                    for (var t = 0; t < App.db.length; t++) {
                        if(App.colorMethod == 1){
                            d3.select("#userinfopanel_" + t).select("#userpic").style("border-color", color(t));
                            d3.select("#em_" + t)
                                    .style("border-left", function () {
                                        return "3px solid " + color(t);
                                    });
                        }
                        
                    }
                    updateNetwork(false, 1, 0);
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
                    updateNetwork(false, 1, 0);
                }
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
                    updateNetwork(false, 2, 0);
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
                    updateNetwork(false, 0, 0);
                }
            }
        };

        App.color_method = function (communities, people, personality) {
            if (communities) {
                d3.select("svg#network").select("#gradient_x_axis").remove();
                d3.select("svg#network").select("#gradient_rect").remove();
                d3.select("svg#network").select("#defsGradient").remove();
                    
                App.colorMethod = 2; App.color_personality = -1;
//                $('#communities').addClass('selectedlink');
//                $('#people').removeClass('selectedlink');
                document.getElementById("for_personality_coloring").checked = false;
                d3.select("#personality_dropdown").select("label").text("Personality");
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
                d3.select("svg#network").select("#gradient_x_axis").remove();
                d3.select("svg#network").select("#gradient_rect").remove();
                d3.select("svg#network").select("#defsGradient").remove();
                    
                App.colorMethod = 1; App.color_personality = -1;
//                $('#people').addClass('selectedlink');
//                $('#communities').removeClass('selectedlink');
                document.getElementById("for_personality_coloring").checked = false;
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
            if(personality != -1){ //by personality
                document.getElementById("radiomerge-members").checked = false;
                document.getElementById("radiomerge-community").checked = false;
                document.getElementById("for_personality_coloring").checked = true;
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
                    console.log(emails);
                    $.ajax({
                        dataType: "json",
                        url: "/get_personality/&json=" + emails,
                        success: function (personalities) {
                            //console.log();
                            console.log(personalities);
                            for(var ii = 0; ii < emails_list.length; ii ++){
                                if(JSON.stringify(personalities[ii]) != JSON.stringify({})){
                                    var k = emails_list[ii];
                                    VMail.App.studyDone[k] = 1;
                                    VMail.App.personality['Open-Mindedness'][k] = parseInt(personalities[ii]['personality']['Open-Mindedness']);
                                    VMail.App.personality['Conscientiousness'][k] = parseInt(personalities[ii]['personality']['Conscientiousness']);
                                    VMail.App.personality['Extraversion'][k] = parseInt(personalities[ii]['personality']['Extraversion']);
                                    VMail.App.personality['Agreeableness'][k] = parseInt(personalities[ii]['personality']['Agreeableness']);
                                    VMail.App.personality['Negative Emotionality'][k] = parseInt(personalities[ii]['personality']['Negative Emotionality']);
                                }
                            }
                            if(App.colorMethod == 3) App.viz.recolorNodes();
                        }
                    });
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
                
                //legend for personality colors
                function createLegend(){
                    d3.select("svg#network").select("#gradient_x_axis").remove();
                    d3.select("svg#network").select("#gradient_rect").remove();
                    d3.select("svg#network").select("#defsGradient").remove();
                    var colors = ["#D82020", "#D88520", "#D4D820", "#5ED820", "#20CFD8"];
                    var w = 335, h = 120;
                    var key = d3.select("svg#network");
                    var legend = key.append("defs").attr("id", "defsGradient").append("svg:linearGradient").attr("id", "gradient").attr("x1", "0%").attr("y1", "100%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");
                    legend.append("stop").attr("offset", "0%").attr("stop-color", colors[App.color_personality]).attr("stop-opacity", 1);
                    legend.append("stop").attr("offset", "100%").attr("stop-color", colors[App.color_personality]).attr("stop-opacity", 0);
                    key.append("rect").attr("id", "gradient_rect").attr("width", w - 100).attr("height", h - 100).style("fill", "url(#gradient)").attr("transform", "translate(20,450)");
                    var x = d3.scale.linear().range([w-100, 0]).domain([1, 100]);
                    var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);
                    key.append("g").attr("class", "x axis").attr("id", "gradient_x_axis").attr("transform", "translate(20,470)").call(xAxis)
                       .append("text").attr("x", 235).attr("y", 30).attr("dy", ".71em").style("text-anchor", "end").text(function(){
                           switch(App.color_personality){
                               case 0: return 'Open-Mindedness'; break;
                               case 1: return 'Conscientiousness'; break;
                               case 2: return 'Extraversion'; break;
                               case 3: return 'Agreeableness'; break;
                               case 4: return 'Negative Emotionality'; break;
                               default: return "Personality"; 
                           }
                       });
                }
                createLegend();
            }
        };

        App.toggleMemberStats = function (show_members, show_stats, show_paths) {
            $("#members").fadeIn();
            $("#stats").fadeIn();
            if(App.node_as_org == 0) $("#paths").fadeIn();
            if (show_members) {
                //highlight the selected link
                $('#members').addClass('selectedrightheader'); 
                $('#members').css("border-bottom", "2px solid rgb(255,255,255)"); $('#members').css("font-weight", 400);
                $('#stats').css("border-bottom", "2px solid rgb(255,255,255)"); $('#stats').css("font-weight", 400);
//                $('#stats').removeClass('selectedrightheader'); 
//                $('#stats').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#stats').css("font-weight", 300);
                $('#paths').removeClass('selectedrightheader'); 
                $('#paths').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#paths').css("font-weight", 300);
                App.rightPanel = 0;

                //update UI state
                d3.select("#contactDetails-content").selectAll("*").remove();
                if (App.type != "multi") {
//                    $('#userinfopanel').fadeIn();
//                    $('#user_stats').fadeIn();
                }
                else {
                    d3.selectAll(".userinfopanel").style("display", "block");
                    d3.selectAll(".for_paths").style("display", "none");
//                    $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
                }
            }
            if (show_stats) {
                //highlight the selected link
                $('#stats').addClass('selectedrightheader'); 
                $('#stats').css("border-bottom", "2px solid rgb(255,255,255)"); $('#stats').css("font-weight", 400);
//                $('#members').removeClass('selectedrightheader'); 
//                $('#members').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#members').css("font-weight", 300);
                $('#paths').removeClass('selectedrightheader'); 
                $('#paths').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#paths').css("font-weight", 300);
                App.rightPanel = 1;

                if (App.type != "multi") {
//                    $('#userinfopanel').hide();
//                    $('#user_stats').hide();
                }
                else {
//                    d3.selectAll(".userinfopanel").style("display", "none");
                    d3.selectAll(".for_paths").style("display", "none");
//                    if(App.removed.indexOf(1) != -1) d3.select("#we_lost_them").style("display", "block");
//                    $("#influence_ranking").fadeIn();
//                    d3.select("#influence_ranking").selectAll(".centrality_ranking").style("height", function(){ 
//                        return document.getElementById(d3.select(this).select("p").attr("id")).offsetHeight + "px"; 
//                    });
                }
            }
            if (show_paths) {
                //highlight the selected link
//                $('#paths').addClass('selectedrightheader'); 
//                $('#paths').css("border-bottom", "2px solid rgb(255,255,255)"); $('#paths').css("font-weight", 400);
//                $('#stats').removeClass('selectedrightheader'); 
//                $('#stats').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#stats').css("font-weight", 300);
//                $('#members').removeClass('selectedrightheader'); 
//                $('#members').css("border-bottom", "1px solid rgba(255,255,255, 0.5)"); $('#members').css("font-weight", 300);
//                App.rightPanel = 2;
//
//                if (App.type != "multi") {
////                    $('#userinfopanel').hide();
////                    $('#user_stats').hide();
//                }
//                else {
//                    d3.selectAll(".userinfopanel").style("display", "none");
//                    d3.selectAll(".for_paths").style("display", "block");
//                    $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
//                }
            }
        };
        
        App.toggleAnaStats = function (show_network, show_personality) {
//            $("#members").fadeIn();
//            $("#stats").fadeIn();
            if (show_network) {
                //highlight the selected link
                $('#about_network').addClass('selectedrightsubheader'); 
                $('#about_network').css("background-color", "rgba(0,0,0,0);"); $('#about_network').css("font-weight", 400);
                $('#personality_analysis').removeClass('selectedrightsubheader'); 
                $('#personality_analysis').css("background-color", "#444;"); $('#personality_analysis').css("font-weight", 300);
                d3.select("#personality_svg_cover").style("display", "none");
                if (App.type != "multi") {
//                    $('#userinfopanel').hide();
//                    $('#user_stats').hide();
                }
                else {
                    d3.select("#influence_ranking").style("display", "block");
                    d3.select("#induced_betweenness_ranking").style("display", "block"); 
                    if(App.removed.indexOf(1) != -1) d3.select("#we_lost_them").style("display", "block");
                    d3.select("#influence_ranking").selectAll(".centrality_ranking").style("height", function(){ 
                        return document.getElementById(d3.select(this).select("p").attr("id")).offsetHeight + "px"; 
                    });
                }
            }
            if (show_personality) {
                //highlight the selected link
                $('#personality_analysis').addClass('selectedrightsubheader'); 
                $('#personality_analysis').css("background-color", "rgba(0,0,0,0);"); $('#personality_analysis').css("font-weight", 400);
                $('#about_network').removeClass('selectedrightsubheader'); 
                $('#about_network').css("background-color", "#444;"); $('#about_network').css("font-weight", 300);
                
                if (App.type != "multi") {
//                    $('#userinfopanel').hide();
//                    $('#user_stats').hide();
                }
                else {
                    d3.select("#influence_ranking").style("display", "none");
                    d3.select("#we_lost_them").style("display", "none");
                    d3.select("#induced_betweenness_ranking").style("display", "none");
                    App.show_personality_results();
                }
            }
        };
        
        App.toggleinfo = function (show_mystats, show_topcollab) {
            if(App.type != "multi"){
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
                    if (App.type != "multi") {
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
                    if (App.type != "multi") {
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
                    
                    if(App.removed.indexOf(1) != -1){ 
                        d3.selectAll(".lost_contacts").style("display", "block");
                        d3.selectAll(".farther_contacts").style("display", "block");
                    }
                    else{ 
                        d3.selectAll(".lost_contacts").style("display", "none");
                        d3.selectAll(".farther_contacts").style("display", "none");
                    }
                    
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

        // show initial data including our own details (left column),
        // the unfiltered network (center column), and the ranking list (right column).
        // This function gets called once the server has fetched the inital batch of emails
        var showData = function () {
            
            $("#data").fadeIn();
            CHARGE_DEFAULT = CHARGE_DEFAULT * 2000 / (NNODES_DEFAULT * App.usersinfo.length); // * 800
            App.charge_default[1] = CHARGE_DEFAULT; App.charge_default[0] = CHARGE_DEFAULT * 2; App.charge_default[2] = 0;
            //d3.select("#data").style("display",null);
            //setting up the in-memory database with the fetched server data
            //db = VMail.DB.setupDB(json);
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
            
            $("#loader").css("display", "none");
            $("#runway").css("display", "none");
            d3.selectAll(".runway").style("display", "none");
            //populate the left column with some basic info and aggregate statistics
            initBasicInfo((App.db[0]).aliases, App.userinfo);

            //setup the setttings for the network vizualization
            //var sizeExtent = d3.extent(graph.nodes, function(node) { return node.attr.size; });
            //var nodeRadius = d3.scale.linear().range([5, 20]).domain(sizeExtent);
            var settings = {
                svgHolder: "#network",
                size: {
                    width: $('#centercolumn').width(),
                    height: $(window).height() - 50
                },
                forceParameters: {
                    friction: FRICTION,
                    gravity: 0.9,
                    linkDistance: LINKDISTANCE,
                    charge: CHARGE_DEFAULT * (App.member_selected == 1 ? 10 : (App.member_selected == 2 ? 1 : 1)),
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
                        
                        var the_w = $('#rightcolumn').width();
                        var the_inner_w = $('#rightcolumn_member').width();
                        if(App.personal_shown == 1){ 
                            d3.select("#rightcolumn").style("width", (the_w - 280) + "px"); 
                            d3.select("#rightcolumn_member").style("width", (the_inner_w - 280) + "px");
                            d3.select("#rightcolumn_move").style("right", ((App.panel_shown? the_w:the_w-600) - 280) + "px");
                        }
                        App.personal_shown = 0;
                        d3.select("#rightcolumn_personal").style("display", "none");
                        
                        if (App.rightPanel == 0)
                            App.toggleMemberStats(true, false, false);
                        else if (App.rightPanel == 1)
                            App.toggleMemberStats(false, true, false);
//                        if (App.wasUserStats)
//                            App.toggleinfo(true, false);
//                        else
//                            App.toggleinfo(false, true);
                    } else if (App.rightPanel != 2) { // not in the shortest path mode
//                        $("#influence_ranking").fadeOut(); $("#we_lost_them").fadeOut();
//                        $("#induced_betweenness_ranking").fadeOut();
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
                svgHolder: "#network",
                size: {
                    width: $('#centercolumn').width(),
                    height: $(window).height() - 50
                },
                forceParameters: {
                    friction: FRICTION,
                    gravity: 0.9,
                    linkDistance: LINKDISTANCE,
                    charge: CHARGE_DEFAULT,
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
                        
                        var the_w = $('#rightcolumn').width();
                        var the_inner_w = $('#rightcolumn_member').width();
                        if(App.personal_shown == 1){ 
                            d3.select("#rightcolumn").style("width", (the_w - 280) + "px"); 
                            d3.select("#rightcolumn_member").style("width", (the_inner_w - 280) + "px");
                            d3.select("#rightcolumn_move").style("right", ((App.panel_shown? the_w:the_w-600) - 280) + "px");
                        }
                        App.personal_shown = 0;
                        d3.select("#rightcolumn_personal").style("display", "none");
                        
//                        if (App.wasUserStats)
//                            App.toggleinfo(true, false);
//                        else
//                            App.toggleinfo(false, true);
                        if (App.rightPanel == 0)
                            App.toggleMemberStats(true, false, false);
                        else if (App.rightPanel == 1)
                            App.toggleMemberStats(false, true, false);
                    } else {
//                        d3.select("#influence_ranking").style("display", "none");
//                        d3.select("#we_lost_them").style("display", "none");
//                        d3.select("#induced_betweenness_ranking").style("display", "none");
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
            
            $('#loader').html('Analyzing metadata: constructing the network.');
            setTimeout(function(){
                //vizualize the network
                viz = new VMail.Viz.NetworkViz(settings, false);
                org_viz = new VMail.Viz.OrgNetworkViz(org_settings, false);
                App.viz = viz;
                nnodes = NNODES_DEFAULT * App.usersinfo.length;
                updateNetwork(true, 1, 0);

                var year_start = start.getFullYear(), year_end = end.getFullYear();
                var long_short = 1;
                for (var t = year_start + 1; t <= year_end; t++) {
                    var slice_date = new Date(t, 1, 1);
                    long_short = 1- long_short;
                    d3.select("#slice_" + (t-year_start))
                        .style("left", function () {
                            var left = $(".ui-slider-range").offset().left - 12 + (slice_date - start) / (end - start) * (parseInt(d3.select("body").select("#slider-range").style("width"))); 
                            return left + "px";
                        })
                        .style("top", function () {
                            if(long_short == 0) return ($("#timeline").offset().top - 6) + "px";
                            return ($("#timeline").offset().top - 2) + "px";
                        });
                    d3.select("#textslice_" + (t-year_start))
                        .style("left", function () {
                            var left = $(".ui-slider-range").offset().left - 12 + (slice_date - start) / (end - start) * (parseInt(d3.select("body").select("#slider-range").style("width"))) -13; 
                            return left + "px";
                        })
                        .style("top", function () {
                            if(long_short == 0) return ($("#timeline").offset().top - 6 + 22) + "px";
                            return ($("#timeline").offset().top - 2 + 22) + "px";
                        }).text(function(){
                            if(long_short == 0) return t;
                            return "";
                        });
                }
                for (var t = 0; t < App.db.length; t++) {//init time for each member
                    d3.select("#timeline").select("#em_" + t)
                            .style("left", function () {
                                var left = $(".ui-slider-range").offset().left - 12 + (App.init_times[t] - init_start) / (init_end - init_start) * (parseInt(d3.select("body").select("#slider-range").style("width"))); //whole time length
                                return left + "px";
                            })
                            .style("top", function () {
                                return ($("#timeline").offset().top - 7) + "px";
                            });
                }

                /*setInterval(function() {
                 //viz.settings.forceParameters.gravity = 0.7;
                 viz.draw();
                 //viz.settings.forceParameters.gravity = 0.8;
                 }, 4000)*/
                //add random movements to keep the network alive
                //setInterval(() => {viz.resume();}, 1000);
                //initialize the search box
                initSearchBox();

                //initialize the aggregate histrograms
    //            initHistograms(0);

                //show initial ranking
                //showTopContacts(NTOPCONTACTS, start, end)
                //setup click handlers for rankings
                if(App.type != "multi"){
                    $('#allTimesLink').click(function () {
                        App.isWithinRange = false;
                        showTopContacts(NTOPCONTACTS);
                    });
                    $('#thisYearLink').click(function () {
                        App.isWithinRange = true;
                        showTopContacts(NTOPCONTACTS);
                    });
                }
                else{
                    for(var i = 0; i < App.db.length; i++){
                        $('#rankings_' + i + ' #allTimesLink').click(function () {
                            App.isWithinRange = false;
                            showTopContacts(NTOPCONTACTS);
                        });
                        $('#rankings_' + i + ' #thisYearLink').click(function () {
                            App.isWithinRange = true;
                            showTopContacts(NTOPCONTACTS);
                        });
                    }
                }
                
                //compute pair communication data and store to db
                var timestamps, start_time = init_start, end_time = init_end;
                var pairs = [];
                var interval = d3.time.year;
                var binDates = interval.range(interval.floor(new Date(start_time * 1000)), new Date(end_time * 1000));
                var scale = d3.time.scale().domain(binDates).rangeRound(d3.range(0, binDates.length));
                for (var i1 = 0; i1 < App.graph.member_nodes.length; i1++) {
                    var index = App.usersinfo.findIndex(x => x.name==App.graph.member_nodes[i1].attr.contact.name);
                    for(var i2 = 0; i2 < App.graph.member_nodes[i1].owns.length; i2++){
                        if(App.graph.member_nodes[i1].owns[i2] > index && typeof(App.graph.member_nodes[i1].owns_before_ids[i2]) != "undefined"){
                            timestamps = (App.db[App.graph.member_nodes[i1].owns[i2]].getEmailDatesByContactMulti(App.graph.member_nodes[i1].owns_before_ids[i2]));
                            var dataset = new Array(binDates.length);
                            for (var i = 0; i < dataset.length; i++) {
                                dataset[i] = 0;
                            }
                            for (var j = 0; j < timestamps.length; j++) {
                                var tmp = scale(interval.floor(timestamps[j].date));
                                if (tmp < 0 || tmp >= binDates.length) {
                                    continue;
                                }
                                dataset[tmp] += timestamps[j].weight;
                            }
                            pairs.push({pair: App.usersinfo[index].given_name + " " + App.usersinfo[index].family_name + "+" + App.usersinfo[App.graph.member_nodes[i1].owns[i2]].given_name + " " + App.usersinfo[App.graph.member_nodes[i1].owns[i2]].family_name, time: binDates, emails: dataset});
                        }
                    }
                }
                $.post('/savemergedpairs', {'json': JSON.stringify(pairs), 'teamid': JSON.stringify({team_id: App.team_id}) });
            }, 10);
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
                    width: 260,
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
//                            clearInterval(for_ana_chart);
//                            flag_ana_chart = 0;
//
//                            container.append("div").html("<b>Density</b>");
//                            VMail.Viz.plotAnaCharts(App.density, histSettings);
//
//                            container.append("div").html("<b>Number of Cliques</b>");
//                            VMail.Viz.plotAnaCharts(App.num_cliques, histSettings);
//                            
//                            container.append("div").html("<b>Ave. Degree</b>");
//                            VMail.Viz.plotAnaCharts(App.ave_degree, histSettings);
//                            
//                            container.append("div").html("<b>Ave. Betweenness Centrality</b>");
//                            VMail.Viz.plotAnaCharts(App.ave_btw_centrality, histSettings);
//                            
//                            container.append("div").html("<b>Ave. Shortest Path Length</b>");
//                            VMail.Viz.plotAnaCharts(App.ave_SPL, histSettings);
                        }
                        else { //move one month forward in the timeline
//                            var the_graph = VMail.Graph.induceNetwork(App.db, NNODES_PRECOMPUTE, start, end); 
//                            console.log("time: "+end);
//                            if(App.mergeTime.length != App.usersinfo.length -1){
//                                var merged = 0;
//                                for(var the_node in the_graph.nodes){
//                                    if(the_graph.nodes[the_node].attr.contact.name=="Mishel Johns") console.log(the_graph.nodes[the_node]);
//                                    if(the_graph.nodes[the_node].owns.length == (merge_num + 1)){ merged = 1; App.mergeTime.push(end); merge_num++; console.log(merge_num+" "+end);console.log(the_graph.nodes[the_node]);break; }
//                                }
//                            }

//                            //python networkx for statistocal analysis
//                            var nodes_spl = [], links_spl = [];
//                            for (var id in the_graph.nodes){
//                            //nodes_spl.push({node: nodes[id].id, weight: nodes[id].attr.size});
//                                nodes_spl.push([the_graph.nodes[id].id, {weight: the_graph.nodes[id].attr.size}]);
//                            }
//                            for (var id in the_graph.links) {
//                                //links_spl.push({src: links[id].source.id, trg: links[id].target.id, weight: links[id].attr.weight});
//                                links_spl.push([the_graph.links[id].source.id, the_graph.links[id].target.id, {weight: the_graph.links[id].attr.weight}]);
//                            }
//                            var network_data = {nodes : nodes_spl,
//                                                links : links_spl};
//                            
//                            //var jsnx = require('jsnetworkx');
//                            var G = new jsnx.Graph();
//                            G.addNodesFrom(nodes_spl);
//                            G.addEdgesFrom(links_spl);
//
//                            //average vertex degree of networks
//                            var degree = jsnx.degree(G)._stringValues;
//                            var sum = 0, num = 0;
//                            for(var de in degree){
//                                sum += degree[de]; num ++;
//                            }
//                            var ave_degree = parseFloat(sum) / parseFloat(num >= 1 ? num:1);
//                            
//                            //density of networks
//                            var density = jsnx.density(G);
//
//                            //average shortest path
//                            var SPL = jsnx.allPairsShortestPathLength(G)._stringValues;
//                            sum = 0; num = 0;
//                            for(var src in SPL){
//                                for(var trg in SPL[src]._stringValues){
//                                    sum += SPL[src]._stringValues[trg]; num ++;
//                                }
//                            }
//                            var ave_SPL = parseFloat(sum) / parseFloat(num >= 1 ? num:1);
//
//                            //number of cliques in networks
//                            var num_cliques = jsnx.graphCliqueNumber(G);
//
//                            //average betweenness centrality
//                            var btw_centrality = jsnx.betweennessCentrality(G)._stringValues;
//                            sum = 0; num = 0;
//                            for(var de in btw_centrality){
//                                sum += btw_centrality[de]; num ++;
//                            }
//                            var ave_btw_centrality = parseFloat(sum) / parseFloat(num >= 1 ? num:1);
//
//                            //degreeHistogram
//                            
//                            App.timeline.push(end);
//                            App.ave_degree.push(ave_degree); 
//                            App.density.push(density); 
//                            App.ave_SPL.push(ave_SPL); 
//                            App.num_cliques.push(num_cliques); 
//                            App.ave_btw_centrality.push(ave_btw_centrality);
//                            
//                            console.log("ave_degree: " + ave_degree);
//                            console.log("density: " + density);
//                            console.log("ave_SPL: " + ave_SPL);
//                            console.log("num_cliques: " + num_cliques);
//                            console.log("ave_btw_centrality: " + ave_btw_centrality);
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
            
            // setup logout links
            d3.select("#exit_team").on("mouseover", function(){
                d3.select(this).style("background-color", "#444444");
                d3.select("#logout_tooltip").style("display", "block");
                logout_flag2 = 1;
             })
             .on("mouseout", function(){
                d3.select(this).style("background-color", "#222222");
            });
            d3.select("#logout_save").on("mouseover", function(){
                d3.select(this).style("background-color", "#444444");
                d3.select("#logout_tooltip").style("display", "block");
                logout_flag2 = 1;
             })
             .on("mouseout", function(){
                d3.select(this).style("background-color", "#222222");
            });
            d3.select("#logout_delete").on("mouseover", function(){
                d3.select(this).style("background-color", "#444444");
                d3.select("#logout_tooltip").style("display", "block");
                logout_flag2 = 1;
             })
             .on("mouseout", function(){
                d3.select(this).style("background-color", "#222222");
            });
            
            d3.select("#logout_tooltip").on("mouseover", function(){
                d3.select("#logout_tooltip").style("display", "block");
                logout_flag2 = 1;
             })
             .on("mouseout", function(){
                logout_flag2 = 0;
                if(logout_flag == 0){
                    d3.select("#logout_tooltip").style("display", "none"); 
                }
            });
            d3.select("#top_logout").on("mouseover", function(){
                d3.select("#logout_tooltip").style("display", "block");
                logout_flag = 1; 
             })
             .on("mouseout", function(){
                logout_flag = 0;
                if(logout_flag2 == 0){
                    d3.select("#logout_tooltip").style("display", "none"); 
                }
             });
            $("#exit_team").click(function () {
                $('#loader').html('Exiting the Team..');
                $('#loader').fadeIn('fast');
                if (typeof myIFrame !== 'undefined') {
                    myIFrame.location.href = 'https://accounts.google.com/Logout';
                }
                setTimeout(function () {
//                    window.location.href = "/exit_team/&json=" + App.team_id;
                }, 2000);
            });
            $("#logout_delete").click(function () {
                $('#loader').html('Logging out securely..');
                $('#loader').fadeIn('fast');
                if (typeof myIFrame !== 'undefined') {
                    myIFrame.location.href = 'https://accounts.google.com/Logout';
                }
                setTimeout(function () {
                    window.location.href = '/logout?delete=1';
                }, 2000);
            });

            $("#logout_save").click(function () {
                $('#loader').html('Logging out securely..');
                $('#loader').fadeIn('fast');
                if (typeof myIFrame !== 'undefined') {
                    myIFrame.location.href = 'https://accounts.google.com/Logout';
                }
                setTimeout(function () {
                    window.location.href = '/logout';
                }, 2000);
            });

                $('#email_net_notext_link').click(function () {
                    VMail.App.snapshot(true);
                });
                $('#email_net_link').click(function () {
                    VMail.App.snapshot(false);
                });

                
                //$('#rightcolumn').css("height", $(window).height()-10);
//                $('#centercolumn').css("width", $(window).width() - $('#rightcolumn').width() - 40 - 30);
                $('#slider-range').css("width", $(window).width() - 288 - 40 - 30 - 21 - 50).css("left", "50px");
                App.toggleinfo(true, false);
                App.toggleMemberStats(true, false, false);
                App.toggleAnaStats(true, false);
                App.org_or_person(false, true);
                App.see_members(true, false, false);

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
                $("#runway").css("display", "block");

                if (App.version < 0) {
                    d3.select("#greetings").style("display", null);
                    return;
                }
                $("#runway").css("display", "none");
                $("#rightlogout").css("display", "block");

    //            if (App.type != "multi") {
    //                if (App.userinfo['name'] === 'Demo User') {
    //                    d3.select("#user_name").html(fict_name);
    //                    d3.select("#user_email").html(fict_email);
    //                } else {
    //                    d3.select("#user_name").html(App.userinfo['name']);
    //                    d3.select("#user_email").html(App.userinfo['email']);
    //                }
    //                if (App.userinfo['picture'] !== undefined) {
    //                    $("#user_pic").attr("src", App.userinfo['picture']);
    //                } else {
    //                    $("#user_pic").attr("src", "/static/images/default_user_pic.jpg");
    //                }
    //                $("#runway").css("display", "block");
    //            }
                if (App.type == "multi") {
                    App.versions = new Array(App.usersinfo.length);
                    App.setupDBdone = new Array(App.usersinfo.length);
                    App.studyDone = new Array(App.usersinfo.length);
//                    App.induced_betweenness_centrality = new Array(App.usersinfo.length);
                    App.personality['Open-Mindedness'] = new Array(VMail.App.usersinfo.length);
                    App.personality['Conscientiousness'] = new Array(VMail.App.usersinfo.length);
                    App.personality['Extraversion'] = new Array(VMail.App.usersinfo.length);
                    App.personality['Agreeableness'] = new Array(VMail.App.usersinfo.length);
                    App.personality['Negative Emotionality'] = new Array(VMail.App.usersinfo.length);
                    for(var i = 0; i < App.usersinfo.length; i++){ 
                        App.studyDone[i] = 0; App.setupDBdone[i] = 0; 
//                        App.induced_betweenness_centrality[i] = 0;
                    }

                    var totalWidth = parseInt(d3.select("body").style("width").substring(0, d3.select("body").style("width").indexOf("px")));
                    d3.range(App.usersinfo.length).forEach(function (i) {
                        var runway = d3.select("body").append("div").attr("class", "runway").attr("id", "runway_" + i);
                        var line = Math.ceil(App.usersinfo.length / 6);
                        if (App.usersinfo.length > 6) {

                        }
                        runway.style("display", "none").style("text-align", "center")
                                .style("position", "relative").style("float", "left").style("left", "20px").style("top", "15%")
                                .style("margin", "0 auto 0 auto").style("width", (totalWidth - 40) / App.usersinfo.length + "px");
                        runway.html('<img id="user_pic" class="runway_item"></img>    <div id="user_name" class="runway_item"></div>    <div id="user_email" class="runway_item"></div>    <div id="user_totalemails" class="runway_item"></div>    <div id="user_fetchedcount" class="runway_item"></div>    <div id="user_queue" class="runway_item"></div>');
                        if (App.usersinfo[i]['name'] === 'Demo User') {
                            runway.select("#user_name").html(fict_name);
                            runway.select("#user_email").html(fict_email);
                        } else {
                            runway.select("#user_name").html(App.usersinfo[i]['name']);
                            runway.select("#user_email").html(App.usersinfo[i]['email']);
                        }
                        if (App.usersinfo[i].name != "Kevin Hu" && App.usersinfo[i]['picture'] !== undefined) {
                            runway.select("#user_pic").attr("src", App.usersinfo[i]['picture']);
                        } else {
                            if(App.usersinfo[i].name == "Almaha Almalki") runway.select("#user_pic").attr("src", "/static/images/demo_maha.png");
                            else if(App.usersinfo[i].name == "Sanjay Guruprasad") runway.select("#user_pic").attr("src", "/static/images/demo_sanjay.png")
                            else if(App.usersinfo[i].name == "Jingxian Zhang") runway.select("#user_pic").attr("src", "/static/images/demo_jingxian.png")
                            else if(App.usersinfo[i].name == "Cesar Hidalgo" || App.usersinfo[i].name == "Cesar A. Hidalgo") runway.select("#user_pic").attr("src", "/static/images/demo_cesar.png")
                            else if(App.usersinfo[i].name == "Kevin Hu" || App.usersinfo[i].name == "Kevin Zeng Hu") runway.select("#user_pic").attr("src", "/static/images/demo_kevin.png")
                            else runway.select("#user_pic").attr("src", "/static/images/default_user_pic.jpg");
                        }
                    });
                    d3.selectAll(".runway").style("display", "block");

    //                if(App.studyDone == 0){
    //                    //display study layer
    //                    d3.select("#study_questions").style("display", "block");
    //                }
                }


                $("#loader").css("display", "block");
                
                d3.select("#merge_button").on("click", function(){
                    d3.select("#merge_selection").style("display", "block");
                    d3.select(this).style("border", "none");
                    d3.selectAll(".nonadmin").style("opacity", 0.3);
                    d3.selectAll(".admin").on("click", function(){
                        var the_team_id = d3.select(this).text();
                        if(d3.select(this).style("border") == "1px solid rgb(140, 61, 54)"){
                            App.merge_selected.push(the_team_id);
                            d3.select(this).style("border", "1px solid #8c8c8c");
                        }
                        else{
                            App.merge_selected.splice(App.merge_selected.indexOf(the_team_id), 1);
                            d3.select(this).style("border", "1px solid rgb(140, 61, 54)");
                        }
                    });
                    d3.selectAll(".nonadmin").on("click", function(){
                        ;
                    });
                });
                d3.select("#merge_cancel").on("click", function(){
                    d3.select("#merge_selection").style("display", "none");
                    d3.select("#merge_button").style("border", "1px solid #8C8C8C");
                    d3.selectAll(".nonadmin").style("opacity", 1);
                    d3.selectAll(".admin").style("border", "1px solid #8c8c8c")
                    d3.selectAll(".one_team").on("click", function(){
                        var the_team_id = d3.select(this).text();
                        window.open(
                            window.document.location.protocol + '//' + window.document.location.host + '/teamviz/' + the_team_id,
                            '_blank' 
                        );
                    });
                });
                d3.select("#merge_continue").on("click", function(){
                    var team_ids = "";
                        for(var jj = 0; jj < App.merge_selected.length; jj++){
                            team_ids += "teamid=" + App.merge_selected[jj];
                            if(jj != App.merge_selected.length - 1){
                                team_ids += "&";
                            }
                        }
//                    window.open(
//                        window.document.location.protocol + '//' + window.document.location.host + '/merge/' + team_ids,
//                        '_blank' 
//                    );
                });

                // fetch all email files
                d3.select("#loader").html('Downloading emails to browser.. 0%');
                $("#loader").css("display", "block");
                var versions_done = 0;
                var allemails = [];
                if (!App.usersinfo) {//alert("version"+App.version);
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
                                        $("#loader").html('Downloading email metadata to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
                                        console.log('Downloading emails to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
                                        if (versions_done === App.version + 1) {
                                            console.log("fetching of emails files done!!");
                                            d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
                                            d3.json("/getstats/&", function (error, stats) {
                                                //                                    App.db = VMail.DB.setupDB(App.userinfo, allemails, stats);
                                                App.db = new Array(1); 
                                                App.db[0] = VMail.DB.setupDB_merge(App.userinfo, allemails, stats, univ_data);
                                                console.log("done setting up the db");
                                                if (App.working == 1) {
                                                    $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
                                                } else {
                                                    $("#loader").css("display", "none");
                                                }
                                                $("#runway").css("display", "none");
                                                d3.selectAll(".runway").style("display", "none");
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
                    });
                    //wait for the get version thing done for all users
                    setTimeout(function () {console.log(App.verisonTowaitTime);
                        var time = 0;
                        var versions_done = new Array(App.usersinfo.length);
                        d3.range(App.usersinfo.length).forEach(function (k) {
    //                        if (k != 0) time = 13000 * k;
                            if (k != 0){ time += (100 * (App.verisonTowaitTime[k - 1] + 10)); console.log(k +" " +time);}
        //                    if (k != 0) time += 8000;
        //                    if(App.usersinfo[k].name == "Sanjay Guruprasad") time += 6000;
        //                    else if(App.usersinfo[k].name == "Cesar Hidalgo" || App.usersinfo[k].name == "Cesar A. Hidalgo") time += 9000;
        //                    else if(App.usersinfo[k].name == "Kevin Hu" || App.usersinfo[k].name == "Kevin Zeng Hu") time += 9000;

                            setTimeout(function () {
                                versions_done[k] = 0;
                                var allemails = [];
//                                $.ajax({
//                                    //                            type: "POST",
//                                    dataType: "json",
//                                    url: "/getversion/&json=" + App.usersinfo[k].email,
//                                    cache: true,
//                                    success: function (returned_version) {console.log("whiat is k now "+k);
//                                        App.version = returned_version;//alert("returned version "+returned_version);
//                                        App.verisonTowaitTime[k] = returned_version;
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
                                                        $("#loader").html('Downloading email metadata to browser.. ' + Math.floor((100 * versions_done[k]) / (App.versions[k] + 1)) + "%");
                                                        d3.select("body").select("#runway_" + k).select("#user_fetchedcount").html(process + "% fetched");
                                                        console.log('Downloading emails to browser.. ' + Math.floor((100 * versions_done[k]) / (App.versions[k] + 1)) + "%");
                                                        if (versions_done[k] === App.versions[k] + 1) {
                                                            console.log("fetching of emails files done!!");
                                                            d3.select("body").select("#runway_" + k).select("#user_fetchedcount").html("Done");
//                                                            d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
                                                            d3.select("#loader").html('Analyzing metadata: setting up the DB.');
                                                            setTimeout(function () {
                                                                d3.json("/getstats/" + "json=" + App.usersinfo[k].email, function (error, stats) {//console.log(stats);
                                                                    if(k == 0) VMail.App.orgs = [];
                                                                    App.db[k] = VMail.DB.setupDB_merge(App.usersinfo[k], allemails, stats, univ_data);//console.log(App.db[k]);
                //                                                    setTimeout(function(){
                                                                    d3.select("#loader").html('Analyzing metadata: done setting up the DB.');
                                                                    console.log("done setting up the db");
                                                                    if (App.working == 1) {
                                                                        $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
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
                                                                            for(var ii = 0; ii <= App.usersinfo.length; ii++){
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
            });
        });
    })(VMail.App || (VMail.App = {}));
    var App = VMail.App;
})(VMail || (VMail = {}));
//# sourceMappingURL=app.js.map
