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
        var CHARGE_DEFAULT = - Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 0.5 *1.1;
        
        App.member_selected = 0; //0 for all, 1 for shared contacts, 3 for members only
        App.rightPanel = 0; //0 for members, 1 for stats, 2 for shortest paths
        App.init_time = 0;
        App.init_times = new Array();
        App.idSwitch_before = new Array();
        App.idSwitch_after = new Array();
        
        App.removed = [];
        App.orgs = [];
        App.not_orgs = ["gmail.com", "hotmail", "yahoo", "googlegroups.com", "google.com", "amazon.com", "linkedin.com", "github.com", "163.com", "uber.com", "msn.com", "aol.com", "ets.org", "qq.com", "windowslive.com", "yahoogroups.com", "ebay.com", "time4education.com", "comcast.net", "outlook.com"];
        App.node_as_org = 0;
        
        App.selectedTwoNodes = [];
        App.shortestPaths = [];
        
        App.thresholdForText = 5;
        App.thresholdForOrgText = 6;
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
        App.working = null;
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
            var colors = ["#E61616", "#E65917", "#E6B517", "#E1E616", "#95E616", "#25E617", "#16DCE6", "#1692E6", "#1721E6", "#6817E6"];
            return colors[i];
        };
        //var color = d3.scale.category10();

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

            if (!App.isWithinRange) {
                $('#allTimesLink').addClass('selectedlink');
                $('#thisYearLink').removeClass('selectedlink');
            } else {
                $('#allTimesLink').removeClass('selectedlink');
                $('#thisYearLink').addClass('selectedlink');
            }
            var container = d3.select("#rankings-content");
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
            $("#user_stats").hide();
            $('#contactDetails').hide();
            $('#userinfopanel').fadeIn();
            $('#rankings').fadeIn();
        };

        
        // show details about a particular contact on the page using information
        // (emails) between start and end date
        var showContactDetails = function (node, contact, start, end) {
            currentContact = contact;
            the_one_node = node;
            App.isContactDetails = true;
            App.isUserStats = false;
            
            d3.select("#contactDetails-content").selectAll("*").remove();
            
            if(App.node_as_org == 0){ //nodes as contacts
                if(the_one_node.owns.length > 1){
                    var connection_score = new Array(the_one_node.owns.length);
                    for(var t=0;t<connection_score.length;t++){
                        var contactDetails = (App.db[the_one_node.owns[t]].getContactDetails(start, end));
                        var the_id = the_one_node.owns_ids[t];//console.log(contactDetails);
                        connection_score[t] = {score: (contactDetails[the_id].nSentEmails + contactDetails[the_id].nRcvEmails), ind: t};
                    }
                    var comp = function (a, b) {
                        if (a.score !== b.score) {
                            return b.score - a.score;
                        }
                        return 0;
                    };
                    connection_score.sort(comp);
                    d3.range(connection_score.length).forEach(function (t){
                        var tt = the_one_node.owns[connection_score[t].ind];
    //                    if(the_one_node.owns.indexOf(the_one_node.owns[tt]) != -1){
                        ContactInfo(tt, t+1);
    //                    }
                    });
                }
                else{
                    d3.range(App.db.length).forEach(function (t){
                        if(the_one_node.owns.indexOf(t) != -1){
                            ContactInfo(t, 1);
                        }
                    });
                }
            }
            else{
                var connection_score = new Array(the_one_node.owns.length);
                for(var t=0; t<connection_score.length; t++){
                    connection_score[t] = {score: the_one_node.owns[t], ind: t};
                }
                var comp = function (a, b) {
                    if (a.score !== b.score) {
                        return b.score - a.score;
                    }
                    return 0;
                };
                connection_score.sort(comp);
                d3.range(connection_score.length).forEach(function (t){
                    var num = the_one_node.owns[connection_score[t].ind];
//                    if(the_one_node.owns.indexOf(the_one_node.owns[tt]) != -1){
                    if(num != 0) OrgInfo(connection_score[t].ind, num, t+1);
//                    }
                });
            }
            
            function OrgInfo(t, count, rank){
                var org = contact;
                var container = d3.select("#contactDetails-content");//.html('');
                var content = '';
                content += "<div>" + org.domain + "</div>";
                
                if(container.select(".person_name")[0][0] == null){
                    var person_left=container.append("div").html(contact.name).attr("class", "person_name").attr("id", "person_name_left").attr('title', '').node();
                    $(person_left).tooltip({ content: content });
                    if(App.type == "multi"){
                        container.append("br");
                        container.append("div").html('<b>' + org.member_size + ' people</b>');
                        container.append("br");
                        container.append("div").html('<b>Contacts contributed by: </b>');
                    }
                }
                else{
//                    container.append("br"); container.append("br");
                }
                if(App.type == "multi"){
                    container.append("hr");
                }
                if(App.type == "multi"){
//                  container.append("div").html('<b><i>with ' + ((App.usersinfo)? App.usersinfo[t].name:App.userinfo.name) + '</i></b>');
                    container.append("div").attr("id","contact_"+rank).html('<b><i>' + rank + '. ' + ((App.usersinfo)? App.usersinfo[t].name:App.userinfo.name) + ' ' + count + '</i></b>');
                    container.selectAll(".contact_"+rank).style("display","none");
                }
                $('#user_stats').hide();
                $('#rankings').hide();
                if(App.type == "multi"){
                    d3.selectAll(".userinfopanel").style("display","none");
                    d3.select("#members").style("display","none");
                    d3.select("#stats").style("display","none");
                    d3.select("#paths").style("display","none");
                    d3.selectAll(".for_paths").style("display","none");
                    $('#contactDetails').fadeIn();
                }
                else{
                    $('#userinfopanel').hide();
                    d3.select("#members").style("display","none");
                    d3.select("#stats").style("display","none");
                    d3.select("#paths").style("display","none");
                    $('#contactDetails').fadeIn();//commented below
                }
            }
            
            //retrieve the details object from the database
            function ContactInfo(t, rank){
                var contactDetails = (App.db[t].getContactDetails(start, end));
                var container = d3.select("#contactDetails-content");//.html('');
                var content = '';
                contact.aliases.forEach(function (alias) {
                    content += "<div>" + alias + "</div>";
                });
                var the_id = node.owns_ids[node.owns.indexOf(t)];//contact.id;
                var the_id_before = node.owns_before_ids[node.owns.indexOf(t)];
                if(container.select(".person_name")[0][0] == null){
                    var person_left=container.append("div").html(contact.name).attr("class", "person_name").attr("id", "person_name_left").attr('title', '').node();
                    $(person_left).tooltip({ content: content });
                    if(App.type == "multi"){
                        container.append("br");
                        container.append("div").html('<b>Connection Ranking: </b>');
                    }
                }
                else{
//                    container.append("br"); container.append("br");
                }
                if(App.type == "multi"){
                    container.append("hr");
                }
                
                if(App.type == "multi"){
//                  container.append("div").html('<b><i>with ' + ((App.usersinfo)? App.usersinfo[t].name:App.userinfo.name) + '</i></b>');
                    container.append("div").attr("id","contact_"+rank).style("cursor", "pointer")
                            .html('<b><i>' + rank + '. ' + ((App.usersinfo)? App.usersinfo[t].name:App.userinfo.name) + '</i></b>')
                            .on("click",function(){
                                var rank = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_")+1, d3.select(this).attr("id").length));
                                if(d3.select(".contact_"+rank).style("display") == "none"){
                                    container.selectAll(".contact_rank").style("display","none");
                                    container.selectAll(".contact_"+rank).style("display","block");
                                }
                                else{
                                    container.selectAll(".contact_rank").style("display","none");
                                    container.selectAll(".contact_"+rank).style("display","none");
                                }
                            })
                            .on("mouseover", function(){
                                var rank = parseInt(d3.select(this).attr("id").substring(d3.select(this).attr("id").indexOf("_")+1, d3.select(this).attr("id").length));
                                d3.range(VMail.App.usersinfo.length).forEach(function(ii){ container.selectAll("#contact_"+(ii+1)).style("background-color","rgba(0,0,0,0)"); });
                                container.select("#contact_"+rank).style("background-color","rgb(200,200,200)");
                            })
                            .on("mouseout", function(){
                                d3.range(VMail.App.usersinfo.length).forEach(function(ii){ container.selectAll("#contact_"+(ii+1)).style("background-color","rgba(0,0,0,0)"); });
                            });
                    container.append("div").attr("id","for_select_"+rank).attr("class","contact_rank").style("display","none").attr("class","contact_"+rank).html('<b>First email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id_before].firstEmail)) + " ago").attr("id", "firstemail");
                    container.append("hr").attr("class","contact_rank").attr("class","contact_"+rank).style("display","none");
                    container.append("div").attr("class","contact_rank").attr("class","contact_"+rank).style("display","none").html('<b>Last email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id_before].lastEmail)) + " ago");

                    var details = contactDetails[the_id];//console.log(the_id+","+the_id_before);console.log(contactDetails);console.log(contactDetails[the_id]);console.log(contactDetails[the_id_before]);
                    if (details === undefined) {
                        return;
                    }
                    container.append("hr").attr("class","contact_rank").attr("class","contact_"+rank);
                    container.append("div").attr("class","contact_rank").attr("class","contact_"+rank).html("<b>Sent (private):</b>  " + numParser(details.nSentEmails) + "  (" + numParser(details.nSentEmailsPvt) + ")");
                    container.append("hr").attr("class","contact_rank").attr("class","contact_"+rank);
                    container.append("div").attr("class","contact_rank").attr("class","contact_"+rank).html("<b>Received (private):</b>  " + numParser(details.nRcvEmails) + "  (" + numParser(details.nRcvEmailsPvt) + ")");
                    container.append("hr").attr("class","contact_rank").attr("class","contact_"+rank);

                    //retrieve a list of timestamps of emails exchanged with this particular contact
                    var timestamps = (App.db[t].getEmailDatesByContactMulti(node.owns_ids[node.owns.indexOf(t)]));

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

                    container.append("div").attr("class","contact_rank").attr("class","contact_"+rank).html("<b>Interaction volume</b>");
                    histSettings.position = container.append("div").attr("class","contact_rank").attr("class","contact_"+rank);
                    container.selectAll(".contact_"+rank).style("display","none");
                }
                else{
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

                //retrieve introduction information from the database for this contact
                var introductions = (App.db[t].getIntroductions(contact));

                //list of contacts we introduced
                var children = introductions.children;

                //list of contacts this contact was introduced by sorted in chronological order
                if(App.type != "multi"){
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
                if(App.type == "multi"){
                    d3.selectAll(".userinfopanel").style("display","none");
                    d3.select("#members").style("display","none");
                    d3.select("#stats").style("display","none");
                    d3.select("#paths").style("display","none");
                    d3.selectAll(".for_paths").style("display","none");
                    $('#contactDetails').fadeIn();
                }
                else{
                    $('#userinfopanel').hide();
                    d3.select("#members").style("display","none");
                    d3.select("#stats").style("display","none");
                    d3.select("#paths").style("display","none");
                    $('#contactDetails').fadeIn();//commented below
                }
                container.append("div").attr("id", "person_name_right")
                        .attr("height",document.getElementById("person_name_left").offsetHeight+"px")
                        .append("a").attr("href","#").attr("id","invite").text("Invite")
                        .style("display",function(){ 
                            if(App.type != "multi"){ return "block";} 
                            else{ return "none"; }
                        })
                        .on("click",function(){
                            var invitation_email={
                                    email: (VMail.App.userinfo.email),
                                    name: (VMail.App.userinfo.name),   
                                    toField: (contact.aliases[contact.aliases.length-1]),
                                    toField_name: (contact.name),
                                    link: ("http://hobbit.media.mit.edu:8001/viz_multi/add=" + VMail.App.userinfo.email + "&add=" + contact.aliases[contact.aliases.length-1])
                                };
                            $.post('/invite_name', { 'json': JSON.stringify(invitation_email) }) //contact.name
                             .success(function(){
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
                    
                    if(App.node_as_org == 0){ //nodes are contacts
                        for(var t in (App.db)){
                            for (var id in (App.db[t].contacts)) {
                                var contact = (App.db[t].contacts[(parseInt(id) + parseInt(c_length)).toString()]);
                                if (typeof(contact) != "undefined" && contact.name.toLowerCase().indexOf(term) !== -1 && typeof(ids[(parseInt(id) + parseInt(c_length)).toString()]) == "undefined") {
                                    results.push({ label: contact.name, value: (parseInt(id) + parseInt(c_length)).toString(), owns: t });
                                    ids[(parseInt(id) + parseInt(c_length)).toString()] = (parseInt(id) + parseInt(c_length)).toString();
                                }
                            }
                            c_length += App.db[t].contactDetails.length;
                        }

                        //some members may be missing in the search results, add them in: term matching, not in the results 
                        for(var t in App.graph.member_nodes){
                            if (App.graph.member_nodes[t].attr.contact.name.toLowerCase().indexOf(term) !== -1 && typeof(ids[App.graph.member_nodes[t].id]) == "undefined") {
                                var search_result = $.grep(results, function(e){ return e.label == App.graph.member_nodes[t].attr.contact.name; });
                                if(search_result.length == 0){
                                    results.push({ label: App.graph.member_nodes[t].attr.contact.name, value: App.graph.member_nodes[t].id, owns: t });
                                    ids[App.graph.member_nodes[t].id] = App.graph.member_nodes[t].id;
                                }
                            }
                        }

                        results.sort(function (a, b) {
                            var idx1 = a.label.toLowerCase().indexOf(term);
                            var idx2 = b.label.toLowerCase().indexOf(term);
                            if (idx1 === 0) {
                                if (idx2 === 0) {
                                    if(a.value < c_length && b.value < c_length) return getScore((App.db[b.owns].contacts[b.value])) - getScore((App.db[a.owns].contacts[a.value]));
                                    else if(a.value < c_length) return 0.5 - getScore((App.db[a.owns].contacts[a.value]));
                                    else if(b.value < c_length) return getScore((App.db[b.owns].contacts[b.value])) - 0.5;
                                    else return 0.01;
                                } else {
                                    return -1;
                                }
                            } else {
                                if (idx2 === 0) {
                                    return 1;
                                } else {
                                    if(a.value < c_length && b.value < c_length) return getScore((App.db[b.owns].contacts[b.value])) - getScore((App.db[a.owns].contacts[a.value]));
                                    else if(a.value < c_length) return 0.5 - getScore((App.db[a.owns].contacts[a.value]));
                                    else if(b.value < c_length) return getScore((App.db[b.owns].contacts[b.value])) - 0.5;
                                    else return 0.01;
                                }
                            }
                            return a.label.toLowerCase().indexOf(term) - b.label.toLowerCase().indexOf(term);
                        });
                        response(results.slice(0, 15));
                    }
                    else{
                        for(var t in App.graph.org_nodes){
                            if ((App.graph.org_nodes[t].name.toLowerCase().indexOf(term) !== -1 || App.graph.org_nodes[t].domain.toLowerCase().indexOf(term) !== -1) && typeof(ids_orgs[App.graph.org_nodes[t].id]) == "undefined") {
                                var search_result = $.grep(results_orgs, function(e){ return e.label == App.graph.org_nodes[t].name; });
                                if(search_result.length == 0){
                                    results_orgs.push({ label: App.graph.org_nodes[t].name, value: App.graph.org_nodes[t].id, member_size: App.graph.org_nodes[t].member_size });
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
                    if(App.node_as_org == 0){
                        var nodes = App.graph.nodes.filter(function (node) {
                            return !node.skip && node.id === ui.item.value;
                        });
                    }
                    else{
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
                    if(App.node_as_org == 0){
                        var nodes = App.graph.nodes.filter(function (node) {
                            return !node.skip && node.id === ui.item.value;
                        });
                    }
                    else{
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
                    $('ul.ui-autocomplete a').tipsy({ gravity: 'w', title: function () {
                            return 'Contact not in time range';
                        } });
                    $(this).autocomplete('widget').css('z-index', 10000);
                    return false;
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
                    updateNetwork(false, 0);
                },
                change: function (event, ui) {
                    nlinks = ui.value; 
                    updateNetwork(false, 0);
                }
            });
        };

        var initNetworkSliders = function () {
            $("#slider-charge").slider({
                //range: "min",
                min: CHARGE_DEFAULT * 2, //-600, default used to be -300
                max: 0,
                value: CHARGE_DEFAULT,
                step: 20,//100
                slide: function (event, ui) {
                    App.viz.settings.forceParameters.charge = ui.value;

                    //updateNetwork(false);
                    App.viz.draw();
                    //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
                }
            });
//            if(App.usersinfo) NNODES_PRECOMPUTE = 400+(App.usersinfo.length -1)*200;

            $("#slider-nodes").slider({
                //range: "min",
                min: 0,
                max: (NNODES_PRECOMPUTE * App.usersinfo.length > 800? 800:NNODES_PRECOMPUTE * App.usersinfo.length),
                value: (NNODES_DEFAULT * App.usersinfo.length > 400? 400:NNODES_DEFAULT * App.usersinfo.length ),
                step: 10, //5
                slide: function (event, ui) {
                    nnodes = ui.value;
                    updateNetwork(false, 0);
                },
                change: function (event, ui) {
                    nnodes = ui.value;
                    updateNetwork(false, 0);
                    //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
                }
            });
            $("#node_max").text((NNODES_PRECOMPUTE * App.usersinfo.length > 800? 800:NNODES_PRECOMPUTE * App.usersinfo.length));

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

            $(document).bind('keydown.t', function () {
                App.viz.toggleLabelVisibility();
            });
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

        var updateNetwork = function (induceNetwork, member) {
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

                App.graph = VMail.Graph.induceOrgNetwork(App.db, NNODES_PRECOMPUTE, start, end);
                initLinksSlider();
            }
            VMail.Graph.filterNodes(App.graph, function (nodeAttr, idx) {//may need to look at later
                return idx < nnodes;
            });
            VMail.Graph.filterLinks(App.graph, function (linkAttr, idx) {
                return idx < nlinks;
            });

            //run community detection on the network
            VMail.Graph.communityDetection(App.graph);
            var sizeExtent = d3.extent(App.graph.nodes, function (node) {
                return node.attr.size;
            });
            var org_sizeExtent = d3.extent(App.graph.org_nodes, function (node) {
                return node.member_size;
            });
            var sizeExtentMember = d3.extent(App.graph.member_nodes, function (node) {
                return node.attr.size;
            });
            var nodeRadius = d3.scale.linear().range([3, 50]).domain(sizeExtent);
            var org_nodeRadius = d3.scale.linear().range([5, 120]).domain(org_sizeExtent);
            var textSize = d3.scale.linear().range([11, 20]).domain(sizeExtent);
            var textMemberSize = d3.scale.linear().range([11, 20]).domain(sizeExtentMember);
            var org_textSize = d3.scale.linear().range([11, 20]).domain(org_sizeExtent);
            var nodeMemberRadius = d3.scale.linear().range([3, 50]).domain(sizeExtentMember);
            var linkSizeExtent = d3.extent(App.graph.links, function (link) {
                return link.attr.weight;
            });
            var org_linkSizeExtent = d3.extent(App.graph.org_links, function (link) {
                return link.weight;
            });
            var linkWidth = d3.scale.linear().range([1, 12]).domain(linkSizeExtent);
            var org_linkWidth = d3.scale.linear().range([1, 20]).domain(org_linkSizeExtent);

            if(App.node_as_org == 0){
                App.viz.settings.nodeSizeFunc = function (attr) {
                    return nodeRadius(attr.size);
                };
                App.viz.settings.textSizeFunc = function (attr) {
                    return textSize(attr.size);
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
            }
            else{
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

            //viz.settings.nodeSizeFunc = null;
            if(member==1) App.viz.updateMemberNetwork(App.graph);
            else App.viz.updateNetwork(App.graph);
//            clearInterval(move);
//            elem.style.width = 100 + '%';
//            d3.select("#loading").remove();
            
            //if(!viz.guestbook) {
            //  setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 5000)
            //}
        };

        // slider where users selects time-sliced view of the data
        var initTimeSlider = function () {
            $("#slider-ytd").click(function () {
                var init_start = 100000000000, init_end = 0;
                for(var t = 0; t < App.db.length; t++){
                    if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
                    if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
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
                updateNetwork(true, 0);
                if (!App.isContactDetails && !App.isUserStats) {
                    showTopContacts(NTOPCONTACTS);
                }
                if (App.isContactDetails) {
                    showContactDetails(the_one_node, currentContact, start, end);
                }
            });

            $("#slider-all").click(function () {
                var init_start = 100000000000, init_end = 0;
                for(var t = 0; t < App.db.length; t++){
                    if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
                    if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
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
                updateNetwork(true, 0);
                if (!App.isContactDetails && !App.isUserStats) {
                    showTopContacts(NTOPCONTACTS);
                }
                if (App.isContactDetails) {
                    showContactDetails(the_one_node, currentContact, start, end);
                }
            });

            $("#slider-pastmonth").click(function () {
                var init_start = 100000000000, init_end = 0;
                for(var t = 0; t < App.db.length; t++){
                    if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
                    if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
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
                updateNetwork(true, 0);
                if (!App.isContactDetails && !App.isUserStats) {
                    showTopContacts(NTOPCONTACTS);
                }
                if (App.isContactDetails) {
                    showContactDetails(the_one_node, currentContact, start, end);
                }
            });

            $("#slider-pastweek").click(function () {
                var init_start = 100000000000, init_end = 0;
                for(var t = 0; t < App.db.length; t++){
                    if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
                    if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
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
                updateNetwork(true, 0);
                if (!App.isContactDetails && !App.isUserStats) {
                    showTopContacts(NTOPCONTACTS);
                }
                if (App.isContactDetails) {
                    showContactDetails(the_one_node, currentContact, start, end);
                }
            });
            
            var play_timeline;
            $("#play_button").click(function(){//play the timeline
                var init_start = 100000000000, init_end = 0;
                for(var t = 0; t < App.db.length; t++){
                    if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
                    if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
                }
                init_start = start; //new Date(init_start * 1000);
                init_end = new Date(init_end * 1000);
                var c = init_end * 1000;
                start = init_start;
                end = start; 
                
                flag_timeline = 1 - flag_timeline;
                if(flag_timeline == 1){
                    play_timeline = setInterval(function(){
                        start = start; 
                        end = ((d3.time.month.offset(end, 6) > init_end)? init_end:d3.time.month.offset(end, 6));
                        if(end == init_end){ //end of the timeline, stop the interval
                            clearInterval(play_timeline);
                            flag_timeline = 0;
                        }
                        else{ //move one month forward in the timeline
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
                else{
                    clearInterval(play_timeline);
                }
            });

            // date formatter for the slider text
            var init_start = 100000000000, init_end = 0;
            for(var t = 0; t < App.db.length; t++){
                if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
                if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
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

            //put lines to represent when each member join the timeline
            App.init_times = new Array(App.db.length);
            App.removed = new Array(App.db.length);
            for(var ii=0; ii<App.db.length; ii++) App.removed[ii] = 0;
            for(var t = 0; t < App.db.length; t++){//init time for each member
                App.init_times[t] = App.db[t].emails[0].timestamp;
                d3.select("#timeline").append("div").attr("class","emerge_time").attr("id","em_" + t)
//                  .style("left",function(){
//                      var left = $("#ui-slider-handle").offset().left + 50 + (init_time[t] - init_start) / (init_end - init_start) * (parseInt(d3.select("body").select("#slider-range").style("width"))); //whole time length
//                      return left + "px";
//                  })
                  .style("border-left","3px solid " + color(t))
//                  .style("top",function(){
//                      return $("#timeline").offset().top + "px";
//                  })
                  .style("height","1.3em");
//                  .style("z-index", 100);
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
                    if(flag_timeline == 1) updateNetwork(true, 0);
                    else updateNetwork(true, 0);
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
            
            if(App.type=="multi"){
                d3.select("#userinfopanel").style("display","none");
                d3.range(App.db.length).forEach(function (t){
                    var panel = d3.select("#rightcolumn").append("div").attr("class","userinfopanel").attr("id","userinfopanel_"+t).style("height","98px");

                    panel.on("mouseover",function(){
                        if(App.removed[t] != 1){
                            d3.selectAll(".userinfopanel").style("opacity", 0.2)
                              .style("-webkit-transition", "opacity 0.3s ease-in-out")
                              .style("-moz-transition", "opacity 0.3s ease-in-out");
                            d3.select(this).style("opacity", 1);

                            d3.selectAll(".node").style("opacity",function(){
                                var node_id = parseInt(d3.select(this).attr("id"));
                                for(var ii = 0; ii < App.graph.nodes.length; ii++){
                                    if(node_id == parseInt(App.graph.nodes[ii].id)){
                                        if(App.graph.nodes[ii].attr.contact.name == App.usersinfo[t].name){
                                            return 1;
                                        }
                                        if(App.graph.nodes[ii].owns.indexOf(t) != -1){
                                            //here
                                            var the_id = App.graph.nodes[ii].owns_before_ids[App.graph.nodes[ii].owns.indexOf(t)];
                                            if(App.db[t].contactDetails[the_id] == undefined) return 0.2;
                                            if(App.db[t].contactDetails[the_id].firstEmail > end) return 0.2;
                                            return 1;
                                        }
                                        break;
                                    }
                                }
                                return 0.2;
                            });
                            d3.selectAll("use").style("opacity",function(){
                                if(VMail.App.viz.labelsVisible){
                                    var node_id = parseInt(d3.select(this).attr("id").substring(5, d3.select(this).attr("id").length));
                                    for(var ii = 0; ii < App.graph.nodes.length; ii++){
                                        if(node_id == parseInt(App.graph.nodes[ii].id)){
                                            if(App.graph.nodes[ii].attr.contact.name == App.usersinfo[t].name){
                                                return 1;
                                            }
                                            if(App.graph.nodes[ii].owns.indexOf(t) != -1){
                                                //here
                                                var the_id = App.graph.nodes[ii].owns_before_ids[App.graph.nodes[ii].owns.indexOf(t)];
                                                if(App.db[t].contactDetails[the_id] == undefined) return 0.2;
                                                if(App.db[t].contactDetails[the_id].firstEmail > end) return 0.2;
                                                return 1;
                                            }
                                            break;
                                        }
                                    }
                                    return 0.2;
                                }
                                else{ return 0; }
                            });
                        }
                    })
                    .on("mouseout",function(){
                        if(App.removed[t] != 1){
                            for(var ii=0; ii<App.removed.length; ii++){
                                if(App.removed[ii] == 1) d3.select("#userinfopanel_"+ii).style("opacity", 0.2);
                                else d3.select("#userinfopanel_"+ii).style("opacity", 1);
                            }
                            d3.selectAll(".node").style("opacity", 1);
                            if(VMail.App.viz.labelsVisible){
                                d3.selectAll("use").style("opacity", 1);
                            }
                        }
                    });
                    panel.append("div").attr("id","name").attr("class","person_name").attr("class","p_" + t)
                        .style("border-left",function(){
                            return "4px solid " + color(t);
                        })
                        .style("width","85%")
                        .html(App.usersinfo[t]['given_name'] + " " + App.usersinfo[t]['family_name']);
                    panel.append("div").attr("class","icons")
                        .style("top", function(){
                            if(panel.select("#name").style("height").substring(0, panel.select("#name").style("height").indexOf("px")) > 30){
                                return (-29-29) + "px";
                            }
                            return "-29px";
                        })
                        .style("height","29px")
                        .append("img")
                        .attr("src","/static/images/remove.png")
                        .style("opacity", 0.2)
                        .on("mouseover", function(){
                            d3.select(this).style("opacity", 1);
                        })
                        .on("mouseout", function(){
                            d3.select(this).style("opacity", 0.2);
                        })
                        .on("click", function(){//remove the person from the group
                            App.removed[t] = 1 - App.removed[t];
                            if(App.removed[t] == 1){
                                d3.select(this).attr("src", "/static/images/add.png");
                                panel.style("opacity", 0.2);
                                for(var ii=0; ii<App.removed.length; ii++){
                                    if(App.removed[ii] == 0) d3.select("#userinfopanel_"+ii).style("opacity", 1);
                                }
                                d3.selectAll(".node").style("opacity", 1);
                                if(VMail.App.viz.labelsVisible){
                                    d3.selectAll("use").style("opacity", 1);
                                }
                                //remove nodes of the member
                                updateNetwork(true, 0);
                                
                            }
                            else{ 
                                d3.select(this).attr("src", "/static/images/remove.png");
                                panel.style("opacity", 1);
                                //readd nodes of the member
                                updateNetwork(true, 0);
                            }
                            
                            
                        });
                    panel.style("height", function(){
                        if(panel.select("#name").style("height").substring(0, panel.select("#name").style("height").indexOf("px")) > 30){
                            return (98+29) + "px";
                        }
                        return "98px";
                    });

                    panel.append("div").attr("class","leftstack").style("position","absolute").append("img").attr("id","userpic").attr("class","userpic_circle")
                         .style("border-color", color(t));
                    if (App.usersinfo[t]['picture'] !== undefined) {
                        panel.select("#userpic").attr("src", App.usersinfo[t]['picture']);
                    } else {
                        panel.select("#userpic").attr("src", "/static/images/default_user_pic.jpg");
                    }
                    var infolevel = panel.append("div").attr("class","leftstack");
                    infolevel.append("div").attr("class","infolevel2").attr("id","ncontacts")
                        .html(numParser((App.db[t].nCollaborators)) + ' collaborators');
                    infolevel.append("div").attr("class","infolevel2").attr("id","totalemails")
                        .html(numParser((App.db[t].emails.length)) + ' emails');
                });
            }
            else{

                if (userinfo['name'] === 'Demo User') {
                    $("#name").html(fict_name);
                    content = "<div>" + fict_email + "</div>";
                } else {
                    $("#name").html(userinfo['given_name'] + " " + userinfo['family_name']);
                    aliases.forEach(function (alias) {
                        content += "<div>" + alias + "</div>";
                    });
                }

                $("#name").attr("title", '').tooltip({ content: content });

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
            canvg('networkcanvas', html, { renderCallback: function () {
                    var canvas = document.getElementById('networkcanvas');
                    var b64 = canvas.toDataURL("image/png");
                    b64 = b64.substring(22);
                    $.post('/snapshot', { 'b64': b64 }, function (response) {
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
                } });
        };

        var initHistograms = function (t) {
            if(App.type!="multi"){
            
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
                var container = d3.select("#user_stats");
                histSettings.position = d3.select("#user_stats");

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
            
            }
        };
        
        //nodes as organizations or people
        App.org_or_person = function (as_orgs, as_people){
            if(as_orgs){
                $('#as_orgs').addClass('selectedlink');
                $('#as_people').removeClass('selectedlink');
                App.node_as_org = 1;
                
                d3.select("#members").style("display","none");
                d3.select("#stats").style("display","none");
                d3.select("#paths").style("display","none");
                
                //disable see all/shared/members
                d3.select("#see_members").style("pointer-events", 'none');
                //disable coloring nodes by
                d3.select("#color_method").style("pointer-events", 'none');
                //search box: look up orgs
                d3.select("label.heading2").html("Lookup Organizations");
                
                if(App.viz){
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
                    for(var t = 0;t < App.db.length; t++){
                        d3.select(".p_" + t)
                          .style("border-left",function(){
                              return "0px solid " + color(t);
                          });
                        d3.select("#em_" + t)
                          .style("border-left",function(){
                              return "3px solid #5a5854";
                          });
                    }
                    updateNetwork(true, 0);
                }
            }
            if(as_people){
                $('#as_people').addClass('selectedlink');
                $('#as_orgs').removeClass('selectedlink');
                App.node_as_org = 0;
                
                $("#members").fadeIn();
                $("#stats").fadeIn();
                $("#paths").fadeIn();
                
                d3.select("#see_members").style("pointer-events", 'all');
                d3.select("#color_method").style("pointer-events", 'all');
                d3.select("label.heading2").html("Lookup Contacts");
                
                if(App.viz){
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
                    for(var t = 0;t < App.db.length; t++){
                        d3.select(".p_" + t)
                          .style("border-left",function(){
                              return "4px solid " + color(t);
                          });
                        d3.select("#em_" + t)
                          .style("border-left",function(){
                              return "3px solid " + color(t);
                          });
                    }
                    updateNetwork(true, 0);
                }
            }
        };

        //only show nodes of members in the group
        App.see_members = function (as_yes, as_half, as_no){
            if(as_yes){
                $('#as_yes').addClass('selectedlink');
                $('#as_half').removeClass('selectedlink');
                $('#as_no').removeClass('selectedlink');
                App.member_selected = 1;
                updateNetwork(false, 1);
            }
            if(as_half){
                $('#as_half').addClass('selectedlink');
                $('#as_no').removeClass('selectedlink');
                $('#as_yes').removeClass('selectedlink');
                App.member_selected = 2;
                if(App.graph) updateNetwork(false, 2);
            }
            if(as_no){
                $('#as_no').addClass('selectedlink');
                $('#as_half').removeClass('selectedlink');
                $('#as_yes').removeClass('selectedlink');
                App.member_selected = 0;
                if(App.graph) updateNetwork(false, 0);
            }
        };
        
        App.color_method = function (communities, people){
            if(communities){
                App.colorMethod = 2;
                $('#communities').addClass('selectedlink');
                $('#people').removeClass('selectedlink');
                for(var t = 0;t < App.db.length; t++){
                    d3.select(".p_" + t)
                      .style("border-left",function(){
                          return "0px solid " + color(t);
                      });
                    d3.select("#em_" + t)
                      .style("border-left",function(){
                          return "3px solid #5a5854";
                      });
                }
                App.viz.recolorNodes();
            }
            if(people){
                App.colorMethod = 1;
                $('#people').addClass('selectedlink');
                $('#communities').removeClass('selectedlink');
                for(var t = 0;t < App.db.length; t++){
                    d3.select(".p_" + t)
                      .style("border-left",function(){
                          return "4px solid " + color(t);
                      });
                    d3.select("#em_" + t)
                      .style("border-left",function(){
                          return "3px solid " + color(t);
                      });
                }
                App.viz.recolorNodes();
            }
        };

        App.toggleMemberStats = function (show_members, show_stats, show_paths) {
            $("#members").fadeIn();
            $("#stats").fadeIn();
            $("#paths").fadeIn();
            if (show_members) {
                //highlight the selected link
                $('#members').addClass('selectedlink');
                $('#stats').removeClass('selectedlink');
                $('#paths').removeClass('selectedlink');
                App.rightPanel = 0;

                //update UI state
                d3.select("#contactDetails-content").selectAll("*").remove();
                if(App.type != "multi"){
//                    $('#userinfopanel').fadeIn();
//                    $('#user_stats').fadeIn();
                }
                else{
                    d3.selectAll(".userinfopanel").style("display","block");
                    d3.selectAll(".for_paths").style("display","none");
                }
            }
            if (show_stats) {
                //highlight the selected link
                $('#stats').addClass('selectedlink');
                $('#members').removeClass('selectedlink');
                $('#paths').removeClass('selectedlink');
                App.rightPanel = 1;

                if(App.type != "multi"){
//                    $('#userinfopanel').hide();
//                    $('#user_stats').hide();
                }
                else{
                    d3.selectAll(".userinfopanel").style("display","none");
                    d3.selectAll(".for_paths").style("display","none");
                }
            }
            if (show_paths) {
                //highlight the selected link
                $('#paths').addClass('selectedlink');
                $('#stats').removeClass('selectedlink');
                $('#members').removeClass('selectedlink');
                App.rightPanel = 2;

                if(App.type != "multi"){
//                    $('#userinfopanel').hide();
//                    $('#user_stats').hide();
                }
                else{
                    d3.selectAll(".userinfopanel").style("display","none");
                    d3.selectAll(".for_paths").style("display","block");
                }
            }
        };

        App.toggleinfo = function (show_mystats, show_topcollab) {
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
                if(App.type != "multi"){
                    $('#userinfopanel').fadeIn();
                    $('#user_stats').fadeIn();
                }
                else{
                    d3.selectAll(".userinfopanel").style("display","block");
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
            $.post('/sendstats', { 'json': JSON.stringify(data) });
        };

        // show initial data including our own details (left column),
        // the unfiltered network (center column), and the ranking list (right column).
        // This function gets called once the server has fetched the inital batch of emails
        var showData = function () {
            $("#data").fadeIn();
            CHARGE_DEFAULT = CHARGE_DEFAULT * 800 / (NNODES_DEFAULT * App.usersinfo.length);
            //d3.select("#data").style("display",null);
            //setting up the in-memory database with the fetched server data
            //db = VMail.DB.setupDB(json);
            var init_start = App.db[0].emails[0].timestamp, init_end = 0;
            for(var t = 0; t < App.db.length; t++){
                if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
                if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
            }
            start = new Date((init_start) * 1000);
            end = new Date();

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
                    charge: CHARGE_DEFAULT * (App.member_selected==1? 20:(App.member_selected==2? 10:1)),
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
                clickHandler: function (node) {
                    if (node === null) {
                        if (App.rightPanel == 0)
                            App.toggleMemberStats(true, false, false);
                        else if(App.rightPanel == 1)
                            App.toggleMemberStats(false, true, false);
//                        if (App.wasUserStats)
//                            App.toggleinfo(true, false);
//                        else
//                            App.toggleinfo(false, true);
                    } else if(App.rightPanel != 2){ // not in the shortest path mode
                        if(App.node_as_org == 0)
                            showContactDetails(node, node.attr.contact, start, end);
                        else
                            showContactDetails(node, node, start, end);
                    }
                    else{//shortest paths
                        if(App.selectedTwoNodes.length < 2){
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
                    charge: CHARGE_DEFAULT * 4,
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
                        if (App.wasUserStats)
                            App.toggleinfo(true, false);
                        else
                            App.toggleinfo(false, true);
                    } else {
                        if(App.node_as_org == 0)
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
            d3.select("#panel").on("mouseover", function(){
                d3.select("#panel_img").attr("src","/static/images/arrow_right.png");
            }).on("mouseout", function(){
                d3.select("#panel_img").attr("src","/static/images/arrow_left.png");
            });

            //vizualize the network
            viz = new VMail.Viz.NetworkViz(settings, false);
            org_viz = new VMail.Viz.OrgNetworkViz(org_settings, false);
            App.viz = viz;
            nnodes = NNODES_DEFAULT * App.usersinfo.length;
            updateNetwork(true, 0);
            for(var t = 0; t < App.db.length; t++){//init time for each member
                d3.select("#timeline").select("#em_" + t)
                  .style("left",function(){
                      var left = $(".ui-slider-range").offset().left - 12 + (App.init_times[t] - init_start) / (init_end - init_start) * (parseInt(d3.select("body").select("#slider-range").style("width"))); //whole time length
                      return left + "px";
                  })
                  .style("top",function(){
                      return ($("#timeline").offset().top - 6) + "px";
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
            initHistograms(0);

            //show initial ranking
            //showTopContacts(NTOPCONTACTS, start, end)
            //setup click handlers for rankings
            $('#allTimesLink').click(function () {
                App.isWithinRange = false;
                showTopContacts(NTOPCONTACTS);
            });
            $('#thisYearLink').click(function () {
                App.isWithinRange = true;
                showTopContacts(NTOPCONTACTS);
            });
            //$('#seeRankingsLink').click(() => {
            //  showTopContacts(NTOPCONTACTS)
            //});
            //$("#loader").fadeOut();
        };
        
        //analysis chart in dashboard
        var flag_ana_chart = 1;
        var initAnalysisCharts = function(){
            if(VMail.App.type == "multi"){
                var init_start = 100000000000, init_end = 0;
                for(var t = 0; t < App.db.length; t++){
                    if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
                    if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
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

                
                App.ave_degree = []; App.density = []; App.ave_SPL = []; App.num_cliques = []; App.ave_btw_centrality = [];
                
                var for_ana_chart;
                if(flag_ana_chart == 1){
                    for_ana_chart = setInterval(function(){
                        start = start; 
                        end = ((d3.time.month.offset(end, 1) > init_end)? init_end:d3.time.month.offset(end, 1));
                        if(end == init_end){ //end of the timeline, stop the interval
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
                        else{ //move one month forward in the timeline
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
//                            //average betweeness centrality
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
                else{
                    clearInterval(for_ana_chart);
                }
            }
        };
//        initAnalysisCharts();

        var nscheduled = null;
        var queuesize = null;
        $(document).ready(function () {
            var univ_data;
            d3.json("/static/world_universities_and_domains.json", function(u_data) {
                univ_data = u_data;
            });
            // setup logout links
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
            $('#centercolumn').css("width", $(window).width() - $('#rightcolumn').width() - 40 - 30);
            $('#slider-range').css("width", $(window).width() - $('#rightcolumn').width() - 40 - 30 - 21 - 50).css("left", "50px");
            App.toggleinfo(true, false);
            App.toggleMemberStats(true, false, false);
            App.org_or_person(false, true);
            App.see_members(false, false, true);

            var dataIsShown = false;

            if(App.type != "multi"){
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
            }
            else{
                var totalWidth = parseInt(d3.select("body").style("width").substring(0, d3.select("body").style("width").indexOf("px")));
                d3.range(App.usersinfo.length).forEach(function(i){
                    var runway = d3.select("body").append("div").attr("class","runway").attr("id","runway_" + i);
                    var line = Math.ceil(App.usersinfo.length/6);
                    if(App.usersinfo.length>6){
                        
                    }
                    runway.style("display", "none").style("text-align", "center")
                          .style("position","relative").style("float", "left").style("left", "20px").style("top", "15%")
                          .style("margin", "0 auto 0 auto").style("width", (totalWidth-40)/App.usersinfo.length + "px");
                    runway.html('<img id="user_pic" class="runway_item"></img>    <div id="user_name" class="runway_item"></div>    <div id="user_email" class="runway_item"></div>    <div id="user_totalemails" class="runway_item"></div>    <div id="user_fetchedcount" class="runway_item"></div>    <div id="user_queue" class="runway_item"></div>');
                    if (App.usersinfo[i]['name'] === 'Demo User') {
                        runway.select("#user_name").html(fict_name);
                        runway.select("#user_email").html(fict_email);
                    } else {
                        runway.select("#user_name").html(App.usersinfo[i]['name']);
                        runway.select("#user_email").html(App.usersinfo[i]['email']);
                    }
                    if (App.usersinfo[i]['picture'] !== undefined) {
                        runway.select("#user_pic").attr("src", App.usersinfo[i]['picture']);
                    } else {
                        runway.select("#user_pic").attr("src", "/static/images/default_user_pic.jpg");
                    }
                });
                d3.selectAll(".runway").style("display","block");
            }

            if (App.version < 0) {
                d3.select("#greetings").style("display", null);
                return;
            }
            $("#loader").css("display", "block");

            // fetch all email files
            d3.select("#loader").html('Downloading emails to browser.. 0%');
            $("#loader").css("display", "block");
            var versions_done = 0;
            var allemails = [];
            if(!App.usersinfo){//alert("version"+App.version);
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
                                        App.db[0] = VMail.DB.setupDB(App.userinfo, allemails, stats, univ_data);
                                        console.log("done setting up the db");
                                        if (App.working == 1) {
                                            $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
                                        } else {
                                            $("#loader").css("display", "none");
                                        }
                                        $("#runway").css("display", "none");
                                        d3.selectAll(".runway").style("display","none");
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
            else{
                var theVersion = App.version;
//                for(var k=0; k<1; k++){
//                    App.version = theVersion;
//                    for(var i in d3.range(App.version + 1))
//                    $.post("/getemails/"+i+"&json="+App.usersinfo[k].email) //contact.name
//                         .success(function (emails) {
//                                allemails = allemails.concat(emails);
//                            }
//                         )
//                         .complete(function(){
//                             versions_done++;
//                            $("#loader").html('Downloading email metadata to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
//                            console.log('Downloading emails to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
//                            if (versions_done === App.version + 1) {
//                                console.log("fetching of emails files done!!");
//                                d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
//                                d3.json("/getstats", function (error, stats) {
//                                    App.db = new Array(App.usersinfo.length);
//                                    App.db[k] = VMail.DB.setupDB(App.usersinfo[k], allemails, stats);
//                                    console.log("done setting up the db");
//                                    if (App.working == 1) {
//                                        $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
//                                    } else {
//                                        $("#loader").css("display", "none");
//                                    }
//                                    $("#runway").css("display", "none");
//                                    dataIsShown = true;
//                                    showData();
//                                    sendStatsToServer();
//                                });
//                            }
//                         });
                    App.db = new Array(App.usersinfo.length);
                    d3.range(App.usersinfo.length).forEach(function (k) {
                        
                        
                        var time = 0;
                        if(k != 0) time = 10000*(k);
                        
                        setTimeout(function(){
                            versions_done = 0;
                            var allemails = [];
                            $.ajax({
    //                            type: "POST",
                                dataType: "json",
                                url: "/getversion/&json=" + App.usersinfo[k].email,
                                cache: true,
                                success: function (returned_version) {
                                    App.version = returned_version;//alert("returned version "+returned_version);

                                    d3.range(App.version + 1).forEach(function (i) {
                                    $.ajax({
            //                            type: "POST",
                                        dataType: "json",
                                        url: "/getemails/" + i + "&json=" + App.usersinfo[k].email,
                                        cache: true,
                                        complete: function () {
                                            versions_done++;console.log(k);
                                            var process = Math.floor((100 * versions_done) / (App.version + 1));
                                            $("#loader").html('Downloading email metadata to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
                                            d3.select("body").select("#runway_" + k).select("#user_fetchedcount").html(process + "% fetched");
                                            console.log('Downloading emails to browser.. ' + Math.floor((100 * versions_done) / (App.version + 1)) + "%");
                                            if (versions_done === App.version + 1) {
                                                console.log("fetching of emails files done!!");
                                                d3.select("body").select("#runway_" + k).select("#user_fetchedcount").html("Done");
                                                d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
                                                d3.json("/getstats/" + "json=" + App.usersinfo[k].email, function (error, stats) {//console.log(stats);
                                                    App.db[k] = VMail.DB.setupDB(App.usersinfo[k], allemails, stats, univ_data);//console.log(App.db[k]);
//                                                    setTimeout(function(){
                                                        console.log("done setting up the db");
                                                        if (App.working == 1) {
                                                            $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
                                                        } else if(k == App.db.length - 1){
                                                            $("#loader").css("display", "none");
                                                        }
                                                        if(k == App.db.length - 1){ $("#runway").css("display", "none"); d3.selectAll(".runway").style("display","none");}
                                                        dataIsShown = true;
                                                        sendStatsToServer(k);
                                                        if(k == App.usersinfo.length-1){
                                                            showData();
                                                            initAnalysisCharts();
                                                        }
//                                                    }, 500);
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
                        }, time);
                    });
            }
        });
    })(VMail.App || (VMail.App = {}));
    var App = VMail.App;
})(VMail || (VMail = {}));
//# sourceMappingURL=app.js.map
