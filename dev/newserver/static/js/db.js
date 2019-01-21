var VMail;
(function (VMail) {
    (function (DB) {
        var InMemoryDB = (function () {
            // ########################################
            function InMemoryDB(emails, contacts, aliases, stats, response_time = null) {
                this.start = 0;
                this.end = emails.length;
                this.emails = emails;
                this.contacts = contacts;
                this.aliases = aliases;
                this.responseTime = response_time;
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

            InMemoryDB.getResponseTime = function (emails, userinfo) { //(emails)
                var response_time = {};
                var member_names = [];
                for(var k = 0; k < VMail.App.usersinfo.length; k++){
                    if(VMail.App.usersinfo[k].name != userinfo.name){
                        response_time[VMail.App.usersinfo[k].name] = [];
                        member_names.push(VMail.App.usersinfo[k].name);
                    }
                }
                emails.sort(function (a, b) {
                    return a.threadid - b.threadid;
                });
                // if (start === undefined) {
                //     start = new Date(this.emails[0].timestamp * 1000);
                // }
                // if (end === undefined) {
                //     //don't use end = new Date() since some emails might have a timestamp in the future
                //     end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                // }
                
                // //if timeline of this user not in seletced time, return empty list
                // if(end < this.emails[0].timestamp * 1000 || start > this.emails[this.emails.length - 1].timestamp * 1000) return [];
                // //adjust start nd end to match the user's timeline
                // if(start < this.emails[0].timestamp * 1000) start = new Date(this.emails[0].timestamp * 1000);
                // if(end > this.emails[this.emails.length - 1].timestamp * 1000) end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                
                // var startt = +start; 
                // var endt = +end;
                for (var i = 0; i < emails.length; i++) {
                // for (var i = this.start; i < this.end; i++) {
                    // var time = this.emails[i].timestamp * 1000;
                    // if (time < startt || time > endt) {
                    //     continue;
                    // }
                    // var time = emails[i].dateField * 1000;
                    // if(emails[i].ccField.length != 0) console.log(emails[i].ccField);
                    //find start and end email of the thread
                    var emails_in_a_thread = [];
                    var thread_start = i, thread_end = i;
                    while(thread_end < emails.length && emails[thread_end].threadid == emails[thread_start].threadid){
                        emails_in_a_thread.push(emails[thread_end]);
                        thread_end++;
                    }
                    i = thread_end;
                    //for emails in the same thread
                    //if the TO (m1) is a FROM in previous email in the thread 
                    //&& the FROM (m2) is in the TO or CC in the very previous email
                    //then compoute the response time from m2 to m1 and add to its array
                    //!! currently I collect the other members' response time to 'me' from 'my' emails

                    emails_in_a_thread.sort(function (a, b) {
                        return a.dateField - b.dateField;
                    });
                    //find first email in the thread that is from 'me'
                    var k = 0;
                    while(k < emails_in_a_thread.length && !emails_in_a_thread[k].isSent){
                        k++;
                    }
                    if(k == emails_in_a_thread.length) continue;

                    var the_thread_start = k;
                    for(var l = the_thread_start + 1; l < emails_in_a_thread.length; l++){
                        var ev = emails_in_a_thread[l];
                        var isSent = ev.isSent;
                        //if TO and FROM are both members: isSent and TO contains a member || !isSent FROM is a member and TO contains a member
                        if(!isSent && member_names.indexOf(ev.fromField[0]) != -1){
                            var next = 0;
                            // for(var p = 0; p < ev.toField.length; p++){
                            //     if(ev.toField[p][0] == userinfo.name){
                            //         next = 1;
                            //     }
                            // }
                            if(ev.toField[0] != undefined && (ev.toField[0][0] == userinfo.name || ev.toField[0][1] == userinfo.email)){
                                next = 1;
                            }
                            if(next == 1){
                                var ll = l - 1;
                                while(ll >= the_thread_start && !emails_in_a_thread[ll].isSent){
                                    ll--;
                                }
                                //can't find a email from 'me' before this email in the thread (which shouldn't be possible)
                                if(ll < the_thread_start){ console.log("not possible"); continue;}

                                var reply_timestamp = ev.dateField,
                                    sent_timestamp = emails_in_a_thread[ll].dateField;
                                // console.log(thread_start+" "+the_thread_start+" "+thread_end);
                                // console.log("one");console.log(emails[the_thread_start]);console.log(ev);console.log(emails[ll]);
                                response_time[ev.fromField[0]].push(Math.round((reply_timestamp - sent_timestamp) / 60));
                            }
                        }
                    }
                }
                return response_time;
            };

            InMemoryDB.getContactsResponseTime = function (emails, userinfo, contacts) { //how the contacts reply to me
                var response_time = {};
                var member_names = [];
                for(var k = 0; k < contacts.length; k++){
                    response_time[contacts[k].name] = [];
                    member_names.push(contacts[k].name);
                }
                emails.sort(function (a, b) {
                    return a.threadid - b.threadid;
                });
                // if (start === undefined) {
                //     start = new Date(this.emails[0].timestamp * 1000);
                // }
                // if (end === undefined) {
                //     //don't use end = new Date() since some emails might have a timestamp in the future
                //     end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                // }
                
                // //if timeline of this user not in seletced time, return empty list
                // if(end < this.emails[0].timestamp * 1000 || start > this.emails[this.emails.length - 1].timestamp * 1000) return [];
                // //adjust start nd end to match the user's timeline
                // if(start < this.emails[0].timestamp * 1000) start = new Date(this.emails[0].timestamp * 1000);
                // if(end > this.emails[this.emails.length - 1].timestamp * 1000) end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                
                // var startt = +start; 
                // var endt = +end;
                for (var i = 0; i < emails.length; i++) {
                // for (var i = this.start; i < this.end; i++) {
                    // var time = this.emails[i].timestamp * 1000;
                    // if (time < startt || time > endt) {
                    //     continue;
                    // }
                    // var time = emails[i].dateField * 1000;
                    // if(emails[i].ccField.length != 0) console.log(emails[i].ccField);
                    //find start and end email of the thread
                    var emails_in_a_thread = [];
                    var thread_start = i, thread_end = i;
                    while(thread_end < emails.length && emails[thread_end].threadid == emails[thread_start].threadid){
                        emails_in_a_thread.push(emails[thread_end]);
                        thread_end++;
                    }
                    i = thread_end;
                    //for emails in the same thread
                    //if the TO (m1) is a FROM in previous email in the thread 
                    //&& the FROM (m2) is in the TO or CC in the very previous email
                    //then compoute the response time from m2 to m1 and add to its array
                    //!! currently I collect the other members' response time to 'me' from 'my' emails

                    emails_in_a_thread.sort(function (a, b) {
                        return a.dateField - b.dateField;
                    });
                    //find first email in the thread that is from 'me'
                    var k = 0;
                    while(k < emails_in_a_thread.length && !emails_in_a_thread[k].isSent){
                        k++;
                    }
                    if(k == emails_in_a_thread.length) continue;

                    var the_thread_start = k;
                    for(var l = the_thread_start + 1; l < emails_in_a_thread.length; l++){
                        var ev = emails_in_a_thread[l];
                        var isSent = ev.isSent;
                        //if TO and FROM are both members: isSent and TO contains a member || !isSent FROM is a member and TO contains a member
                        if(!isSent && member_names.indexOf(ev.fromField[0]) != -1){
                            var next = 0;
                            // for(var p = 0; p < ev.toField.length; p++){
                            //     if(ev.toField[p][0] == userinfo.name){
                            //         next = 1;
                            //     }
                            // }
                            if(ev.toField[0] != undefined && (ev.toField[0][0] == userinfo.name || ev.toField[0][1] == userinfo.email)){
                                next = 1;
                            }
                            if(next == 1){
                                var ll = l - 1;
                                while(ll >= the_thread_start && !emails_in_a_thread[ll].isSent){
                                    ll--;
                                }
                                //can't find a email from 'me' before this email in the thread (which shouldn't be possible)
                                if(ll < the_thread_start){ console.log("not possible"); continue;}

                                var reply_timestamp = ev.dateField,
                                    sent_timestamp = emails_in_a_thread[ll].dateField;
                                // console.log(thread_start+" "+the_thread_start+" "+thread_end);
                                // console.log("one");console.log(emails[the_thread_start]);console.log(ev);console.log(emails[ll]);
                                response_time[ev.fromField[0]].push(Math.round((reply_timestamp - sent_timestamp) / 60));
                            }
                        }
                    }
                }
                return response_time;
            };

            InMemoryDB.getMyResponseTime = function (emails, userinfo, contacts) { //how I respond the contacts
                var response_time = {};
                var member_names = [];
                for(var k = 0; k < contacts.length; k++){
                    response_time[contacts[k].name] = [];
                    member_names.push(contacts[k].name);
                }
                emails.sort(function (a, b) {
                    return a.threadid - b.threadid;
                });
                for (var i = 0; i < emails.length; i++) {
                   var emails_in_a_thread = [];
                    var thread_start = i, thread_end = i;
                    while(thread_end < emails.length && emails[thread_end].threadid == emails[thread_start].threadid){
                        emails_in_a_thread.push(emails[thread_end]);
                        thread_end++;
                    }
                    i = thread_end;
                    //for emails in the same thread
                    //if the TO (m1) is a FROM in previous email in the thread 
                    //&& the FROM (m2) is in the TO or CC in the very previous email
                    //then compoute the response time from m2 to m1 and add to its array
                    //!! currently I collect the other members' response time to 'me' from 'my' emails

                    emails_in_a_thread.sort(function (a, b) {
                        return a.dateField - b.dateField;
                    });
                    //find first email in the thread that is from 'me'
                    var k = 0;
                    while(k < emails_in_a_thread.length && !emails_in_a_thread[k].isSent){
                        k++;
                    }
                    if(k == emails_in_a_thread.length) continue;

                    var the_thread_start = k;
                    for(var l = the_thread_start + 1; l < emails_in_a_thread.length; l++){
                        var ev = emails_in_a_thread[l];
                        var isSent = ev.isSent;
                        //if TO and FROM are both members: isSent and TO contains a member || !isSent FROM is a member and TO contains a member
                        // if(!isSent && member_names.indexOf(ev.fromField[0]) != -1){
                        if(isSent && ev.toField[0] != undefined && member_names.indexOf(ev.toField[0][0]) != -1){
                            var ll = l - 1;
                            while(ll >= the_thread_start && emails_in_a_thread[ll].isSent){
                                ll--;
                            }
                            //can't find a email from 'me' before this email in the thread (which shouldn't be possible)
                            if(ll < the_thread_start){ console.log("not possible"); continue;}

                            var reply_timestamp = ev.dateField,
                                sent_timestamp = emails_in_a_thread[ll].dateField;
                            response_time[ev.toField[0][0]].push(Math.round((reply_timestamp - sent_timestamp) / 60));
                        }
                    }
                }
                var responses = [];
                for(var name in response_time) responses = responses.concat(response_time[name]);
                return responses;
            };

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

            // InMemoryDB.prototype.getTopOrgs = function (topN, start, end, ascending) {
            //     var orgDetails = this.getOrgDetails(start, end);
            //     var p = -3;
            //     var getScores = function (a) {
            //         if (orgDetails[a.id] === undefined) {
            //             return null;
            //         }
            //         return [orgDetails[a.id].nRcvEmails];
            //     };
            //     return this.getRanking(topN, getScores, ascending);
            // };

            InMemoryDB.prototype.getTopContacts_multi = function (topN, start, end, ascending) {
                var contactDetails = this.getContactDetails(start, end);
                var p = -3;
                var getScores = function (a) {
                    if (contactDetails[a.id] === undefined) {
                        return null;
                    }
                    return [Math.pow((Math.pow(contactDetails[a.id].nRcvEmails, p) + Math.pow(contactDetails[a.id].nSentEmails, p)) / 2.0, 1.0 / p)];
                };
                var getSentRcv = function (a) {
                    if (contactDetails[a.id] === undefined) {
                        return null;
                    }
                    return {sent: contactDetails[a.id].nSentEmails, rcv: contactDetails[a.id].nRcvEmails};
                };
                return this.getRanking_multi(topN, getScores, getSentRcv, ascending);
            };

            InMemoryDB.prototype.getTopMemberContacts_multi = function (t, topN, start, end, ascending) {
                var contactDetails = this.getMemberContactDetails(t, start, end);
                var p = -3;
                var getScores = function (a) {
                    if (contactDetails[a.id] === undefined) {
                        return null;
                    }
                    return [Math.pow((Math.pow(contactDetails[a.id].nRcvEmails, p) + Math.pow(contactDetails[a.id].nSentEmails, p)) / 2.0, 1.0 / p)];
                };
                var getSentRcv = function (a) {
                    if (contactDetails[a.id] === undefined) {
                        return null;
                    }
                    return {sent: contactDetails[a.id].nSentEmails, rcv: contactDetails[a.id].nRcvEmails};
                };
                return this.getRanking_multi(topN, getScores, getSentRcv, ascending);
            };

            InMemoryDB.getNumberOfContacts = function (contacts) {
                var ncontacts = 0;
                for (var cid in contacts) {
                    var contact = contacts[cid];
                    if (Math.min(contact["rcv"], contact["sent"]) >= 3) {//threshold for contacts
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
                
                //if timeline of this user not in seletced time, return empty list
                if(end < this.emails[0].timestamp * 1000 || start > this.emails[this.emails.length - 1].timestamp * 1000) return [];
                //adjust start nd end to match the user's timeline
                if(start < this.emails[0].timestamp * 1000) start = new Date(this.emails[0].timestamp * 1000);
                if(end > this.emails[this.emails.length - 1].timestamp * 1000) end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                
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
                                lastEmail: undefined,
                                newEmails: 0 
                            };
                        }
                        contactDetails[a].nRcvEmails += 1;
                        contactDetails[a].nRcvEmailsNorm += 1.0 / (ev.destinations.length + 1);
                        contactDetails[a].lastEmail = new Date(ev.timestamp * 1000);
                        if (ev.destinations.length === 0) {
                            contactDetails[a].nRcvEmailsPvt += 1;
                        }
                        if(ev.flags.indexOf("Seen") != -1) contactDetails[a].newEmails += 1;
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
                                lastEmail: undefined,
                                newEmails: 0
                            };
                        }
                        if (isSent) {
                            contactDetails[b].lastEmail = new Date(ev.timestamp * 1000);
                            contactDetails[b].nSentEmails += 1;
                            contactDetails[b].nSentEmailsNorm += 1.0 / ev.destinations.length;
                        }
                    }
                    if (isSent && ev.destinations.length === 1 && this.isContact(ev.destinations[0].toString())) {
                        b = ev.destinations[0].toString();
                        contactDetails[b].nSentEmailsPvt += 1;
                    }
                }
                return contactDetails;
            };

            InMemoryDB.prototype.getMemberContactDetails = function (t, start, end) {
                //var emails = db.getEmails();
                var contactDetails = [];
                if (start === undefined) {
                    start = new Date(this.emails[0].timestamp * 1000);
                }
                if (end === undefined) {
                    //don't use end = new Date() since some emails might have a timestamp in the future
                    end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                }
                
                //if timeline of this user not in seletced time, return empty list
                if(end < this.emails[0].timestamp * 1000 || start > this.emails[this.emails.length - 1].timestamp * 1000) return [];
                //adjust start nd end to match the user's timeline
                if(start < this.emails[0].timestamp * 1000) start = new Date(this.emails[0].timestamp * 1000);
                if(end > this.emails[this.emails.length - 1].timestamp * 1000) end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                
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
                    if (!isSent && this.isMemberContact(t, ev.source)) {
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
                                lastEmail: undefined,
                                newEmails: 0 
                            };
                        }
                        contactDetails[a].nRcvEmails += 1;
                        contactDetails[a].nRcvEmailsNorm += 1.0 / (ev.destinations.length + 1);
                        contactDetails[a].lastEmail = new Date(ev.timestamp * 1000);
                        if (ev.destinations.length === 0) {
                            contactDetails[a].nRcvEmailsPvt += 1;
                        }
                        if(ev.flags.indexOf("Seen") != -1) contactDetails[a].newEmails += 1;
                    }
                    for (var j = 0; j < ev.destinations.length; j++) {
                        var b = ev.destinations[j].toString();
                        if (!this.isMemberContact(t, b)) {
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
                                lastEmail: undefined,
                                newEmails: 0
                            };
                        }
                        if (isSent) {
                            contactDetails[b].lastEmail = new Date(ev.timestamp * 1000);
                            contactDetails[b].nSentEmails += 1;
                            contactDetails[b].nSentEmailsNorm += 1.0 / ev.destinations.length;
                        }
                    }
                    if (isSent && ev.destinations.length === 1 && this.isMemberContact(t, ev.destinations[0].toString())) {
                        b = ev.destinations[0].toString();
                        contactDetails[b].nSentEmailsPvt += 1;
                    }
                }
                return contactDetails;
            };

            InMemoryDB.prototype.getOrgDetails = function (start, end) {
                //var emails = db.getEmails();
                var orgDetails = {};
                if (start === undefined) {
                    start = new Date(this.emails[0].timestamp * 1000);
                }
                if (end === undefined) {
                    //don't use end = new Date() since some emails might have a timestamp in the future
                    end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                }
                
                //if timeline of this user not in seletced time, return empty list
                if(end < this.emails[0].timestamp * 1000 || start > this.emails[this.emails.length - 1].timestamp * 1000) return [];
                //adjust start nd end to match the user's timeline
                if(start < this.emails[0].timestamp * 1000) start = new Date(this.emails[0].timestamp * 1000);
                if(end > this.emails[this.emails.length - 1].timestamp * 1000) end = new Date(this.emails[this.emails.length - 1].timestamp * 1000);
                
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
                        var a = VMail.App.domainToid[ev.source_org];
                        if(a != undefined){
                            if (orgDetails[a] === undefined) { 
                                orgDetails[a] = {
                                    id: a,
                                    nRcvEmails: 0,
                                    nSentEmails: 0,
                                    nRcvEmailsPvt: 0,
                                    nSentEmailsPvt: 0,
                                    nSentEmailsNorm: 0,
                                    nRcvEmailsNorm: 0,
                                    firstEmail: new Date(ev.timestamp * 1000),
                                    lastEmail: undefined,
                                    newEmails: 0 
                                };
                            }
                            orgDetails[a].nRcvEmails += 1;
                            orgDetails[a].nRcvEmailsNorm += 1.0 / (ev.destinations.length + 1);
                            orgDetails[a].lastEmail = new Date(ev.timestamp * 1000);
                            if (ev.destinations.length === 0) {
                                orgDetails[a].nRcvEmailsPvt += 1;
                            }
                            if(ev.flags.indexOf("Seen") != -1) orgDetails[a].newEmails += 1;
                        }
                    }
                    for (var j = 0; j < ev.destinations.length; j++) {
                        var b = ev.destinations[j].toString();
                        if (!this.isContact(b)) {
                            continue;
                        }
                        if (orgDetails[b] === undefined) {
                            orgDetails[b] = {
                                id: b,
                                nRcvEmails: 0,
                                nSentEmails: 0,
                                nRcvEmailsPvt: 0,
                                nSentEmailsPvt: 0,
                                nSentEmailsNorm: 0,
                                nRcvEmailsNorm: 0,
                                firstEmail: new Date(ev.timestamp * 1000),
                                lastEmail: undefined,
                                newEmails: 0
                            };
                        }
                        if (isSent) {
                            orgDetails[b].lastEmail = new Date(ev.timestamp * 1000);
                            orgDetails[b].nSentEmails += 1;
                            orgDetails[b].nSentEmailsNorm += 1.0 / ev.destinations.length;
                        }
                    }
                    if (isSent && ev.destinations.length === 1 && this.isContact(ev.destinations[0].toString())) {
                        b = ev.destinations[0].toString();
                        orgDetails[b].nSentEmailsPvt += 1;
                    }
                }
                return orgDetails;
            };

            InMemoryDB.prototype.getEmailDatesPattern = function (start_year, end_year) {
                var dates_hours = {}, dates_days = {};
                for(var i = start_year; i <= end_year; i++){
                    dates_hours[i] = []; dates_days[i] = [];
                }
                var formatHour = d3.time.format("%H"),
                    formatDay = d3.time.format("%a");

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (isSent) {
                        var the_year = new Date(this.emails[i].timestamp * 1000);
                        the_year = the_year.getFullYear();
                        dates_hours[the_year].push(parseInt(formatHour(new Date(ev.timestamp * 1000))));
                        dates_days[the_year].push(formatDay(new Date(ev.timestamp * 1000)));
                    }
                }
                return { "hours": dates_hours, "days": dates_days };
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

            InMemoryDB.prototype.getEmailDates_plus = function () {
                var dates = [], sent_years = {}, received_years = {};

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (isSent) {
                        var the_year = (new Date(ev.timestamp * 1000)).getFullYear();
                        if(the_year in sent_years){
                            sent_years[the_year].volume++;
                        }
                        else
                            sent_years[the_year] = { date: (new Date(ev.timestamp * 1000)).getFullYear(), direction: "sent", volume: 1.0 };
                    }
                    else{
                        var the_year = (new Date(ev.timestamp * 1000)).getFullYear();
                        if(the_year in received_years){
                            received_years[the_year].volume++;
                        }
                        else
                            received_years[the_year] = { date: (new Date(ev.timestamp * 1000)).getFullYear(), direction: "received", volume: 1.0 };
                    }
                }
                for(var year in sent_years) dates.push(sent_years[year]);
                for(var year in received_years) dates.push(received_years[year]);
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

            InMemoryDB.prototype.getMemberEmailDatesSent = function (ids) {
                var dates = [];

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (isSent) {
                        for (var j = 0; j < ev.destinations.length; j++) {
                            if (ids.indexOf(ev.destinations[j].toString()) != -1) {
                                var weight = 1.0;
                                dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                            }
                        }
                    }
                }
                return dates;
            };

            InMemoryDB.prototype.getMemberEmailDatesRcv = function (ids) {
                var dates = [];

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (!isSent) {
                        if (ids.indexOf(ev.source.toString()) != -1) {
                            var weight = 1.0;
                            dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                        }
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

            InMemoryDB.prototype.getEmailDatesByOrg = function (org) {
                var dates = [];
                for(var k = 0; k < VMail.App.db.length; k++){
                    for (var i = VMail.App.db[k].start; i < VMail.App.db[k].end; i++) {
                        var ev = VMail.App.db[k].emails[i];

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
            
            InMemoryDB.prototype.getEmailDatesByContactMulti = function (the_id) {
                var dates = [];

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];

                    //var isSent = (ev.f == undefined);
                    var isSent = !(ev.hasOwnProperty('source'));
                    if (isSent) {
                        for (var j = 0; j < ev.destinations.length; j++) {
                            if (ev.destinations[j].toString() === the_id) {
                                var weight = 1.0;
                                dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                            }
                        }
                    } else if (ev.source.toString() === the_id) {
                        var weight = 1.0;
                        dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                    }
                }
                return dates;
            };

            InMemoryDB.prototype.getEmailDatesByContactMulti_onedirection = function (the_id, direction) {
                var dates = [];

                if(direction == 'to'){
                    for (var i = this.start; i < this.end; i++) {
                        var ev = this.emails[i];

                        //var isSent = (ev.f == undefined);
                        var isSent = !(ev.hasOwnProperty('source'));
                        if (isSent) {
                            for (var j = 0; j < ev.destinations.length; j++) {
                                if (ev.destinations[j].toString() === the_id) {
                                    var weight = 1.0;
                                    dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                                }
                            }
                        }
                    }
                }
                else if(direction == 'from'){
                    for (var i = this.start; i < this.end; i++) {
                        var ev = this.emails[i];

                        //var isSent = (ev.f == undefined);
                        var isSent = !(ev.hasOwnProperty('source'));
                        if (!isSent) {
                            if (ev.source.toString() === the_id) {
                                var weight = 1.0;
                                dates.push({ date: new Date(ev.timestamp * 1000), weight: weight });
                            }
                        }
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

            InMemoryDB.prototype.isMemberContact = function (t, id) {
                if (isNaN(id))
                    return false;

                if(VMail.App.member_idSwitch_before[t].indexOf(id.toString()) != -1)
                    return true;
                else return false;
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

            InMemoryDB.prototype.getTimestampsNewContacts_plus = function () {
                var seen = [];
                var dates = [];
                var years = {};

                for (var i = this.start; i < this.end; i++) {
                    var ev = this.emails[i];
                    var isRcv = (ev.hasOwnProperty('source'));
                    if (isRcv && this.isContact(ev.source)) {
                        if (seen[ev.source] === undefined) {
                            var the_year = (new Date(ev.timestamp * 1000)).getFullYear();
                            if(the_year in years)
                                years[the_year].volume++;
                            else
                                years[the_year] = { date: the_year, name: "user", volume: 1.0 };
                            seen[ev.source] = true;
                        }
                    }
                    if (!isRcv) {
                        for (var j = 0; j < ev.destinations.length; j++) {
                            var b = ev.destinations[j].toString();
                            if (this.isContact(b)) {
                                if (seen[b] === undefined) {
                                    var the_year = (new Date(ev.timestamp * 1000)).getFullYear();
                                    if(the_year in years)
                                        years[the_year].volume++;
                                    else
                                        years[the_year] = { date: the_year, name: "user", volume: 1.0 };
                                    seen[b] = true;
                                }
                            }
                        }
                    }
                }
                for(var year in years) dates.push(years[year]);
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
//                                if(typeof(this.contactDetails[b]) == "undefined") {console.log(b+","+a);console.log(ev);}
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
                topN = (topN > results.length? results.length : topN);
                var to_return = results.slice(0, topN);
                return to_return;
            };

            InMemoryDB.prototype.getRanking_multi = function (topN, getScores, getSentRcv, ascending) {
                var results = [];
                for (var id in this.contacts) {
                    var contact = this.contacts[id];
                    var scores = getScores(contact);
                    var SentRcv = getSentRcv(contact);
                    if (scores === null) {
                        continue;
                    }
                    if(SentRcv['sent'] == 0 && SentRcv['rcv'] == 0) continue;
                    results.push({ contact: contact, sentrcv: SentRcv, scores: scores });
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
                topN = (topN > results.length? results.length : topN);
                var diff = 0;
                for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
                    if('aliases' in VMail.App.usersinfo[kk]){
                        for(var jj = 0; jj < VMail.App.usersinfo[kk].aliases.length; jj++){
                            var ind = $.map(results, function(e, index){
                                if(e.contact.name == VMail.App.usersinfo[kk].name || e.contact.aliases.indexOf(VMail.App.usersinfo[kk].aliases[jj]) != -1)
                                    return index;
                            });
                            // var result = $.grep(results, function(e){ return e.contact.name == VMail.App.usersinfo[kk].name || e.contact.aliases.indexOf(VMail.App.usersinfo[kk].aliases[jj]) != -1; });
                            if(ind.length != 0 && ind[0] >= topN){
                                var b = results[ind[0]];
                                results[ind[0]] = results[topN + diff]
                                results[topN + diff] = b; //console.log(b);
                                diff++;
                                jj = VMail.App.usersinfo[kk].aliases.length;
                            }
                        }
                    }
                }
                var to_return = results.slice(0, topN + diff);
                
                return to_return;
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
            if(name == undefined) name = "";
            
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

        function modifyMails(userinfo, rawemails){
            if(VMail.App.userinfo.email == "data.immersion@gmail.com" && VMail.App.usersinfo.length == 7){
                var name_emails = 
                        [
                            {name: "Kathrin Frauscher", emails: ["kfrauscher@gmail.com", "kfrauscher@open-contracting.org", "kfrauscher@worldbank.org"]},
                            {name: "Gavin Hayman", emails: ["haymangavin@gmail.com", "ghayman@open-contracting.org"]},
                            {name: "OCP", emails: ["info@open-contracting.org", "data@open-contracting.org", "data.immersion@gmail.com"]},
                            {name: "Lindsey Marchessault", emails: ["lmarchessault@worldbank.org", "lindsey.marchessault@gmail.com", "lmarchessault@open-contracting.org", "d+MTA2MTgwMTg2ODg0NjI5Nzc4NjQ3-MTA2MTkwNDM1MjcxMjE5MjI0NDU1@docs.google.com", "drive-shares-noreply@google.com"]},
                            {name: "Georg Neumann", emails: ["georgneu@gmail.com", "gneumann@open-contracting.org", "GEORGN@iadb.org", "d+MTA2MTgwMTg2ODg0NjI5Nzc4NjQ3-MTA0MDUzOTU1ODU4OTIxOTg5NDQz@docs.google.com"]},
                            {name: "Sierra Ramirez", emails: ["sierra.ramirez.au@gmail.com", "sramirez@open-contracting.org"]},
                            {name: "J. Macdonald", emails: ["jrmacdonald@law.gwu.edu", "jrmacdonald@open-contracting.org"]}
                        ];
            }
            else{
                var name_emails = 
                        [
                            {name: "Kathrin Frauscher", emails: ["kfrauscher@gmail.com", "kfrauscher@open-contracting.org"]},
                            {name: "Gavin Hayman", emails: ["haymangavin@gmail.com", "ghayman@open-contracting.org"]},
                            {name: "OCP", emails: ["info@open-contracting.org", "data@open-contracting.org", "data.immersion@gmail.com", "member@surveymonkey.com"]},
                            {name: "Lindsey Marchessault", emails: ["lindsey.marchessault@gmail.com", "lmarchessault@open-contracting.org"]},
                            {name: "Georg Neumann", emails: ["georgneu@gmail.com", "gneumann@open-contracting.org"]},
                            {name: "Sierra Ramirez", emails: ["sierra.evenstar@gmail.com", "sramirez@open-contracting.org"]},
                            {name: "J. Macdonald", emails: ["jrmacdonald@law.gwu.edu", "jrmacdonald@open-contracting.org"]},
                            {name: "Katherine Wikrent", emails: ["katherine.wikrent@gmail.com", "kwikrent@developmentgateway.org", "wikrent@gwmail.gwu.edu", "katherine@open-contracting.org", "kwikrent@open-contracting.org"]},
                            {name: "Carey Kluttz", emails: ["careykluttz@gmail.com", "ckluttz@open-contracting.org"]},
                            {name: "Karolis Granickas", emails: ["k.granickas@gmail.com", "kgranickas@open-contracting.org", "karolis@transparency.lt", "karolis@open-contracting.org"]},
                            {name: "Marie Diop", emails: ["mariediop08@gmail.com", "mdiop@open-contracting.org"]}
                        ];
            }
            var emails = [];
            for (var i = 0; i < rawemails.length; i++) {
                if (rawemails[i] instanceof Array) {
//                    console.log(rawemails[i]);
                    var email = {};
                    if (rawemails[i] == undefined || !(rawemails[i] instanceof Array) || rawemails[i].length < 2) {
                        continue;
                    }
                    var prefixheader = rawemails[i][0];
//                    console.log(prefixheader);
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
                    var flags_start = prefixheader.indexOf("FLAGS(");
                    if (flags_start >= 0) {
                        email.flags = prefixheader.substring(flags_start + 6, prefixheader.substring(flags_start + 6, prefixheader.length).indexOf(")"));
                    }
                    else{
                        email.flags = "Seen";
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
                    }//console.log("parse "+ email.dateField);
                    emails.push(email);
                    //modify every eamil to make the name match what we have in name_emails
                    var results = $.grep(name_emails, function (e) { return e.emails.indexOf(email.fromField[1]) != -1; });
                    if(results.length != 0 && email.fromField[0] != results[0].name){
                        email.fromField[0] = results[0].name;
                    }
                    for(var t in email.toField){
                        var user = email.toField[t];
                        var results = $.grep(name_emails, function (e) { return e.emails.indexOf(user[1]) != -1; });
                        if(results.length != 0 && user[0] != results[0].name){
                            user[0] = results[0].name;
                        }
                    }
                    for(var t in email.ccField){
                        var user = email.ccField[t];
                        var results = $.grep(name_emails, function (e) { return e.emails.indexOf(user[1]) != -1; });
                        if(results.length != 0 && user[0] != results[0].name){
                            user[0] = results[0].name;
                        }
                    }
                } 
                else if (rawemails[i] !== null && rawemails[i].auto !== true) {
                    //console.log("nonparse " + rawemails[i].flags);
                    if(rawemails[i].flags == undefined) rawemails[i].flags = "Seen";//console.log("parse2 "+ rawemails[i].dateField);
                    emails.push(rawemails[i]);
                    //modify every eamil to make the name match what we have in name_emails
                    var results = $.grep(name_emails, function (e) { return e.emails.indexOf(rawemails[i].fromField[1]) != -1; });
                    if(results.length != 0 && rawemails[i].fromField[0] != results[0].name){
                        rawemails[i].fromField[0] = results[0].name;
                    }
                    for(var t in rawemails[i].toField){
                        var user = rawemails[i].toField[t];
                        var results = $.grep(name_emails, function (e) { return e.emails.indexOf(user[1]) != -1; });
                        if(results.length != 0 && user[0] != results[0].name){
                            user[0] = results[0].name;
                        }
                    }
                    for(var t in rawemails[i].ccField){
                        var user = rawemails[i].ccField[t];
                        var results = $.grep(name_emails, function (e) { return e.emails.indexOf(user[1]) != -1; });
                        if(results.length != 0 && user[0] != results[0].name){
                            user[0] = results[0].name;
                        }
                    }
                }
            }
            return emails;
        }
        DB.modifyMails = modifyMails;

        function setupDB(userinfo, rawemails, stats, univ_data, saved_contacts) {
            var uniqid = 0;
            // if(saved_contacts != null) uniqid = saved_contacts['contacts'].length;

            var name_emails = 
                [
                    {name: "Kathrin Frauscher", emails: ["kfrauscher@gmail.com", "kfrauscher@open-contracting.org", "kfrauscher@worldbank.org"]},
                    {name: "Gavin Hayman", emails: ["haymangavin@gmail.com", "ghayman@open-contracting.org"]},
                    {name: "OCP", emails: ["info@open-contracting.org", "data@open-contracting.org", "data.immersion@gmail.com"]},
                    {name: "Lindsey Marchessault", emails: ["lmarchessault@worldbank.org", "lindsey.marchessault@gmail.com", "lmarchessault@open-contracting.org", "d+MTA2MTgwMTg2ODg0NjI5Nzc4NjQ3-MTA2MTkwNDM1MjcxMjE5MjI0NDU1@docs.google.com", "drive-shares-noreply@google.com"]},
                    {name: "Georg Neumann", emails: ["georgneu@gmail.com", "gneumann@open-contracting.org", "GEORGN@iadb.org", "d+MTA2MTgwMTg2ODg0NjI5Nzc4NjQ3-MTA0MDUzOTU1ODU4OTIxOTg5NDQz@docs.google.com"]},
                    {name: "Sierra Ramirez", emails: ["sierra.ramirez.au@gmail.com", "sramirez@open-contracting.org"]},
                    {name: "J. Macdonald", emails: ["kfrauscher@gmail.com", "jrmacdonald@law.gwu.edu", "jrmacdonald@open-contracting.org"]}
                ];
//          d3.json("/static/world_universities_and_domains.json", function(univ_data) {
            var today = (+new Date()) / 1000 + 60 * 60 * 24 * 2;
            var beginning = (+new Date(1980, 1, 1)) / 1000;
            //sort emails by timestamp
            var emails = [];//console.log("haha");
            for (var i = 0; i < rawemails.length; i++) {
                if (rawemails[i] instanceof Array) {
//                    console.log(rawemails[i]);
                    var email = {};
                    if (rawemails[i] == undefined || !(rawemails[i] instanceof Array) || rawemails[i].length < 2) {
                        continue;
                    }
                    var prefixheader = rawemails[i][0];
//                    console.log(prefixheader);
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
                    var flags_start = prefixheader.indexOf("FLAGS(");
                    if (flags_start >= 0) {
                        email.flags = prefixheader.substring(flags_start + 6, prefixheader.substring(flags_start + 6, prefixheader.length).indexOf(")"));
                    }
                    else{
                        email.flags = "Seen";
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
                            if (tmp[0].name == "Almaha Adnan Almalki"){
                                tmp[0].name = "Almaha Almalki";
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
                                if (t.name == "Almaha Adnan Almalki"){
                                    t.name = "Almaha Almalki";
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
                                if (t.name == "Almaha Adnan Almalki"){
                                    t.name = "Almaha Almalki";
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
                    }//console.log("parse "+ email.flags);
                    
                    //check if the email is related with current member
                    if(VMail.App.type == "multi" && (userinfo.email == "data.immersion@gmail.com" || userinfo.email == "data.immersion.2016@gmail.com")){
                        var push_or_not = 0;
                        var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == email.fromField[0]; });
                        if(results.length != 0){
                            push_or_not = 1;
                        }
                        for(var t in email.toField){
                            var user = email.toField[t];
                            var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == user[0]; });
                            if(results.length != 0){
                                push_or_not = 1;
                            }
                        }
                        for(var t in email.ccField){
                            var user = email.ccField[t];
                            var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == user[0]; });
                            if(results.length != 0){
                                push_or_not = 1;
                            }
                        }
                        if(push_or_not == 1) emails.push(email);
                    }
                    else{
                        // if(email.dateField > 0)
                            emails.push(email);
                    }
                    // if(userinfo.email=="who.is.kevin.hu@gmail.com") console.log("parse3 "+ email.dateField);
                } 
                else if (rawemails[i] !== null && rawemails[i].auto !== true) {
                    //console.log("nonparse " + rawemails[i].flags);
                    if(rawemails[i].flags == undefined) rawemails[i].flags = "Seen";
                    //check if the email is related with current member
                    if(VMail.App.type == "multi" && (userinfo.email == "data.immersion@gmail.com" || userinfo.email == "data.immersion.2016@gmail.com")){
                        var push_or_not = 0;
                        var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == rawemails[i].fromField[0]; });
                        if(results.length != 0){
                            push_or_not = 1;
                        }
                        for(var t in rawemails[i].toField){
                            var user = rawemails[i].toField[t];
                            var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == user[0]; });
                            if(results.length != 0){
                                push_or_not = 1;
                            }
                        }
                        for(var t in rawemails[i].ccField){
                            var user = rawemails[i].ccField[t];
                            var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == user[0]; });
                            if(results.length != 0){
                                push_or_not = 1;
                            }
                        }
                        if(push_or_not == 1) emails.push(rawemails[i]);
                    }
                    else{
                        if(rawemails[i].dateField > 0){
                            if(i != 0 && i != rawemails.length - 1 && rawemails[i - 1] != null && rawemails[i + 1] != null){
                                if(Math.abs(rawemails[i].dateField - rawemails[i - 1].dateField) < 1000000 && Math.abs(rawemails[i].dateField - rawemails[i + 1].dateField) < 1000000)
                                    emails.push(rawemails[i]);
                            }
                            else{
                                emails.push(rawemails[i]);
                            }
                        }
                    }
                    //if(userinfo.email=="who.is.kevin.hu@gmail.com" && (i > 110000 && i <120000)) console.log(rawemails[i].dateField);
                }
                
            }//if(userinfo.email=="who.is.kevin.hu@gmail.com") console.log(emails[0]);
            emails.sort(function (a, b) {
                return a.dateField - b.dateField;
            });
            // if(userinfo.email=="who.is.kevin.hu@gmail.com") console.log(emails[0]);
            // var person_name = [""];
            // if (userinfo['name'] !== undefined) {
            //     person_name = userinfo['name'].split(/\s+/);
            // }
            // if (person_name.length === 1) {
            //     userinfo['name'] = person_name[0].trim().toTitleCase();
            // } else {
            //     userinfo['name'] = person_name[0].trim().toTitleCase() + " " + person_name[person_name.length - 1].trim().toTitleCase();
            // }

            // find the person's email aliases by going through the sent emails and reading the 'from' field
            var my = {}; //var my2 = {};
            my[userinfo['email']] = true;
            emails.forEach(function (email) {
                if (email.isSent) {
                    if(VMail.App.type == "multi" && (VMail.App.userinfo.email == "data.immersion@gmail.com" || VMail.App.userinfo.email == "data.immersion.2016@gmail.com")){
                        if(email.fromField[0] == userinfo['name']) my[email.fromField[1].toLowerCase()] = true;
                    }
                    else if(email.fromField[1].indexOf("docs.google") != -1 || email.fromField[1].indexOf("github.com") != -1 || email.fromField[1].indexOf("facebookmail.com") != -1 || email.fromField[1].indexOf("noreply") != -1 || email.fromField[1].indexOf("webex.com") != -1 || email.fromField[1].indexOf("doodle.com") != -1 || email.fromField[1].indexOf("dropbox.com") != -1 || email.fromField[1].indexOf("buzz+") != -1){//filter wrong aliases  
                        //docs.google.com, github.com, facebookmail.com, noreply@google.com
                    }
                    else if(email.fromField[0] == userinfo['name'] || email.fromField[0].indexOf(userinfo['family_name']) != -1 || email.fromField[0].indexOf(userinfo['given_name']) != -1) {
                        var results = $.grep(VMail.App.not_aliases, function(e){ return email.fromField[1].indexOf(e) != -1; });
                        if(results.length == 0)
                            my[email.fromField[1].toLowerCase()] = true;
                    }
//                    if(VMail.App.userinfo.email == "data.immersion.2016@gmail.com") my2[email.fromField[1]]=email.fromField[0];
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
                    var email = addr[1].toLowerCase();
//                    if(email=="nuriahidalgo@gmail.com") console.log(mail);
//                    if(email=="nuria_hidalgo@hotmail.com") console.log(mail);
                    if (email in my) {
                        return;
                    }
                    if (name === userinfo['name']) {
                        if(email.indexOf("docs.google") == -1 && email.indexOf("github.com") == -1 && email.indexOf("facebookmail.com") == -1 && email.indexOf("noreply") == -1 && email.indexOf("webex.com") == -1 && email.indexOf("doodle.com") == -1 && email.indexOf("dropbox.com") == -1 && email.indexOf("buzz+") == -1){
                            var results = $.grep(VMail.App.not_aliases, function(e){ return email.indexOf(e) != -1; });
                            if(results.length == 0)
                                my[email] = true; 
                        }
                    }
                });
            });
            
            //DONE normalizing data
            // assign each email address a unique name
            var email_to_name = {};
            emails.forEach(function (mail) {
//                if(mail.fromField.indexOf("gkarthik505@gmail.com")!=-1&&mail.ccField.indexOf("nuriahidalgo@gmail.com")!=-1) console.log(mail);
                var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                addrs.forEach(function (addr) {
                    var name = addr[0];
                    var email = addr[1].toLowerCase();
                    if (email in my) {
                        return;
                    }

                    //if its the first time we see this email
                    if(email.indexOf("docs.google") == -1 && email.indexOf("github.com") == -1 && email.indexOf("facebookmail.com") == -1 && email.indexOf("noreply") == -1 && email.indexOf("webex.com") == -1 && email.indexOf("doodle.com") == -1 && email.indexOf("dropbox.com") == -1 && email.indexOf("buzz+") == -1){
                        if (!(email in email_to_name)) {
                            if(name == "Almaha Adnan Almalki"){
                                name = "Almaha Almalki";
                            }
                            email_to_name[email] = name;
                        }

                        // overwrite the name if the previous name is the same as email or he is the sender
                        if (name !== email && (email_to_name[email] === email || email === mail.fromField[1])) {
                            if(name == "Almaha Adnan Almalki"){
                                name = "Almaha Almalki";
                            }
                            email_to_name[email] = name;
                        }
                    }
                });
            });

            // DONE assign each email address a unique name
            // assign each name a unique contact with all the email addresses
            var contacts = {};
            var name_to_id = {};
            var id_to_email = {};
            var email_to_org = {};
            $('#loader').html("Analyzing metadata: setting up the DB (20%).");

            // if(saved_contacts != null){ 
            //     for(var kk = 0; kk < saved_contacts['contacts'].length; kk++){
            //         var contact = saved_contacts['contacts'][kk];
            //         name_to_id[contact.name] = kk.toString();
            //         id_to_email[kk.toString()] = contact.aliases[0];
            //         contacts[kk.toString()] = {
            //             'id': kk.toString(),
            //             'aliases': contact.aliases,
            //             'name': contact.name,
            //             'rcv': contact.rcv,
            //             'sent': contact.sent,
            //             'new': contact.new,
            //             'slack_sent': 0, 
            //             'slack_rcv': 0
            //         };
            //     }
            // }alert(uniqid);
            
            var member_aliases = {
                email: (userinfo.email),
                name: (userinfo.name),
                aliases: (Object.keys(my)),
                timestamp: emails[emails.length - 1].dateField,
                use_length: Math.ceil((emails[emails.length - 1].dateField - emails[0].dateField) / 3600 / 24)
            };
            $.post('/save_aliases', {'json': JSON.stringify(member_aliases)}) //Object.keys(my)
                .success(function () {
//                    alert("Aliases saved for " + userinfo.name);
                }
            );
            
            console.time('construct org list');//console.log(the_length);

            for (var email in email_to_name) {
                var name = email_to_name[email];
                var this_org, this_domain;
                var search_or_not = 1;
                if (!(name in name_to_id)) {
                    // console.log("unqid: "+ uniqid+" "+name);
                    name_to_id[name] = uniqid.toString();
                    id_to_email[uniqid.toString()] = email;
                    contacts[uniqid.toString()] = { 'name': name, 'aliases': [email.toLowerCase()], 'sent': 0, 'rcv': 0, 'new': 0,  'slack_sent': 0, 'slack_rcv': 0, 'id': uniqid.toString() };
                    uniqid++;

                    //get a list of different email ending (organizations) by going through all the emails
                    var domain = email.substring(email.indexOf("@") + 1, email.length).toLowerCase();
                    this_domain = domain;
                    for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                        if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                            search_or_not = 0; break;
                        }
                    }
                    // if(VMail.App.graph != undefined && VMail.App.graph.org_nodes != undefined){
                    //     var org_lookup = $.grep(VMail.App.graph.org_nodes, function(e){ return e.domain == domain; })
                    //     if(org_lookup.length == 1){
                    //         search_or_not = 0;
                    //         this_domain = the_domain;
                    //         this_org = org_lookup[0];
                    //     }
                    //     else if(org_lookup.length > 1){
                    //         search_or_not = 0;
                    //         this_domain = the_domain;
                    //         this_org = org_lookup[0];
                    //     }
                    // }

                    if(search_or_not == 1){
                      try{
                        if(domain in VMail.App.org_domains){
                            // search_or_not = 0;
                            // var org_lookup = $.grep(VMail.App.orgs, function(e){ return e.domain == VMail.App.org_domains[domain]['domain']; })
                            // if(org_lookup.length == 1){
                            //     if(org_lookup[0]['other'].indexOf(domain) == -1) org_lookup[0]['other'].push(domain);
                            //     this_domain = VMail.App.org_domains[domain]['domain'];
                            //     this_org = org_lookup[0];
                            // }
                            // else if(org_lookup.length > 1){
                            //     if(org_lookup[0]['other'].indexOf(domain) == -1) org_lookup[0]['other'].push(domain);
                            //     this_domain = VMail.App.org_domains[domain]['domain'];
                            //     this_org = org_lookup[0];
                            // }

                            if(VMail.App.org_domains[domain]['domain'] in VMail.App.orgs){
                                var org_lookup = VMail.App.the_orgs(VMail.App.org_domains[domain]['domain']);
                                this_domain = VMail.App.org_domains[domain]['domain'];
                                this_org = org_lookup;
                            }
                        }
                        else{
                            console.log("not found " + domain);
                        

                            var result = $.grep(VMail.App.orgs, function(e){ return e.domain == domain; });
                            if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                                var the_domain = domain;
                                while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                    the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                    var org_lookup = $.grep(VMail.App.orgs, function(e){ return e.domain == the_domain; })
                                    if(org_lookup.length == 1){//we find the only one. should be the correct org.
    //                                    org_lookup[0].num++;
    //                                    email_to_org[email] = the_domain;
                                        if(org_lookup[0]['other'].indexOf(domain) == -1) org_lookup[0]['other'].push(domain);
                                        this_domain = the_domain;
                                        this_org = org_lookup[0];
                                        break;
                                    }
                                    else if(org_lookup.length > 1){//more than one results, should pick up the right one
    //                                    console.log(org_lookup);//reverse later to see what it is
    //                                    org_lookup[0].num++;
    //                                    email_to_org[email] = the_domain;
                                        if(org_lookup[0]['other'].indexOf(domain) == -1) org_lookup[0]['other'].push(domain);
                                        this_domain = the_domain;
                                        this_org = org_lookup[0];
                                        break;
                                    }
                                }
                                if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                                    the_domain = domain;
                                    result = $.grep(univ_data, function(e){ return e.domain == domain; });
                                    if(result.length == 0){//not found in the univ_list, next we make sure its family domains are not in the list
                                        while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                            the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                            var univ_lookup = $.grep(univ_data, function(e){ return e.domain == the_domain; })
                                            if(univ_lookup.length == 1){//we find the only one. should be the correct org.
                                                this_domain = the_domain;
                                                VMail.App.org_domains[domain] = {'domain': the_domain.toLowerCase(), 'name': univ_lookup[0].name, 'org_index': VMail.App.orgs.length };
                                                VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'other': [domain], 'org' : univ_lookup[0].name, 'num' : 0});
                                                this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                            email_to_org[email] = the_domain;
                                                break;
                                            }
                                            else if(univ_lookup.length > 1){//more than one results, should pick up the right one
    //                                            console.log(univ_lookup); //reverse later to see what it is
                                                this_domain = the_domain;
                                                VMail.App.org_domains[domain] = {'domain': the_domain.toLowerCase(), 'name': univ_lookup[0].name, 'org_index': VMail.App.orgs.length };
                                                VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'other': [domain], 'org' : univ_lookup[0].name, 'num' : 0});
                                                this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                            email_to_org[email] = the_domain;
                                                break;
                                            }
                                        }
                                        if(the_domain.indexOf(".") == -1){//not a university
                                            this_domain = domain;
                                            VMail.App.org_domains[domain] = {'domain': domain.toLowerCase(), 'name': domain, 'org_index': VMail.App.orgs.length };
                                            VMail.App.orgs.push({'domain': domain.toLowerCase(), 'other': [domain], 'org' : domain, 'num' : 0});
                                            this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                        email_to_org[email] = domain;
                                        }
                                    }
                                    else{
                                        this_domain = the_domain;
                                        VMail.App.org_domains[domain] = {'domain': the_domain.toLowerCase(), 'name': result[0].name, 'org_index': VMail.App.orgs.length };
                                        VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'other': [domain], 'org' : result[0].name, 'num' : 0});
                                        this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                    email_to_org[email] = the_domain;
                                    }
                                }
                            }
                            else{
                                if(result[0]['other'].indexOf(domain) == -1) result[0]['other'].push(domain);
                                this_org = result[0];
                            }
                        }
                      }
                      catch(err) {
                          console.log("ERROR1: " + err.message);
                      }
                    }
                }
                try{
                  if(search_or_not && this_org != undefined){
                    this_org.num++;
                  }
                  if((!(email in email_to_org)) && search_or_not){ 
                    email_to_org[email] = this_domain;
                    // this_org.num++;
                    email = email.toLowerCase();
                    if(contacts[name_to_id[name]]['aliases'].indexOf(email) == -1) contacts[name_to_id[name]]['aliases'].push(email);
                  }
                }
                catch(err) {
                    VMail.App.orgs = [];
                    console.log("ERROR2: " + err.message);
                } 
            }

           // };
//            construct_org_list();
            console.timeEnd('construct org list');
            
        // function go_next(){
            //add my emails to email_to_org
            for(var email in my){
                var domain = email.substring(email.indexOf("@") + 1, email.length).toLowerCase();
                var search_or_not = 1;
                for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                    if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                        search_or_not = 0; break;
                    }
                }
                if(search_or_not == 1){
                    if(domain in VMail.App.org_domains && (VMail.App.org_domains[domain]['domain'] in VMail.App.the_orgs)){
                        var result = VMail.App.the_orgs(VMail.App.org_domains[domain]['domain']);
                        this_domain = VMail.App.org_domains[domain]['domain'];
                        this_org = result;
                        if(result['other'].indexOf(domain) == -1) result['other'].push(domain);
                        result.num ++;
                        email_to_org[email] = domain;
                    }
                    else{
                        var result = $.grep(VMail.App.orgs, function(e){ return e.domain == domain; });
                        if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                            var the_domain = domain;
                            while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                var org_lookup = $.grep(VMail.App.orgs, function(e){ return e.domain == the_domain; })
                                if(org_lookup.length == 1){//we find the only one. should be the correct org.
                                    if(org_lookup[0]['other'].indexOf(domain) == -1) org_lookup[0]['other'].push(domain);
                                    org_lookup[0].num++;
                                    email_to_org[email] = the_domain;
                                    break;
                                }
                                else if(org_lookup.length > 1){//more than one results, should pick up the right one
    //                                    console.log(org_lookup);//reverse later to see what it is
                                    if(org_lookup[0]['other'].indexOf(domain) == -1) org_lookup[0]['other'].push(domain);
                                    org_lookup[0].num++;
                                    email_to_org[email] = the_domain;
                                    break;
                                }
                            }
                            if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                                the_domain = domain;
                                result = $.grep(univ_data, function(e){ return e.domain == domain; });
                                if(result.length == 0){//not found in the univ_list, next we make sure its family domains are not in the list
                                    while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                        the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                        var univ_lookup = $.grep(univ_data, function(e){ return e.domain == the_domain; })
                                        if(univ_lookup.length == 1){//we find the only one. should be the correct org.
                                            VMail.App.org_domains[domain] = {'domain': the_domain.toLowerCase(), 'name': univ_lookup[0].name, 'org_index': VMail.App.orgs.length };
                                            VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'other': [domain], 'org' : univ_lookup[0].name, 'num' : 1});
                                            email_to_org[email] = the_domain;
                                            break;
                                        }
                                        else if(univ_lookup.length > 1){//more than one results, should pick up the right one
    //                                            console.log(univ_lookup); //reverse later to see what it is
                                            VMail.App.org_domains[domain] = {'domain': the_domain.toLowerCase(), 'name': univ_lookup[0].name, 'org_index': VMail.App.orgs.length };
                                            VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'other': [domain], 'org' : univ_lookup[0].name, 'num' : 1});
                                            email_to_org[email] = the_domain;
                                            break;
                                        }
                                    }
                                    if(the_domain.indexOf(".") == -1){//not a university
                                        VMail.App.org_domains[domain] = {'domain': domain.toLowerCase(), 'name': domain, 'org_index': VMail.App.orgs.length };
                                        VMail.App.orgs.push({'domain': domain, 'other': [domain], 'org' : domain, 'num' : 1});
                                        email_to_org[email] = domain;
                                    }
                                }
                                else{
                                    VMail.App.org_domains[domain] = {'domain': the_domain.toLowerCase(), 'name': result[0].name, 'org_index': VMail.App.orgs.length };
                                    VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'other': [domain], 'org' : result[0].name, 'num' : 1});
                                    email_to_org[email] = the_domain;
    //                                break;
    //                                result[0].num ++;
                                }
                            }
                        }
                        else{
                            if(result[0]['other'].indexOf(domain) == -1) result[0]['other'].push(domain);
                            result[0].num ++;
                            email_to_org[email] = domain;
                        }
                    }
                }
            }

            var comp = function (a, b) {
                if (a.num !== b.num) {
                    return b.num - a.num;
                }
                return 0;
            };
            if(VMail.App.type == "multi" && VMail.App.usersinfo.indexOf(userinfo) == VMail.App.usersinfo.length - 1){ 
                VMail.App.orgs.sort(comp);

                //save org info to the DB
                $.post('/save_orgs_version', {'json': JSON.stringify({id: VMail.App.team_id, version: Math.ceil(VMail.App.orgs.length/6000)})})
                    .success(function (returned_data) {
                        if(returned_data['success'] == true){ 
                        }
                    }
                );
                d3.range(Math.ceil(VMail.App.orgs.length/6000)).forEach(function (l){
                    setTimeout(function(){
                        var part_of_orgs = {id: VMail.App.team_id, batch: l, orgs: VMail.App.orgs.slice(l * 6000, (l + 1) * 6000)};
                        $.post('/save_orgs', {'json': JSON.stringify(part_of_orgs)})
                            .success(function (returned_data) {
                                if(returned_data['success'] == true){ 
                                }
                            }
                        );
                    }, l*200);
                });
            }
            console.time('no. of sent and rcv');
            // calculate the no. of sent and rcv for each unique contact
            if(userinfo.email=="who.is.kevin.hu@gmail.com") console.log(emails[0]);
            emails.forEach(function (mail) {
                // if(saved_contacts != null && mail.dateField <= saved_contacts['timestamp']) return;
                var a = mail.fromField[1];
                if(VMail.App.type == "multi" && (VMail.App.userinfo.email == "data.immersion@gmail.com" || VMail.App.userinfo.email == "data.immersion.2016@gmail.com")){
                    if(mail.fromField[0] == userinfo['name']){//isSent
                        var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                        addrs.forEach(function (addr) {
                            var b_name = addr[0];
                            var b = addr[1];
                            if (b in email_to_name) {
                                contacts[name_to_id[email_to_name[b]]]['sent']++;
                            }
                        });
                    }
                    else{
                        if (a in email_to_name) {
                            contacts[name_to_id[email_to_name[a]]]['rcv']++;
                            if(mail.flags.indexOf("Seen") == -1) contacts[name_to_id[email_to_name[a]]]['new']++;
                        }
                    }
                }
                else{
                    if (mail.isSent) {
                        var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                        addrs.forEach(function (addr) {
                            var b_name = addr[0];
                            var b = addr[1];
                            if (b in email_to_name) {
                                contacts[name_to_id[email_to_name[b]]]['sent']++;
                            }
                        });
                    } else {
                        if (a in email_to_name) {
                            contacts[name_to_id[email_to_name[a]]]['rcv']++;
                            if(mail.flags.indexOf("Seen") == -1) contacts[name_to_id[email_to_name[a]]]['new']++;
                        }
                    }
                }
            });console.timeEnd('no. of sent and rcv');

            for (var name in name_to_id) {
                var id = name_to_id[name];
                var contact = contacts[id];
                if (Math.min(contact['sent'], contact['rcv']) < 1) {
                    //if the name doesn't belong to people in the group, delete related info
                    var is_user = 0;
                    if(VMail.App.usersinfo){
                        for(var ii=0; ii<VMail.App.usersinfo.length; ii++){
//                            if(id_to_email[id] == "sanjay.guruprasad@gmail.com") console.log(name+","+id);
//                            if(id_to_email[id] == VMail.App.usersinfo[ii].email){
//                                is_user = 1; break;
//                            }
                            if(name == VMail.App.usersinfo[ii].name){
                                is_user = 1; break;
                            }
                        }
                    }
                    if(is_user == 0){
                        contact['aliases'].forEach(function (email) {
                            delete email_to_name[email];
                        });
                        delete contacts[id];
                    }
                }
            }

            // //save contacts info of the user to the DB
            // var user_contacts = [];
            // for(var contact_id in contacts){
            //     user_contacts.push({
            //         name: contacts[contact_id].name,
            //         aliases: contacts[contact_id].aliases,
            //         rcv: contacts[contact_id].rcv,
            //         sent: contacts[contact_id].sent
            //     });
            // }
            // $.post('/save_contacts', {'json': JSON.stringify({id: VMail.App.team_id, email: userinfo.email, contacts: user_contacts, timestamp: emails[emails.length - 1].dateField })})
            //     .success(function (returned_data) {
            //         if(returned_data['success'] == true){ 

            //         }
            //     }
            // );
            
            console.time('response time');
            //get response time from processed emails
            var response_time = InMemoryDB.getResponseTime(emails, userinfo);
            console.timeEnd('response time');
                    
            if(VMail.App.type == "single"){
                var new_contacts = [];
                var p = -3;
                for(var id in contacts){
                    new_contacts.push({'name': contacts[id].name, 'num': Math.pow((Math.pow(contacts[id].rcv, p) + Math.pow(contacts[id].sent, p)) / 2.0, 1.0 / p)});
                }
                new_contacts.sort(function (a, b) {
                    return b.num - a.num;
                });

                var top_contacts = [], all_contacts = [];
                if(new_contacts.length != 0){
                    for(var kk = 0; kk < (new_contacts.length < 5? new_contacts.length:5); kk++){
                        top_contacts.push({'name': new_contacts[kk].name});
                    }
                }
                for(var name in contacts){
                    if(contacts[name].rcv >= 1 && contacts[name].sent >= 1)
                        all_contacts.push({'name': contacts[name].name});
                }
                response_time = {};
                response_time['contacts'] = InMemoryDB.getContactsResponseTime(emails, userinfo, top_contacts);
                response_time['my'] = InMemoryDB.getMyResponseTime(emails, userinfo, all_contacts);
            }

            d3.select('#loader').html("Analyzing metadata: setting up the DB (70%).");
            // make the events list
            var events = [];console.time('event list');
            emails.forEach(function (mail) {
                var a = mail.fromField[1];
                var tmp = [], tmp_org = [];
                var addrs = mail.toField.concat(mail.ccField); 
                addrs.forEach(function (addr) {
                    var b_name = addr[0];
                    var b = addr[1];

                    if (b !== a && !(b in my) && (b.indexOf("docs.google") == -1 && b.indexOf("github.com") == -1 && b.indexOf("facebookmail.com") == -1 && b.indexOf("noreply") == -1 && b.indexOf("webex.com") == -1 && b.indexOf("doodle.com") == -1 && b.indexOf("dropbox.com") == -1 && b.indexOf("buzz+") == -1)) {
                        if (b in email_to_name) {
                            var id = name_to_id[email_to_name[b]];
//                            if(mail.threadid=="1505504347206425811") console.log(id+","+email_to_name[b]);
                        } else {
                            var id = b;
                        }
                        if(id != ""){ 
                            tmp.push(id.toString());
                            tmp_org.push(typeof(email_to_org[b]) == "undefined"? "undefined":email_to_org[b].toString().toLowerCase());
                        }
                    }
                });

                if(VMail.App.type == "multi" && (VMail.App.userinfo.email == "data.immersion@gmail.com" || VMail.App.userinfo.email == "data.immersion.2016@gmail.com")){
                    if(mail.fromField[0] == userinfo['name'] && (a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1 && a.indexOf("doodle.com") == -1 && a.indexOf("dropbox.com") == -1 && a.indexOf("buzz+") == -1)){//isSent  
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': "Seen" });
                    }
                    else if(a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1){ 
                        if (a in email_to_name) {//if(email_to_name[a]=="Sanjay Guruprasad") console.log("from found!");
                            var id = name_to_id[email_to_name[a]];
                        } else {
                            var id = a;
                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source': id, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': mail.flags });
                    }
                }
                else{
                    if (mail.isSent && (a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1 && a.indexOf("doodle.com") == -1 && a.indexOf("dropbox.com") == -1 && a.indexOf("buzz+") == -1)) {
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        // if(userinfo.email=="who.is.kevin.hu@gmail.com") console.log(mail.dateField);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': "Seen" });
                    } else if(a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1 && a.indexOf("doodle.com") == -1 && a.indexOf("dropbox.com") == -1 && a.indexOf("buzz+") == -1){ 
                        if (a in email_to_name) {
                            var id = name_to_id[email_to_name[a]]; 
                        } else {
                            var id = a;
                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source': id, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': mail.flags });
                        // if(mail.threadid=="1502298247979207005") {console.log(a+" "+email_to_name[a]);console.log({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source': id, 'source_org': org});console.log(Object.keys(my)); console.log(mail);}
                    }
                }
            });console.timeEnd('event list');
            
            return new InMemoryDB(events, contacts, Object.keys(my), stats, response_time);
        // }  
          
        }
        
        function setupDB_merge(userinfo, rawemails, stats, univ_data) {
            var name_emails = 
                [
                    {name: "Kathrin Frauscher", emails: ["kfrauscher@gmail.com", "kfrauscher@open-contracting.org", "kfrauscher@worldbank.org"]},
                    {name: "Gavin Hayman", emails: ["haymangavin@gmail.com", "ghayman@open-contracting.org"]},
                    {name: "OCP", emails: ["info@open-contracting.org", "data@open-contracting.org", "data.immersion@gmail.com"]},
                    {name: "Lindsey Marchessault", emails: ["lmarchessault@worldbank.org", "lindsey.marchessault@gmail.com", "lmarchessault@open-contracting.org", "d+MTA2MTgwMTg2ODg0NjI5Nzc4NjQ3-MTA2MTkwNDM1MjcxMjE5MjI0NDU1@docs.google.com", "drive-shares-noreply@google.com"]},
                    {name: "Georg Neumann", emails: ["georgneu@gmail.com", "gneumann@open-contracting.org", "GEORGN@iadb.org", "d+MTA2MTgwMTg2ODg0NjI5Nzc4NjQ3-MTA0MDUzOTU1ODU4OTIxOTg5NDQz@docs.google.com"]},
                    {name: "Sierra Ramirez", emails: ["sierra.ramirez.au@gmail.com", "sramirez@open-contracting.org"]},
                    {name: "J. Macdonald", emails: ["kfrauscher@gmail.com", "jrmacdonald@law.gwu.edu", "jrmacdonald@open-contracting.org"]}
                ];
//          d3.json("/static/world_universities_and_domains.json", function(univ_data) {
            var today = (+new Date()) / 1000 + 60 * 60 * 24 * 2;
            var beginning = (+new Date(2004, 3, 1)) / 1000;
            //sort emails by timestamp
            var emails = [];
            var member_aliases = [];
            for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
                member_aliases = member_aliases.concat(VMail.App.usersinfo[kk].aliases);
            }
            for (var i = 0; i < rawemails.length; i++) {
                if (rawemails[i] instanceof Array) {
//                    console.log(rawemails[i]);
                    var email = {};
                    if (rawemails[i] == undefined || !(rawemails[i] instanceof Array) || rawemails[i].length < 2) {
                        continue;
                    }
                    var prefixheader = rawemails[i][0];
//                    console.log(prefixheader);
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
                    var flags_start = prefixheader.indexOf("FLAGS(");
                    if (flags_start >= 0) {
                        email.flags = prefixheader.substring(flags_start + 6, prefixheader.substring(flags_start + 6, prefixheader.length).indexOf(")"));
                    }
                    else{
                        email.flags = "Seen";
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
                    }//console.log("parse "+ email.flags);
                    
                    //check if the email is related with current member
                    if(VMail.App.type == "multi" && (userinfo.email == "data.immersion@gmail.com" || userinfo.email == "data.immersion.2016@gmail.com")){
                        var push_or_not = 0;
                        var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == email.fromField[0]; });
                        if(results.length != 0){
                            push_or_not = 1;
                        }
                        for(var t in email.toField){
                            var user = email.toField[t];
                            var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == user[0]; });
                            if(results.length != 0){
                                push_or_not = 1;
                            }
                        }
                        for(var t in email.ccField){
                            var user = email.ccField[t];
                            var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == user[0]; });
                            if(results.length != 0){
                                push_or_not = 1;
                            }
                        }
                        if(push_or_not == 1){
                            var fromField, toField = new Array(email.toField.length), ccField = new Array(email.ccField == undefined? 0:email.ccField.length);
                            fromField = [email.fromField[1].trim().toLowerCase()];
                            for (var ii = 0; ii < email.toField.length; ii++) {
                                toField[ii] = [email.toField[ii][1].trim().toLowerCase()];
                            }
                            if (email.ccField !== undefined) {
                                for (var ii = 0; ii < email.ccField.length; ii++) {
                                    ccField[ii] = [email.ccField[ii][1].trim().toLowerCase()];
                                }
                            } else {
                                ccField = [];
                            }

                            //only keep emails with another member involved in the address
                            var addrs = fromField.concat(toField, ccField);
                            var keep = 0;
                            for(var kk = 0; kk < addrs.length; kk++){
                                if(member_aliases.indexOf(addrs[kk]) != -1){ // 
                                    keep = 1; break;
                                }
                            }
                            if(keep == 1) emails.push(email);
                        }
                    }
                    else{
                        var fromField, toField = new Array(email.toField.length), ccField = new Array(email.ccField == undefined? 0:email.ccField.length);
                        fromField = [email.fromField[1].trim().toLowerCase()];
                        for (var ii = 0; ii < email.toField.length; ii++) {
                            toField[ii] = [email.toField[ii][1].trim().toLowerCase()];
                        }
                        if (email.ccField !== undefined) {
                            for (var ii = 0; ii < email.ccField.length; ii++) {
                                ccField[ii] = [email.ccField[ii][1].trim().toLowerCase()];
                            }
                        } else {
                            ccField = [];
                        }

                        //only keep emails with another member involved in the address
                        var addrs = fromField.concat(toField, ccField);
                        var keep = 0;
                        for(var kk = 0; kk < addrs.length; kk++){
                            if(member_aliases.indexOf(addrs[kk]) != -1){ // 
                                keep = 1; break;
                            }
                        }
                        if(keep == 1) emails.push(email);
                    }
                } 
                else if (rawemails[i] !== null && rawemails[i].auto !== true) {
                    //console.log("nonparse " + rawemails[i].flags);
                    if(rawemails[i].flags == undefined) rawemails[i].flags = "Seen";
                    
                    //check if the email is related with current member
                    if(VMail.App.type == "multi" && (userinfo.email == "data.immersion@gmail.com" || userinfo.email == "data.immersion.2016@gmail.com")){
                        var push_or_not = 0;
                        var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == rawemails[i].fromField[0]; });
                        if(results.length != 0){
                            push_or_not = 1;
                        }
                        for(var t in rawemails[i].toField){
                            var user = rawemails[i].toField[t];
                            var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == user[0]; });
                            if(results.length != 0){
                                push_or_not = 1;
                            }
                        }
                        for(var t in rawemails[i].ccField){
                            var user = rawemails[i].ccField[t];
                            var results = $.grep(name_emails, function (e) { return e.name == userinfo.name && e.name == user[0]; });
                            if(results.length != 0){
                                push_or_not = 1;
                            }
                        }
                        if(push_or_not == 1){
                            var fromField, toField = new Array(rawemails[i].toField.length), ccField = new Array(rawemails[i].ccField == undefined? 0:rawemails[i].ccField.length);
                            fromField = [rawemails[i].fromField[1].trim().toLowerCase()];
                            for (var ii = 0; ii < rawemails[i].toField.length; ii++) {
                                toField[ii] = [rawemails[i].toField[ii][1].trim().toLowerCase()];
                            }
                            if (rawemails[i].ccField !== undefined) {
                                for (var ii = 0; ii < rawemails[i].ccField.length; ii++) {
                                    ccField[ii] = [rawemails[i].ccField[ii][1].trim().toLowerCase()];
                                }
                            } else {
                                ccField = [];
                            }

                            //only keep emails with another member involved in the address
                            var addrs = fromField.concat(toField, ccField);
                            var keep = 0;
                            for(var kk = 0; kk < addrs.length; kk++){
                                if(member_aliases.indexOf(addrs[kk]) != -1){ // 
                                    keep = 1; break;
                                }
                            }
                            if(keep == 1) emails.push(rawemails[i]);
                        }
                    }
                    else{ 
                        var fromField, toField = new Array(rawemails[i].toField.length), ccField = new Array(rawemails[i].ccField == undefined? 0:rawemails[i].ccField.length);
                        fromField = [rawemails[i].fromField[1].trim().toLowerCase()];
                        for (var ii = 0; ii < rawemails[i].toField.length; ii++) {
                            toField[ii] = [rawemails[i].toField[ii][1].trim().toLowerCase()];
                        }
                        if (rawemails[i].ccField !== undefined) {
                            for (var ii = 0; ii < rawemails[i].ccField.length; ii++) {
                                ccField[ii] = [rawemails[i].ccField[ii][1].trim().toLowerCase()];
                            }
                        } else {
                            ccField = [];
                        }

                        //only keep emails with another member involved in the address
                        var addrs = fromField.concat(toField, ccField);
                        var keep = 0;
                        for(var kk = 0; kk < addrs.length; kk++){
                            if(member_aliases.indexOf(addrs[kk]) != -1){ // 
                                keep = 1; break;
                            }
                        }
                        if(keep == 1){ 
                            if(rawemails[i].dateField > 0){
                                if(i != 0 && i != rawemails.length - 1 && rawemails[i - 1] != null && rawemails[i + 1] != null){
                                    if(Math.abs(rawemails[i].dateField - rawemails[i - 1].dateField) < 1000000 && Math.abs(rawemails[i].dateField - rawemails[i + 1].dateField) < 1000000)
                                        emails.push(rawemails[i]);
                                }
                                else{
                                    emails.push(rawemails[i]);
                                }
                            }
                            // emails.push(rawemails[i]);
                        }


                    }
                }
                
            }
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
            userinfo.aliases.forEach(function(email){
                var results = $.grep(VMail.App.not_aliases, function(e){ return email.indexOf(e) != -1; });
                if(results.length == 0) my[email] = true;
                // if(email.indexOf("docs.google") == -1 && email.indexOf("github.com") == -1 && email.indexOf("facebookmail.com") == -1 && email.indexOf("noreply") == -1 && email.indexOf("webex.com") == -1 && email.indexOf("doodle.com") == -1 && email.indexOf("dropbox.com") == -1 && email.indexOf("buzz+") == -1){
                //     my[email] = true;
                // }
            });

            // normalize data
            emails.forEach(function (mail) {
                if(member_aliases.indexOf(mail.fromField[1].trim().toLowerCase()) != -1){
                    mail.fromField = [normalizeName(mail.fromField[0], mail.fromField[1]), mail.fromField[1].trim().toLowerCase()];
                }
                else{
                    mail.fromField = [];
                }
                
                var ind = 0;
                for (var i = 0; i < mail.toField.length; i++) {
                    if(member_aliases.indexOf(mail.toField[i][1].trim().toLowerCase()) != -1){
                        mail.toField[i] = [
                            normalizeName(mail.toField[i][0], mail.toField[i][1]),
                            mail.toField[i][1].trim().toLowerCase()];
                        ind++;
                    }
                }
                mail.toField.slice(0, ind);
                if (mail.ccField !== undefined) {
                    var ind = 0;
                    for (var i = 0; i < mail.ccField.length; i++) {
                        if(member_aliases.indexOf(mail.ccField[i][1].trim().toLowerCase()) != -1){
                            mail.ccField[ind] = [
                                normalizeName(mail.ccField[i][0], mail.ccField[i][1]),
                                mail.ccField[i][1].trim().toLowerCase()];
                            ind++;
                        }
                    }
                    mail.ccField.slice(0, ind);
                } else {
                    mail.ccField = [];
                }
            });
            
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
                    if(email.indexOf("docs.google") == -1 && email.indexOf("github.com") == -1 && email.indexOf("facebookmail.com") == -1 && email.indexOf("noreply") == -1 && email.indexOf("webex.com") == -1 && email.indexOf("doodle.com") == -1 && email.indexOf("dropbox.com") == -1 && email.indexOf("buzz+") == -1){
                        if (!(email in email_to_name)) {
                            email_to_name[email] = name;
                        }

                        // overwrite the name if the previous name is the same as email or he is the sender
                        if (name !== email && (email_to_name[email] === email || email === mail.fromField[1])) {
                            email_to_name[email] = name;
                        }
                    }
                });
            });

            // DONE assign each email address a unique name
            // assign each name a unique contact with all the email addresses
            var uniqid = 0;
            var contacts = {};
            var name_to_id = {};
            var id_to_email = {};
            var email_to_org = {};
            $('#loader').html("Analyzing metadata: setting up the DB (20%).");
            
//            var the_index = 0, the_length = Object.keys(email_to_name).length;
            console.time('construct org list');//console.log(the_length);
//            var construct_org_list = function() {
//                for (; the_index < the_length; the_index++) {
                for (var email in email_to_name) {
//                    var email = Object.keys(email_to_name)[the_index];
                    var name = email_to_name[email];
                    var this_org, this_domain;
                    var search_or_not = 1;
                    if (!(name in name_to_id)) {
                        name_to_id[name] = uniqid.toString();
                        id_to_email[uniqid.toString()] = email;
                        contacts[uniqid.toString()] = { 'name': name, 'aliases': [email.toLowerCase()], 'sent': 0, 'rcv': 0, 'new': 0,  'slack_sent': 0, 'slack_rcv': 0, 'id': uniqid.toString() };
                        uniqid++;

                        //get a list of different email ending (organizations) by going through all the emails
                        var domain = email.substring(email.indexOf("@") + 1, email.length).toLowerCase();
                        this_domain = domain;
                        for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                            if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                                search_or_not = 0; break;
                            }
                        }
                        if(search_or_not == 1){
                          try{
                            var result = $.grep(VMail.App.orgs, function(e){ return e.domain == domain; });
                            if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                                var the_domain = domain;
                                while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                    the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                    var org_lookup = $.grep(VMail.App.orgs, function(e){ return e.domain == the_domain; })
                                    if(org_lookup.length == 1){//we find the only one. should be the correct org.
    //                                    org_lookup[0].num++;
    //                                    email_to_org[email] = the_domain;
                                        this_domain = the_domain;
                                        this_org = org_lookup[0];
                                        break;
                                    }
                                    else if(org_lookup.length > 1){//more than one results, should pick up the right one
    //                                    console.log(org_lookup);//reverse later to see what it is
    //                                    org_lookup[0].num++;
    //                                    email_to_org[email] = the_domain;
                                        this_domain = the_domain;
                                        this_org = org_lookup[0];
                                        break;
                                    }
                                }
                                if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                                    the_domain = domain;
                                    result = $.grep(univ_data, function(e){ return e.domain == domain; });
                                    if(result.length == 0){//not found in the univ_list, next we make sure its family domains are not in the list
                                        while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                            the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                            var univ_lookup = $.grep(univ_data, function(e){ return e.domain == the_domain; })
                                            if(univ_lookup.length == 1){//we find the only one. should be the correct org.
                                                this_domain = the_domain;
                                                VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : univ_lookup[0].name, 'num' : 0});
                                                this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                            email_to_org[email] = the_domain;
                                                break;
                                            }
                                            else if(univ_lookup.length > 1){//more than one results, should pick up the right one
    //                                            console.log(univ_lookup); //reverse later to see what it is
                                                this_domain = the_domain;
                                                VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : univ_lookup[0].name, 'num' : 0});
                                                this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                            email_to_org[email] = the_domain;
                                                break;
                                            }
                                        }
                                        if(the_domain.indexOf(".") == -1){//not a university
                                            this_domain = domain;
                                            VMail.App.orgs.push({'domain': domain.toLowerCase(), 'org' : domain, 'num' : 0});
                                            this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                        email_to_org[email] = domain;
                                        }
                                    }
                                    else{
                                        this_domain = the_domain;
                                        VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : result[0].name, 'num' : 0});
                                        this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                    email_to_org[email] = the_domain;
                                    }
                                }
                            }
                            else{
                                this_org = result[0];
    //                            result[0].num ++;
    //                            email_to_org[email] = domain;
                            }
                          }
                          catch(err) {
                              console.log("ERROR: " + err.message);
                          }
                        }
                    }
                    try{
                      if((!(email in email_to_org)) && search_or_not){
                        email_to_org[email] = this_domain;
                        this_org.num++;
                        email = email.toLowerCase();
                        if(contacts[name_to_id[name]]['aliases'].indexOf(email) == -1) contacts[name_to_id[name]]['aliases'].push(email);
                      }
                    }
                    catch(err) {
                        VMail.App.orgs = [];
                        console.log("ERROR: " + err.message);
                    }
                }
//            };
//            construct_org_list();
            console.timeEnd('construct org list');
            
            //add my emails to email_to_org
            for(var email in my){
                var domain = email.substring(email.indexOf("@") + 1, email.length).toLowerCase();
                var search_or_not = 1;
                for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                    if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                        search_or_not = 0; break;
                    }
                }
                if(search_or_not == 1){
                    var result = $.grep(VMail.App.orgs, function(e){ return e.domain == domain; });
                    if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                        var the_domain = domain;
                        while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                            the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                            var org_lookup = $.grep(VMail.App.orgs, function(e){ return e.domain == the_domain; })
                            if(org_lookup.length == 1){//we find the only one. should be the correct org.
                                org_lookup[0].num++;
                                email_to_org[email] = the_domain;
                                break;
                            }
                            else if(org_lookup.length > 1){//more than one results, should pick up the right one
//                                    console.log(org_lookup);//reverse later to see what it is
                                org_lookup[0].num++;
                                email_to_org[email] = the_domain;
                                break;
                            }
                        }
                        if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                            the_domain = domain;
                            result = $.grep(univ_data, function(e){ return e.domain == domain; });
                            if(result.length == 0){//not found in the univ_list, next we make sure its family domains are not in the list
                                while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                    the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                    var univ_lookup = $.grep(univ_data, function(e){ return e.domain == the_domain; })
                                    if(univ_lookup.length == 1){//we find the only one. should be the correct org.
                                        VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : univ_lookup[0].name, 'num' : 1});
                                        email_to_org[email] = the_domain;
                                        break;
                                    }
                                    else if(univ_lookup.length > 1){//more than one results, should pick up the right one
//                                            console.log(univ_lookup); //reverse later to see what it is
                                        VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : univ_lookup[0].name, 'num' : 1});
                                        email_to_org[email] = the_domain;
                                        break;
                                    }
                                }
                                if(the_domain.indexOf(".") == -1){//not a university
                                    VMail.App.orgs.push({'domain': domain, 'org' : domain, 'num' : 1});
                                    email_to_org[email] = domain;
                                }
                            }
                            else{
                                VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : result[0].name, 'num' : 1});
                                email_to_org[email] = the_domain;
//                                break;
//                                result[0].num ++;
                            }
                        }
                    }
                    else{
                        result[0].num ++;
                        email_to_org[email] = domain;
                    }
                }
            }
            var comp = function (a, b) {
                if (a.num !== b.num) {
                    return b.num - a.num;
                }
                return 0;
            };
            if(VMail.App.type == "multi" && VMail.App.usersinfo.indexOf(userinfo) == VMail.App.usersinfo.length - 1) VMail.App.orgs.sort(comp);
            console.time('no. of sent and rcv');
            // calculate the no. of sent and rcv for each unique contact
            emails.forEach(function (mail) {
                var a = mail.fromField[1];
                if(VMail.App.type == "multi" && (VMail.App.userinfo.email == "data.immersion@gmail.com" || VMail.App.userinfo.email == "data.immersion.2016@gmail.com")){
                    if(mail.fromField[0] == userinfo['name']){//isSent
                        var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                        addrs.forEach(function (addr) {
                            var b_name = addr[0];
                            var b = addr[1];
                            if (b in email_to_name) {
                                contacts[name_to_id[email_to_name[b]]]['sent']++;
                            }
                        });
                    }
                    else{
                        if (a in email_to_name) {
                            contacts[name_to_id[email_to_name[a]]]['rcv']++;
                            if(mail.flags.indexOf("Seen") == -1) contacts[name_to_id[email_to_name[a]]]['new']++;
                        }
                    }
                }
                else{
                    if (mail.isSent) {
                        var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                        addrs.forEach(function (addr) {
                            var b_name = addr[0];
                            var b = addr[1];
                            if (b in email_to_name) {
                                contacts[name_to_id[email_to_name[b]]]['sent']++;
                            }
                        });
                    } else {
                        if (a in email_to_name) {
                            contacts[name_to_id[email_to_name[a]]]['rcv']++;
                            if(mail.flags.indexOf("Seen") == -1) contacts[name_to_id[email_to_name[a]]]['new']++;
                        }
                    }
                }
            });console.timeEnd('no. of sent and rcv');

            for (var name in name_to_id) {
                var id = name_to_id[name];
                var contact = contacts[id];
                if (Math.min(contact['sent'], contact['rcv']) < 1) {
                    //if the name doesn't belong to people in the group, delete related info
                    var is_user = 0;
                    if(VMail.App.usersinfo){
                        for(var ii=0; ii<VMail.App.usersinfo.length; ii++){
//                            if(id_to_email[id] == "sanjay.guruprasad@gmail.com") console.log(name+","+id);
//                            if(id_to_email[id] == VMail.App.usersinfo[ii].email){
//                                is_user = 1; break;
//                            }
                            if(name == VMail.App.usersinfo[ii].name){
                                is_user = 1; break;
                            }
                        }
                    }
                    if(is_user == 0){
                        contact['aliases'].forEach(function (email) {
                            delete email_to_name[email];
                        });
                        delete contacts[id];
                    }
                }
            }
            
            d3.select('#loader').html("Analyzing metadata: setting up the DB (70%).");
            // make the events list
            var events = [];console.time('event list');
            emails.forEach(function (mail) {
                var a = mail.fromField[1];
                var tmp = [], tmp_org = [];
                var addrs = mail.toField.concat(mail.ccField); 
                addrs.forEach(function (addr) {
                    var b_name = addr[0];
                    var b = addr[1];

                    if (b !== a && !(b in my) && (b.indexOf("docs.google") == -1 && b.indexOf("github.com") == -1 && b.indexOf("facebookmail.com") == -1 && b.indexOf("noreply") == -1 && b.indexOf("webex.com") == -1 && b.indexOf("doodle.com") == -1 && b.indexOf("dropbox.com") == -1 && b.indexOf("buzz+") == -1)) {
                        if (b in email_to_name) {
                            var id = name_to_id[email_to_name[b]];
//                            if(mail.threadid=="1505504347206425811") console.log(id+","+email_to_name[b]);
                        } else {
                            var id = b;
                        }
                        if(id != ""){ 
                            tmp.push(id.toString());
//                            if(typeof(email_to_org[b]) == "undefined"){
//                                tmp_org.push("undefined");
//                            }
//                            else{
//                                var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[b]; });
//                                tmp_org.push(VMail.App.orgs.indexOf(results[0]));
//                            }
                            tmp_org.push(typeof(email_to_org[b]) == "undefined"? "undefined":email_to_org[b].toString().toLowerCase());
                        }
                    }
                });

                if(VMail.App.type == "multi" && (VMail.App.userinfo.email == "data.immersion@gmail.com" || VMail.App.userinfo.email == "data.immersion.2016@gmail.com")){
                    if(mail.fromField[0] == userinfo['name'] && (a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1 && a.indexOf("doodle.com") == -1 && a.indexOf("dropbox.com") == -1 && a.indexOf("buzz+") == -1)){//isSent  
//                        if(typeof(email_to_org[a]) == "undefined"){
//                            var org  = "undefined";
//                        }
//                        else{
//                            var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[a]; });
//                            var org = VMail.App.orgs.indexOf(results[0]);
//                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': "Seen" });
                    }
                    else if(a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply@google.com") == -1){
                        if (a in email_to_name) {//if(email_to_name[a]=="Sanjay Guruprasad") console.log("from found!");
                            var id = name_to_id[email_to_name[a]];
                        } else {
                            var id = a;
                        }
//                        if(typeof(email_to_org[a]) == "undefined"){
//                            var org  = "undefined";
//                        }
//                        else{
//                            var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[a]; });
//                            var org = VMail.App.orgs.indexOf(results[0]);
//                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source': id, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': mail.flags });
                    }
                }
                else{
                    if (mail.isSent && (a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1 && a.indexOf("doodle.com") == -1 && a.indexOf("dropbox.com") == -1 && a.indexOf("buzz+") == -1)) { // 
//                        if(typeof(email_to_org[a]) == "undefined"){
//                            var org  = "undefined";
//                        }
//                        else{
//                            var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[a]; });
//                            var org = VMail.App.orgs.indexOf(results[0]);
//                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': "Seen" });
                    } else if(a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1 && a.indexOf("doodle.com") == -1 && a.indexOf("dropbox.com") == -1 && a.indexOf("buzz+") == -1){ // 
                        if (a in email_to_name) {//if(email_to_name[a]=="Sanjay Guruprasad") console.log("from found!");
                            var id = name_to_id[email_to_name[a]];
                        } else {
                            var id = a;
                        }
//                        if(typeof(email_to_org[a]) == "undefined"){
//                            var org  = "undefined";
//                        }
//                        else{
//                            var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[a]; });
//                            var org = VMail.App.orgs.indexOf(results[0]);
//                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source': id, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': mail.flags });
                    }
                }
            });console.timeEnd('event list');
            
            return new InMemoryDB(events, contacts, Object.keys(my), stats);
          
//          });
          
        }

        function setupDB_simplified(userinfo, rawemails, stats, univ_data) {
            var today = (+new Date()) / 1000 + 60 * 60 * 24 * 2;
            var beginning = (+new Date(2004, 3, 1)) / 1000;
            
            //sort emails by timestamp
            var emails = [];
            var emails_for_aliases = [];
            var member_aliases = [];
            for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
                member_aliases = member_aliases.concat(VMail.App.usersinfo[kk].aliases);
            }
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
                    var flags_start = prefixheader.indexOf("FLAGS(");
                    if (flags_start >= 0) {
                        email.flags = prefixheader.substring(flags_start + 6, prefixheader.substring(flags_start + 6, prefixheader.length).indexOf(")"));
                    }
                    else{
                        email.flags = "Seen";
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
                    
                    var fromField, toField = new Array(email.toField.length), ccField = new Array(email.ccField == undefined? 0:email.ccField.length);
                    fromField = [email.fromField[1].trim().toLowerCase()];
                    for (var ii = 0; ii < email.toField.length; ii++) {
                        toField[ii] = [email.toField[ii][1].trim().toLowerCase()];
                    }
                    if (email.ccField !== undefined) {
                        for (var ii = 0; ii < email.ccField.length; ii++) {
                            ccField[ii] = [email.ccField[ii][1].trim().toLowerCase()];
                        }
                    } else {
                        ccField = [];
                    }

                    // emails.push(email);

                    //only keep emails with another member involved in the address
                    var addrs = fromField.concat(toField, ccField);
                    var keep = 0;
                    for(var kk = 0; kk < addrs.length; kk++){
                        if(member_aliases.indexOf(addrs[kk]) != -1){ // 
                            keep = 1; break;
                        }
                    }
                    if(keep == 1) emails.push(email);
                    emails_for_aliases.push(email);
                } 
                else if (rawemails[i] !== null && rawemails[i].auto !== true) {
                    //console.log("nonparse " + rawemails[i].flags);
                    if(rawemails[i].flags == undefined) rawemails[i].flags = "Seen";
                    
                    var fromField, toField = new Array(rawemails[i].toField.length), ccField = new Array(rawemails[i].ccField == undefined? 0:rawemails[i].ccField.length);
                    fromField = [rawemails[i].fromField[1].trim().toLowerCase()];
                    for (var ii = 0; ii < rawemails[i].toField.length; ii++) {
                        toField[ii] = [rawemails[i].toField[ii][1].trim().toLowerCase()];
                    }
                    if (rawemails[i].ccField !== undefined) {
                        for (var ii = 0; ii < rawemails[i].ccField.length; ii++) {
                            ccField[ii] = [rawemails[i].ccField[ii][1].trim().toLowerCase()];
                        }
                    } else {
                        ccField = [];
                    }

                    // emails.push(rawemails[i]);

                    //only keep emails with another member involved in the address
                    var addrs = fromField.concat(toField, ccField);
                    var keep = 0;
                    for(var kk = 0; kk < addrs.length; kk++){
                        if(member_aliases.indexOf(addrs[kk]) != -1){ // 
                            keep = 1; break;
                        }
                    }
                    if(keep == 1) emails.push(rawemails[i]);
                    emails_for_aliases.push(rawemails[i]);
                }
                
            }
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
            var my = {}; //var my2 = {};
            emails_for_aliases.forEach(function (email) {
                if (email.isSent) {
                    if(VMail.App.type == "multi" && (VMail.App.userinfo.email == "data.immersion@gmail.com" || VMail.App.userinfo.email == "data.immersion.2016@gmail.com")){
                        if(email.fromField[0] == userinfo['name']) my[email.fromField[1].toLowerCase()] = true;
                    }
                    else if(email.fromField[1].indexOf("docs.google") != -1 || email.fromField[1].indexOf("github.com") != -1 || email.fromField[1].indexOf("facebookmail.com") != -1 || email.fromField[1].indexOf("noreply") != -1 || email.fromField[1].indexOf("webex.com") != -1 || email.fromField[1].indexOf("doodle.com") != -1 || email.fromField[1].indexOf("dropbox.com") != -1 || email.fromField[1].indexOf("buzz+") != -1){//filter wrong aliases  
                        //docs.google.com, github.com, facebookmail.com, noreply@google.com
                    }
                    else if(email.fromField[0] == userinfo['name'] || email.fromField[0].indexOf(userinfo['family_name']) != -1 || email.fromField[0].indexOf(userinfo['given_name']) != -1){ 
                        var reuslts = $.grep(VMail.App.not_aliases, function(e){ return email.fromField[1].indexOf(e) != -1; });
                        if(results.length ==0)
                            my[email.fromField[1].toLowerCase()] = true;
                    }
//                    if(VMail.App.userinfo.email == "data.immersion.2016@gmail.com") my2[email.fromField[1]]=email.fromField[0];
                }
            });

            // normalize data
            emails.forEach(function (mail) {
                if(member_aliases.indexOf(mail.fromField[1].trim().toLowerCase()) != -1){
                    mail.fromField = [normalizeName(mail.fromField[0], mail.fromField[1]), mail.fromField[1].trim().toLowerCase()];
                }
                else{
                    mail.fromField = [];
                }
                
                var ind = 0;
                for (var i = 0; i < mail.toField.length; i++) {
                    if(member_aliases.indexOf(mail.toField[i][1].trim().toLowerCase()) != -1){
                        mail.toField[i] = [
                            normalizeName(mail.toField[i][0], mail.toField[i][1]),
                            mail.toField[i][1].trim().toLowerCase()];
                        ind++;
                    }
                }
                mail.toField.slice(0, ind);
                if (mail.ccField !== undefined) {
                    var ind = 0;
                    for (var i = 0; i < mail.ccField.length; i++) {
                        if(member_aliases.indexOf(mail.ccField[i][1].trim().toLowerCase()) != -1){
                            mail.ccField[ind] = [
                                normalizeName(mail.ccField[i][0], mail.ccField[i][1]),
                                mail.ccField[i][1].trim().toLowerCase()];
                            ind++;
                        }
                    }
                    mail.ccField.slice(0, ind);
                } else {
                    mail.ccField = [];
                }
            });
            
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
                    if(email.indexOf("docs.google") == -1 && email.indexOf("github.com") == -1 && email.indexOf("facebookmail.com") == -1 && email.indexOf("noreply") == -1 && email.indexOf("webex.com") == -1 && email.indexOf("doodle.com") == -1 && email.indexOf("dropbox.com") == -1 && email.indexOf("buzz+") == -1){
                        if (!(email in email_to_name)) {
                            email_to_name[email] = name;
                        }

                        // overwrite the name if the previous name is the same as email or he is the sender
                        if (name !== email && (email_to_name[email] === email || email === mail.fromField[1])) {
                            email_to_name[email] = name;
                        }
                    }
                });
            });

            // DONE assign each email address a unique name
            // assign each name a unique contact with all the email addresses
            var uniqid = 0;
            var contacts = {};
            var name_to_id = {};
            var id_to_email = {};
            var email_to_org = {};
            $('#loader').html("Analyzing metadata: setting up the DB (20%).");

            var member_aliases = {
                email: (userinfo.email),
                name: (userinfo.name),
                aliases: (Object.keys(my)),
                use_length: Math.ceil((emails[emails.length - 1].dateField - emails[0].dateField) / 3600 / 24)
            };
            $.post('/save_aliases', {'json': JSON.stringify(member_aliases)}) //Object.keys(my)
                .success(function () {
//                    alert("Aliases saved for " + userinfo.name);
                }
            );
            
//            var the_index = 0, the_length = Object.keys(email_to_name).length;
            console.time('construct org list');//console.log(the_length);
//            var construct_org_list = function() {
//                for (; the_index < the_length; the_index++) {
                for (var email in email_to_name) {
//                    var email = Object.keys(email_to_name)[the_index];
                    var name = email_to_name[email];
                    var this_org, this_domain;
                    var search_or_not = 1;
                    if (!(name in name_to_id)) {
                        name_to_id[name] = uniqid.toString();
                        id_to_email[uniqid.toString()] = email;
                        contacts[uniqid.toString()] = { 'name': name, 'aliases': [email.toLowerCase()], 'sent': 0, 'rcv': 0, 'new': 0,  'slack_sent': 0, 'slack_rcv': 0, 'id': uniqid.toString() };
                        uniqid++;

                        //get a list of different email ending (organizations) by going through all the emails
                        var domain = email.substring(email.indexOf("@") + 1, email.length).toLowerCase();
                        this_domain = domain;
                        for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                            if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                                search_or_not = 0; break;
                            }
                        }
                        if(search_or_not == 1){
                          try{
                            var result = $.grep(VMail.App.orgs, function(e){ return e.domain == domain; });
                            if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                                var the_domain = domain;
                                while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                    the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                    var org_lookup = $.grep(VMail.App.orgs, function(e){ return e.domain == the_domain; })
                                    if(org_lookup.length == 1){//we find the only one. should be the correct org.
    //                                    org_lookup[0].num++;
    //                                    email_to_org[email] = the_domain;
                                        this_domain = the_domain;
                                        this_org = org_lookup[0];
                                        break;
                                    }
                                    else if(org_lookup.length > 1){//more than one results, should pick up the right one
    //                                    console.log(org_lookup);//reverse later to see what it is
    //                                    org_lookup[0].num++;
    //                                    email_to_org[email] = the_domain;
                                        this_domain = the_domain;
                                        this_org = org_lookup[0];
                                        break;
                                    }
                                }
                                if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                                    the_domain = domain;
                                    result = $.grep(univ_data, function(e){ return e.domain == domain; });
                                    if(result.length == 0){//not found in the univ_list, next we make sure its family domains are not in the list
                                        while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                            the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                            var univ_lookup = $.grep(univ_data, function(e){ return e.domain == the_domain; })
                                            if(univ_lookup.length == 1){//we find the only one. should be the correct org.
                                                this_domain = the_domain;
                                                VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : univ_lookup[0].name, 'num' : 0});
                                                this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                            email_to_org[email] = the_domain;
                                                break;
                                            }
                                            else if(univ_lookup.length > 1){//more than one results, should pick up the right one
    //                                            console.log(univ_lookup); //reverse later to see what it is
                                                this_domain = the_domain;
                                                VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : univ_lookup[0].name, 'num' : 0});
                                                this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                            email_to_org[email] = the_domain;
                                                break;
                                            }
                                        }
                                        if(the_domain.indexOf(".") == -1){//not a university
                                            this_domain = domain;
                                            VMail.App.orgs.push({'domain': domain.toLowerCase(), 'org' : domain, 'num' : 0});
                                            this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                        email_to_org[email] = domain;
                                        }
                                    }
                                    else{
                                        this_domain = the_domain;
                                        VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : result[0].name, 'num' : 0});
                                        this_org = VMail.App.orgs[VMail.App.orgs.length - 1];
    //                                    email_to_org[email] = the_domain;
                                    }
                                }
                            }
                            else{
                                this_org = result[0];
    //                            result[0].num ++;
    //                            email_to_org[email] = domain;
                            }
                          }
                          catch(err) {
                              console.log("ERROR: " + err.message);
                          }
                        }
                    }
                    try{
                      if((!(email in email_to_org)) && search_or_not){
                        email_to_org[email] = this_domain;
                        this_org.num++;
                        email = email.toLowerCase();
                        if(contacts[name_to_id[name]]['aliases'].indexOf(email) == -1) contacts[name_to_id[name]]['aliases'].push(email);
                      }
                    }
                    catch(err) {
                        VMail.App.orgs = [];
                        console.log("ERROR: " + err.message);
                    }
                }
//            };
//            construct_org_list();
            console.timeEnd('construct org list');
            
            //add my emails to email_to_org
            for(var email in my){
                var domain = email.substring(email.indexOf("@") + 1, email.length).toLowerCase();
                var search_or_not = 1;
                for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                    if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                        search_or_not = 0; break;
                    }
                }
                if(search_or_not == 1){
                    var result = $.grep(VMail.App.orgs, function(e){ return e.domain == domain; });
                    if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                        var the_domain = domain;
                        while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                            the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                            var org_lookup = $.grep(VMail.App.orgs, function(e){ return e.domain == the_domain; })
                            if(org_lookup.length == 1){//we find the only one. should be the correct org.
                                org_lookup[0].num++;
                                email_to_org[email] = the_domain;
                                break;
                            }
                            else if(org_lookup.length > 1){//more than one results, should pick up the right one
//                                    console.log(org_lookup);//reverse later to see what it is
                                org_lookup[0].num++;
                                email_to_org[email] = the_domain;
                                break;
                            }
                        }
                        if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                            the_domain = domain;
                            result = $.grep(univ_data, function(e){ return e.domain == domain; });
                            if(result.length == 0){//not found in the univ_list, next we make sure its family domains are not in the list
                                while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                    the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                    var univ_lookup = $.grep(univ_data, function(e){ return e.domain == the_domain; })
                                    if(univ_lookup.length == 1){//we find the only one. should be the correct org.
                                        VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : univ_lookup[0].name, 'num' : 1});
                                        email_to_org[email] = the_domain;
                                        break;
                                    }
                                    else if(univ_lookup.length > 1){//more than one results, should pick up the right one
//                                            console.log(univ_lookup); //reverse later to see what it is
                                        VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : univ_lookup[0].name, 'num' : 1});
                                        email_to_org[email] = the_domain;
                                        break;
                                    }
                                }
                                if(the_domain.indexOf(".") == -1){//not a university
                                    VMail.App.orgs.push({'domain': domain, 'org' : domain, 'num' : 1});
                                    email_to_org[email] = domain;
                                }
                            }
                            else{
                                VMail.App.orgs.push({'domain': the_domain.toLowerCase(), 'org' : result[0].name, 'num' : 1});
                                email_to_org[email] = the_domain;
//                                break;
//                                result[0].num ++;
                            }
                        }
                    }
                    else{
                        result[0].num ++;
                        email_to_org[email] = domain;
                    }
                }
            }
            var comp = function (a, b) {
                if (a.num !== b.num) {
                    return b.num - a.num;
                }
                return 0;
            };
            if(VMail.App.type == "multi" && VMail.App.usersinfo.indexOf(userinfo) == VMail.App.usersinfo.length - 1) VMail.App.orgs.sort(comp);
            console.time('no. of sent and rcv');
            // calculate the no. of sent and rcv for each unique contact
            emails.forEach(function (mail) {
                var a = mail.fromField[1];
                if(VMail.App.type == "multi" && (VMail.App.userinfo.email == "data.immersion@gmail.com" || VMail.App.userinfo.email == "data.immersion.2016@gmail.com")){
                    if(mail.fromField[0] == userinfo['name']){//isSent
                        var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                        addrs.forEach(function (addr) {
                            var b_name = addr[0];
                            var b = addr[1];
                            if (b in email_to_name) {
                                contacts[name_to_id[email_to_name[b]]]['sent']++;
                            }
                        });
                    }
                    else{
                        if (a in email_to_name) {
                            contacts[name_to_id[email_to_name[a]]]['rcv']++;
                            if(mail.flags.indexOf("Seen") == -1) contacts[name_to_id[email_to_name[a]]]['new']++;
                        }
                    }
                }
                else{
                    if (mail.isSent) {
                        var addrs = [mail.fromField].concat(mail.toField, mail.ccField);
                        addrs.forEach(function (addr) {
                            var b_name = addr[0];
                            var b = addr[1];
                            if (b in email_to_name) {
                                contacts[name_to_id[email_to_name[b]]]['sent']++;
                            }
                        });
                    } else {
                        if (a in email_to_name) {
                            contacts[name_to_id[email_to_name[a]]]['rcv']++;
                            if(mail.flags.indexOf("Seen") == -1) contacts[name_to_id[email_to_name[a]]]['new']++;
                        }
                    }
                }
            });console.timeEnd('no. of sent and rcv');

            for (var name in name_to_id) {
                var id = name_to_id[name];
                var contact = contacts[id];
                if (Math.min(contact['sent'], contact['rcv']) < 1) {
                    //if the name doesn't belong to people in the group, delete related info
                    var is_user = 0;
                    if(VMail.App.usersinfo){
                        for(var ii=0; ii<VMail.App.usersinfo.length; ii++){
//                            if(id_to_email[id] == "sanjay.guruprasad@gmail.com") console.log(name+","+id);
//                            if(id_to_email[id] == VMail.App.usersinfo[ii].email){
//                                is_user = 1; break;
//                            }
                            if(name == VMail.App.usersinfo[ii].name){
                                is_user = 1; break;
                            }
                        }
                    }
                    if(is_user == 0){
                        contact['aliases'].forEach(function (email) {
                            delete email_to_name[email];
                        });
                        delete contacts[id];
                    }
                }
            }
            
            d3.select('#loader').html("Analyzing metadata: setting up the DB (70%).");
            // make the events list
            var events = [];console.time('event list');
            emails.forEach(function (mail) {
                var a = mail.fromField[1];
                var tmp = [], tmp_org = [];
                var addrs = mail.toField.concat(mail.ccField); 
                addrs.forEach(function (addr) {
                    var b_name = addr[0];
                    var b = addr[1];

                    if (b !== a && !(b in my) && (b.indexOf("docs.google") == -1 && b.indexOf("github.com") == -1 && b.indexOf("facebookmail.com") == -1 && b.indexOf("noreply") == -1 && b.indexOf("webex.com") == -1 && b.indexOf("doodle.com") == -1 && b.indexOf("dropbox.com") == -1 && b.indexOf("buzz+") == -1)) {
                        if (b in email_to_name) {
                            var id = name_to_id[email_to_name[b]];
//                            if(mail.threadid=="1505504347206425811") console.log(id+","+email_to_name[b]);
                        } else {
                            var id = b;
                        }
                        if(id != ""){ 
                            tmp.push(id.toString());
//                            if(typeof(email_to_org[b]) == "undefined"){
//                                tmp_org.push("undefined");
//                            }
//                            else{
//                                var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[b]; });
//                                tmp_org.push(VMail.App.orgs.indexOf(results[0]));
//                            }
                            tmp_org.push(typeof(email_to_org[b]) == "undefined"? "undefined":email_to_org[b].toString().toLowerCase());
                        }
                    }
                });

                if(VMail.App.type == "multi" && (VMail.App.userinfo.email == "data.immersion@gmail.com" || VMail.App.userinfo.email == "data.immersion.2016@gmail.com")){
                    if(mail.fromField[0] == userinfo['name'] && (a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1 && a.indexOf("doodle.com") == -1 && a.indexOf("dropbox.com") == -1 && a.indexOf("buzz+") == -1)){//isSent  
//                        if(typeof(email_to_org[a]) == "undefined"){
//                            var org  = "undefined";
//                        }
//                        else{
//                            var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[a]; });
//                            var org = VMail.App.orgs.indexOf(results[0]);
//                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': "Seen" });
                    }
                    else if(a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply@google.com") == -1){
                        if (a in email_to_name) {//if(email_to_name[a]=="Sanjay Guruprasad") console.log("from found!");
                            var id = name_to_id[email_to_name[a]];
                        } else {
                            var id = a;
                        }
//                        if(typeof(email_to_org[a]) == "undefined"){
//                            var org  = "undefined";
//                        }
//                        else{
//                            var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[a]; });
//                            var org = VMail.App.orgs.indexOf(results[0]);
//                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source': id, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': mail.flags });
                    }
                }
                else{
                    if (mail.isSent && (a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1 && a.indexOf("doodle.com") == -1 && a.indexOf("dropbox.com") == -1&& a.indexOf("buzz+") == -1)) { // 
//                        if(typeof(email_to_org[a]) == "undefined"){
//                            var org  = "undefined";
//                        }
//                        else{
//                            var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[a]; });
//                            var org = VMail.App.orgs.indexOf(results[0]);
//                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': "Seen" });
                    } else if(a.indexOf("docs.google") == -1 && a.indexOf("github.com") == -1 && a.indexOf("facebookmail.com") == -1 && a.indexOf("noreply") == -1 && a.indexOf("webex.com") == -1 && a.indexOf("doodle.com") == -1 && a.indexOf("dropbox.com") == -1 && a.indexOf("buzz+") == -1){ // 
                        if (a in email_to_name) {//if(email_to_name[a]=="Sanjay Guruprasad") console.log("from found!");
                            var id = name_to_id[email_to_name[a]];
                        } else {
                            var id = a;
                        }
//                        if(typeof(email_to_org[a]) == "undefined"){
//                            var org  = "undefined";
//                        }
//                        else{
//                            var results = $.grep(VMail.App.orgs, function(e){ return e.domain == email_to_org[a]; });
//                            var org = VMail.App.orgs.indexOf(results[0]);
//                        }
                        var org = (typeof(email_to_org[a]) == "undefined"? "undefined":email_to_org[a]);
                        events.push({ 'threadid': mail.threadid, 'timestamp': mail.dateField, 'source': id, 'source_org': org, 'destinations': tmp, 'destinations_org': tmp_org, 'flags': mail.flags });
                    }
                }
            });console.timeEnd('event list');
            
            return new InMemoryDB(events, contacts, Object.keys(my), stats);
          
//          });
          
        }
        DB.setupDB = setupDB;
        DB.setupDB_merge = setupDB_merge;
        DB.setupDB_simplified = setupDB_simplified;
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
