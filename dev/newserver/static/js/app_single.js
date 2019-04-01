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
        var NNODES_PRECOMPUTE = 400;
        //default network viz parameters
        var NNODES_DEFAULT = 200;
        var CHARGE_DEFAULT = -1200;
        
        

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

        App.isWithinRange = true;
        App.isContactDetails = false;
        App.isUserStats = true;
        App.wasUserStats = true;

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
            
            if(the_one_node.owns.length > 1){
                var connection_score = new Array(the_one_node.owns.length);
                for(var t=0;t<connection_score.length;t++){
                    var contactDetails = (App.db[t].getContactDetails(start, end));
                    var the_id = node.owns_ids[node.owns.indexOf(t)];
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
                    var tt = connection_score[t].ind;
                    if(the_one_node.owns.indexOf(tt) != -1){
                        ContactInfo(tt, t+1);
                    }
                });
            }
            else{
                d3.range(App.db.length).forEach(function (t){
                    if(the_one_node.owns.indexOf(t) != -1){
                        ContactInfo(t, 1);
                    }
                });
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
                    container.append("div").attr("id","contact_"+rank).html('<b><i>' + rank + '. ' + ((App.usersinfo)? App.usersinfo[t].name:App.userinfo.name) + '</i></b>')
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
                            });
                    container.append("div").attr("id","for_select_"+rank).attr("class","contact_rank").attr("class","contact_"+rank).html('<b>First email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id].firstEmail)) + " ago").attr("id", "firstemail");
                    container.append("hr").attr("class","contact_rank").attr("class","contact_"+rank);
                    container.append("div").attr("class","contact_rank").attr("class","contact_"+rank).html('<b>Last email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id].lastEmail)) + " ago");

                    var details = contactDetails[the_id];
                    if (details === undefined) {
                        return;
                    }
                    container.append("hr").attr("class","contact_rank").attr("class","contact_"+rank);
                    container.append("div").attr("class","contact_rank").attr("class","contact_"+rank).html("<b>Sent (private):</b>  " + numParser(details.nSentEmails) + "  (" + numParser(details.nSentEmailsPvt) + ")");
                    container.append("hr").attr("class","contact_rank").attr("class","contact_"+rank);
                    container.append("div").attr("class","contact_rank").attr("class","contact_"+rank).html("<b>Received (private):</b>  " + numParser(details.nRcvEmails) + "  (" + numParser(details.nRcvEmailsPvt) + ")");
                    container.append("hr").attr("class","contact_rank").attr("class","contact_"+rank);

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

                    container.append("div").attr("class","contact_rank").attr("class","contact_"+rank).html("<b>Interaction volume</b>");
                    histSettings.position = container.append("div").attr("class","contact_rank").attr("class","contact_"+rank);
                    container.selectAll(".contact_"+rank).style("display","none");
                }
                else{
//                    container.append("div").html('<b><i>with ' + ((App.usersinfo)? App.usersinfo[t].name:App.userinfo.name) + '</i></b>');
                    container.append("div").html('<b>First email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id].firstEmail)) + " ago").attr("id", "firstemail");
                    container.append("hr");
                    container.append("div").html('<b>Last email:</b> ' + longAgo(new Date(), (App.db[t].contactDetails[the_id].lastEmail)) + " ago");

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
                    $('#contactDetails').fadeIn();
                }
                else{
                    $('#userinfopanel').hide();
                    $('#contactDetails').fadeIn();//commented below
                }
                container.append("div").attr("id", "person_name_right")
                        .attr("height",document.getElementById("person_name_left").offsetHeight+"px")
                        .append("a").attr("href","#").attr("id","invite").text("Invite")
                        .on("click",function(){
                            $.post('/invite_name', { 'json': JSON.stringify(contact.aliases[contact.aliases.length-1]) }) //contact.name
                             .success(function(){
                                 alert("Invite " + contact.name + " for a joined network");
                                 window.location.replace("/invite_name");
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
                    for(var t in (App.db)){
                        for (var id in (App.db[t].contacts)) {
                            var contact = (App.db[t].contacts[id]);
                            if (contact.name.toLowerCase().indexOf(term) !== -1) {
                                results.push({ label: contact.name, value: contact.id });
                            }
                        }
                    }
                    results.sort(function (a, b) {
                        var idx1 = a.label.toLowerCase().indexOf(term);
                        var idx2 = b.label.toLowerCase().indexOf(term);
                        if (idx1 === 0) {
                            if (idx2 === 0) {
                                return getScore((App.db[0].contacts[b.value])) - getScore((App.db[0].contacts[a.value]));
                            } else {
                                return -1;
                            }
                        } else {
                            if (idx2 === 0) {
                                return 1;
                            } else {
                                return getScore((App.db[0].contacts[b.value])) - getScore((App.db[0].contacts[a.value]));
                            }
                        }
                        return a.label.toLowerCase().indexOf(term) - b.label.toLowerCase().indexOf(term);
                    });

                    //limit results to 15
                    response(results.slice(0, 15));
                },
                focus: function (event, ui) {
                    event.preventDefault();
                    if (focusedNode !== null) {
                        App.viz.mouseoutNode(focusedNode);
                        focusedNode = null;
                    }
                    var nodes = App.graph.nodes.filter(function (node) {
                        return !node.skip && node.id === ui.item.value;
                    });
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
                    var nodes = App.graph.nodes.filter(function (node) {
                        return !node.skip && node.id === ui.item.value;
                    });
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
                step: 5,
                slide: function (event, ui) {
                    nlinks = ui.value;
                    updateNetwork(false);
                },
                change: function (event, ui) {
                    nlinks = ui.value;
                    updateNetwork(false);
                }
            });
        };

        var initNetworkSliders = function () {
            $("#slider-charge").slider({
                //range: "min",
                min: -2400, //5000
                max: 0,
                value: CHARGE_DEFAULT,
                step: 100,
                slide: function (event, ui) {
                    App.viz.settings.forceParameters.charge = ui.value;

                    //updateNetwork(false);
                    App.viz.draw();
                    //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
                }
            });

            $("#slider-nodes").slider({
                //range: "min",
                min: 0,
                max: NNODES_PRECOMPUTE,
                value: NNODES_DEFAULT,
                step: 5,
                slide: function (event, ui) {
                    nnodes = ui.value;
                    updateNetwork(false);
                },
                change: function (event, ui) {
                    nnodes = ui.value;
                    updateNetwork(false);
                    //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
                }
            });

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

        var updateNetwork = function (induceNetwork) {
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
                App.graph = VMail.Graph.induceNetwork(App.db, NNODES_PRECOMPUTE, start, end);
                initLinksSlider();
            }
            VMail.Graph.filterNodes(App.graph, function (nodeAttr, idx) {
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
            var nodeRadius = d3.scale.linear().range([3, 50]).domain(sizeExtent);
            var linkSizeExtent = d3.extent(App.graph.links, function (link) {
                return link.attr.weight;
            });
            var linkWidth = d3.scale.linear().range([1, 12]).domain(linkSizeExtent);

            App.viz.settings.nodeSizeFunc = function (attr) {
                return nodeRadius(attr.size);
            };
            App.viz.settings.linkSizeFunc = function (attr) {
                return linkWidth(attr.weight);
            };

            //viz.settings.nodeSizeFunc = null;
            App.viz.updateNetwork(App.graph);
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
                updateNetwork(true);
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
                updateNetwork(true);
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
                updateNetwork(true);
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
                updateNetwork(true);
                if (!App.isContactDetails && !App.isUserStats) {
                    showTopContacts(NTOPCONTACTS);
                }
                if (App.isContactDetails) {
                    showContactDetails(the_one_node, currentContact, start, end);
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
                    updateNetwork(true);
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
                    var panel = d3.select("#rightcolumn").append("div").attr("class","userinfopanel").style("height","94px");

                    panel.on("mouseover",function(){
                        d3.selectAll(".userinfopanel").selectAll("*").style("opacity", 0.2)
                          .style("-webkit-transition", "opacity 0.3s ease-in-out")
                          .style("-moz-transition", "opacity 0.3s ease-in-out");
                        d3.select(this).selectAll("*").style("opacity", 1);

                        d3.selectAll(".node").style("opacity",function(){
                            var node_id = parseInt(d3.select(this).attr("id"));
                            for(var ii = 0; ii < App.graph.nodes.length; ii++){
                                if(node_id == parseInt(App.graph.nodes[ii].id)){
                                    if(App.graph.nodes[ii].owns.indexOf(t) != -1){
                                        //here
                                        var the_id = App.graph.nodes[ii].owns_ids[App.graph.nodes[ii].owns.indexOf(t)];
                                        if(App.db[t].contactDetails[the_id].firstEmail > end) return 0.2;
                                        return 1;
                                    }
                                    break;
                                }
                            }
                            return 0.2;
                        });
                    })
                    .on("mouseout",function(){
                        d3.selectAll(".userinfopanel").selectAll("*").style("opacity", 1);
                        d3.selectAll(".node").style("opacity",1);
                    });
                    panel.append("div").attr("id","name").attr("class","person_name")
                        .html(App.usersinfo[t]['given_name'] + " " + App.usersinfo[t]['family_name']);

                    panel.append("div").attr("class","leftstack").append("img").attr("id","userpic").attr("class","userpic_circle");
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
        
        var updateData = function () {
            $("#data").fadeIn();

            //d3.select("#data").style("display",null);
            //setting up the in-memory database with the fetched server data
            //db = VMail.DB.setupDB(json);
            var init_start = App.db[0].emails[0].timestamp;
            for(var t = 0; t < App.db.length; t++){
                if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
//                if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
            }
            start = new Date((init_start) * 1000);
            end = new Date();

            //populate the left column with some basic info and aggregate statistics
            initBasicInfo((App.db[0]).aliases, App.userinfo);

            //setup the setttings for the network vizualization
            //var sizeExtent = d3.extent(graph.nodes, function(node) { return node.attr.size; });
            //var nodeRadius = d3.scale.linear().range([5, 20]).domain(sizeExtent);
            var color = d3.scale.category10();
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
                    charge: CHARGE_DEFAULT,
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
                linkSizeFunc: null,
                colorFunc: function (attr) {
                    return color(attr.color);
                },
                clickHandler: function (node) {
                    if (node === null) {
                        if (App.wasUserStats)
                            App.toggleinfo(true, false);
                        else
                            App.toggleinfo(false, true);
                    } else {
                        showContactDetails(node, node.attr.contact, start, end);
                    }
                }
            };

            //initialize slider
            initTimeSlider();
            initNetworkSliders();
        };
        
        var showData = function () {
            $("#data").fadeIn();

            //d3.select("#data").style("display",null);
            //setting up the in-memory database with the fetched server data
            //db = VMail.DB.setupDB(json);
            var init_start = App.db[0].emails[0].timestamp;
            for(var t = 0; t < App.db.length; t++){
                if(App.db[t].emails[0].timestamp < init_start){ init_start = App.db[t].emails[0].timestamp; }
//                if(App.db[t].emails[App.db[t].emails.length - 1].timestamp > init_end){ init_end = App.db[t].emails[App.db[t].emails.length - 1].timestamp; }
            }
            start = new Date((init_start) * 1000);
            end = new Date();

            //populate the left column with some basic info and aggregate statistics
            initBasicInfo((App.db[0]).aliases, App.userinfo);

            //setup the setttings for the network vizualization
            //var sizeExtent = d3.extent(graph.nodes, function(node) { return node.attr.size; });
            //var nodeRadius = d3.scale.linear().range([5, 20]).domain(sizeExtent);
            var color = d3.scale.category10();
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
                    charge: CHARGE_DEFAULT,
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
                linkSizeFunc: null,
                colorFunc: function (attr) {
                    return color(attr.color);
                },
                clickHandler: function (node) {
                    if (node === null) {
                        if (App.wasUserStats)
                            App.toggleinfo(true, false);
                        else
                            App.toggleinfo(false, true);
                    } else {
                        showContactDetails(node, node.attr.contact, start, end);
                    }
                }
            };

            //initialize slider
            initTimeSlider();
            initNetworkSliders();

            //vizualize the network
            App.viz = new VMail.Viz.NetworkViz(settings, false);
            updateNetwork(true);

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

        var nscheduled = null;
        var queuesize = null;
        $(document).ready(function () {
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
            $('#slider-range').css("width", $(window).width() - $('#rightcolumn').width() - 40 - 30 - 21);
            App.toggleinfo(true, false);

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
                                if (versions_done === App.version + 1) {//console.log(allemails);
                                    console.log("fetching of emails files done!!");
                                    d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
                                    d3.json("/getstats/&", function (error, stats) {
    //                                    App.db = VMail.DB.setupDB(App.userinfo, allemails, stats);
                                        App.db = new Array(1);
                                        App.db[0] = VMail.DB.setupDB(App.userinfo, allemails, stats);
                                        console.log("done setting up the db");
                                        if (App.working == 1) {
                                            $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.');
                                        } else {
                                            $("#loader").css("display", "none");
                                        }
                                        $("#runway").css("display", "none");
                                        d3.selectAll(".runway").style("display","none");
                                        dataIsShown = true;//console.log(App.db[0]);
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
                                                    App.db[k] = VMail.DB.setupDB(App.usersinfo[k], allemails, stats);//console.log(App.db[k]);
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
                                                    }
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
