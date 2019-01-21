var VMail;
(function (VMail) {
    (function (DB) {
        var InMemoryDB = (function () {
            // ########################################
            function InMemoryDB(emails, contacts, aliases, stats) {
                this.start = 0;
                this.end = emails.length;
                this.emails = emails;
                this.contacts = contacts;
                this.aliases = aliases;
                this.contactDetails = this.getContactDetails();
                var tmp = InMemoryDB.getNSentRcvEmails(emails);
                this.nSent = tmp[0];

                //this.nSentScore = d3.bisectLeft(stats['nsent'], this.nSent)/stats['nsent'].length * 100;
                this.nRcv = tmp[1];

                //this.nRcvScore = d3.bisectLeft(stats['nrcv'], this.nRcv)/stats['nrcv'].length * 100;
                this.nCollaborators = InMemoryDB.getNumberOfContacts(contacts);

                //this.nCollaboratorsScore = d3.bisectLeft(stats['ncollaborators'], this.nCollaborators)/stats['ncollaborators'].length * 100;
                this.myReplyTimes = InMemoryDB.getReplyTimes(true, emails);
                this.othersReplyTimes = InMemoryDB.getReplyTimes(false, emails);
            }
            InMemoryDB.prototype.getTopContacts = function (topN, start, end, ascending) {
                var contactDetails = this.getContactDetails(start, end);
                var p = -3;
                var getScores = function (a) {
                    if (contactDetails[a.id] === undefined) {
                        return null;
                    }
                    return [Math.pow((Math.pow(contactDetails[a.id].nRcvEmails, p) + Math.pow(contactDetails[a.id].nSentEmails, p)) / 2.0, 1.0 / p)];
                };
                return this.getRanking(topN, getScores, ascending);
            };

            InMemoryDB.getNumberOfContacts = function (contacts) {
                var ncontacts = 0;
                for (var cid in contacts) {
                    var contact = contacts[cid];
                    if (Math.min(contact["rcv"], contact["sent"]) >= 3) {
                        ncontacts += 1;
                    }
                }
                return ncontacts;
            };

            InMemoryDB.prototype.getContactDetails = function (start, end) {
                //var emails = db.getEmails();
                var contactDetails = [];
                if (start === undefined) {
                    start = new Date(this.emails[0].timestamp * 1000);
                }
                if (end === undefined) {
                    //don't use end = new Date() since some emails might have a timestamp in the future
                    end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                }
                var startt = +start; 
                var endt = +end;
                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var time = this.emails[i].timestamp * 1000;
                    if (time < startt || time > endt) {
                        continue;
                    }
                    
                    //var isSent = (ev.f == undefined);
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (!isSent && this.isContact(ev.source)) {
                        var a = ev.source.toString();
                        if (contactDetails[a] === undefined) {
                            contactDetails[a] = {
                                id: a,
                                nRcvEmails: 0,
                                nSentEmails: 0,
                                nRcvEmailsPvt: 0,
                                nSentEmailsPvt: 0,
                                nSentEmailsNorm: 0,
                                nRcvEmailsNorm: 0,
                                firstEmail: new Date(ev.timestamp * 1000),
                                lastEmail: undefined
                            };
                        }
                        contactDetails[a].nRcvEmails += 1;
                        contactDetails[a].nRcvEmailsNorm += 1.0 / (ev.destinations.length + 1);
                        contactDetails[a].lastEmail = new Date(ev.timestamp * 1000);
                        if (ev.destinations.length === 0) {
                            contactDetails[a].nRcvEmailsPvt += 1;
                        }
                    }
                    for (var j = 0; j < ev.destinations.length; j++) {
                        var b = ev.destinations[j].toString();
                        if (!this.isContact(b)) {
                            continue;
                        }
                        if (contactDetails[b] === undefined) {
                            contactDetails[b] = {
                                id: b,
                                nRcvEmails: 0,
                                nSentEmails: 0,
                                nRcvEmailsPvt: 0,
                                nSentEmailsPvt: 0,
                                nSentEmailsNorm: 0,
                                nRcvEmailsNorm: 0,
                                firstEmail: new Date(ev.timestamp * 1000),
                                lastEmail: undefined
                            };
                        }
                        if (isSent) {
                            contactDetails[b].lastEmail = new Date(ev.timestamp * 1000);
                            contactDetails[b].nSentEmails += 1;
                            contactDetails[b].nSentEmailsNorm += 1.0 / ev.destinations.length;
                        }
                    }
                    if (isSent && this.isContact(b) && ev.destinations.length === 1) {
                        b = ev.destinations[0].toString();
                        contactDetails[b].nSentEmailsPvt += 1;
                    }
                }
                return contactDetails;
            };

            InMemoryDB.prototype.getEmailDatesSent = function () {
                var dates = [];

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (isSent) {
                        dates.push({ date: new Date(ev.timestamp * 1000), weight: 1.0 });
                    }
                }
                return dates;
            };

            InMemoryDB.prototype.getEmailDatesRcv = function () {
                var dates = [];

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (!isSent) {
                        dates.push({ date: new Date(ev.timestamp * 1000), weight: 1.0 });
                    }
                }
                return dates;
            };

            InMemoryDB.prototype.getEmailDatesByContact = function (contact) {
                var dates = [];

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];

                    //var isSent = (ev.f == undefined);
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (isSent) {
                        for (var j = 0; j < ev.destinations.length; j++) {
                            if (ev.destinations[j].toString() === contact.id) {
                                var weight = 1.0;
                                dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                            }
                        }
                    } else if (ev.source.toString() === contact.id) {
                        var weight = 1.0;
                        dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                    }
                }
                return dates;
            };

            InMemoryDB.prototype.buildIntroductionTrees = function () {
                var nodes = [];

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isRcv = (ev.hasOwnProperty('source'));

                    if (isRcv) {
                        var a = ev.source.toString();
                        if (!this.isContact(a)) {
                            continue;
                        }
                        var score = Math.min(this.contactDetails[a].nRcvEmails, this.contactDetails[a].nSentEmails);
                        if (score < 1) {
                            continue;
                        }
                        if (nodes[a] === undefined) {
                            nodes[a] = { contact: this.contacts[a] };
                        }
                    }
                    for (var j = 0; j < ev.destinations.length; j++) {
                        var b = ev.destinations[j].toString();
                        if (!this.isContact(b)) {
                            continue;
                        }
                        var score = Math.min(this.contactDetails[b].nRcvEmails, this.contactDetails[b].nSentEmails);
                        if (score < 1) {
                            continue;
                        }
                        if (nodes[b] === undefined) {
                            nodes[b] = { contact: this.contacts[b] };
                            if (isRcv) {
                                if (nodes[a].children === undefined) {
                                    nodes[a].children = [];
                                }
                                nodes[a].children.push(nodes[b]);
                                nodes[b].father = nodes[a];
                            }
                        }
                    }
                }
                return nodes;
            };

            InMemoryDB.prototype.isContact = function (id) {
                if (isNaN(id))
                    return false;

                //var score = Math.min(this.contactDetails[id].nRcvEmails, this.contactDetails[id].nSentEmails);
                //return score >=1;
                return true;
            };

            InMemoryDB.prototype.getTimestampsFromContact = function (contact) {
                var res = [];
                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isRcv = (ev.hasOwnProperty('source'));
                    if (isRcv) {
                        var a = ev.source.toString();
                        if (a === contact.id) {
                            res.push(ev.timestamp);
                        }
                    } else {
                        for (var j = 0; j < ev.destinations.length; j++) {
                            var b = ev.destinations[j].toString();
                            if (b === contact.id) {
                                res.push(ev.timestamp);
                                break;
                            }
                        }
                    }
                }
                return res;
            };

            InMemoryDB.getNSentRcvEmails = function (emails) {
                var countSent = 0;
                var countRcv = 0;
                for (var i = 0; i < emails.length; i++) {
                    var ev = emails[i];
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (isSent) {
                        countSent++;
                    } else {
                        countRcv++;
                    }
                }
                return [countSent, countRcv];
            };

            InMemoryDB.prototype.getNormCommunicationVariance = function (contact) {
                console.log(contact.name + "-------------------------------------");
                var times = this.getTimestampsFromContact(contact);

                for (var i = 0; i < times.length; i++) {
                    times[i] /= 1000000;
                }
                for (var k = 1; k < 100; k++) {
                    var assignment = new Array(times.length);

                    //initialize centroids
                    var centroid = new Array(k);
                    for (var j = 0; j < k; j++) {
                        var randint = Math.floor(Math.random() * times.length);
                        centroid[j] = times[randint];
                    }

                    //initialize centroids size
                    var npoints = new Array(k);
                    for (var iter = 0; iter < 100; iter++) {
                        var centroid2 = new Array(k);
                        for (var j = 0; j < k; j++) {
                            centroid2[j] = 0;
                            npoints[j] = 0;
                        }

                        for (var i = 0; i < times.length; i++) {
                            var minDist = 2000000000;
                            var minIdx = -1;
                            for (var j = 0; j < k; j++) {
                                // compute distance between point i and centroid j
                                var dist = Math.abs(times[i] - centroid[j]);
                                if (dist < minDist) {
                                    minDist = dist;
                                    minIdx = j;
                                }
                            }

                            //assign point i to cluster minIdx
                            assignment[i] = minIdx;
                            centroid2[minIdx] += times[i];
                            npoints[minIdx] += 1;
                        }
                        for (var j = 0; j < k; j++) {
                            if (npoints[j] === 0) {
                                var randint = Math.floor(Math.random() * times.length);
                                centroid[j] = times[randint];
                            } else {
                                centroid[j] = centroid2[j] / npoints[j];
                            }
                        }
                    }

                    // compute within clusters variance
                    var clusterVariance = new Array(k);
                    for (var j = 0; j < k; j++) {
                        clusterVariance[j] = 0;
                    }

                    for (var i = 0; i < times.length; i++) {
                        clusterVariance[assignment[i]] += Math.pow(times[i] - centroid[assignment[i]], 2);
                    }
                    for (var j = 0; j < k; j++) {
                        clusterVariance[j] /= npoints[j];
                    }
                    var wcv = 0;
                    for (var j = 0; j < k; j++) {
                        wcv += clusterVariance[j];
                    }

                    //compute between clusters variance
                    var mean = 0;
                    for (var j = 0; j < k; j++) {
                        mean += centroid[j];
                    }
                    mean /= k;
                    var bcv = 0;
                    for (var j = 0; j < k; j++) {
                        bcv += Math.pow(centroid[j] - mean, 2);
                    }
                    bcv /= k;
                    console.log(k + " : " + (Math.sqrt(bcv) + Math.sqrt(wcv)));
                }
                return 0;
            };

            InMemoryDB.getReplyTimes = function (my, emails) {
                var replyDict = {};
                var allTimes = [];
                var pastYearTimes = [];
                var pastMonthTimes = [];
                var pastWeekTimes = [];

                // timestamps should always be seconds since the epoch
                var pastYear_ts = (+d3.time.year.offset(new Date(), -1)) / 1000;
                var pastMonth_ts = (+d3.time.month.offset(new Date(), -1)) / 1000;
                var pastWeek_ts = (+d3.time.week.offset(new Date(), -1)) / 1000;

                for (var i = 0; i < emails.length; i++) {
                    var ev = emails[i];
                    var isFirst = (ev.hasOwnProperty('source'));
                    if (!my) {
                        isFirst = !isFirst;
                    }
                    if (isFirst && !(ev.threadid in replyDict)) {
                        replyDict[ev.threadid] = ev.timestamp;
                    } else if (!isFirst && ev.threadid in replyDict && replyDict[ev.threadid] !== false) {
                        var ts = replyDict[ev.threadid];
                        var diffSec = ev.timestamp - ts;
                        allTimes.push(diffSec);
                        if (ts > pastYear_ts) {
                            pastYearTimes.push(diffSec);
                        }
                        if (ts > pastMonth_ts) {
                            pastMonthTimes.push(diffSec);
                        }
                        if (ts > pastWeek_ts) {
                            pastWeekTimes.push(diffSec);
                        }
                        replyDict[ev.threadid] = false;
                    }
                }
                return { 'all': allTimes, 'pastYear': pastYearTimes, 'pastMonth': pastMonthTimes, 'pastWeek': pastWeekTimes };
            };

            InMemoryDB.prototype.getCommunicationVariance = function (contact) {
                var times = this.getTimestampsFromContact(contact);

                // compute the average
                var mean = 0;
                for (var i = 0; i < times.length; i++) {
                    mean += (times[i] / 1000000) / times.length;
                }
                var variance = 0;
                for (var i = 0; i < times.length; i++) {
                    variance += Math.pow(times[i] / 1000000 - mean, 2) / times.length;
                }
                return Math.sqrt(variance);
            };

            InMemoryDB.prototype.getTimestampsNewContacts = function () {
                var seen = [];
                var dates = [];

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isRcv = (ev.hasOwnProperty('source'));
                    if (isRcv && this.isContact(ev.source)) {
                        if (seen[ev.source] === undefined) {
                            dates.push({ date: new Date(ev.timestamp * 1000), weight: 1.0 });
                            seen[ev.source] = true;
                        }
                    }
                    if (!isRcv) {
                        for (var j = 0; j < ev.destinations.length; j++) {
                            var b = ev.destinations[j].toString();
                            if (this.isContact(b)) {
                                if (seen[b] === undefined) {
                                    dates.push({ date: new Date(ev.timestamp * 1000), weight: 1.0 });
                                    seen[b] = true;
                                }
                            }
                        }
                    }
                }
                return dates;
            };

            InMemoryDB.prototype.getIntroductions = function (contact) {
                var father = [];
                var seen = [];
                var children = [];

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isRcv = (ev.hasOwnProperty('source'));
                    if (isRcv) {
                        var a = ev.source.toString();
                        if (!this.isContact(a)) {
                            continue;
                        }
                        seen[a] = true;
                    }
                    for (var j = 0; j < ev.destinations.length; j++) {
                        var b = ev.destinations[j].toString();
                        if (!this.isContact(b)) {
                            continue;
                        }
                        if (seen[b] === undefined && isRcv) {
                            father[b] = this.contacts[ev.source.toString()];
                        }
                        if (isRcv && ev.source.toString() === contact.id) {
                            if (seen[b] === undefined) {
                                var score = Math.min(this.contactDetails[b].nRcvEmails, this.contactDetails[b].nSentEmails);
                                if (score >= 1) {
                                    children.push(this.contacts[b]);
                                }
                            }
                        }
                        seen[b] = true;
                    }
                }
                var id = contact.id;
                var fathers = [];
                while (father[id] !== undefined) {
                    fathers.push(father[id]);
                    id = father[id];
                }
                return { children: children, fathers: fathers };
            };

            InMemoryDB.prototype.getRanking = function (topN, getScores, ascending) {
                var results = [];
                for (var id in this.contacts) {
                    var contact = this.contacts[id];
                    var scores = getScores(contact);
                    if (scores === null) {
                        continue;
                    }
                    results.push({ contact: contact, scores: scores });
                }
                var comp = function (a, b) {
                    for (var i = 0; i < a.scores.length; i++) {
                        if (a.scores[i] !== b.scores[i]) {
                            return b.scores[i] - a.scores[i];
                        }
                    }
                    return 0;
                };
                results.sort(comp);
                if (ascending) {
                    results.reverse();
                }
                return results.slice(0, topN);
            };
            return InMemoryDB;
        })();
        DB.InMemoryDB = InMemoryDB;

        function normalizeName(name, email) {
            if (name instanceof Array) {
                if (name.length > 0) {
                    name = name[0];
                } else {
                    name = "";
                }
            }

            // trim and strip off ' and "
            name = name.trim().replace("'", '').replace('"', '');

            // strip off the text between parenthesis, i.e. (some text)
            name = name.replace(/\(.*\)/, "").trim().toLowerCase();

            // strip and convert email to lowercase
            email = email.trim().toLowerCase();
            if (name === "" || name === email) {
                return email;
            }
            if (name.indexOf(",") !== -1) {
                var ss = name.split(",");
                var first = ss[ss.length - 1].trim().toTitleCase();
                var last = ss[0].trim().toTitleCase();
            } else {
                var ss = name.split(/\s+/);
                if (ss.length === 1) {
                    return ss[0].trim().toTitleCase();
                }
                var first = ss[0].trim().toTitleCase();
                var last = ss[ss.length - 1].trim().toTitleCase();
            }
            return first + " " + last;
        }

        function setupDB(userinfo, rawemails, stats) {//alert("rawemails"+rawemails.length);
            var today = (+new Date()) / 1000 + 60 * 60 * 24 * 2;
            var beginning = (+new Date(2004, 3, 1)) / 1000;
//            console.log(rawemails);
            //sort emails by timestamp
            var emails = [];//console.log(rawemails);
            for (var i = 0; i < rawemails.length; i++) {
                if (rawemails[i] instanceof Array) {
                    var email = {};
                    if (rawemails[i] == undefined || !(rawemails[i] instanceof Array) || rawemails[i].length < 2) {
                        continue;
                    }
                    var prefixheader = rawemails[i][0];
                    var thridStart = prefixheader.indexOf("X-GM-THRID ");
                    if (thridStart >= 0) {
                        var thridEnd = prefixheader.indexOf(" ", thridStart + 11);
                        var thrid = prefixheader.substring(thridStart + 11, thridEnd);
                        email.threadid = thrid;
                    }
                    if (prefixheader.indexOf("\\\\Sent") >= 0) {
                        email.isSent = true;
                    } else {
                        email.isSent = false;
                    }

                    var rawemail = rawemails[i][1];
                    var headerRegExp = /^(.+): ((.|\r\n\s)+)\r\n/mg;
                    var h;
                    while (h = headerRegExp.exec(rawemail)) {
                        if (h[1].toLowerCase() === "date") {
                            email.dateField = (+new Date(h[2])) / 1000;
                        }
                        if (h[1].toLowerCase() === "from") {
                            var tmp = parser(h[2]);
                            if (tmp[0] === undefined || tmp[0].address === undefined) {
                                continue;
                            }
                            if (tmp[0].name === undefined) {
                                tmp[0].name = tmp[0].address;
                            }
                            if (tmp[0].name.indexOf("=?") === 0) {
                                tmp[0].name = tmp[0].address;
                            }
                            email.fromField = [tmp[0].name, tmp[0].address];
                        }
                        if (h[1].toLowerCase() === "to") {
                            var tmp = parser(h[2]);
                            email.toField = [];
                            tmp.forEach(function (t) {
                                if (t === undefined || t.address === undefined) {
                                    return;
                                }
                                if (t.name === undefined) {
                                    t.name = t.address;
                                }
                                if (t.name.indexOf("=?") === 0) {
                                    t.name = t.address;
                                }
                                email.toField.push([t.name, t.address]);
                            });
                        }
                        if (h[1].toLowerCase() === "cc") {
                            var tmp = parser(h[2]);
                            email.ccField = [];
                            tmp.forEach(function (t) {
                                if (t === undefined || t.address === undefined) {
                                    return;
                                }
                                if (t.name === undefined) {
                                    t.name = t.address;
                                }
                                if (t.name.indexOf("=?") === 0) {
                                    t.name = t.address;
                                }
                                email.ccField.push([t.name, t.address]);
                            });
                        }
                    }
                    if (email.fromField === undefined || email.fromField === '' || email.dateField === undefined || email.dateField > today || email.dateField < beginning) {
                        continue;
                    }
                    if (email.toField === undefined) {
                        email.toField = [];
                    }
                    if (email.ccField === undefined) {
                        email.ccField = [];
                    }
                    emails.push(email);
                } else if (rawemails[i] !== null) { // && rawemails[i].auto !== true
//                    rawemails[i].isSent = (rawemails[i].fromField[0] == VMail.App.userinfo.name? true:false);
                    if(VMail.App.userinfo.name == "John Podesta"){
                        if(rawemails[i].fromField instanceof Array) rawemails[i].fromField = [rawemails[i].fromField[0], rawemails[i].fromField[0]];
                        else rawemails[i].fromField = [rawemails[i].fromField, rawemails[i].fromField];

                        rawemails[i].toField = [[rawemails[i].toField[0], rawemails[i].toField[0]]];

                        var the_ccField = new Array(rawemails[i].ccField.length);
                        for(var h=0; h<rawemails[i].ccField.length; h++){
                            the_ccField[h] = [rawemails[i].ccField[h], rawemails[i].ccField[h]];
                        }
                        rawemails[i].ccField = the_ccField;
                        
                        rawemails[i].isSent = (rawemails[i].fromField[0] == "John Podesta"? true:false);

                        rawemails[i].dateField = parseInt(rawemails[i].dateField);

                        rawemails[i].threadid = i;
                    }
                    else{
                        if(rawemails[i].ccField[0][0] == "ccPlaceholder") rawemails[i].ccField = [];
                        
                        if(VMail.App.userinfo.name == "Hillary Clinton"){
                            if(rawemails[i].fromField[0] != "Hillary Clinton" && rawemails[i].toField[0][0] != "Hillary Clinton") 
                                rawemails[i].ccField == [["Hillary Clinton", "Hillary Clinton"]];
                            if(rawemails[i].fromField[0] instanceof Array){
                                continue;
                            }
                        }
                        
                        rawemails[i].isSent = (rawemails[i].fromField[0] == "Hillary Clinton"? true:false);

                        rawemails[i].dateField = parseInt(rawemails[i].dateField);

                        rawemails[i].threadid = i;
                    }
                    
                    
//                    if(rawemails[i].ccField[0]){ //rawemails[i].ccField = [[rawemails[i].ccField[0], rawemails[i].ccField[0]]];
//                        if(rawemails[i].ccField[0].length != 2)
//                            rawemails[i].ccField = [[rawemails[i].ccField[0], rawemails[i].ccField[0]]];   
//                    }
//                    else rawemails[i].ccField = undefined;
                    emails.push(rawemails[i]);
                }
            }console.log(emails);
            emails.sort(function (a, b) {
                return a.dateField - b.dateField;
            });

            var person_name = [""];
            if (userinfo['name'] !== undefined) {
                person_name = userinfo['name'].split(/\s+/);
            }
            if (person_name.length === 1) {
                userinfo['name'] = person_name[0].trim().toTitleCase();
            } else {
                userinfo['name'] = person_name[0].trim().toTitleCase() + " " + person_name[person_name.length - 1].trim().toTitleCase();
            }

            // find the person's email aliases by going through the sent emails and reading the 'from' field
            var my = {};
            emails.forEach(function (email) {
                if (email.isSent) {
                    my[email.fromField[1]] = true;
                }
            });

            // normalize data
            emails.forEach(function (mail) {
                mail.fromField = [normalizeName(mail.fromField[0], mail.fromField[1]), mail.fromField[1].trim().toLowerCase()];

                for (var i = 0; i < mail.toField.length; i++) {
                    mail.toField[i] = [
                        normalizeName(mail.toField[i][0], mail.toField[i][1]),
                        mail.toField[i][1].trim().toLowerCase()];
                }
                if (mail.ccField !== undefined) {
                    for (var i = 0; i < mail.ccField.length; i++) {
                        mail.ccField[i] = [
                            normalizeName(mail.ccField[i][0], mail.ccField[i][1]),
                            mail.ccField[i][1].trim().toLowerCase()];
                    }
                } else {
                    mail.ccField = [];
                }

                // add more aliases if they match the person's name
                var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                addrs.forEach(function (addr) {
                    var name = addr[0];
                    var email = addr[1];
                    if (email in my) {
                        return;
                    }
                    if (name === userinfo['name']) {
                        my[email] = true;
                    }
                });
            });//console.log(my);

            //DONE normalizing data
            // assign each email address a unique name
            var email_to_name = {};
            emails.forEach(function (mail) {
//                if(mail.fromField.indexOf("gkarthik505@gmail.com")!=-1&&mail.ccField.indexOf("nuriahidalgo@gmail.com")!=-1) console.log(mail);
                var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                addrs.forEach(function (addr) {
                    var name = addr[0];
                    var email = addr[1];
                    if (email in my) {
                        return;
                    }

                    //if its the first time we see this email
                    if (!(email in email_to_name)) {//if hillary name not in addrs, then not count any one in addr as a contact
                        email_to_name[email] = name;
                    }

                    // overwrite the name if the previous name is the same as email or he is the sender
                    if (name !== email && (email_to_name[email] === email || email === mail.fromField[1])) {
                        email_to_name[email] = name;
                    }
                });
            });

            // DONE assign each email address a unique name
            // assign each name a unique contact with all the email addresses
            var uniqid = 0;
            var contacts = {};
            var name_to_id = {};

            for (var email in email_to_name) {
                var name = email_to_name[email];
                if (!(name in name_to_id)) {
                    name_to_id[name] = uniqid.toString();
                    contacts[uniqid.toString()] = { 'name': name, 'aliases': [], 'sent': 0, 'rcv': 0, 'id': uniqid.toString() };
                    uniqid++;
                }
                contacts[name_to_id[name]]['aliases'].push(email);
            }

            // calculate the no. of sent and rcv for each unique contact
            emails.forEach(function (mail) {
                var a = mail.fromField[1];
                if (mail.isSent) {
                    var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                    addrs.forEach(function (addr) {
                        var b_name = addr[0];
                        var b = addr[1];
                        if (b in email_to_name) {
                            contacts[name_to_id[email_to_name[b]]]['sent']++;
                        }
                    });
                } else {//if hillary not in addrs, then not count as rcv
                    if (a in email_to_name) {
                        contacts[name_to_id[email_to_name[a]]]['rcv']++;
                    }
                }
            });

            for (var name in name_to_id) {
                var id = name_to_id[name];
                var contact = contacts[id];
                if (Math.min(contact['sent'], contact['rcv']) < 0) {
                    contact['aliases'].forEach(function (email) {
                        delete email_to_name[email];
                    });
                    delete contacts[id];
                }
            }

            // make the events list
            var events = [];
            emails.forEach(function (mail) {
                var a = mail.fromField[1];
                var tmp = [];
                var addrs = mail.toField.concat(mail.ccField);//if(addrs.length>1) console.log(addrs);
                addrs.forEach(function (addr) {
                    var b_name = addr[0];
                    var b = addr[1];
                    if (b !== a && !(b == VMail.App.userinfo.name || b == VMail.App.userinfo.name.toLowerCase())) {
                        if (b in email_to_name) {
                            var id = name_to_id[email_to_name[b]];
                        } else {
                            var id = b;
                        }
                        tmp.push(id.toString());
                    }
                });
                if (mail.isSent) {
                    events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'destinations': tmp });
                } else {
                    if (a in email_to_name) {
                        var id = name_to_id[email_to_name[a]];
                    } else if(!(a == VMail.App.userinfo.name || a == VMail.App.userinfo.name.toLowerCase())){
                        var id = a;
                    } //if(tmp.length!=0) console.log(tmp);
                    events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source': id, 'destinations': tmp });
                }
            });
            return new InMemoryDB(events, contacts, Object.keys(my), stats);
        }
        DB.setupDB = setupDB;
    })(VMail.DB || (VMail.DB = {}));
    var DB = VMail.DB;
})(VMail || (VMail = {}));


String.prototype.toTitleCase = function () {
    var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|vs?\.?|via)$/i;

    return this.replace(/([^\W_]+[^\s-]*) */g, function (match, p1, index, title) {
        if (index > 0 && index + p1.length !== title.length && p1.search(smallWords) > -1 && title.charAt(index - 2) !== ":" && title.charAt(index - 1).search(/[^\s-]/) < 0) {
            return match.toLowerCase();
        }

        if (p1.substr(1).search(/[A-Z]|\../) > -1) {
            return match;
        }

        return match.charAt(0).toUpperCase() + match.substr(1);
    });
};
//# sourceMappingURL=db.js.map
