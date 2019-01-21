/// <reference path="d3.d.ts" />
/// <reference path="jquery.d.ts" />
/// <reference path="jqueryui.d.ts" />

declare var canvg: any;
declare var myIFrame: any;

interface JQuery {
  tipsy: any;
}

interface Node {
  innerHTML: any;
}

declare module D3 {
  interface Event {
    stopPropagation: any;
  }
}

//Presentation Layout module
module VMail.App {

// ********** CONSTANTS **********
var FRICTION = 0.5;
var LINKDISTANCE = 50;
var NTOPCONTACTS = 15;
//number of nodes to precompute graph for
var NNODES_PRECOMPUTE = 200;
//default network viz parameters
var NNODES_DEFAULT = 100;
var CHARGE_DEFAULT = -2500;
//***********************************

var fict_names = ['Tony Stark', 'Lex Luthor', 'Will Hunting', 'Howard Wolowitz'];
var fict_name = fict_names[Math.floor(Math.random()*fict_names.length)];
var fict_email = fict_name.split(" ")[0].toLowerCase() + "@fict.mit.edu";
//In-memory database object holding all the contacts and emails,
// visible to outside for debuging purposes (e.g. testing in browser console)
export var db: VMail.DB.InMemoryDB = null;
export var userinfo = null;
export var version = null;
export var working = null;
export var aliases = null;
// ****** CURRENT STATE OF PRESENTATION LAYER *********
export var viz: VMail.Viz.NetworkViz = null;
export var graph: VMail.Graph.IGraph = null;

export var isWithinRange = true; // used by rankings
export var isContactDetails = false; // true is showing details for a contact
export var isUserStats = true; // true if showing aggregated user statistics
export var wasUserStats = true;

var currentContact: VMail.DB.IContact = undefined;
//current dates of the range
var start = undefined;
var end = undefined;
//current number of nodes
var nnodes = NNODES_DEFAULT;
var nlinks = 1000000000;
//*****************************************************

var timedelta = (seconds : number) => {
  var minutes = seconds/60;
  var hours = minutes/60;
  var days = hours/24;
  var months = days/30.42; // source: wolframalpha.com
  var years = days/365;
  return {
    seconds: seconds,
    minutes: minutes,
    hours: hours,
    days: days,
    months: months,
    years: years
  }
}

// calcualtes the timespan between two dates
var timespan = (a: Date, b: Date) => {
  return (a.getTime() - b.getTime())/1000;
};


var longAgo = (a: Date, b: Date) : string => {
  return timespanPretty(timespan(a,b));
};

// returns the timespan between the two dates in human-friendly format
var timespanPretty = (seconds: number) => {
  var diff = timedelta(seconds);
  var result = "";
  var postfix = "";
  if(diff.seconds < 70) {
    result = diff.seconds.toFixed(1);
    postfix = "second";
  } else if(diff.minutes < 70) {
    result = diff.minutes.toFixed(1);
    postfix = "minute";
  } else if(diff.hours < 24) {
    result = diff.hours.toFixed(1);
    postfix = "hour";
  } else if(diff.days < 61) {
    result = diff.days.toFixed(1);
    postfix = "day";
  } else if(diff.months < 12) {
    result = diff.months.toFixed(1);
    postfix = "month";
  } else {
    result = diff.years.toFixed(1);
    postfix = "year";
  }
  if(parseFloat(result) > 1) { postfix+="s"}
  return result + " " + postfix;
};

// show a list of the topN contacts on the page using only information
//(emails) between start and end date
var showTopContacts = (topN:number) => {
  //update the UI state
  isContactDetails = false;
  isUserStats = false;
  wasUserStats = false;

  if(!isWithinRange) {
    $('#allTimesLink').addClass('selectedlink')
    $('#thisYearLink').removeClass('selectedlink')
  } else {
    $('#allTimesLink').removeClass('selectedlink')
    $('#thisYearLink').addClass('selectedlink')
  }
  var container = d3.select("#rankings-content");
  container.html('');

  //retrieve topN contacts from the database
  if(!isWithinRange) {
    var topContacts = db.getTopContacts(topN, undefined, undefined);
  } else {
    var topContacts = db.getTopContacts(topN, start, end);
  }

  container = container.append("table").attr("class", "ranking");
  topContacts.forEach((value, i) => {
    var contact = value.contact;
    var tr = container.append("tr").style("cursor","pointer")
      .on("mouseover", () => {
        var nodes = graph.nodes.filter((node: VMail.Graph.INode) => { return !node.skip && node.id === contact.id});
        if(nodes.length === 0) { return;}
        viz.mouseoverNode(nodes[0]);
      })
      .on("mouseout", () => {
        var nodes = graph.nodes.filter((node: VMail.Graph.INode) => { return !node.skip && node.id === contact.id});
        if(nodes.length === 0) { return;}
        viz.mouseoutNode(nodes[0]);
      })
      .on("click", () => {
        var nodes = graph.nodes.filter((node: VMail.Graph.INode) => { return !node.skip && node.id === contact.id});
        if(nodes.length === 0) { return;}
        viz.clickNode(nodes[0]);
      })
    //tr.append("td").style("background","#ccc").html(i+1);
    tr.append("td").attr("class", "num").html(i+1);
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
var showContactDetails = (contact: VMail.DB.IContact, start?:Date, end?:Date) => {
    currentContact = contact;
    isContactDetails = true;
    isUserStats = false;

    //retrieve the details object from the database
    var contactDetails = db.getContactDetails(start, end);
    var container = d3.select("#contactDetails-content").html('');
    var content = '';
    contact.aliases.forEach((alias) => {
      content += "<div>" + alias + "</div>";
    });
    
    $(container.append("div").html(contact.name)
    .attr("class","person_name")
    .attr('title','').node())
    .tooltip({ content: content });
  
    container.append("div").html('<b>First email:</b> ' + longAgo(new Date(), db.contactDetails[contact.id].firstEmail) + " ago").attr("id", "firstemail");
    container.append("hr");
    container.append("div").html('<b>Last email:</b> ' + longAgo(new Date(), db.contactDetails[contact.id].lastEmail) + " ago");

    var details = contactDetails[contact.id];
    if (details === undefined) {
      return;
    }
    container.append("hr");
    container.append("div").html("<b>Sent (private):</b>  " + numParser(details.nSentEmails) + "  (" + numParser(details.nSentEmailsPvt) + ")")
    container.append("hr");
    container.append("div").html("<b>Received (private):</b>  " + numParser(details.nRcvEmails) + "  (" + numParser(details.nRcvEmailsPvt) + ")")
    container.append("hr");


    //retrieve a list of timestamps of emails exchanged with this particular contact
    var timestamps = db.getEmailDatesByContact(contact);

    var a = +start;
    var b = +end;

    //settings for the histogram of interaction volume
    var histSettings = {
      width:280,
      height:150,
      start: start,
      end: end,
      interval: d3.time.month,
      ylabel: '',//# of emails exchanged',
      position:undefined,
      dateformat: "%b \n \n %y",
      nTicks:5,
      prediction:false
    };

    container.append("div").html("<b>Interaction volume</b>");
    histSettings.position = container.append("div");
    //plot a histogram with the interaction volume
    VMail.Viz.plotTimeHistogram(timestamps, histSettings);

    container.append("hr");

    //retrieve introduction information from the database for this contact
    var introductions = db.getIntroductions(contact);
    //list of contacts we introduced
    var children = introductions.children;
    //list of contacts this contact was introduced by sorted in chronological order
    var fathers = introductions.fathers;
    var tmpstr = "<b>Introduced you to:</b><br/><br/>";
    children.forEach((contact) => { tmpstr += "- "+contact.name + "<br/>"});
    if(tmpstr == "<b>Introduced you to:</b><br/><br/>") tmpstr+= "None<br/><br/>";
    container.append("div").html(tmpstr);
    container.append("hr");

    var tmpstr = "<b>Introduced by:</b><br/><br/>";
    fathers.forEach((contact) => { tmpstr += "- "+contact.name + "<br/>"});
    if(tmpstr == "<b>Introduced by:</b><br/><br/>") tmpstr+= "None<br/><br/>";
    container.append("div").html(tmpstr);

    //switch to 'contact details' view
    $('#user_stats').hide();
    $('#rankings').hide();
    $('#userinfopanel').hide();
    $('#contactDetails').fadeIn();
};

// auto-complete search box allowing searching for contacts
var initSearchBox = () => {
  var p = -3;
  var getScore = (a: VMail.DB.IContact) => {
        return Math.pow((Math.pow(a.rcv,p) +
                    Math.pow(a.sent,p))/2.0,1.0/p);
  }

  var focusedNode = null;
  var clickedNode = null;
  $("#searchContacts").autocomplete({
      minLength:2,
      source: ( request, response ) => {
          var term = request.term.toLowerCase();
          var results: { label: string; value: string;}[] = [];
          for(var id in db.contacts) {
            var contact = db.contacts[id];
            if (contact.name.toLowerCase().indexOf(term) !== -1) {
              results.push({label:contact.name, value: contact.id });
            }
          }
          results.sort((a,b) => {
            var idx1 = a.label.toLowerCase().indexOf(term);
            var idx2 = b.label.toLowerCase().indexOf(term);
            if(idx1 === 0) {
              if(idx2 === 0) {
                return getScore(db.contacts[b.value]) - getScore(db.contacts[a.value]);
              } else {
                return -1;
              }
            } else {
              if(idx2 === 0) {
                return 1;
              } else {
                return getScore(db.contacts[b.value]) - getScore(db.contacts[a.value]);
              }
            }
            return a.label.toLowerCase().indexOf(term) - b.label.toLowerCase().indexOf(term);
          });
          //limit results to 15
          response(results.slice(0,15));
      },
      focus: function( event, ui ) {
        event.preventDefault();
        if(focusedNode !== null) {
          viz.mouseoutNode(focusedNode);
          focusedNode = null;
        }
        var nodes = graph.nodes.filter((node: VMail.Graph.INode) => { return !node.skip && node.id === ui.item.value});
        if(nodes.length === 0) { return;}
        else { $(".tipsy").remove(); }
        viz.mouseoverNode(nodes[0]);
        focusedNode = nodes[0];
      },
      select: ( event, ui ) => {
        event.preventDefault();
        if(focusedNode !== null) {
          viz.mouseoutNode(focusedNode);
          focusedNode = null;
        }
        var nodes = graph.nodes.filter((node: VMail.Graph.INode) => { return !node.skip && node.id === ui.item.value});
        if(nodes.length === 0) {console.log("node not in graph!"); return;}
        viz.clickNode(nodes[0]);
        clickedNode = nodes[0];
      },
      //make sure the search box is on top of everything else
      open: function(event, ui) {
        //add tooltips
        $('ul.ui-autocomplete a').tipsy({gravity: 'w', title: () => { return 'Contact not in time range'}});
        $(this).autocomplete('widget').css('z-index', 10000);
        return false;
      }
  });
}


//call this only after you have induced a new network
var initLinksSlider = () => {
  nlinks = graph.links.length;
  if($("#slider-links").slider()) {
    $("#slider-links").slider("destroy");
  }
  $("#slider-links").slider({
      //range: "min",
      min: 0,
      max: graph.links.length,
      value: nlinks,
      step:5,
      slide: ( event, ui ) => {
        nlinks = ui.value;
        updateNetwork(false);
      },
      change: ( event, ui ) => {
        nlinks = ui.value;
        updateNetwork(false);
      }
  });
}

var initNetworkSliders = () => {
  $("#slider-charge").slider({
      //range: "min",
      min: -5000,
      max: 0,
      value: CHARGE_DEFAULT ,
      step:100,
      slide: ( event, ui ) => {
        viz.settings.forceParameters.charge = ui.value;
        //updateNetwork(false);
        viz.draw();
        //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
      }
  });

  $("#slider-nodes").slider({
      //range: "min",
      min: 0,
      max: NNODES_PRECOMPUTE,
      value: NNODES_DEFAULT,
      step:5,
      slide: ( event, ui ) => {
        nnodes = ui.value;
        updateNetwork(false);
      },
      change: ( event, ui ) => {
        nnodes = ui.value;
        updateNetwork(false);
        //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
      }
  });

  //var inc = function(slider) {slider.slider("value", slider.slider("value") - slider.slider("option","step"));};
  //var dec = (slider) => {slider.slider("value", slider.slider("value") - slider.slider("option","step"));};
  //nodes binding
  $(document).bind('keydown.a', () => {
    var slider = $("#slider-nodes");
    slider.slider("value", slider.slider("value") - slider.slider("option","step"));
  });

  $(document).bind('keydown.s', () => {
    var slider = $("#slider-nodes");
    slider.slider("value", slider.slider("value") + slider.slider("option","step"));
  });

  //links binding
  $(document).bind('keydown.q', () => {
    var slider = $("#slider-links");
    slider.slider("value", slider.slider("value") - slider.slider("option","step")*2);
  });
  $(document).bind('keydown.w', () => {
    var slider = $("#slider-links");
    slider.slider("value", slider.slider("value") + slider.slider("option","step"));
  });

  $(document).bind('keydown.f', () => {
    viz.draw();
    //setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 3000)
  });

  $(document).bind('keydown.t', () => {
    viz.toggleLabelVisibility();
  });

}

var updateNetwork = (induceNetwork: boolean) => {
  if(induceNetwork) {
    ////generate a network out of email data
    graph = VMail.Graph.induceNetwork(db, NNODES_PRECOMPUTE, start, end);
    initLinksSlider();
  }
  VMail.Graph.filterNodes(graph, (nodeAttr, idx:number) => { return idx < nnodes});
  VMail.Graph.filterLinks(graph, (linkAttr, idx:number) => { return idx < nlinks});
  //run community detection on the network
  VMail.Graph.communityDetection(graph);
  var sizeExtent = d3.extent(graph.nodes, function(node) { return node.attr.size; });
  var nodeRadius = d3.scale.linear().range([3, 50]).domain(sizeExtent);
  var linkSizeExtent = d3.extent(graph.links, function(link) { return link.attr.weight; });
  var linkWidth = d3.scale.linear().range([1, 12]).domain(linkSizeExtent);

  viz.settings.nodeSizeFunc = (attr) => { return nodeRadius(attr.size)};
  viz.settings.linkSizeFunc = (attr) => { return linkWidth(attr.weight)};
  //viz.settings.nodeSizeFunc = null;
  viz.updateNetwork(graph);
  //if(!viz.guestbook) {
  //  setTimeout(function(){ viz.clustercolors = true; viz.recolorNodes();}, 5000)
  //}
}

// slider where users selects time-sliced view of the data
var initTimeSlider = () => {

  $("#slider-ytd").click(() => {
    var c = db.emails[db.emails.length -1].timestamp * 1000;
    end = new Date(c);
    start = d3.time.year.offset(end, -1);
    $("#slider-range").slider('option', "values", [+start, +end]);
    $('#slider-text').html(formatter(start) + " - " + formatter(end));
    $('#slider-duration').html(longAgo(end, start));
    updateNetwork(true);
    if(!isContactDetails && !isUserStats) {
      showTopContacts(NTOPCONTACTS);
    }
    if(isContactDetails) {
      showContactDetails(currentContact, start, end);
    }
  });

  $("#slider-all").click(() => {
    var a = db.emails[0].timestamp*1000;
    //var b = +new Date(2005,0,1);
    start = new Date(a);
    var c = db.emails[db.emails.length -1].timestamp * 1000;
    end = new Date(c);
    $("#slider-range").slider('option', "values", [+start, +end]);
    $('#slider-text').html(formatter(start) + " - " + formatter(end));
    $('#slider-duration').html(longAgo(end, start));
    updateNetwork(true);
    if(!isContactDetails && !isUserStats) {
      showTopContacts(NTOPCONTACTS);
    }
    if(isContactDetails) {
      showContactDetails(currentContact, start, end);
    }
  });

  $("#slider-pastmonth").click(() => {
    var c = db.emails[db.emails.length -1].timestamp * 1000;
    end = new Date(c);
    start = d3.time.month.offset(end, -1);
    $("#slider-range").slider('option', "values", [+start, +end]);
    $("#slider-range").slider('values', 1, c);
    $('#slider-text').html(formatter(start) + " - " + formatter(end));
    $('#slider-duration').html(longAgo(end, start));
    updateNetwork(true);
    if(!isContactDetails && !isUserStats) {
      showTopContacts(NTOPCONTACTS);
    }
    if(isContactDetails) {
      showContactDetails(currentContact, start, end);
    }
  });

    $("#slider-pastweek").click(() => {
    var c = db.emails[db.emails.length -1].timestamp * 1000;
    end = new Date(c);
    start = d3.time.week.offset(end, -1);
    $("#slider-range").slider('option', "values", [+start, +end]);
    $("#slider-range").slider('values', 1, c);
    $('#slider-text').html(formatter(start) + " - " + formatter(end));
    $('#slider-duration').html(longAgo(end, start));
    updateNetwork(true);
    if(!isContactDetails && !isUserStats) {
      showTopContacts(NTOPCONTACTS);
    }
    if(isContactDetails) {
      showContactDetails(currentContact, start, end);
    }
  });



  // date formatter for the slider text
  var formatter = d3.time.format('%d %b %Y');
  var a = db.emails[0].timestamp*1000;
  //var b = +new Date(2005,0,1);
  var c = db.emails[db.emails.length -1].timestamp * 1000;
  start = new Date(a);
  end = new Date(c);
  //initialize the slider text
  $('#slider-text').html(formatter(start) + " - " + formatter(end));
  $('#slider-duration').html(longAgo(end, start));
  //initialize the slider
  $( "#slider-range" ).slider({
    range: true,
    min: a,
    max: c,
    values: [a , c],

    slide: ( event, ui ) => {
      start = new Date(ui.values[0])
      end = new Date(ui.values[1])
      $('#slider-text').html(formatter(start) + " - " + formatter(end));
      $('#slider-duration').html(longAgo(end, start));
    },

    change: ( event, ui ) => {
      start = new Date(ui.values[0])
      end = new Date(ui.values[1])
      updateNetwork(true);
      if(!isContactDetails && !isUserStats) {
        showTopContacts(NTOPCONTACTS);
      }
      if(isContactDetails) {
        showContactDetails(currentContact, start, end);
      }
    },
  });
}

//populate the left column with some basic info and aggregate statistics
var initBasicInfo = (aliases, userinfo) => {
  var column = d3.select("#userinfopanel");
  //show user's name and all aliases in tooltip
  var content = ""; 
  if(userinfo['name'] === 'Demo User') {
    $("#name").html(fict_name);
    content = "<div>" + fict_email + "</div>";
  } else {
    $("#name").html(userinfo['given_name'] + " " + userinfo['family_name']);
    aliases.forEach((alias) => {
      content += "<div>" + alias + "</div>";
    });
  }
  

  
  $("#name").attr("title",'').tooltip({ content: content });
  //show user's picture
  if (userinfo['picture'] !== undefined) {
    $("#userpic").attr("src", userinfo['picture']);
  } else {
    $("#userpic").attr("src", "/static/images/default_user_pic.jpg");
  }

  //get the total number of email contacts
  $('#ncontacts').html(numParser(db.nCollaborators) + ' collaborators');
  $('#totalemails').html(numParser(db.emails.length)+ ' emails');
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
}

var numParser = function(num) {
  var digits = num.toString().split("");
  var len = digits.length;
  var commas = 0;
  if(len>3) {
      if(len%3 == 0)
        commas = (len/3)-1;
      else
        commas = Math.floor(len/3);
      for(var i=0; i<commas; i++) {
        digits.splice(len-(3*(i+1)), 0, ',');
      }
      return digits.join("");
  }
  else return num;
}

export var snapshot = (notext: boolean) => {
  $('#loader').html("Taking a snapshot of your network...")
  $('#loader').fadeIn('fast');
  if(notext) {
    d3.select("svg#network").selectAll("text").style("display", "none");
  }
  var html = d3.select("svg#network").node().parentNode.innerHTML;
  if(notext) {
    d3.select("svg#network").selectAll("text").style("display", null);
  }
  //var b64 = 'data:image/svg+xml;base64,' + Base64.encode(html);

  canvg('networkcanvas', html,  { renderCallback: function () {
    var canvas:any = document.getElementById('networkcanvas');
    var b64 = canvas.toDataURL("image/png");
    b64 = b64.substring(22);
    $.post('/snapshot', {'b64':b64}, function(response) {
      $('#loader').fadeOut();
      $('#open_snapshot').remove();
      jQuery('<a/>', {
        id: 'open_snapshot',
        href: response.url,
        target: '_blank',
        text: 'open shapshot'
      }).appendTo('#snapshot_holder');
      $('#open_snapshot').effect( "highlight", 1000); 
    });
  }});
}

var initHistograms = () => {
  var timestampsSent = db.getEmailDatesSent();
  var timestampsRcv = db.getEmailDatesRcv();
  var a = + new Date(db.emails[0].timestamp*1000);
  //var b = + new Date(2005,0,1);
  var histSettings = {
    width:250,
    height:150,
    start: new Date(a),
    end: new Date(),
    interval: d3.time.year,
    position:undefined,
    dateformat: "'%y",
    nTicks:5,
    prediction:true
  };
  var container = d3.select("#user_stats");
  histSettings.position = d3.select("#user_stats");

  //histSettings.ylabel = "Emails Sent";
  container.append("div").html("<b>Emails Sent</b>");
  VMail.Viz.plotTimeHistogram(timestampsSent, histSettings);

  //histSettings.ylabel="Emails Received";
  container.append("div").html("<b>Emails Received</b>");
  VMail.Viz.plotTimeHistogram(timestampsRcv, histSettings);

  var timestampsNewContacts = db.getTimestampsNewContacts()

  //histSettings.ylabel="New Collaborators";
  container.append("div").html("<b>New Collaborators</b>");
  VMail.Viz.plotTimeHistogram(timestampsNewContacts, histSettings);

}

export var toggleinfo = function(show_mystats, show_topcollab) {
  if(show_mystats) {
    //highlight the selected link
    $('#my_stats').addClass('selectedlink')
    $('#top_collaborators').removeClass('selectedlink')

    //hide rankings and contactDetails and show user_stats
    //update UI state
    isUserStats = true;
    wasUserStats = true;
    isContactDetails = false;
    $('#rankings').hide();
    $("#contactDetails").hide();
    $('#userinfopanel').fadeIn();
    $('#user_stats').fadeIn();
  }
  if(show_topcollab) {
    //highlight the selected link
    $('#top_collaborators').addClass('selectedlink')
    $('#my_stats').removeClass('selectedlink')

    //hide user_stats and contactDetails and show rankings
   //$("#contactDetails").fadeOut();
    //$('#user_stats').fadeOut(400, function() {
      showTopContacts(NTOPCONTACTS);
    //});
  }
}


var sendStatsToServer = () => {
  var data = {}
  data['ncollaborators'] = db.nCollaborators;
  data['nsent'] = db.nSent;
  data['nrcv'] = db.nRcv;
  
  // reply times
  var myReplyTimes = db.myReplyTimes;
  var othersReplyTimes = db.othersReplyTimes;
  data['replyTimesMedian'] = {
    'my': {
      'all': d3.median(myReplyTimes.all),
      'pastYear': d3.median(myReplyTimes.pastYear),
      'pastMonth': d3.median(myReplyTimes.pastMonth),
      'pastWeek' : d3.median(myReplyTimes.pastWeek)
    },
    'others': {
      'all': d3.median(othersReplyTimes.all),
      'pastYear': d3.median(othersReplyTimes.pastYear),
      'pastMonth': d3.median(othersReplyTimes.pastMonth),
      'pastWeek' : d3.median(othersReplyTimes.pastWeek)
    }
  };
  $.post('/sendstats', { 'json': JSON.stringify(data)});
}

// show initial data including our own details (left column),
// the unfiltered network (center column), and the ranking list (right column).
// This function gets called once the server has fetched the inital batch of emails
var showData = () => {
  $("#data").fadeIn();
  //d3.select("#data").style("display",null);
  //setting up the in-memory database with the fetched server data
  //db = VMail.DB.setupDB(json);
  start = new Date(db.emails[0].timestamp*1000);
  end = new Date();

  //populate the left column with some basic info and aggregate statistics
  initBasicInfo(db.aliases, userinfo);

  //setup the setttings for the network vizualization
  //var sizeExtent = d3.extent(graph.nodes, function(node) { return node.attr.size; });
  //var nodeRadius = d3.scale.linear().range([5, 20]).domain(sizeExtent);
  var color = d3.scale.category10();
  var settings = {
    svgHolder: "#network",
    size: {
      width: $('#centercolumn').width(),
      height: $(window).height()-50 //$('#centercolumn').height()-100
    },
    forceParameters: {
      friction: FRICTION,
      gravity: 0.9,
      linkDistance: LINKDISTANCE,
      charge: CHARGE_DEFAULT,
      live:true
    },
    nodeLabelFunc: (attr : any) : string => {
      var namefield = attr.contact.name;
      if(namefield.indexOf('@') >= 0) {
        return namefield.split('@')[0];
      } else {
        return namefield.split(' ')[0];
      }
    },

    nodeLabelFuncHover:(attr : any) : string => {
      var namefield = attr.contact.name;
      if(namefield.indexOf('@') >= 0) {
        return namefield.split('@')[0];
      } else {
        return namefield;
      }
    },
    nodeSizeFunc: null,//(attr) => {return nodeRadius(attr.size)},
    linkSizeFunc: null,
    colorFunc: (attr) => {return color(attr.color);},
    clickHandler: (node: VMail.Graph.INode) => {
      if (node === null) {if(wasUserStats) toggleinfo(true, false); else toggleinfo(false, true);}
      else { showContactDetails(node.attr.contact, start, end); }
    }
  };

  //initialize slider
  initTimeSlider();
  initNetworkSliders();

  //vizualize the network
  viz = new VMail.Viz.NetworkViz(settings, false);
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
  initHistograms();

  //show initial ranking
  //showTopContacts(NTOPCONTACTS, start, end)
  //setup click handlers for rankings
  $('#allTimesLink').click(() => {
    isWithinRange = false;
    showTopContacts(NTOPCONTACTS)
  });
  $('#thisYearLink').click(() => {
    isWithinRange = true;
    showTopContacts(NTOPCONTACTS);
  });
  //$('#seeRankingsLink').click(() => {
  //  showTopContacts(NTOPCONTACTS)
  //});
  //$("#loader").fadeOut();
};

var nscheduled = null;
var queuesize = null;
$(document).ready(() => {
  // setup logout links
  
  $("#logout_delete").click(() => {
    $('#loader').html('Logging out securely..');
    $('#loader').fadeIn('fast');
    if(typeof myIFrame !== 'undefined') {
      myIFrame.location.href='https://accounts.google.com/Logout';
    }
    setTimeout(function(){ window.location.href = '/logout?delete=1'}, 2000);
  });

  $("#logout_save").click(() => {
    $('#loader').html('Logging out securely..');
    $('#loader').fadeIn('fast');
    if(typeof myIFrame !== 'undefined') {
      myIFrame.location.href='https://accounts.google.com/Logout';
    }
    setTimeout(function(){ window.location.href = '/logout'}, 2000);
  });

  $('#email_net_notext_link').click(() => {VMail.App.snapshot(true);});
  $('#email_net_link').click(() => {VMail.App.snapshot(false);});
  //$('#rightcolumn').css("height", $(window).height()-10);

  $('#centercolumn').css("width", $(window).width() - $('#rightcolumn').width() - 40 - 30);
  $('#slider-range').css("width", $(window).width() - $('#rightcolumn').width() - 40 - 30 -21);
  toggleinfo(true, false);

  var dataIsShown = false;
  
  if(userinfo['name'] === 'Demo User') {
    d3.select("#user_name").html(fict_name);
    d3.select("#user_email").html(fict_email);
  } else {
    d3.select("#user_name").html(userinfo['name']);
    d3.select("#user_email").html(userinfo['email']);
  }
  if(userinfo['picture'] !== undefined) {
    $("#user_pic").attr("src", userinfo['picture']);
  } else {
    $("#user_pic").attr("src", "/static/images/default_user_pic.jpg");
  }
  $("#runway").css("display", "block");

  if(version < 0) {
    d3.select("#greetings").style("display", null);
    return;
  }
  $("#loader").css("display", "block");
  // fetch all email files
  d3.select("#loader").html('Downloading emails to browser.. 0%');
  $("#loader").css("display", "block");
  var versions_done = 0;
  var allemails = [];
  d3.range(version+1).forEach((i) => {
    $.ajax({
        dataType: "json",
        url: "/getemails/" + i,
        cache: true ,
        complete: () => {
          versions_done++;
          $("#loader").html('Downloading email metadata to browser.. ' + Math.floor((100*versions_done)/(version+1)) + "%");
          console.log('Downloading emails to browser.. ' + Math.floor((100*versions_done)/(version+1)) + "%");
          if(versions_done === version + 1) {
            console.log("fetching of emails files done!!");
            d3.select("#loader").html('Analyzing metadata. It might take up to a minute.');
            d3.json("/getstats", function(error, stats) {
              db = VMail.DB.setupDB(userinfo, allemails, stats);
              console.log("done setting up the db");
              if(working == 1) {
                $("#loader").html('Still collecting metadata. ' + numParser(allemails.length) + ' emails collected so far. Please <a href="javascript:location.reload()">refresh</a> occasionally.')
              } else {
                $("#loader").css("display", "none");
              }
              $("#runway").css("display", "none");
              dataIsShown = true;
              showData();
              sendStatsToServer();
            });
          }
        },
        success: (emails) => {allemails = allemails.concat(emails);}
    });
  });
    
});
} // END of module
