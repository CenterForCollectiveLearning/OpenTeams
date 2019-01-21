var VMail;
(function (VMail) {
    (function (Graph) {
        Graph.communityDetection = function (graph) {
            //var nodes = graph.nodes;
            var nodesMap = {};
            var the_links;
            if(VMail.App.node_as_org == 0){
                var this_nodes, this_links;
                if(VMail.App.member_selected == 1){
                    this_nodes = graph.member_nodes; this_links = graph.member_links;
                }
                else{
                    this_nodes = graph.nodes; this_links = graph.links;
                }
                for (var i in this_nodes) {
                    if (this_nodes[i].skip) { // || graph.nodes[i].attr.size == 0
                        continue;
                    }
                    if(VMail.App.type == "multi" && (this_nodes[i].skip || this_nodes[i].skip_removed || this_nodes[i].owns.length == 0)){
                        continue;
                    }
                    if(VMail.App.data_source == 1 && this_nodes[i].skip && this_nodes[i].skipslack){//slack data
                        continue;
                    }
                    //don't count member nodes in
//                    var is_user = 0;
//                    for(var ii = 0; ii < VMail.App.usersinfo.length; ii++){
//                        if(graph.nodes[i].attr.contact.name == VMail.App.usersinfo[ii].name){
//                            is_user = 1;
//                        }
//                    }
//                    if(is_user) continue;
                    
                    var node = this_nodes[i];
                    nodesMap[node.id] = { node: node, degree: 0 };
                }
//                the_links = graph.links; 
                var filteredLinks = this_links.filter(function (link) {
                    if(VMail.App.data_source == 1){
                        return !link.skipcommunity && !link.skipslack;
                    }
                    else{
                        return !link.skipcommunity;
                    }
                });
                the_links = filteredLinks; 
            }
            else{
                for (var i in graph.org_nodes) {
                    if (graph.org_nodes[i].skip) {
                        continue;
                    }
                    var node = graph.org_nodes[i];
                    nodesMap[node.id] = { node: node, degree: 0 };
                }
                the_links = graph.org_links;
            }
            var m = 0;
            var linksMap = {};

            the_links.forEach(function (link) {
                a = link.source.id;
                b = link.target.id;
                if(VMail.App.data_source == 1){
                    if (link.skipslack|| link.source.skip || link.target.skip) {
                        return;
                    }
                }
                if (link.skip || link.skip2draw || link.skip_removed.length != 0 || link.source.skip || link.target.skip) {
                    return;
                }
                if (!(a in linksMap)) {
                    linksMap[a] = {};
                }
                if (!(b in linksMap)) {
                    linksMap[b] = {};
                }
                if (!(b in linksMap[a])) {
                    linksMap[a][b] = 0;
                    linksMap[b][a] = 0;
                    m++;
                    nodesMap[a].degree += 1;
                    nodesMap[b].degree += 1;
                }
            });

            //console.log(m);
            var communities = {};
            var Q = 0;
            for (var id in nodesMap) {
                communities[id] = { score: nodesMap[id].degree / (2.0 * m), nodes: [id] };
            }
            for (var a in linksMap) {
                for (var b in linksMap[a]) {
                    linksMap[a][b] = 1.0 / (2 * m) - (nodesMap[a].degree * nodesMap[b].degree) / (4.0 * m * m);
                }
            }

            var iter = 0;
            while (iter < 1000) {
                //find largest element of links
                var deltaQ = -1;
                var maxa = undefined;
                var maxb = undefined;
                for (var a in linksMap) {
                    for (var b in linksMap[a]) {
                        if (linksMap[a][b] > deltaQ) {
                            deltaQ = linksMap[a][b];
                            maxa = a;
                            maxb = b;
                        }
                    }
                }
                if (deltaQ < 0)
                    break;

                for (var k in linksMap[maxa]) {
                    if(!Number.isNaN(linksMap[maxa][k])){
                        if (k != maxb) {
                            if (k in linksMap[maxb]) {
                                // k is connected to both a and b
                                linksMap[maxb][k] += linksMap[maxa][k];
                            } else if(!Number.isNaN(linksMap[maxa][k])){
                                //k is connected to a but not b
                                linksMap[maxb][k] = linksMap[maxa][k] - 2 * communities[maxb].score * communities[k].score;
                            }
                            linksMap[k][maxb] = linksMap[maxb][k];
                        }
                        delete linksMap[k][maxa];
                    }
                }
                for (var k in linksMap[maxb]) {
                    if(!Number.isNaN(linksMap[maxb][k])){
                        if (!(k in linksMap[maxa]) && k != maxb) {
                            // k is connected to b but not a
                            linksMap[maxb][k] -= 2 * communities[maxa].score * communities[k].score;
                            linksMap[k][maxb] = linksMap[maxb][k];
                        }
                    }
                }
                for (var i in communities[maxa].nodes) {
                    communities[maxb].nodes.push(communities[maxa].nodes[i]);
                }
                communities[maxb].score += communities[maxa].score;
                delete communities[maxa];
                delete linksMap[maxa];
                Q += deltaQ;
                iter++;
                //console.log(Q);
            }

            //assign colors based on community size
            var tmp = [];
            for (var cid in communities) {
                tmp.push([cid, communities[cid].nodes.length]);
            }
            tmp.sort(function (a, b) {
                return b[1] - a[1];
            });
            var colorid = 0;
            for (var i in tmp) {
                cid = tmp[i][0];
                for (var i in communities[cid].nodes) {
                    nodesMap[communities[cid].nodes[i]].node.attr.color = colorid;
                }
                if (communities[cid].nodes.length > 1) {
                    colorid++;
                }
            }
        };

        Graph.filterNodes = function (graph, filter) {
            if(VMail.App.node_as_org == 0){
                graph.nodes.forEach(function (node, idx) {
                    node.skip = !filter(node.attr, idx);
                });
                graph.member_nodes.forEach(function (node, idx) {
                    node.skip = !filter(node.attr, idx);
                });
            }
            else{
                graph.org_nodes.forEach(function (node, idx) {
                    node.skip = !filter(node.attr, idx);
                });
            }
            //adjustLinks(graph);
        };

        Graph.filterLinks = function (graph, filter) {
            if(VMail.App.node_as_org == 0){
                graph.links.forEach(function (link, idx) {
                    link.skip = !filter(link.attr, idx);
                });
                graph.member_links.forEach(function (link, idx) {
                    link.skip = !filter(link.attr, idx);
                });
            }
            else{
                graph.org_links.forEach(function (link, idx) {
                    link.skip = !filter(link.attr, idx);
                });
            }
            //filterNonExistentLinks();
        };

        /*var adjustLinks = (graph:IGraph) => {
        //create dictionary of present nodes
        var d: {[id: string]: bool;} = {};
        graph.nodes.forEach((node: INode) => {
        d[node.id] = !node.skip;
        });
        
        //keep only links between filteredNodes
        var filteredLinks2 = [];
        this.filteredLinks.forEach((link) => {
        if(link.source.id in d && link.target.id in d) {
        filteredLinks2.push(link);
        }
        });
        this.filteredLinks = filteredLinks2;
        };*/
        
        Graph.induceOrgNetwork = function (db, nnodes, start, end, member_to_process) {
            //initial setup
            var startt = +start;
            var endt = +end;
            var init_start = 100000000000, init_end = 0;
            for(var t = 0; t < db.length; t++){
                if(db[t].emails[0].timestamp < init_start){ init_start = db[t].emails[0].timestamp; }
                if(db[t].emails[db[t].emails.length - 1].timestamp > init_end){ init_end = db[t].emails[db[t].emails.length - 1].timestamp; }
            }

            var init_startt = init_start, init_endt = init_end;
            
            //whole timeline and no member removed, use saved whole_graph
            if(member_to_process == -1 && VMail.App.removed.indexOf(1) == -1 && VMail.App.type == "multi" && VMail.App.init_time && startt == init_start * 1000 && endt == init_end * 1000 && VMail.App.removed.indexOf(1) == -1){
                return { nodes: VMail.App.whole_graph.nodes, links: VMail.App.whole_graph.links, org_nodes: VMail.App.whole_graph.org_nodes, org_links: VMail.App.whole_graph.org_links, member_nodes: VMail.App.whole_graph.member_nodes, member_links: VMail.App.whole_graph.member_links}; 
            }

            init_start = new Date(init_start * 1000);
            init_end = new Date(init_end * 1000);
            //process newly removed/added member and return network
            if(member_to_process != -1){
                if(VMail.App.removed[member_to_process] == 0){ //a member added
                //Use current network but add the member and emails (just links?) related to the member
                    return process_one_member(member_to_process, 1);

                }
                else{ //a member removed
                //Use current network but remove the member and emails (just links?) related to the member
                    return process_one_member(member_to_process, -1);
                    
                }
            }

            function process_one_member(user_index, is_added){
                var network_to_use = VMail.App.graph;
                var org_idpairToLink = {}, org_idToNode = {};
                for(var kk = 0; kk < network_to_use.org_links.length; kk++){
                    var src = network_to_use.org_links[kk].source.id, trg = network_to_use.org_links[kk].target.id;
                    var key = src + "#" + trg;
                    org_idpairToLink[key] = network_to_use.org_links[kk];
                }
                for(var kk = 0; kk < network_to_use.org_nodes.length; kk++){
                    org_idToNode[network_to_use.org_nodes[kk].id] = network_to_use.org_nodes[kk];
                }

                var the_member_id = null;
                var the_member_node = null, the_node = null, the_member_index = null, the_index = null;
                for(var j in network_to_use.member_nodes){
                    if(VMail.App.usersinfo[user_index].name == network_to_use.member_nodes[j].attr.contact.name){
                        the_member_id = network_to_use.member_nodes[j].id; 
                        the_member_index = j;
                        the_member_node = network_to_use.member_nodes[j];
                        the_index = network_to_use.nodes.map(function(x) {return x.id; }).indexOf(the_member_id);
                        var results = $.grep(network_to_use.nodes, function(e){ return e.id == the_member_id; })
                        if(results.length != 0) the_node = results[0];
                        break;
                    }
                }
                // alert(is_added+" "+the_member_id);

                if(is_added == -1){ //remove the member
                    if(the_member_id == null) alert("error with member names");
                    else{
                        //org_network
                        var k = user_index;
                        for (var i = 0; i < db[k].emails.length; i++) {
                            var ev = db[k].emails[i];
                            var time = ev.timestamp * 1000;
                            if (time >= startt && time <= endt) {
                                continue;
                            }

                            var isSent = !(ev.hasOwnProperty('source'));
                            if(ev.source_org == "datawheel.com") ev.source_org = "datawheel.us";
                            var a_org = VMail.App.domainToid[ev.source_org];
                            
                            if(isSent){// the mail is send by the member
                                // if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent--;
                                for (var j = 0; j < ev.destinations.length; j++) {
                                    if(ev.destinations_org[j] == "datawheel.com") ev.destinations_org[j] = "datawheel.us";
                                    var b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                    // if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv--;
                                    
                                    //adding links to organization nodes
                                    var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                    var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                    var key = src_org + '#' + trg_org;
                                    if(src_org != trg_org  && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                        if ((key in org_idpairToLink)) org_idpairToLink[key].weight--;
                                        else console.log("org_idpairToLink exception");
                                    }
                                }
                            }
                            continue;

                            // if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent--;
                            for (var j = 0; j < ev.destinations.length; j++) {
                                var b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                // if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv--;
                                
                                //add links for organization nodes
                                var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                var key = src_org + '#' + trg_org;
                                if(src_org != trg_org && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                    if ((key in org_idpairToLink)) org_idpairToLink[key].weight--;
                                }
                            }
                        }

                        for (var idpair in org_idpairToLink) {
                            if(org_idpairToLink[idpair].weight == 0){
                                org_idpairToLink[idpair].skip_removed = true;
                            }
                        }
                        network_to_use.org_links.sort(function (a, b) {
                            return b.weight - a.weight;
                        });

                        for(var kk = 0; kk < the_node.orgs.length; kk++){
                            var results = $.grep(network_to_use.org_nodes, function(e){ return e.id == the_node.orgs[kk]; })
                            results[0].skip_removed.push(user_index);
                            // var index = results[0].nodes.map(function(x) {return x.id; }).indexOf(the_member_id);
                            // results[0].nodes.splice(index, 1);
                        }

                        //member network
                        var index = $.map(network_to_use.member_links, function(x, index){ 
                            if(x.source.id == the_member_id || x.target.id == the_member_id)
                                return index;
                        });
                        for(var ind = index.length - 1; ind >= 0; ind--){
                            network_to_use.member_links[index[ind]].skip_removed.push(user_index);
                            // network_to_use.member_links.splice(index[ind], 1);
                        }
                        // for(var kk = 0; kk < network_to_use.member_nodes.length; kk++){
                        //     var own_ind = network_to_use.member_nodes[kk].owns.indexOf(user_index);
                        //     if(own_ind != -1){
                        //         network_to_use.member_nodes[kk].owns.splice(own_ind, 1);
                        //         network_to_use.member_nodes[kk].owns_before_ids.splice(own_ind, 1);
                        //         network_to_use.member_nodes[kk].owns_ids.splice(own_ind, 1);
                        //     }
                        // }
                        // network_to_use.member_nodes[the_member_index].skip_removed = true;
                        // network_to_use.member_nodes.splice(the_member_index, 1);

                        //network
                        var index = $.map(network_to_use.links, function(x, index){ 
                            if(x.source.id == the_member_id || x.target.id == the_member_id)
                                return index;
                        });
                        for(var ind = index.length - 1; ind >= 0; ind--){
                            network_to_use.links[index[ind]].skip_removed.push(user_index);
                            // network_to_use.links.splice(index[ind], 1);
                        }
                        // for(var kk = 0; kk < network_to_use.nodes.length; kk++){
                        //     var own_ind = network_to_use.nodes[kk].owns.indexOf(user_index);
                        //     if(own_ind != -1){
                        //         network_to_use.nodes[kk].owns.splice(own_ind, 1);
                        //         network_to_use.nodes[kk].owns_before_ids.splice(own_ind, 1);
                        //         network_to_use.nodes[kk].owns_ids.splice(own_ind, 1);
                        //     }
                        // }
                        network_to_use.nodes[the_index].skip_removed = true;
                        // network_to_use.nodes.splice(the_index, 1);
                    }
                }
                else{ //is_added == 1
                    //org_network
                    if(the_member_id == null) alert("error with member names");
                    else{
                        //org_network
                        var k = user_index;
                        for (var i = 0; i < db[k].emails.length; i++) {
                            var ev = db[k].emails[i];
                            var time = ev.timestamp * 1000;
                            if (time >= startt && time <= endt) {
                                continue;
                            }

                            var isSent = !(ev.hasOwnProperty('source'));
                            if(ev.source_org == "datawheel.com") ev.source_org = "datawheel.us";
                            var a_org = VMail.App.domainToid[ev.source_org];
                            
                            if(isSent){// the mail is send by the member
                                // if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent--;
                                for (var j = 0; j < ev.destinations.length; j++) {
                                    if(ev.destinations_org[j] == "datawheel.com") ev.destinations_org[j] = "datawheel.us";
                                    var b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                    // if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv--;
                                    
                                    //adding links to organization nodes
                                    var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                    var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                    var key = src_org + '#' + trg_org;
                                    if(src_org != trg_org  && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                        if ((key in org_idpairToLink)) org_idpairToLink[key].weight++;
                                        else console.log("org_idpairToLink exception");
                                    }
                                }
                            }
                            continue;

                            // if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent--;
                            for (var j = 0; j < ev.destinations.length; j++) {
                                var b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                // if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv--;
                                
                                //add links for organization nodes
                                var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                var key = src_org + '#' + trg_org;
                                if(src_org != trg_org && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                    if ((key in org_idpairToLink)) org_idpairToLink[key].weight++;
                                }
                            }
                        }

                        for (var idpair in org_idpairToLink) {
                            if(org_idpairToLink[idpair].skip_removed == true && org_idpairToLink[idpair].weight != 0){
                                org_idpairToLink[idpair].skip_removed = false;
                            }
                        }
                        network_to_use.org_links.sort(function (a, b) {
                            return b.weight - a.weight;
                        });

                        for(var kk = 0; kk < the_node.orgs.length; kk++){
                            var results = $.grep(network_to_use.org_nodes, function(e){ return e.id == the_node.orgs[kk]; })
                            results[0].skip_removed.splice(results[0].skip_removed.indexOf(user_index), 1);
                        }
                        
                        //member network
                        var index = $.map(network_to_use.member_links, function(x, index){ 
                            if(x.source.id == the_member_id || x.target.id == the_member_id)
                                return index;
                        });
                        for(var ind = index.length - 1; ind >= 0; ind--){
                            var a = network_to_use.member_links[index[ind]].skip_removed.indexOf(user_index);
                            network_to_use.member_links[index[ind]].skip_removed.splice(a, 1);
                        }
                        // for(var kk = 0; kk < network_to_use.member_nodes.length; kk++){
                        //     var own_ind = network_to_use.member_nodes[kk].owns.indexOf(user_index);
                        //     if(own_ind != -1){
                        //         network_to_use.member_nodes[kk].owns.splice(own_ind, 1);
                        //         network_to_use.member_nodes[kk].owns_before_ids.splice(own_ind, 1);
                        //         network_to_use.member_nodes[kk].owns_ids.splice(own_ind, 1);
                        //     }
                        // }
                        // network_to_use.member_nodes[the_member_index].skip_removed = true;
                        // network_to_use.member_nodes.splice(the_member_index, 1);

                        //network
                        var index = $.map(network_to_use.links, function(x, index){ 
                            if(x.source.id == the_member_id || x.target.id == the_member_id)
                                return index;
                        });
                        for(var ind = index.length - 1; ind >= 0; ind--){
                            network_to_use.links[index[ind]].skip_removed.splice(network_to_use.links[index[ind]].skip_removed.indexOf(user_index), 1);
                            // network_to_use.links.splice(index[ind], 1);
                        }
                        // for(var kk = 0; kk < network_to_use.nodes.length; kk++){
                        //     var own_ind = network_to_use.nodes[kk].owns.indexOf(user_index);
                        //     if(own_ind != -1){
                        //         network_to_use.nodes[kk].owns.splice(own_ind, 1);
                        //         network_to_use.nodes[kk].owns_before_ids.splice(own_ind, 1);
                        //         network_to_use.nodes[kk].owns_ids.splice(own_ind, 1);
                        //     }
                        // }
                        network_to_use.nodes[the_index].skip_removed = false;
                        // network_to_use.nodes.splice(the_index, 1);
                    }
                }
                return { nodes: network_to_use.nodes, links: network_to_use.links, member_nodes: network_to_use.member_nodes, member_links: network_to_use.member_links, org_nodes: network_to_use.org_nodes, org_links: network_to_use.org_links, sample: network_to_use.sample }; 
            }


            // maps from id to node
            var nodes = [], half_nodes = [];
            var org_nodes = [], half_org_nodes = [];
            var idToNode = {}, half_idToNode = {};
            var org_idToNode = {}, half_org_idToNode = {};
            var member_nodes = [], half_member_nodes = [];
            var member_idToNode = {}, half_member_idToNode = {};
            if(VMail.App.init_time == 0){ //first time setting up the ids
                VMail.App.idSwitch_before = new Array(db.length); VMail.App.idSwitch_after = new Array(db.length); 
                VMail.App.member_idSwitch_before = new Array(db.length); VMail.App.member_idSwitch_after = new Array(db.length); 
                for(var m=0; m<db.length; m++){
                    VMail.App.idSwitch_before[m] = [];
                    VMail.App.idSwitch_after[m] = [];
                    VMail.App.member_idSwitch_before[m] = [];
                    VMail.App.member_idSwitch_after[m] = [];
                }
            }

            function arrayUnique(array) {
                var a = array.concat();
                for(var i=0; i<a.length; ++i) {
                    for(var j=i+1; j<a.length; ++j) {
                        if(a[i] === a[j])
                            a.splice(j--, 1);
                    }
                }
                return a;
            }
            
            if(db.length > 1 || VMail.App.type == "multi"){
                var construct_network = 1;//
                if(VMail.App.init_time && (startt != init_startt * 1000 || endt != init_endt * 1000) && VMail.App.removed.indexOf(1) == -1){
                    //from the begining or from the end: choose the way that less emails to process
                    var total_emails = 0, emails_from_start = 0;
                    var start_time = startt / 1000, end_time = endt / 1000;

                    if(VMail.App.time_points[2] != 0){
                        if(start_time < VMail.App.time_points[2] && end_time >= VMail.App.time_points[2]){ //first and second half of the network
                            for(var k = 0; k < db.length; k++){
                                var ss = null, ee = null;
                                var total_done = 0;
                                for (var i = 0; i < db[k].emails.length; i++) {
                                    if(total_done == 0){ total_emails += (db[k].emails.length - i); total_done = 1;}
                                    if(ss == null && db[k].emails[i].timestamp >= start_time) ss = i;
                                    if(db[k].emails[i].timestamp >= VMail.App.time_points[2]){
                                        if(ee == null && db[k].emails[i].timestamp >= end_time) ee = i;
                                    }
                                    if(ss != null && ee != null) break;
                                }
                                if(ss == null) continue;
                                if(ee == null) ee = db[k].emails.length - 1;
                                emails_from_start += (ee - ss);
                            }
                            var rest_emails = (total_emails - emails_from_start) * 2;
                            if(rest_emails < emails_from_start){ //use whole_network, process removed emails
                                construct_network = 0;
                                return redo_network("whole", construct_network);
                            }
                            else{ //use half_network, process new emails, remove emails before startt
                                if(start_time == VMail.App.time_points[0]){
                                    construct_network = 1;
                                    return redo_network("half", construct_network); //may also need to remove
                                }
                                else{
                                    construct_network = 1;
                                    return redo_network(null, construct_network); 
                                }
                            }
                        }
                        else if(end_time >= VMail.App.time_points[2]){ //second half of the network
                            construct_network = 1;
                            return redo_network(null, construct_network);
                        }
                        else{ //first half of the network
                            for(var k = 0; k < db.length; k++){
                                var ss = null, ee = null;
                                for (var i = 0; i < db[k].emails.length; i++) {
                                    if(db[k].emails[i].timestamp < VMail.App.time_points[2]){
                                        if(ss == null && db[k].emails[i].timestamp >= start_time) ss = i;
                                        if(ee == null && db[k].emails[i].timestamp >= end_time) ee = i;
                                        // if(ss != null && ee != null) break;
                                    }
                                    else{
                                        total_emails += i;
                                        if(ee == null) ee = i;
                                        break;
                                    }
                                    
                                }
                                if(ss == null) continue;
                                emails_from_start += (ee - ss);
                            }
                            var rest_emails = total_emails - emails_from_start;
                            if(rest_emails < emails_from_start){ //use half_network, process removed emails
                                construct_network = 0;
                                return redo_network("half", construct_network);
                            }
                            else{ //use null network, process new emails
                                construct_network = 1;
                                return redo_network(null, construct_network);
                            }
                        }
                    }
                    else{
                        construct_network = 1;
                        return redo_network(null, construct_network);
                    }
                }
                return redo_network(null, construct_network);

                function redo_network(type, construct_network){
                    console.log(startt+" "+endt+" "+construct_network+" "+type);
                    var network_to_use = null;
                    if(type == "half") network_to_use = VMail.App.half_graph;
                    else if(type == "whole") network_to_use = VMail.App.whole_graph;

                    if(construct_network == 0){//process removed emails
                        var idpairToLink = {}, org_idpairToLink = {}, member_idpairToLink = {};
                        for(var kk = 0; kk < network_to_use.nodes.length; kk++){
                            var node = { 
                                attr: undefined, links: [], 
                                orgs: network_to_use.nodes[kk].orgs.slice(), 
                                id: network_to_use.nodes[kk].id, 
                                skip: false, skip_removed: false, skipslack: false, 
                                owns: [], //VMail.App.whole_graph.nodes[kk].owns.slice(), 
                                owns_before_ids: [], //VMail.App.whole_graph.nodes[kk].owns_before_ids.slice(), 
                                owns_ids: [] //VMail.App.whole_graph.nodes[kk].owns_ids.slice()
                            };
                            node.attr = {
                                contact: {
                                    'aliases': network_to_use.nodes[kk].attr.contact['aliases'],
                                    'id': network_to_use.nodes[kk].attr.contact['id'],
                                    'name': network_to_use.nodes[kk].attr.contact['name'],
                                    'new': network_to_use.nodes[kk].attr.contact['new'],
                                    'rcv': 0, //VMail.App.whole_graph.nodes[kk].attr.contact['rcv'],
                                    'sent': 0, //VMail.App.whole_graph.nodes[kk].attr.contact['sent'],
                                    'slack_rcv': network_to_use.nodes[kk].attr.contact['slack_rcv'],
                                    'slack_sent': network_to_use.nodes[kk].attr.contact['slack_sent']
                                }, 
                                size: 0,
                                size_slack: 0,
                                size_general: 0
                            };
                            nodes.push(node);
                            idToNode[network_to_use.nodes[kk].id] = node;
                        }
                        for(var kk = 0; kk < network_to_use.links.length; kk++){
                            var src = network_to_use.links[kk].source.id, trg = network_to_use.links[kk].target.id;
                            var key = src + "#" + trg;
                            var link = { 
                                source: idToNode[src], 
                                target: idToNode[trg], 
                                attr: { 
                                    weight: network_to_use.links[kk].attr.weight, 
                                    weight_slack: 0, 
                                    weight_general: 0 }, 
                                skip: network_to_use.links[kk].skip, 
                                skip2draw: network_to_use.links[kk].skip2draw, 
                                skip_removed: network_to_use.links[kk].skip_removed, 
                                skipcommunity: network_to_use.links[kk].skipcommunity, 
                                skipslack: network_to_use.links[kk].skipslack
                            }; 
                            // idToNode[src].links.push(link);
                            // idToNode[trg].links.push(link);
                            idpairToLink[key] = link;
                        }
                        for(var kk = 0; kk < network_to_use.member_nodes.length; kk++){
                            var node = { 
                                attr: undefined, links: [], 
                                id: network_to_use.member_nodes[kk].id, 
                                skip: false, skip_removed: false, skipslack: false, 
                                owns: [], //VMail.App.whole_graph.member_nodes[kk].owns.slice(), 
                                owns_before_ids: [], //VMail.App.whole_graph.member_nodes[kk].owns_before_ids.slice(), 
                                owns_ids: [] //VMail.App.whole_graph.member_nodes[kk].owns_ids.slice()
                            };
                            node.attr = {
                                contact: {
                                    'aliases': network_to_use.member_nodes[kk].attr.contact['aliases'],
                                    'id': network_to_use.member_nodes[kk].attr.contact['id'],
                                    'name': network_to_use.member_nodes[kk].attr.contact['name'],
                                    'new': network_to_use.member_nodes[kk].attr.contact['new'],
                                    'rcv': 0, //VMail.App.whole_graph.member_nodes[kk].attr.contact['rcv'],
                                    'sent': 0, //VMail.App.whole_graph.member_nodes[kk].attr.contact['sent'],
                                    'slack_rcv': network_to_use.member_nodes[kk].attr.contact['slack_rcv'],
                                    'slack_sent': network_to_use.member_nodes[kk].attr.contact['slack_sent']
                                }, 
                                size: 0,
                                size_slack: 0,
                                size_general: 0
                            };
                            member_nodes.push(node);
                            member_idToNode[network_to_use.member_nodes[kk].id] = node;
                        }
                        for(var kk = 0; kk < network_to_use.member_links.length; kk++){
                            var src = network_to_use.member_links[kk].source.id, trg = network_to_use.member_links[kk].target.id;
                            var key = src + "#" + trg;
                            var link = { 
                                source: member_idToNode[src], 
                                target: member_idToNode[trg], 
                                attr: { 
                                    weight: network_to_use.member_links[kk].attr.weight, 
                                    weight_slack: 0, 
                                    weight_general: 0 }, 
                                skip: network_to_use.member_links[kk].skip, 
                                skip2draw: network_to_use.member_links[kk].skip2draw, 
                                skip_removed: network_to_use.member_links[kk].skip_removed, 
                                skipcommunity: network_to_use.member_links[kk].skipcommunity, 
                                skipslack: network_to_use.member_links[kk].skipslack
                            }; 
                            // member_idToNode[src].links.push(link);
                            // member_idToNode[trg].links.push(link);
                            member_idpairToLink[key] = link;
                        }
                        // org_nodes = VMail.App.whole_graph.org_nodes; 
                        for(var kk = 0; kk < network_to_use.org_nodes.length; kk++){
                            var node = { 
                                attr: {}, 
                                link_weight: network_to_use.org_nodes[kk].link_weight,
                                domain: network_to_use.org_nodes[kk].domain, 
                                name: network_to_use.org_nodes[kk].name, 
                                member_size: network_to_use.org_nodes[kk].member_size, 
                                email_size: network_to_use.org_nodes[kk].email_size, 
                                email_rcv: network_to_use.org_nodes[kk].email_rcv, 
                                email_sent: network_to_use.org_nodes[kk].email_sent, 
                                nodes: [], links: [], 
                                id: network_to_use.org_nodes[kk].id, 
                                skip: false, 
                                skip_removed: [], 
                                owns: network_to_use.org_nodes[kk].owns.slice(), 
                                owns_contacts: JSON.parse(JSON.stringify(network_to_use.org_nodes[kk].owns_contacts))
                            };
                            for(var jj = 0; jj < network_to_use.org_nodes[kk].nodes.length; jj++){
                                node.nodes.push(idToNode[network_to_use.org_nodes[kk].nodes[jj].id]);
                            }
                            org_nodes.push(node);
                            org_idToNode[network_to_use.org_nodes[kk].id] = node;
                        }
                        for(var kk = 0; kk < network_to_use.org_links.length; kk++){
                            var src = network_to_use.org_links[kk].source.id, trg = network_to_use.org_links[kk].target.id;
                            var key = src + "#" + trg;
                            var link = { 
                                source: org_idToNode[src], 
                                target: org_idToNode[trg], 
                                attr: { weight: network_to_use.org_links[kk].attr.weight }, 
                                skip: network_to_use.org_links[kk].skip, 
                                skip_removed: network_to_use.org_links[kk].skip_removed, 
                                skip2draw: network_to_use.org_links[kk].skip2draw,
                                weight: network_to_use.org_links[kk].weight
                            }; 
                            // org_idToNode[src].links.push(link);
                            // org_idToNode[trg].links.push(link);
                            org_idpairToLink[key] = link;
                        }
                        // for(var kk = 0; kk < nodes.length; kk++) idToNode[nodes[kk].id] = nodes[kk];
                        // for(var kk = 0; kk < member_nodes.length; kk++) member_idToNode[member_nodes[kk].id] = member_nodes[kk];
                        // for(var kk = 0; kk < org_nodes.length; kk++) org_idToNode[org_nodes[kk].id] = org_nodes[kk];
                        

                        d3.range(db.length).forEach(function (k){
                            if(type == "whole") var this_endt = endt;
                            else if(type == "half") var this_endt = VMail.App.time_points[2] * 1000;
                            db[k].getTopContacts_multi(nnodes, startt, endt).forEach(function (contactScore) { 
                                if(VMail.App.idSwitch_before[k].indexOf(contactScore.contact.id) != -1){ //console.log(contactScore.contact);
                                    var node_id = VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(contactScore.contact.id)];
                                    idToNode[node_id].attr.contact.sent = idToNode[node_id].attr.contact.sent + contactScore.sentrcv.sent;
                                    idToNode[node_id].attr.contact.rcv = idToNode[node_id].attr.contact.rcv + contactScore.sentrcv.rcv;
                                    // idToNode[node_id].attr.size = Math.pow((Math.pow(nodes[node_already].attr.contact.sent, p) + Math.pow(nodes[node_already].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                    if(idToNode[node_id].owns.indexOf(k) == -1){
                                        // idToNode[node_id].attr.contact.aliases = arrayUnique(nodes[node_already].attr.contact.aliases.concat(contactScore.contact.aliases));
                                        idToNode[node_id].owns.push(k);
                                        idToNode[node_id].owns_before_ids.push(contactScore.contact.id);
                                        idToNode[node_id].owns_ids.push(idToNode[node_id].id);
                                    }
                                }
                                if(VMail.App.member_idSwitch_before[k].indexOf(contactScore.contact.id) != -1){
                                    var node_id = VMail.App.member_idSwitch_after[k][VMail.App.member_idSwitch_before[k].indexOf(contactScore.contact.id)];
                                    member_idToNode[node_id].attr.contact.sent = member_idToNode[node_id].attr.contact.sent + contactScore.sentrcv.sent;
                                    member_idToNode[node_id].attr.contact.rcv = member_idToNode[node_id].attr.contact.rcv + contactScore.sentrcv.rcv;
                                    // idToNode[node_id].attr.size = Math.pow((Math.pow(nodes[node_already].attr.contact.sent, p) + Math.pow(nodes[node_already].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                    if(member_idToNode[node_id].owns.indexOf(k) == -1){
                                        // idToNode[node_id].attr.contact.aliases = arrayUnique(nodes[node_already].attr.contact.aliases.concat(contactScore.contact.aliases));
                                        member_idToNode[node_id].owns.push(k);
                                        member_idToNode[node_id].owns_before_ids.push(contactScore.contact.id);
                                        member_idToNode[node_id].owns_ids.push(member_idToNode[node_id].id);
                                    }
                                }
                            });

                            if(type == "whole") var from_length = db[k].emails.length;
                            else if(type == "half") var from_length = VMail.App.half_email_index[k];
                            for (var i = 0; i < from_length; i++) {
                                var ev = db[k].emails[i];
                                var time = ev.timestamp * 1000;
                                if (time >= startt && time <= endt) {
                                    continue;
                                }

                                var isSent = !(ev.hasOwnProperty('source'));
                                if(ev.source_org == "datawheel.com") ev.source_org = "datawheel.us";
                                var a = ev.source, a_org = VMail.App.domainToid[ev.source_org];
                                
                                a = ((VMail.App.idSwitch_before[k].indexOf(ev.source)!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.source)]:"");  //:ev.source
                                
                                if (isSent || !(a in idToNode)) { // the mail is send by the member
                                    // if(isSent && VMail.App.removed[k] == 1) continue; //to keep connections of the member's contacts after removing him/her
                                    if(isSent){// the mail is send by the member
                                        for(var jjj in member_nodes){
                                            if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                                a = member_nodes[jjj].id; break;
                                            }
                                        }
                                        // idToNode[a].attr.contact.sent--;
                                        if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent--;
                                        // var member_in_both = 0;
                                        for (var j = 0; j < ev.destinations.length; j++) {
                                            if(ev.destinations_org[j] == "datawheel.com") ev.destinations_org[j] = "datawheel.us";
                                            var b = ev.destinations[j], b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                            b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
                                            // idToNode[b].attr.contact.rcv--;
                                            if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv--;
                                            
                                            //adding links to organization nodes
                                            var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                            var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                            var key = src_org + '#' + trg_org;
                                            if(src_org != trg_org  && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                                // if (!(key in org_idpairToLink)) {
                                                //     //regular link processing
                                                //         var org_link = { source: org_idToNode[src_org], target: org_idToNode[trg_org], weight: 0, skip: false, skip2draw: false, links: [], attr: { weight: 0 }};
                                                //         org_idToNode[src_org].links.push(org_link);
                                                //         org_idToNode[trg_org].links.push(org_link);
                                                //         org_idpairToLink[key] = org_link;
                                                // }
                                                if ((key in org_idpairToLink)) org_idpairToLink[key].weight--;
                                                // else console.log("org_idpairToLink exception");
                                            }

                                            if (!(b in idToNode) || b == a)
                                                continue;
                                            // idToNode[b].attr.contact.rcv--;
                                            var src = Math.min(parseInt(a), parseInt(b)).toString();
                                            var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                            var key = src + '#' + trg;
                                            // if (!(key in idpairToLink)) {
                                            //     //regular link processing
                                            //     var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: false, skipslack: false}; //skipcommunity: true,
                                            //     idToNode[src].links.push(link);
                                            //     idToNode[trg].links.push(link);
                                            //     idpairToLink[key] = link;
                                            //     //see if src and trg are members
                                            //     var src_ind = -1, trg_ind = -1;
                                            //     for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                            //         if(idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                            //             src_ind = i1;
                                            //         }
                                            //         if(idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                            //             trg_ind = i1;
                                            //         }
                                            //     }
                                            //     if(src_ind != -1){
                                            //         if(idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                            //             idToNode[trg].owns.push(src_ind); 
                                            //             idToNode[trg].owns_before_ids.push(undefined); 
                                            //             idToNode[trg].owns_ids.push(undefined);
                                            //         }
                                            //     }
                                            //     if(trg_ind != -1){
                                            //         if(idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                            //             idToNode[src].owns.push(trg_ind); 
                                            //             idToNode[src].owns_before_ids.push(undefined); 
                                            //             idToNode[src].owns_ids.push(undefined);
                                                        
                                            //         }
                                            //     }
                                            // }
                                            if (key in idpairToLink) idpairToLink[key].attr.weight--;
                                            // else console.log("idpairToLink exception");
                                            
                                            // if (!(key in member_idpairToLink)) {
                                            //     //links among members
                                            //     if(a in member_idToNode && b in member_idToNode){
                                            //         var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: false, skipslack: false};
                                            //         member_idToNode[src].links.push(link);
                                            //         member_idToNode[trg].links.push(link);
                                            //         member_idpairToLink[key] = link;
                                            //         //see if src and trg are members
                                            //         var src_ind = -1, trg_ind = -1;
                                            //         for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                            //             if(member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                            //                 src_ind = i1;
                                            //             }
                                            //             if(member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                            //                 trg_ind = i1;
                                            //             }
                                            //         }
                                            //         if(src_ind != -1){
                                            //             if(member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                            //                 member_idToNode[trg].owns.push(src_ind); 
                                            //                 member_idToNode[trg].owns_before_ids.push(undefined); 
                                            //                 member_idToNode[trg].owns_ids.push(undefined);
                                            //             }
                                            //         }
                                            //         if(trg_ind != -1){
                                            //             if(member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                            //                 member_idToNode[src].owns.push(trg_ind); 
                                            //                 member_idToNode[src].owns_before_ids.push(undefined); 
                                            //                 member_idToNode[src].owns_ids.push(undefined);
                                            //             }
                                            //         }
                                            //     }
                                            // }
                                            if(a in member_idToNode && b in member_idToNode){ 
                                                // member_idToNode[a].attr.contact.sent--;
                                                // member_idToNode[b].attr.contact.rcv--;
                                                // member_in_both = 1;
                                                if(key in member_idpairToLink) member_idpairToLink[key].attr.weight--; 
                                                // var the_date = new Date(time);
                                                // sample[the_date.getFullYear()].push({ from: a, to: b, time: time });
                                            }

                                        }
                                        // if(member_in_both == 1) member_idToNode[a].attr.contact.sent--;
                                    }
                                    
                                    continue;
                                }
                                // idToNode[a].attr.contact.sent--;
                                // if(a in member_idToNode) member_idToNode[a].attr.contact.sent--;
                                if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent--;
                                for (var j = 0; j < ev.destinations.length; j++) {
                                    var b = ev.destinations[j], b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                    b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
                                    if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv--;
                                    
                                    //add links for organization nodes
                                    var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                    var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                    var key = src_org + '#' + trg_org;
                                    if(src_org != trg_org && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                        // if (!(key in org_idpairToLink)) {
                                        //     //regular link processing
                                        //         var org_link = { source: org_idToNode[src_org], target: org_idToNode[trg_org], weight: 0, skip: false, skip2draw: false, links: [], attr: { weight: 0 }};
                                        //         org_idToNode[src_org].links.push(org_link);
                                        //         org_idToNode[trg_org].links.push(org_link);
                                        //         org_idpairToLink[key] = org_link;
                                        // }
                                        if ((key in org_idpairToLink)) org_idpairToLink[key].weight--;
                                    }
                                    
                                    if (!(b in idToNode) || b == a)
                                        continue;
                                    // idToNode[b].attr.contact.rcv--;
                                    var src = Math.min(parseInt(a), parseInt(b)).toString();
                                    var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                    var key = src + '#' + trg;
                                    // if (!(key in idpairToLink)) {
                                    //     //regular link processing
                                    //     var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: false, skipslack: false};
                                    //     idToNode[src].links.push(link);
                                    //     idToNode[trg].links.push(link);
                                    //     idpairToLink[key] = link;
                                    //     //see if src and trg are members
                                    //     var src_ind = -1, trg_ind = -1;
                                    //     for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                    //         if(idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                    //             src_ind = i1;
                                    //         }
                                    //         if(idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                    //             trg_ind = i1;
                                    //         }
                                    //     }
                                    //     if(src_ind != -1){
                                    //         if(idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                    //             idToNode[trg].owns.push(src_ind); 
                                    //             idToNode[trg].owns_before_ids.push(undefined); 
                                    //             idToNode[trg].owns_ids.push(undefined);
                                                
                                    //         }
                                    //     }
                                    //     if(trg_ind != -1){
                                    //         if(idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                    //             idToNode[src].owns.push(trg_ind);
                                    //             idToNode[src].owns_before_ids.push(undefined); 
                                    //             idToNode[src].owns_ids.push(undefined);
                                               
                                    //         }
                                    //     }
                                    // }
                                    if(key in idpairToLink) idpairToLink[key].attr.weight--;
                                    
                                    // if (!(key in member_idpairToLink)) {
                                    //     //links among members
                                    //     if(a in member_idToNode && b in member_idToNode){
                                    //         var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: false, skipslack: false};
                                    //         member_idToNode[src].links.push(link);
                                    //         member_idToNode[trg].links.push(link);
                                    //         member_idpairToLink[key] = link;
                                    //         //see if src and trg are members
                                    //         var src_ind = -1, trg_ind = -1;
                                    //         for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                    //             if(member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                    //                 src_ind = i1;
                                    //             }
                                    //             if(member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                    //                 trg_ind = i1;
                                    //             }
                                    //         }
                                    //         if(src_ind != -1){
                                    //             if(member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                    //                 member_idToNode[trg].owns.push(src_ind); 
                                    //                 member_idToNode[trg].owns_before_ids.push(undefined); 
                                    //                 member_idToNode[trg].owns_ids.push(undefined);
                                    //             }
                                    //         }
                                    //         if(trg_ind != -1){
                                    //             if(member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                    //                 member_idToNode[src].owns.push(trg_ind);
                                    //                 member_idToNode[src].owns_before_ids.push(undefined); 
                                    //                 member_idToNode[src].owns_ids.push(undefined);
                                    //             }
                                    //         }
                                    //     }
                                    // }
                                    if(a in member_idToNode && b in member_idToNode){ 
                                        // member_idToNode[a].attr.contact.sent--;
                                        // member_idToNode[b].attr.contact.rcv--;
                                        // member_in_both = 1;
                                        if(key in member_idpairToLink)
                                            member_idpairToLink[key].attr.weight--; 
                                    }
                                }
                                // if(member_in_both == 1) member_idToNode[a].attr.contact.sent--;
                                
                                //the member is a recipient too
                                for(var jjj in member_nodes){
                                    if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                        // if(VMail.App.removed[k] == 1) b = a;
                                        // else b = member_nodes[jjj].id;
                                        b = member_nodes[jjj].id;
                                    }
                                }
                                if(b == a) continue; 
                                // idToNode[a].attr.contact.sent--;
                                // idToNode[b].attr.contact.rcv--;
                                var src = Math.min(parseInt(a), parseInt(b)).toString();
                                var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                var key = src + '#' + trg;
                                // if (!(key in idpairToLink)) {
                                //     //regular link processing
                                //     var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: false, skipslack: false}; //skipcommunity: true,
                                //     idToNode[src].links.push(link);
                                //     idToNode[trg].links.push(link);
                                //     idpairToLink[key] = link;
                                //     //see if src and trg are members
                                //     var src_ind = -1, trg_ind = -1;
                                //     for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                //         if(idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                //             src_ind = i1;
                                //         }
                                //         if(idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                //             trg_ind = i1;
                                //         }
                                //     }
                                //     if(src_ind != -1){
                                //         if(idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                //             idToNode[trg].owns.push(src_ind); 
                                //             idToNode[trg].owns_before_ids.push(undefined); 
                                //             idToNode[trg].owns_ids.push(undefined);
                                //         }
                                //     }
                                //     if(trg_ind != -1){
                                //         if(idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                //             idToNode[src].owns.push(trg_ind);
                                //             idToNode[src].owns_before_ids.push(undefined); 
                                //             idToNode[src].owns_ids.push(undefined);
                                //         }
                                //     }
                                // }
                                if(!(key in idpairToLink)){
                                    // console.log(key);
                                } 
                                else idpairToLink[key].attr.weight--;
                                // console.log(idpairToLink[key]);

                                // if (!(key in member_idpairToLink)) {
                                //     //links among members
                                //     if(a in member_idToNode && b in member_idToNode){
                                //         var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: false, skipslack: false};
                                //         member_idToNode[src].links.push(link);
                                //         member_idToNode[trg].links.push(link);
                                //         member_idpairToLink[key] = link;
                                //         //see if src and trg are members
                                //         var src_ind = -1, trg_ind = -1;
                                //         for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                //             if(member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                //                 src_ind = i1;
                                //             }
                                //             if(member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                //                 trg_ind = i1;
                                //             }
                                //         }
                                //         if(src_ind != -1){
                                //             if(member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                //                 member_idToNode[trg].owns.push(src_ind); 
                                //                 member_idToNode[trg].owns_before_ids.push(undefined); 
                                //                 member_idToNode[trg].owns_ids.push(undefined);
                                                 
                                //             }
                                //         }
                                //         if(trg_ind != -1){
                                //             if(member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                //                 member_idToNode[src].owns.push(trg_ind); 
                                //                 member_idToNode[src].owns_before_ids.push(undefined); 
                                //                 member_idToNode[src].owns_ids.push(undefined);
                                //             }
                                //         }
                                //     }
                                // }
                                if(a in member_idToNode && b in member_idToNode){ 
                                    // member_idToNode[a].attr.contact.sent--;
                                    // member_idToNode[b].attr.contact.rcv--;
                                    if(key in member_idpairToLink) member_idpairToLink[key].attr.weight--; 
                                    // var the_date = new Date(time);
                                    // sample[the_date.getFullYear()].push({ from: a, to: b, time: time }); 
                                }
                                
                            }
                        });

                        for(var hh = nodes.length - 1; hh >= 0; hh--){
                            if(nodes[hh].attr.contact.rcv <= 0 || nodes[hh].attr.contact.sent <= 0){
                                //remove the node from org_nodes (member_size, nodes, owns, owns_contacts)
                                for(var jj = 0; jj < nodes[hh].orgs.length; jj++){
                                    // console.log(nodes[hh].orgs[jj]);
                                    if(nodes[hh].orgs[jj].id in org_idToNode){
                                        org_idToNode[nodes[hh].orgs[jj].id].member_size--;
                                        for(var kk = 0; kk < nodes[hh].owns.length; kk++){
                                            org_idToNode[nodes[hh].orgs[jj].id].owns[nodes[hh].owns[kk]]--;
                                            org_idToNode[nodes[hh].orgs[jj].id].owns_contacts[nodes[hh].owns[kk]];
                                            var index = org_idToNode[nodes[hh].orgs[jj].id].owns_contacts.map(function(x) {return x.id; }).indexOf(nodes[hh].id)
                                            org_idToNode[nodes[hh].orgs[jj].id].owns_contacts.splice(index, 1);
                                            var index2 = org_idToNode[nodes[hh].orgs[jj].id].nodes.map(function(x) {return x.id; }).indexOf(nodes[hh].id)
                                            org_idToNode[nodes[hh].orgs[jj].id].nodes.splice(index2, 1);
                                        }
                                    }
                                }
                                // console.log(nodes[hh]);
                                //remove the node from nodes list
                                if(!(nodes[hh].id in member_idToNode)){ 
                                    nodes[hh].skip = true;
                                    for(var mm = 0; mm < nodes[hh].links.length; mm++){
                                        var key = nodes[hh].links[mm].src + '#' + nodes[hh].links[mm].trg;
                                        delete idpairToLink[key];
                                    }
                                    nodes.splice(hh, 1);
                                }
                                else if(nodes[hh].owns.length == 0){
                                    for(var mm = 0; mm < nodes[hh].links.length; mm++){
                                        var key = nodes[hh].links[mm].src + '#' + nodes[hh].links[mm].trg;
                                        delete idpairToLink[key];
                                    }
                                    for(var mm = 0; mm < member_idToNode[nodes[hh].id].links.length; mm++){
                                        var key = member_idToNode[nodes[hh].id].links[mm].src + '#' + member_idToNode[nodes[hh].id].links[mm].trg;
                                        delete member_idpairToLink[key];
                                    }
                                    // console.log(member_idToNode[nodes[hh].id]);
                                    // nodes[hh].owns.push(0);
                                    var ind = $.map(VMail.App.usersinfo, function(obj, index){ 
                                        if(obj.name == member_idToNode[nodes[hh].id].attr.contact.name)
                                            return index;
                                    });
                                    if(ind != -1){ 
                                        member_idToNode[nodes[hh].id].owns.push(ind[0]);
                                        nodes[hh].owns.push(ind[0]);
                                    }
                                }
                            }
                            else{
                                var p = -3;
                                nodes[hh].attr.size = Math.pow((Math.pow(nodes[hh].attr.contact.sent, p) + Math.pow(nodes[hh].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                if(nodes[hh].attr.contact.slack_rcv == 0 && nodes[hh].attr.contact.slack_sent == 0) nodes[hh].skipslack = true;
                                else nodes[hh].attr.size_slack = Math.pow((Math.pow(nodes[hh].attr.contact.slack_rcv, p) + Math.pow(nodes[hh].attr.contact.slack_sent, p)) / 2.0, 1.0 / p);
                                nodes[hh].attr.size_general = Math.pow(
                                    (Math.pow((nodes[hh].attr.contact.slack_rcv + nodes[hh].attr.contact.rcv), p) + 
                                     Math.pow((nodes[hh].attr.contact.slack_sent + nodes[hh].attr.contact.sent), p)) / 2.0, 1.0 / p);
                            }
                        }
                        for(var hh = member_nodes.length - 1; hh >= 0; hh--){
                            if(member_nodes[hh].attr.contact.rcv <= 0 || member_nodes[hh].attr.contact.sent <= 0){
                                //remove the member node from member_nodes list
                                // member_nodes.splice(hh, 1);
                            }
                            else{
                                var p = -3;
                                member_nodes[hh].attr.size = Math.pow((Math.pow(member_nodes[hh].attr.contact.sent, p) + Math.pow(member_nodes[hh].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                if(member_nodes[hh].attr.contact.slack_rcv == 0 && member_nodes[hh].attr.contact.slack_sent == 0) member_nodes[hh].skipslack = true;
                                else member_nodes[hh].attr.size_slack = Math.pow((Math.pow(member_nodes[hh].attr.contact.slack_rcv, p) + Math.pow(member_nodes[hh].attr.contact.slack_sent, p)) / 2.0, 1.0 / p);
                                member_nodes[hh].attr.size_general = Math.pow(
                                    (Math.pow((member_nodes[hh].attr.contact.slack_rcv + member_nodes[hh].attr.contact.rcv), p) + 
                                     Math.pow((member_nodes[hh].attr.contact.slack_sent + member_nodes[hh].attr.contact.sent), p)) / 2.0, 1.0 / p);
                            }

                            if(member_nodes[hh].owns.length == 0){
                                var index = 0;
                                for(var iii=0; iii<VMail.App.usersinfo.length; iii++){
                                    if(VMail.App.usersinfo[iii].name == member_nodes[hh].name){
                                        index = iii; break;
                                    }
                                }
                                // for(var kk = 0; kk < member_nodes.length; kk++){
                                //     if(kk != hh && member_nodes[kk].owns.indexOf(iii) != -1){
                                //         for(var iii=0; iii<VMail.App.usersinfo.length; iii++){
                                //             if(VMail.App.usersinfo[iii].name == member_nodes[kk].name){
                                //                 idToNode[member_nodes[hh].id].owns.push(iii);
                                //                 member_nodes[hh].owns.push(iii); break;
                                //             }
                                //         }
                                //     }
                                // }
                                if(member_nodes[hh].owns.length == 0){
                                    idToNode[member_nodes[hh].id].owns.push(index);
                                    member_nodes[hh].owns.push(index);
                                }
                            }
                        }
                        // for(var id in member_nodes){
                        //     var a = member_nodes[id].id, b;
                        //     for(var iii in member_nodes[id].owns){
                        //         for(var jjj in member_nodes){
                        //             if(VMail.App.usersinfo[member_nodes[id].owns[iii]].name == member_nodes[jjj].attr.contact.name){
                        //                 b = member_nodes[jjj].id;
                        //             }
                        //         }
                            
                        //         var src = Math.min(parseInt(a), parseInt(b)).toString();
                        //         var trg = Math.max(parseInt(a), parseInt(b)).toString();
                        //         if (!(src in member_idToNode) || !(trg in member_idToNode) || src == trg)
                        //             continue;
                        //         var key = src + '#' + trg;
                        //         if (!(key in member_idpairToLink)) {
                        //             var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                        //             member_idToNode[src].links.push(link);
                        //             member_idToNode[trg].links.push(link);
                        //             member_idpairToLink[key] = link;
                        //             member_idpairToLink[key].attr.weight += 1;
                        //             if (!(key in idpairToLink)) {
                        //                 var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                        //                 idToNode[src].links.push(link);
                        //                 idToNode[trg].links.push(link);
                        //                 idpairToLink[key] = link;
                        //                 idpairToLink[key].attr.weight += 1;
                        //             }
                        //         }
                                
                        //     }
                            
                        // }
                        for(var hh = org_nodes.length - 1; hh >= 0; hh--){//cubic mean
                            if(org_nodes[hh].email_rcv <= 0 && org_nodes[hh].email_sent <= 0){
                                //remove the org node from org_nodes list
                                org_nodes.splice(hh, 1);
                            }
                            else{
                                org_nodes[hh].email_size = Math.sqrt(org_nodes[hh].email_rcv + org_nodes[hh].email_sent);
                            }
                        }
                        var links = [], member_links = [], org_links = [];
                        for (var idpair in idpairToLink) {
                            if(idpairToLink[idpair].attr.weight > 0){
                                idpairToLink[idpair].attr.weight_general = idpairToLink[idpair].attr.weight + idpairToLink[idpair].attr.weight_slack;
                                if(idpairToLink[idpair].attr.weight_slack == 0) idpairToLink[idpair].skipslack = true;
                                links.push(idpairToLink[idpair]);

                                var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                idToNode[src].links.push(idpairToLink[idpair]);
                                idToNode[trg].links.push(idpairToLink[idpair]);
                            }
                            else if(idpairToLink[idpair].attr.weight_slack > 0){
                                idpairToLink[idpair].skipslack = false;
                                inks.push(idpairToLink[idpair]);
                                idpairToLink[idpair].attr.weight_general = idpairToLink[idpair].attr.weight_slack;
                                var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                idToNode[src].links.push(idpairToLink[idpair]);
                                idToNode[trg].links.push(idpairToLink[idpair]);
                            }
                            else delete idpairToLink[idpair];
                        }
                        links.sort(function (a, b) {
                            return b.attr.weight - a.attr.weight;
                        });
                        for (var idpair in member_idpairToLink) {
                            if(member_idpairToLink[idpair].attr.weight > 0){
                                member_idpairToLink[idpair].attr.weight_general = member_idpairToLink[idpair].attr.weight + member_idpairToLink[idpair].attr.weight_slack;
                                if(member_idpairToLink[idpair].attr.weight_slack == 0) member_idpairToLink[idpair].skipslack = true;
                                member_links.push(member_idpairToLink[idpair]);

                                var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                member_idToNode[src].links.push(member_idpairToLink[idpair]);
                                member_idToNode[trg].links.push(member_idpairToLink[idpair]);
                            }
                            else if(member_idpairToLink[idpair].attr.weight_slack > 0){
                                member_idpairToLink[idpair].attr.weight_general = member_idpairToLink[idpair].attr.weight_slack;
                                member_idpairToLink[idpair].skipslack = false;
                                member_links.push(member_idpairToLink[idpair]);

                                var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                member_idToNode[src].links.push(member_idpairToLink[idpair]);
                                member_idToNode[trg].links.push(member_idpairToLink[idpair]);
                            }
                            else delete member_idpairToLink[idpair];
                        }
                        member_links.sort(function (a, b) {
                            return b.attr.weight - a.attr.weight;
                        });
                        for (var idpair in org_idpairToLink) {
                            if(org_idpairToLink[idpair].weight != 0){
                                org_links.push(org_idpairToLink[idpair]);

                                var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                org_idToNode[src].links.push(org_idpairToLink[idpair]);
                                org_idToNode[trg].links.push(org_idpairToLink[idpair]);
                            }
                        }
                        org_links.sort(function (a, b) {
                            return b.weight - a.weight;
                        });

                    }
                    else{ //construct_network == 1
                        var num_contact = 0, num_contact2 = 0;
                        var member_shown = new Array(VMail.App.db.length);
                        var half_member_shown = new Array(VMail.App.db.length);
                        for(var iii = 0; iii<member_shown.length; iii++){ 
                            member_shown[iii] = 0;
                            half_member_shown[iii] = 0;
                        }

                        // map a link to a link object
                        var idpairToLink = {}, half_idpairToLink = {};
                        var org_idpairToLink = {}, half_org_idpairToLink = {};
                        var member_idpairToLink = {}, half_member_idpairToLink = {};

                        if(type == "half"){
                            var network_to_use = VMail.App.half_graph;
                            for(var kk = 0; kk < network_to_use.nodes.length; kk++){
                                var node = { 
                                    attr: undefined, links: [], 
                                    orgs: network_to_use.nodes[kk].orgs.slice(), 
                                    id: network_to_use.nodes[kk].id, 
                                    skip: false, skip_removed: false, skipslack: false, 
                                    owns: [], //VMail.App.whole_graph.nodes[kk].owns.slice(), 
                                    owns_before_ids: [], //VMail.App.whole_graph.nodes[kk].owns_before_ids.slice(), 
                                    owns_ids: [] //VMail.App.whole_graph.nodes[kk].owns_ids.slice()
                                };
                                node.attr = {
                                    contact: {
                                        'aliases': network_to_use.nodes[kk].attr.contact['aliases'],
                                        'id': network_to_use.nodes[kk].attr.contact['id'],
                                        'name': network_to_use.nodes[kk].attr.contact['name'],
                                        'new': network_to_use.nodes[kk].attr.contact['new'],
                                        'rcv': 0, //VMail.App.whole_graph.nodes[kk].attr.contact['rcv'],
                                        'sent': 0, //VMail.App.whole_graph.nodes[kk].attr.contact['sent'],
                                        'slack_rcv': network_to_use.nodes[kk].attr.contact['slack_rcv'],
                                        'slack_sent': network_to_use.nodes[kk].attr.contact['slack_sent']
                                    }, 
                                    size: 0,
                                    size_slack: 0,
                                    size_general: 0
                                };
                                nodes.push(node);
                                idToNode[network_to_use.nodes[kk].id] = node;
                            }
                            for(var kk = 0; kk < network_to_use.links.length; kk++){
                                var src = network_to_use.links[kk].source.id, trg = network_to_use.links[kk].target.id;
                                var key = src + "#" + trg;
                                var link = { 
                                    source: idToNode[src], 
                                    target: idToNode[trg], 
                                    attr: { 
                                        weight: network_to_use.links[kk].attr.weight, 
                                        weight_slack: 0, 
                                        weight_general: 0 }, 
                                    skip: network_to_use.links[kk].skip, 
                                    skip2draw: network_to_use.links[kk].skip2draw, 
                                    skip_removed: network_to_use.links[kk].skip_removed, 
                                    skipcommunity: network_to_use.links[kk].skipcommunity, 
                                    skipslack: network_to_use.links[kk].skipslack
                                }; 
                                // idToNode[src].links.push(link);
                                // idToNode[trg].links.push(link);
                                idpairToLink[key] = link;
                            }
                            for(var kk = 0; kk < network_to_use.member_nodes.length; kk++){
                                var node = { 
                                    attr: undefined, links: [], 
                                    id: network_to_use.member_nodes[kk].id, 
                                    skip: false, skip_removed: false, skipslack: false, 
                                    owns: [], //VMail.App.whole_graph.member_nodes[kk].owns.slice(), 
                                    owns_before_ids: [], //VMail.App.whole_graph.member_nodes[kk].owns_before_ids.slice(), 
                                    owns_ids: [] //VMail.App.whole_graph.member_nodes[kk].owns_ids.slice()
                                };
                                node.attr = {
                                    contact: {
                                        'aliases': network_to_use.member_nodes[kk].attr.contact['aliases'],
                                        'id': network_to_use.member_nodes[kk].attr.contact['id'],
                                        'name': network_to_use.member_nodes[kk].attr.contact['name'],
                                        'new': network_to_use.member_nodes[kk].attr.contact['new'],
                                        'rcv': 0, //VMail.App.whole_graph.member_nodes[kk].attr.contact['rcv'],
                                        'sent': 0, //VMail.App.whole_graph.member_nodes[kk].attr.contact['sent'],
                                        'slack_rcv': network_to_use.member_nodes[kk].attr.contact['slack_rcv'],
                                        'slack_sent': network_to_use.member_nodes[kk].attr.contact['slack_sent']
                                    }, 
                                    size: 0,
                                    size_slack: 0,
                                    size_general: 0
                                };
                                member_nodes.push(node);
                                member_idToNode[network_to_use.member_nodes[kk].id] = node;
                            }
                            for(var kk = 0; kk < network_to_use.member_links.length; kk++){
                                var src = network_to_use.member_links[kk].source.id, trg = network_to_use.member_links[kk].target.id;
                                var key = src + "#" + trg;
                                var link = { 
                                    source: member_idToNode[src], 
                                    target: member_idToNode[trg], 
                                    attr: { 
                                        weight: network_to_use.member_links[kk].attr.weight, 
                                        weight_slack: 0, 
                                        weight_general: 0 }, 
                                    skip: network_to_use.member_links[kk].skip, 
                                    skip_removed: network_to_use.member_links[kk].skip_removed, 
                                    skip2draw: network_to_use.member_links[kk].skip2draw, 
                                    skipcommunity: network_to_use.member_links[kk].skipcommunity, 
                                    skipslack: network_to_use.member_links[kk].skipslack
                                }; 
                                // member_idToNode[src].links.push(link);
                                // member_idToNode[trg].links.push(link);
                                member_idpairToLink[key] = link;
                            }
                            // org_nodes = VMail.App.whole_graph.org_nodes; 
                            for(var kk = 0; kk < network_to_use.org_nodes.length; kk++){
                                var node = { 
                                    attr: {}, 
                                    link_weight: network_to_use.org_nodes[kk].link_weight,
                                    domain: network_to_use.org_nodes[kk].domain, 
                                    name: network_to_use.org_nodes[kk].name, 
                                    member_size: network_to_use.org_nodes[kk].member_size, 
                                    email_size: network_to_use.org_nodes[kk].email_size, 
                                    email_rcv: network_to_use.org_nodes[kk].email_rcv, 
                                    email_sent: network_to_use.org_nodes[kk].email_sent, 
                                    nodes: [], links: [], 
                                    id: network_to_use.org_nodes[kk].id, 
                                    skip: false, 
                                    skip_removed: [], 
                                    owns: network_to_use.org_nodes[kk].owns.slice(), 
                                    owns_contacts: JSON.parse(JSON.stringify(network_to_use.org_nodes[kk].owns_contacts))
                                };
                                for(var jj = 0; jj < network_to_use.org_nodes[kk].nodes.length; jj++){
                                    node.nodes.push(idToNode[network_to_use.org_nodes[kk].nodes[jj].id]);
                                }
                                org_nodes.push(node);
                                org_idToNode[network_to_use.org_nodes[kk].id] = node;
                            }
                            for(var kk = 0; kk < network_to_use.org_links.length; kk++){
                                var src = network_to_use.org_links[kk].source.id, trg = network_to_use.org_links[kk].target.id;
                                var key = src + "#" + trg;
                                var link = { 
                                    source: org_idToNode[src], 
                                    target: org_idToNode[trg], 
                                    attr: { weight: network_to_use.org_links[kk].attr.weight }, 
                                    skip: network_to_use.org_links[kk].skip, 
                                    skip_removed: network_to_use.org_links[kk].skip_removed, 
                                    skip2draw: network_to_use.org_links[kk].skip2draw,
                                    weight: network_to_use.org_links[kk].weight
                                }; 
                                // org_idToNode[src].links.push(link);
                                // org_idToNode[trg].links.push(link);
                                org_idpairToLink[key] = link;
                            }
                        }

                        if(type == "half"){ 
                            var this_endt = endt; 
                            var this_startt = VMail.App.time_points[2] * 1000;
                        }
                        else{ 
                            var this_endt = endt, this_startt = startt;
                        }

                        console.time('nodes');
                        d3.range(db.length).forEach(function (i){
                          //if(VMail.App.removed[i] != 1){
                            start = init_start; end = init_end; console.log("next user");
                            var nnodes = Math.max(500, parseInt(db[i].nCollaborators / 2)); console.time('contacts');

                            db[i].getTopContacts_multi(nnodes, startt, endt).forEach(function (contactScore) { 
                                var node_already = -1;
                                var member_node_already = -1;
                                if(i != 0 || type == "half"){
                                    for(var ii = 0; ii < nodes.length; ii++){
                                        var email_add = nodes[ii].attr.contact.aliases;
                                        if(nodes[ii].attr.contact.name == contactScore.contact.name){
                                            node_already = ii;
                                            for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                                                for(var iii = 0; iii < member_nodes.length; iii++){
                                                    var member_email_add = member_nodes[iii].attr.contact.aliases;
                                                    if(member_email_add.indexOf(contactScore.contact.aliases[jj])!= -1){
                                                        member_node_already = iii; 
                                                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){ 
                                                            if(VMail.App.usersinfo[tt].name == contactScore.contact.name){
                                                                member_shown[tt] = 1; break;
                                                            }
                                                        }
                                                        
        //                                                member_nodes[iii].owns.push(i);
        //                                                member_nodes[iii].owns_before_ids.push(contactScore.contact.id);
        //                                                member_nodes[iii].owns_ids.push((parseInt(contactScore.contact.id) + num_contact).toString());
                                                    }
                                                }

                                                jj = contactScore.contact.aliases.length;                                       
                                            }
                                            ii = nodes.length; 
                                        }
                                    }
                                }
                                //if(contactScore.contact.name=="Mishel Johns") console.log("new "+i+" "+node_already);
                                if((i != 0 || type == "half") && node_already != -1){//add email info to the existing node
                                    var p = -3; 
                                    // nodes[node_already].attr.size = nodes[node_already].attr.size + contactScore.scores[0];
                                    nodes[node_already].attr.contact.sent = nodes[node_already].attr.contact.sent + contactScore.sentrcv.sent;
                                    nodes[node_already].attr.contact.rcv = nodes[node_already].attr.contact.rcv + contactScore.sentrcv.rcv;
                                    nodes[node_already].attr.size = Math.pow((Math.pow(nodes[node_already].attr.contact.sent, p) + Math.pow(nodes[node_already].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                    if(nodes[node_already].owns.indexOf(i) == -1){
                                        nodes[node_already].attr.contact.aliases = arrayUnique(nodes[node_already].attr.contact.aliases.concat(contactScore.contact.aliases));
                                        nodes[node_already].owns.push(i);
                                        nodes[node_already].owns_before_ids.push(contactScore.contact.id);
                                        nodes[node_already].owns_ids.push(nodes[node_already].id); 
                                        if(VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id) == -1){//first time seeing this contact for user i
                                            VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                            VMail.App.idSwitch_after[i].push(nodes[node_already].id); //(parseInt(contactScore.contact.id) + num_contact).toString()
                                        }
                                        
                                        //get a list of different email ending (organizations) by going through all the emails
                                        for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                                            var domain = contactScore.contact.aliases[jj].substring(contactScore.contact.aliases[jj].indexOf("@") + 1, contactScore.contact.aliases[jj].length);
                                            var search_or_not = 1;
                                            for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                                                if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                                                    search_or_not = 0; break;
                                                }
                                            }
                                            if(domain in VMail.App.org_domains){
                                                search_or_not = 0;
                                                var org_lookup = $.grep(org_nodes, function(e){ return e.domain == VMail.App.org_domains[domain]['domain']; })
                                                if(org_lookup.length == 1){
                                                    if(($.grep(org_lookup[0].nodes, function(e){ return e.id == nodes[node_already].id;})).length == 0){
                                                        org_lookup[0].member_size++;
                                                        org_lookup[0].nodes.push(nodes[node_already]);
                                                    }
                                                    if(($.grep(org_lookup[0].owns_contacts[i], function(e){ return e.id == nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)];})).length == 0){
                                                        org_lookup[0].owns[i]++;
                                                        org_lookup[0].owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
                                                    }
                                                    if(nodes[node_already].orgs.indexOf(org_lookup[0].id) == -1){
                                                        nodes[node_already].orgs.push(org_lookup[0].id);
                                                    }
                                                }
                                                else if(org_lookup.length > 1){
                                                    if(($.grep(org_lookup[0].nodes, function(e){ return e.id == nodes[node_already].id;})).length == 0){
                                                        org_lookup[0].member_size++;
                                                        org_lookup[0].nodes.push(nodes[node_already]);
                                                    }
                                                    if(($.grep(org_lookup[0].owns_contacts[i], function(e){ return e.id == nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)];})).length == 0){
                                                        org_lookup[0].owns[i]++;
                                                        org_lookup[0].owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
                                                    }
                                                    if(nodes[node_already].orgs.indexOf(org_lookup[0].id) == -1){
                                                        nodes[node_already].orgs.push(org_lookup[0].id);
                                                    }
                                                }
                                                else{
                                                    var result = VMail.App.org_domains[domain];
                                                    var the_node = { domain: result.domain, name: result.name, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns:[], owns_contacts: [], id: (VMail.App.domainToid[result.domain]).toString(), attr: {}, skip: false, skip_removed: []};
                                                    for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
                                                    the_node.owns[i]++;
        //                                                    the_node.owns_contacts[i].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
                                                    the_node.owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
                                                    org_nodes.push(the_node);
                                                    the_node.nodes.push(nodes[node_already]);
                                                    org_idToNode[(VMail.App.domainToid[result.domain]).toString()] = the_node;
                                                    if(nodes[node_already].orgs.indexOf((VMail.App.domainToid[result.domain]).toString()) == -1){
                                                        nodes[node_already].orgs.push((VMail.App.domainToid[result.domain]).toString());
                                                    }
                                                }
                                            }
                                            if(search_or_not == 1){
                                                var result = $.grep(org_nodes, function(e){ return e.domain == domain; });
                                                if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                                                    var the_domain = domain;
                                                    while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                                        the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                                        var org_lookup = $.grep(org_nodes, function(e){ return e.domain == the_domain; });
                                                        if(org_lookup.length == 1){//we find the only one. should be the correct org.
                                                            if(($.grep(org_lookup[0].nodes, function(e){ return e.id == nodes[node_already].id;})).length == 0){
                                                                org_lookup[0].member_size++;
                                                                org_lookup[0].nodes.push(nodes[node_already]);
                                                            } 
        //                                                    if(($.grep(org_lookup[0].owns_contacts[i], function(e){ return e.id == nodes[node_already].id;})).length == 0){
        //                                                        org_lookup[0].owns[i]++;
        //                                                        org_lookup[0].owns_contacts[i].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
        //                                                    }
                                                            if(($.grep(org_lookup[0].owns_contacts[i], function(e){ return e.id == nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)];})).length == 0){
                                                                org_lookup[0].owns[i]++;
                                                                org_lookup[0].owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
                                                            }
                                                            if(nodes[node_already].orgs.indexOf(org_lookup[0].id) == -1){
                                                                nodes[node_already].orgs.push(org_lookup[0].id);
                                                            }
                                                            break;
                                                        }
                                                        else if(org_lookup.length > 1){//more than one results, should pick up the right one
                                                            if(($.grep(org_lookup[0].nodes, function(e){ return e.id == nodes[node_already].id;})).length == 0){
                                                                org_lookup[0].member_size++;
                                                                org_lookup[0].nodes.push(nodes[node_already]);
                                                            } 
        //                                                    if(($.grep(org_lookup[0].owns_contacts[i], function(e){ return e.id == nodes[node_already].id;})).length == 0){
        //                                                        org_lookup[0].owns[i]++;
        //                                                        org_lookup[0].owns_contacts[i].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
        //                                                    }
                                                            if(($.grep(org_lookup[0].owns_contacts[i], function(e){ return e.id == nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)];})).length == 0){
                                                                org_lookup[0].owns[i]++;
                                                                org_lookup[0].owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
                                                            }
                                                            if(nodes[node_already].orgs.indexOf(org_lookup[0].id) == -1){
                                                                nodes[node_already].orgs.push(org_lookup[0].id);
                                                            }
                                                            break;
                                                        }
                                                    }
                                                    if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                                                        the_domain = domain;

                                                        if(domain in VMail.App.org_domains){
                                                            result = VMail.App.org_domains[domain];
                                                            var the_node = { domain: result.domain, name: result.name, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns:[], owns_contacts: [], id: (VMail.App.domainToid[result.domain]).toString(), attr: {}, skip: false, skip_removed: []};
                                                            for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
                                                            the_node.owns[i]++;
            //                                                    the_node.owns_contacts[i].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
                                                            the_node.owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
                                                            org_nodes.push(the_node);
                                                            the_node.nodes.push(nodes[node_already]);
                                                            org_idToNode[(VMail.App.domainToid[result.domain]).toString()] = the_node;
                                                            if(nodes[node_already].orgs.indexOf((VMail.App.domainToid[result.domain]).toString()) == -1){
                                                                nodes[node_already].orgs.push((VMail.App.domainToid[result.domain]).toString());
                                                            }
                                                        }
                                                        // else console.log("exception: " + domain);

                                                        // result = $.grep(VMail.App.orgs, function(e){ return e.domain == domain; });
        //                                                 if(result.length == 0){//not found in the univ_list, next we make sure its family domains are not in the list
        //                                                     while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
        //                                                         the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
        //                                                         var univ_lookup = $.grep(VMail.App.orgs, function(e){ return e.domain == the_domain; })
        //                                                         if(univ_lookup.length == 1){//we find the only one. should be the correct org.
        //                                                             var the_node = { domain: univ_lookup[0].domain, name: univ_lookup[0].org, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns: [], owns_contacts: [], id: (VMail.App.orgs.indexOf(univ_lookup[0])).toString(), attr: {}, skip: false,};
        //                                                             for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
        //                                                             the_node.owns[i]++;
        // //                                                            the_node.owns_contacts[i].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
        //                                                             the_node.owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
        //                                                             org_nodes.push(the_node);
        //                                                             the_node.nodes.push(nodes[node_already]);
        //                                                             org_idToNode[(VMail.App.orgs.indexOf(univ_lookup[0])).toString()] = the_node;
        //                                                             if(nodes[node_already].orgs.indexOf((VMail.App.orgs.indexOf(univ_lookup[0])).toString()) == -1){
        //                                                                 nodes[node_already].orgs.push((VMail.App.orgs.indexOf(univ_lookup[0])).toString());
        //                                                             }
        //                                                             break;
        //                                                         }
        //                                                         else if(univ_lookup.length > 1){//more than one results, should pick up the right one
        //                                                             var the_node = { domain: univ_lookup[0].domain, name: univ_lookup[0].org, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns: [], owns_contacts: [], id: (VMail.App.orgs.indexOf(univ_lookup[0])).toString(), attr: {}, skip: false,};
        //                                                             for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
        //                                                             the_node.owns[i]++;
        // //                                                            the_node.owns_contacts[i].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
        //                                                             the_node.owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
        //                                                             org_nodes.push(the_node);
        //                                                             the_node.nodes.push(nodes[node_already]);
        //                                                             org_idToNode[(VMail.App.orgs.indexOf(univ_lookup[0])).toString()] = the_node;
        //                                                             if(nodes[node_already].orgs.indexOf((VMail.App.orgs.indexOf(univ_lookup[0])).toString()) == -1){
        //                                                                 nodes[node_already].orgs.push((VMail.App.orgs.indexOf(univ_lookup[0])).toString());
        //                                                             }
        //                                                             break;
        //                                                         }
        //                                                     }
        //                                                     if(the_domain.indexOf(".") == -1){//not in org list? shouldn't be
        // //                                                        alert("not in org list, wierd");
        //                                                         console.log("exception, "+domain);
        //                                                     }
        //                                                 }
        //                                                 else{
        //                                                     var the_node = { domain: result[0].domain, name: result[0].org, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns:[], owns_contacts: [], id: (VMail.App.orgs.indexOf(result[0])).toString(), attr: {}, skip: false,};
        //                                                     for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
        //                                                     the_node.owns[i]++;
        // //                                                    the_node.owns_contacts[i].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
        //                                                     the_node.owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
        //                                                     org_nodes.push(the_node);
        //                                                     the_node.nodes.push(nodes[node_already]);
        //                                                     org_idToNode[(VMail.App.orgs.indexOf(result[0])).toString()] = the_node;
        //                                                     if(nodes[node_already].orgs.indexOf((VMail.App.orgs.indexOf(result[0])).toString()) == -1){
        //                                                         nodes[node_already].orgs.push((VMail.App.orgs.indexOf(result[0])).toString());
        //                                                     }
        //                                                 }
                                                    }
                                                }
                                                else{
                                                    //if(result[0].id== undefined){console.log(result[0]); console.log(result[0].id);}
                                                    if(($.grep(result[0].nodes, function(e){ return e.id == nodes[node_already].id;})).length == 0){
                                                        result[0].member_size++;
                                                        result[0].nodes.push(nodes[node_already]);
                                                    }
                                                    if(($.grep(result[0].owns_contacts[i], function(e){ return e.id == nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)];})).length == 0){
                                                        result[0].owns[i]++;
        //                                                result[0].owns_contacts[i].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
                                                        result[0].owns_contacts[i].push({id: nodes[node_already].owns_before_ids[nodes[node_already].owns.indexOf(i)], name: nodes[node_already].attr.contact.name});
                                                    }
                                                    if(nodes[node_already].orgs.indexOf(result[0].id) == -1){
                                                        nodes[node_already].orgs.push(result[0].id);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    
                                    if(member_node_already != -1){
        //                                for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
        //                                    if(contactScore.contact.name == VMail.App.usersinfo[kk].name){
        //                                        member_nodes[member_node_already].attr.size = member_nodes[member_node_already].attr.size + contactScore.scores[0];
        //                                    }
        //                                }
                                        // member_nodes[member_node_already].attr.size = member_nodes[member_node_already].attr.size + contactScore.scores[0];
                                        member_nodes[member_node_already].attr.contact.sent = member_nodes[member_node_already].attr.contact.sent + contactScore.sentrcv.sent;
                                        member_nodes[member_node_already].attr.contact.rcv = member_nodes[member_node_already].attr.contact.rcv + contactScore.sentrcv.rcv;
                                        member_nodes[member_node_already].attr.size = Math.pow((Math.pow(member_nodes[member_node_already].attr.contact.sent, p) + Math.pow(member_nodes[member_node_already].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                        if(member_nodes[member_node_already].owns.indexOf(i) == -1){
                                            member_nodes[member_node_already].owns.push(i);
                                            member_nodes[member_node_already].owns_before_ids.push(contactScore.contact.id);
                                            member_nodes[member_node_already].owns_ids.push(nodes[node_already].id); //contactScore.contact.id
                                            if(VMail.App.member_idSwitch_before[i].indexOf(contactScore.contact.id) == -1){//first time seeing this contact for user i
                                                VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                VMail.App.member_idSwitch_after[i].push(member_nodes[member_node_already].id); //(parseInt(contactScore.contact.id) + num_contact).toString()
                                            }
                                        }
                                    }
        //                            nodes[node_already].attr.size = Math.pow((Math.pow(nodes[node_already].attr.size, p) + Math.pow(contactScore.scores[0], p)), 1.0 / p);
                                }
                                else {//create a new node
                                    //member nodes
                                    var removed_member = 0;
                                    for(var iii=0; iii<VMail.App.usersinfo.length; iii++){
                                        if(VMail.App.usersinfo[iii].name == contactScore.contact.name){
                                            // if(VMail.App.removed[iii] == 1){ removed_member = 1; }
                                            if(member_shown[iii] == 0){
                                                member_shown[iii] = 1;
                                                var node2 = { attr: undefined, links: [], id: null, skip: false, skip_removed: false, skipslack: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                                node2.attr = {
                                                    contact: {
                                                        'aliases': contactScore.contact['aliases'],
                                                        'id': contactScore.contact['id'],
                                                        'name': contactScore.contact['name'],
                                                        'new': contactScore.contact['new'],
                                                        'rcv': contactScore.sentrcv['rcv'],
                                                        'sent': contactScore.sentrcv['sent'],
                                                        'slack_rcv': contactScore.contact['slack_rcv'],
                                                        'slack_sent': contactScore.contact['slack_sent']
                                                    }, //contactScore.contact,
                                                    size: contactScore.scores[0],
                                                    size_slack: 0,
                                                    size_general: 0
                                                };
                                                node2.attr.contact.aliases = VMail.App.db[iii].aliases;
                                                node2.owns.push(i);
                                                node2.owns_before_ids.push(contactScore.contact.id); 
                                                if(VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id) == -1){
                                                    if(type == "half"){
                                                        var exist_node = $.grep(VMail.App.whole_graph.member_nodes, function(e){ return e.attr.contact.name == contactScore.contact.name; });
                                                        if(exist_node.length > 0){
                                                            node2.id = exist_node[0].id;
                                                            node2.owns_ids.push(exist_node[0].id); 
                                                            VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                            VMail.App.idSwitch_after[i].push(exist_node[0].id);
                                                            VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                            VMail.App.member_idSwitch_after[i].push(exist_node[0].id);
                                                        }
                                                        else{
                                                            node2.id = (parseInt(contactScore.contact.id) + num_contact2).toString();
                                                            node2.owns_ids.push((parseInt(contactScore.contact.id) + num_contact2).toString()); //contactScore.contact.id
                                                            VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                            VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                            VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                            VMail.App.member_idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                        }
                                                    }
                                                    else{
                                                        node2.id = (parseInt(contactScore.contact.id) + num_contact).toString();
                                                        node2.owns_ids.push((parseInt(contactScore.contact.id) + num_contact).toString()); //contactScore.contact.id
                                                        member_idToNode[parseInt(contactScore.contact.id) + num_contact] = node2;
                                                        VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                        VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                        VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                        VMail.App.member_idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                    }
                                                }
                                                else{
                                                    var the_id = (VMail.App.idSwitch_after[i][VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id)]).toString();
                                                    node2.id = the_id;
                                                    node2.owns_ids.push(the_id); //contactScore.contact.id
                                                    member_idToNode[the_id] = node2;
                                                    VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                    VMail.App.member_idSwitch_after[i].push((VMail.App.idSwitch_after[i][VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id)]).toString());
                                                }
                                                member_nodes.push(node2);
                                            }
                                            if(VMail.App.member_idSwitch_before[i].indexOf(contactScore.contact.id) == -1){//first time seeing this contact for user i
                                                VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                VMail.App.member_idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString()); //(parseInt(contactScore.contact.id) + num_contact).toString()
                                            }
                                        }
                                    }
                                    //regular processing of nodes
        //                            if(i==2 && contactScore.contact.id == "259"){ console.log("259 found. " + num_contact); console.log(contactScore);}

                                    if(removed_member == 0){//if this node is not a removed member
                                        var the_num_contact = num_contact;
                                        if(VMail.App.init_time != 0 && i != 0 && VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id) == -1){//add a new pair into before and after
                                            VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                            VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                            the_num_contact = num_contact2;
                                        }
                                        else if(VMail.App.init_time != 0 && i != 0){ 
                                            var exist_node = $.grep(nodes, function(e){ return e.id == VMail.App.idSwitch_after[VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id)];})
                                            if(exist_node.length > 0){//
                                                 if(exist_node[0].attr.contact.name != contactScore.contact.name){
                                                     VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                     VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                     the_num_contact = num_contact2;
                                                 }
                                            }
                                        }
                                        var node = { attr: undefined, links: [], id: null, skip: false, skip_removed: false, skipslack: false, orgs: [], owns: [], owns_before_ids: [], owns_ids: [] };
                                        node.attr = {
                                            contact: {
                                                'aliases': contactScore.contact['aliases'],
                                                'id': contactScore.contact['id'],
                                                'name': contactScore.contact['name'],
                                                'new': contactScore.contact['new'],
                                                'rcv': contactScore.sentrcv['rcv'],
                                                'sent': contactScore.sentrcv['sent'],
                                                'slack_rcv': contactScore.contact['slack_rcv'],
                                                'slack_sent': contactScore.contact['slack_sent']
                                            },
                                            size: contactScore.scores[0],
                                            size_slack: 0,
                                            size_general: 0
                                        };
                                        node.owns.push(i);
                                        node.owns_before_ids.push(contactScore.contact.id);
                                        if(VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id) == -1){
                                            if(type == "half"){
                                                var exist_node = $.grep(VMail.App.whole_graph.nodes, function(e){ return e.attr.contact.name == contactScore.contact.name; });
                                                if(exist_node.length > 0){
                                                    node.id = exist_node[0].id;
                                                    node.owns_ids.push(exist_node[0].id);
                                                    VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                    VMail.App.idSwitch_after[i].push(exist_node[0].id);
                                                }
                                                else{
                                                    node.id = (parseInt(contactScore.contact.id) + the_num_contact).toString();
                                                    node.owns_ids.push((parseInt(contactScore.contact.id) + the_num_contact).toString()); //contactScore.contact.id
                                                    half_idToNode[parseInt(contactScore.contact.id) + the_num_contact] = node;
                                                    VMail.App.idSwitch_before[i2].push(contactScore.contact.id);
                                                    VMail.App.idSwitch_after[i2].push((parseInt(contactScore.contact.id) + the_num_contact).toString());
                                                }
                                            }
                                            else{
                                                node.id = (parseInt(contactScore.contact.id) + the_num_contact).toString();
                                                node.owns_ids.push((parseInt(contactScore.contact.id) + the_num_contact).toString()); //contactScore.contact.id
                                                idToNode[parseInt(contactScore.contact.id) + the_num_contact] = node;
                                                VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + the_num_contact).toString());
                                            }
                                        }
                                        else{
                                            var the_id = (VMail.App.idSwitch_after[i][VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id)]).toString();
                                            node.id = the_id;
                                            node.owns_ids.push(the_id); //contactScore.contact.id
                                            idToNode[the_id] = node;
                                        }
                                        // node.owns_ids.push((parseInt(contactScore.contact.id) + the_num_contact).toString()); //contactScore.contact.id
                                        // idToNode[(parseInt(contactScore.contact.id) + the_num_contact).toString()] = node;
                                        nodes.push(node);
                                   
                                    
                                        //get a list of different email ending (organizations) by going through all the emails
                                        for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                                            var domain = contactScore.contact.aliases[jj].substring(contactScore.contact.aliases[jj].indexOf("@") + 1, contactScore.contact.aliases[jj].length);
                                            var search_or_not = 1;
                                            for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                                                if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                                                    search_or_not = 0; break;
                                                }
                                            }

                                            if(domain in VMail.App.org_domains){
                                                search_or_not = 0;
                                                var org_lookup = $.grep(org_nodes, function(e){ return e.domain == VMail.App.org_domains[domain]['domain']; })
                                                if(org_lookup.length == 1){
                                                    if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                                        org_lookup[0].member_size++;
                                                        org_lookup[0].nodes.push(node);
                                                    }
                                                    if(($.grep(org_lookup[0].owns_contacts[i], function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i)];})).length == 0){
                                                        org_lookup[0].owns[i]++;
                                                        org_lookup[0].owns_contacts[i].push({id: node.owns_before_ids[node.owns.indexOf(i)], name: node.attr.contact.name});
                                                    }
                                                    if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                                        node.orgs.push(org_lookup[0].id);
                                                    }
                                                }
                                                else if(org_lookup.length > 1){
                                                    if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                                        org_lookup[0].member_size++;
                                                        org_lookup[0].nodes.push(node);
                                                    }
                                                    if(($.grep(org_lookup[0].owns_contacts[i], function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i)];})).length == 0){
                                                        org_lookup[0].owns[i]++;
                                                        org_lookup[0].owns_contacts[i].push({id: node.owns_before_ids[node.owns.indexOf(i)], name: node.attr.contact.name});
                                                    }
                                                    if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                                        node.orgs.push(org_lookup[0].id);
                                                    }
                                                }
                                                else{ //length == 0 -> create an org node
                                                    var result = VMail.App.org_domains[domain];
                                                    var the_node = { domain: result.domain, name: result.name, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns:[], owns_contacts: [], id: (VMail.App.domainToid[result.domain]).toString(), attr: {}, skip: false, skip_removed: []};
                                                    for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
                                                    the_node.owns[i]++;
                                                    the_node.owns_contacts[i].push({id: node.owns_before_ids[node.owns.indexOf(i)], name: node.attr.contact.name});
                                                    org_nodes.push(the_node);
                                                    the_node.nodes.push(node);
                                                    org_idToNode[(VMail.App.domainToid[result.domain]).toString()] = the_node;
                                                    if(node.orgs.indexOf((VMail.App.domainToid[result.domain]).toString()) == -1){
                                                        node.orgs.push((VMail.App.domainToid[result.domain]).toString());
                                                    }
                                                }
                                            }

                                            if(search_or_not == 1){
                                                var result = $.grep(org_nodes, function(e){ return e.domain == domain; });
                                                if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                                                    var the_domain = domain;
                                                    while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                                        the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                                        var org_lookup = $.grep(org_nodes, function(e){ return e.domain == the_domain; })
                                                        if(org_lookup.length == 1){//we find the only one. should be the correct org.
                                                            if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                                                org_lookup[0].member_size++;
                                                                org_lookup[0].nodes.push(node);
                                                            } 
                                                            if(($.grep(org_lookup[0].owns_contacts[i], function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i)];})).length == 0){
                                                                org_lookup[0].owns[i]++;
                                                                org_lookup[0].owns_contacts[i].push({id: node.owns_before_ids[node.owns.indexOf(i)], name: node.attr.contact.name});
                                                            }
                                                            if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                                                node.orgs.push(org_lookup[0].id);
                                                            }
                                                            break;
                                                        }
                                                        else if(org_lookup.length > 1){//more than one results, should pick up the right one
                                                            if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i)];})).length == 0){
                                                                org_lookup[0].member_size++;
                                                                org_lookup[0].nodes.push(node);
                                                            } 
                                                            if(($.grep(org_lookup[0].owns_contacts, function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i)];})).length == 0){
                                                                org_lookup[0].owns[i]++;
                                                                org_lookup[0].owns_contacts[i].push({id: node.owns_before_ids[node.owns.indexOf(i)], name: node.attr.contact.name});
                                                            }
                                                            if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                                                node.orgs.push(org_lookup[0].id);
                                                            }
                                                            break;
                                                        }
                                                    }
                                                    if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                                                        the_domain = domain;

                                                        if(domain in VMail.App.org_domains){
                                                            result = VMail.App.org_domains[domain];
                                                            var the_node = { domain: result.domain, name: result.name, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns:[], owns_contacts: [], id: (VMail.App.domainToid[result.domain]).toString(), attr: {}, skip: false, skip_removed: []};
                                                            for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
                                                            the_node.owns[i]++;
                                                            the_node.owns_contacts[i].push({id: node.owns_before_ids[node.owns.indexOf(i)], name: node.attr.contact.name});
                                                            org_nodes.push(the_node);
                                                            the_node.nodes.push(node);
                                                            org_idToNode[(VMail.App.domainToid[result.domain]).toString()] = the_node;
                                                            if(node.orgs.indexOf((VMail.App.domainToid[result.domain]).toString()) == -1){
                                                                node.orgs.push((VMail.App.domainToid[result.domain]).toString());
                                                            }
                                                        }
                                                    }
                                                }
                                                else{
                                                    if(($.grep(result[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                                        result[0].member_size++;
                                                        result[0].nodes.push(node);
                                                    }
                                                    if(($.grep(result[0].owns_contacts[i], function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i)];})).length == 0){
                                                        result[0].owns[i]++;
                                                        result[0].owns_contacts[i].push({id: node.owns_before_ids[node.owns.indexOf(i)], name: node.attr.contact.name}); 
                                                    }
                                                    if(node.orgs.indexOf(result[0].id) == -1){
                                                        node.orgs.push(result[0].id);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    
        //                            if(i != 0){
                                    if(VMail.App.init_time == 0){
                                        VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                        VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact).toString());
                                    }
        //                            }
                                }
                            });
                            if(i == db.length - 1){
                                console.time('half_contacts');
                                //for half network
                                if(VMail.App.init_time == 0){
                                    d3.range(db.length).forEach(function (i2){
                                        db[i2].getTopContacts_multi(nnodes, startt, VMail.App.time_points[2] * 1000).forEach(function (contactScore) { 
                                            var node_already = -1;
                                            var member_node_already = -1;
                                            if(i2 != 0){ 
                                                for(var ii = 0; ii < half_nodes.length; ii++){
                                                    var email_add = half_nodes[ii].attr.contact.aliases;
                                                    if(half_nodes[ii].attr.contact.name == contactScore.contact.name){
                                                        node_already = ii;
                                                        for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                                                            for(var iii = 0; iii < half_member_nodes.length; iii++){
                                                                var member_email_add = half_member_nodes[iii].attr.contact.aliases;
                                                                if(member_email_add.indexOf(contactScore.contact.aliases[jj])!= -1){
                                                                    member_node_already = iii; 
                                                                }
                                                            }

                                                            jj = contactScore.contact.aliases.length;                                       
                                                        }
                                                        ii = half_nodes.length; 
                                                    }
                                                }
                                            }
                                            if(i2 != 0 && node_already != -1){//add email info to the existing node
                                                var p = -3; 
                                                half_nodes[node_already].attr.contact.sent = half_nodes[node_already].attr.contact.sent + contactScore.sentrcv.sent;
                                                half_nodes[node_already].attr.contact.rcv = half_nodes[node_already].attr.contact.rcv + contactScore.sentrcv.rcv;
                                                half_nodes[node_already].attr.size = Math.pow((Math.pow(half_nodes[node_already].attr.contact.sent, p) + Math.pow(half_nodes[node_already].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                                if(half_nodes[node_already].owns.indexOf(i2) == -1){
                                                    half_nodes[node_already].attr.contact.aliases = arrayUnique(half_nodes[node_already].attr.contact.aliases.concat(contactScore.contact.aliases));
                                                    half_nodes[node_already].owns.push(i2);
                                                    half_nodes[node_already].owns_before_ids.push(contactScore.contact.id);
                                                    half_nodes[node_already].owns_ids.push(half_nodes[node_already].id); 
                                                    if(VMail.App.idSwitch_before[i2].indexOf(contactScore.contact.id) == -1){//first time seeing this contact for user i
                                                        VMail.App.idSwitch_before[i2].push(contactScore.contact.id);
                                                        VMail.App.idSwitch_after[i2].push(half_nodes[node_already].id); //(parseInt(contactScore.contact.id) + num_contact).toString()
                                                    }
                                                    
                                                    //get a list of different email ending (organizations) by going through all the emails
                                                    for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                                                        var domain = contactScore.contact.aliases[jj].substring(contactScore.contact.aliases[jj].indexOf("@") + 1, contactScore.contact.aliases[jj].length);
                                                        var search_or_not = 1;
                                                        for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                                                            if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                                                                search_or_not = 0; break;
                                                            }
                                                        }
                                                        if(domain in VMail.App.org_domains){
                                                            search_or_not = 0;
                                                            var org_lookup = $.grep(half_org_nodes, function(e){ return e.domain == VMail.App.org_domains[domain]['domain']; })
                                                            if(org_lookup.length == 1){
                                                                if(($.grep(org_lookup[0].nodes, function(e){ return e.id == half_nodes[node_already].id;})).length == 0){
                                                                    org_lookup[0].member_size++;
                                                                    org_lookup[0].nodes.push(half_nodes[node_already]);
                                                                }
                                                                if(($.grep(org_lookup[0].owns_contacts[i2], function(e){ return e.id == half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)];})).length == 0){
                                                                    org_lookup[0].owns[i2]++;
                                                                    org_lookup[0].owns_contacts[i2].push({id: half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)], name: half_nodes[node_already].attr.contact.name});
                                                                }
                                                                if(half_nodes[node_already].orgs.indexOf(org_lookup[0].id) == -1){
                                                                    half_nodes[node_already].orgs.push(org_lookup[0].id);
                                                                }
                                                            }
                                                            else if(org_lookup.length > 1){
                                                                if(($.grep(org_lookup[0].nodes, function(e){ return e.id == half_nodes[node_already].id;})).length == 0){
                                                                    org_lookup[0].member_size++;
                                                                    org_lookup[0].nodes.push(half_nodes[node_already]);
                                                                }
                                                                if(($.grep(org_lookup[0].owns_contacts[i2], function(e){ return e.id == half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)];})).length == 0){
                                                                    org_lookup[0].owns[i2]++;
                                                                    org_lookup[0].owns_contacts[i2].push({id: half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)], name: half_nodes[node_already].attr.contact.name});
                                                                }
                                                                if(half_nodes[node_already].orgs.indexOf(org_lookup[0].id) == -1){
                                                                    half_nodes[node_already].orgs.push(org_lookup[0].id);
                                                                }
                                                            }
                                                            else{
                                                                var result = VMail.App.org_domains[domain];
                                                                var the_node = { domain: result.domain, name: result.name, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns:[], owns_contacts: [], id: (VMail.App.domainToid[result.domain]).toString(), attr: {}, skip: false, skip_removed: []};
                                                                for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
                                                                the_node.owns[i2]++;
                    //                                                    the_node.owns_contacts[i2].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
                                                                the_node.owns_contacts[i2].push({id: half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)], name: half_nodes[node_already].attr.contact.name});
                                                                half_org_nodes.push(the_node);
                                                                the_node.nodes.push(half_nodes[node_already]);
                                                                half_org_idToNode[(VMail.App.domainToid[result.domain]).toString()] = the_node;
                                                                if(half_nodes[node_already].orgs.indexOf((VMail.App.domainToid[result.domain]).toString()) == -1){
                                                                    half_nodes[node_already].orgs.push((VMail.App.domainToid[result.domain]).toString());
                                                                }
                                                            }
                                                        }
                                                        if(search_or_not == 1){
                                                            var result = $.grep(half_org_nodes, function(e){ return e.domain == domain; });
                                                            if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                                                                var the_domain = domain;
                                                                while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                                                    the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                                                    var org_lookup = $.grep(half_org_nodes, function(e){ return e.domain == the_domain; });
                                                                    if(org_lookup.length == 1){//we find the only one. should be the correct org.
                                                                        if(($.grep(org_lookup[0].nodes, function(e){ return e.id == half_nodes[node_already].id;})).length == 0){
                                                                            org_lookup[0].member_size++;
                                                                            org_lookup[0].nodes.push(half_nodes[node_already]);
                                                                        } 
                                                                        if(($.grep(org_lookup[0].owns_contacts[i2], function(e){ return e.id == half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)];})).length == 0){
                                                                            org_lookup[0].owns[i2]++;
                                                                            org_lookup[0].owns_contacts[i2].push({id: half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)], name: half_nodes[node_already].attr.contact.name});
                                                                        }
                                                                        if(half_nodes[node_already].orgs.indexOf(org_lookup[0].id) == -1){
                                                                            half_nodes[node_already].orgs.push(org_lookup[0].id);
                                                                        }
                                                                        break;
                                                                    }
                                                                    else if(org_lookup.length > 1){//more than one results, should pick up the right one
                                                                        if(($.grep(org_lookup[0].nodes, function(e){ return e.id == half_nodes[node_already].id;})).length == 0){
                                                                            org_lookup[0].member_size++;
                                                                            org_lookup[0].nodes.push(half_nodes[node_already]);
                                                                        } 
                                                                        if(($.grep(org_lookup[0].owns_contacts[i2], function(e){ return e.id == half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)];})).length == 0){
                                                                            org_lookup[0].owns[i2]++;
                                                                            org_lookup[0].owns_contacts[i2].push({id: half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)], name: half_nodes[node_already].attr.contact.name});
                                                                        }
                                                                        if(half_nodes[node_already].orgs.indexOf(org_lookup[0].id) == -1){
                                                                            half_nodes[node_already].orgs.push(org_lookup[0].id);
                                                                        }
                                                                        break;
                                                                    }
                                                                }
                                                                if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                                                                    the_domain = domain;

                                                                    if(domain in VMail.App.org_domains){
                                                                        result = VMail.App.org_domains[domain];
                                                                        var the_node = { domain: result.domain, name: result.name, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns:[], owns_contacts: [], id: (VMail.App.domainToid[result.domain]).toString(), attr: {}, skip: false, skip_removed: []};
                                                                        for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
                                                                        the_node.owns[i2]++;
                        //                                                    the_node.owns_contacts[i2].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
                                                                        the_node.owns_contacts[i2].push({id: half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)], name: half_nodes[node_already].attr.contact.name});
                                                                        half_org_nodes.push(the_node);
                                                                        the_node.nodes.push(half_nodes[node_already]);
                                                                        half_org_idToNode[(VMail.App.domainToid[result.domain]).toString()] = the_node;
                                                                        if(half_nodes[node_already].orgs.indexOf((VMail.App.domainToid[result.domain]).toString()) == -1){
                                                                            half_nodes[node_already].orgs.push((VMail.App.domainToid[result.domain]).toString());
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            else{
                                                                if(($.grep(result[0].nodes, function(e){ return e.id == half_nodes[node_already].id;})).length == 0){
                                                                    result[0].member_size++;
                                                                    result[0].nodes.push(half_nodes[node_already]);
                                                                }
                                                                if(($.grep(result[0].owns_contacts[i2], function(e){ return e.id == half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)];})).length == 0){
                                                                    result[0].owns[i2]++;
                    //                                                result[0].owns_contacts[i2].push({id: nodes[node_already].id, name: nodes[node_already].attr.contact.name});
                                                                    result[0].owns_contacts[i2].push({id: half_nodes[node_already].owns_before_ids[half_nodes[node_already].owns.indexOf(i2)], name: half_nodes[node_already].attr.contact.name});
                                                                }
                                                                if(half_nodes[node_already].orgs.indexOf(result[0].id) == -1){
                                                                    half_nodes[node_already].orgs.push(result[0].id);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                
                                                if(member_node_already != -1){
                                                    // member_nodes[member_node_already].attr.size = member_nodes[member_node_already].attr.size + contactScore.scores[0];
                                                    half_member_nodes[member_node_already].attr.contact.sent = half_member_nodes[member_node_already].attr.contact.sent + contactScore.sentrcv.sent;
                                                    half_member_nodes[member_node_already].attr.contact.rcv = half_member_nodes[member_node_already].attr.contact.rcv + contactScore.sentrcv.rcv;
                                                    half_member_nodes[member_node_already].attr.size = Math.pow((Math.pow(half_member_nodes[member_node_already].attr.contact.sent, p) + Math.pow(half_member_nodes[member_node_already].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                                    if(half_member_nodes[member_node_already].owns.indexOf(i2) == -1){
                                                        half_member_nodes[member_node_already].owns.push(i2);
                                                        half_member_nodes[member_node_already].owns_before_ids.push(contactScore.contact.id);
                                                        half_member_nodes[member_node_already].owns_ids.push(half_nodes[node_already].id); //contactScore.contact.id
                                                        if(VMail.App.member_idSwitch_before[i2].indexOf(contactScore.contact.id) == -1){//first time seeing this contact for user i
                                                            VMail.App.member_idSwitch_before[i2].push(contactScore.contact.id);
                                                            VMail.App.member_idSwitch_after[i2].push(half_member_nodes[member_node_already].id); //(parseInt(contactScore.contact.id) + num_contact).toString()
                                                        }
                                                    }
                                                }
                    //                            nodes[node_already].attr.size = Math.pow((Math.pow(nodes[node_already].attr.size, p) + Math.pow(contactScore.scores[0], p)), 1.0 / p);
                                            }
                                            else {//create a new node
                                                //member nodes
                                                var removed_member = 0;
                                                for(var iii=0; iii<VMail.App.usersinfo.length; iii++){
                                                    if(VMail.App.usersinfo[iii].name == contactScore.contact.name){
                                                        // if(VMail.App.removed[iii] == 1){ removed_member = 1; }
                                                        if(half_member_shown[iii] == 0){
                                                            half_member_shown[iii] = 1;
                                                            var node2 = { attr: undefined, links: [], id: null, skip: false, skip_removed: false, skipslack: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                                            node2.attr = {
                                                                contact: {
                                                                    'aliases': contactScore.contact['aliases'],
                                                                    'id': contactScore.contact['id'],
                                                                    'name': contactScore.contact['name'],
                                                                    'new': contactScore.contact['new'],
                                                                    'rcv': contactScore.sentrcv['rcv'],
                                                                    'sent': contactScore.sentrcv['sent'],
                                                                    'slack_rcv': contactScore.contact['slack_rcv'],
                                                                    'slack_sent': contactScore.contact['slack_sent']
                                                                }, //contactScore.contact,
                                                                size: contactScore.scores[0],
                                                                size_slack: 0,
                                                                size_general: 0
                                                            };
                                                            node2.attr.contact.aliases = VMail.App.db[iii].aliases;
                                                            node2.owns.push(i2);
                                                            node2.owns_before_ids.push(contactScore.contact.id); 
                                                            if(VMail.App.idSwitch_before[i2].indexOf(contactScore.contact.id) == -1){
                                                                var exist_node = $.grep(member_nodes, function(e){ return e.attr.contact.name == contactScore.contact.name; });
                                                                if(exist_node.length > 0){
                                                                    node2.id = exist_node[0].id;
                                                                    node2.owns_ids.push(exist_node[0].id); 
                                                                    half_member_idToNode[the_id] = node2;
                                                                    VMail.App.idSwitch_before[i2].push(contactScore.contact.id);
                                                                    VMail.App.idSwitch_after[i2].push(exist_node[0].id);
                                                                    VMail.App.member_idSwitch_before[i2].push(contactScore.contact.id);
                                                                    VMail.App.member_idSwitch_after[i2].push(exist_node[0].id);
                                                                }
                                                                else{
                                                                    node2.id = (parseInt(contactScore.contact.id) + num_contact2).toString();
                                                                    node2.owns_ids.push((parseInt(contactScore.contact.id) + num_contact2).toString()); //contactScore.contact.id
                                                                    half_member_idToNode[parseInt(contactScore.contact.id) + num_contact2] = node2;
                                                                    VMail.App.idSwitch_before[i2].push(contactScore.contact.id);
                                                                    VMail.App.idSwitch_after[i2].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                                    VMail.App.member_idSwitch_before[i2].push(contactScore.contact.id);
                                                                    VMail.App.member_idSwitch_after[i2].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                                }
                                                            }
                                                            else{
                                                                var the_id = (VMail.App.idSwitch_after[i2][VMail.App.idSwitch_before[i2].indexOf(contactScore.contact.id)]).toString();
                                                                node2.id = the_id;
                                                                node2.owns_ids.push(the_id); //contactScore.contact.id
                                                                half_member_idToNode[the_id] = node2;
                                                                VMail.App.member_idSwitch_before[i2].push(contactScore.contact.id);
                                                                VMail.App.member_idSwitch_after[i2].push((VMail.App.idSwitch_after[i2][VMail.App.idSwitch_before[i2].indexOf(contactScore.contact.id)]).toString());
                                                            }
                                                            half_member_nodes.push(node2);
                                                        }
                                                        if(VMail.App.member_idSwitch_before[i2].indexOf(contactScore.contact.id) == -1){//first time seeing this contact for user i
                                                            VMail.App.member_idSwitch_before[i2].push(contactScore.contact.id);
                                                            VMail.App.member_idSwitch_after[i2].push((parseInt(contactScore.contact.id) + num_contact2).toString()); //(parseInt(contactScore.contact.id) + num_contact).toString()
                                                        }
                                                    }
                                                }

                                                if(removed_member == 0){//if this node is not a removed member
                                                    var the_num_contact = num_contact;
                                                    // if(VMail.App.init_time != 0 && i != 0 && VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id) == -1){//add a new pair into before and after
                                                    //     VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                    //     VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                    //     the_num_contact = num_contact2;
                                                    // }
                                                    // else if(VMail.App.init_time != 0 && i != 0){ 
                                                    //     var exist_node = $.grep(half_nodes, function(e){ return e.id == VMail.App.idSwitch_after[VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id)];})
                                                    //     if(exist_node.length > 0){//
                                                    //          if(exist_node[0].attr.contact.name != contactScore.contact.name){
                                                    //              VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                    //              VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                    //              the_num_contact = num_contact2;
                                                    //          }
                                                    //     }
                                                    // }
                                                    var node = { attr: undefined, links: [], id: null, skip: false, skip_removed: false, skipslack: false, orgs: [], owns: [], owns_before_ids: [], owns_ids: [] };
                                                    node.attr = {
                                                        contact: {
                                                            'aliases': contactScore.contact['aliases'],
                                                            'id': contactScore.contact['id'],
                                                            'name': contactScore.contact['name'],
                                                            'new': contactScore.contact['new'],
                                                            'rcv': contactScore.sentrcv['rcv'],
                                                            'sent': contactScore.sentrcv['sent'],
                                                            'slack_rcv': contactScore.contact['slack_rcv'],
                                                            'slack_sent': contactScore.contact['slack_sent']
                                                        },
                                                        size: contactScore.scores[0],
                                                        size_slack: 0,
                                                        size_general: 0
                                                    };
                                                    node.owns.push(i2);
                                                    node.owns_before_ids.push(contactScore.contact.id);
                                                    if(VMail.App.idSwitch_before[i2].indexOf(contactScore.contact.id) == -1){
                                                        var exist_node = $.grep(nodes, function(e){ return e.attr.contact.name == contactScore.contact.name; });
                                                        if(exist_node.length > 0){
                                                            node.id = exist_node[0].id;
                                                            node.owns_ids.push(exist_node[0].id); 
                                                            half_idToNode[the_id] = node;
                                                            VMail.App.idSwitch_before[i2].push(contactScore.contact.id);
                                                            VMail.App.idSwitch_after[i2].push(exist_node[0].id);
                                                        }
                                                        else{
                                                            node.id = (parseInt(contactScore.contact.id) + the_num_contact).toString();
                                                            node.owns_ids.push((parseInt(contactScore.contact.id) + the_num_contact).toString()); //contactScore.contact.id
                                                            half_idToNode[parseInt(contactScore.contact.id) + the_num_contact] = node;
                                                            VMail.App.idSwitch_before[i2].push(contactScore.contact.id);
                                                            VMail.App.idSwitch_after[i2].push((parseInt(contactScore.contact.id) + the_num_contact).toString());
                                                        }
                                                    }
                                                    else{
                                                        var the_id = (VMail.App.idSwitch_after[i2][VMail.App.idSwitch_before[i2].indexOf(contactScore.contact.id)]).toString();
                                                        node.id = the_id;
                                                        node.owns_ids.push(the_id); //contactScore.contact.id
                                                        half_idToNode[the_id] = node;
                                                    }
                                                    half_nodes.push(node);
                                               
                                                
                                                    //get a list of different email ending (organizations) by going through all the emails
                                                    for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                                                        var domain = contactScore.contact.aliases[jj].substring(contactScore.contact.aliases[jj].indexOf("@") + 1, contactScore.contact.aliases[jj].length);
                                                        var search_or_not = 1;
                                                        for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                                                            if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                                                                search_or_not = 0; break;
                                                            }
                                                        }

                                                        if(domain in VMail.App.org_domains){
                                                            search_or_not = 0;
                                                            var org_lookup = $.grep(half_org_nodes, function(e){ return e.domain == VMail.App.org_domains[domain]['domain']; })
                                                            if(org_lookup.length == 1){
                                                                if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                                                    org_lookup[0].member_size++;
                                                                    org_lookup[0].nodes.push(node);
                                                                }
                                                                if(($.grep(org_lookup[0].owns_contacts[i2], function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i2)];})).length == 0){
                                                                    org_lookup[0].owns[i2]++;
                                                                    org_lookup[0].owns_contacts[i2].push({id: node.owns_before_ids[node.owns.indexOf(i2)], name: node.attr.contact.name});
                                                                }
                                                                if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                                                    node.orgs.push(org_lookup[0].id);
                                                                }
                                                            }
                                                            else if(org_lookup.length > 1){
                                                                if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                                                    org_lookup[0].member_size++;
                                                                    org_lookup[0].nodes.push(node);
                                                                }
                                                                if(($.grep(org_lookup[0].owns_contacts[i2], function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i2)];})).length == 0){
                                                                    org_lookup[0].owns[i2]++;
                                                                    org_lookup[0].owns_contacts[i2].push({id: node.owns_before_ids[node.owns.indexOf(i2)], name: node.attr.contact.name});
                                                                }
                                                                if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                                                    node.orgs.push(org_lookup[0].id);
                                                                }
                                                            }
                                                            else{ //length == 0 -> create an org node
                                                                var result = VMail.App.org_domains[domain];
                                                                var the_node = { domain: result.domain, name: result.name, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns:[], owns_contacts: [], id: (VMail.App.domainToid[result.domain]).toString(), attr: {}, skip: false, skip_removed: []};
                                                                for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
                                                                the_node.owns[i2]++;
                                                                the_node.owns_contacts[i2].push({id: node.owns_before_ids[node.owns.indexOf(i2)], name: node.attr.contact.name});
                                                                half_org_nodes.push(the_node);
                                                                the_node.nodes.push(node);
                                                                half_org_idToNode[(VMail.App.domainToid[result.domain]).toString()] = the_node;
                                                                if(node.orgs.indexOf((VMail.App.domainToid[result.domain]).toString()) == -1){
                                                                    node.orgs.push((VMail.App.domainToid[result.domain]).toString());
                                                                }
                                                            }
                                                        }

                                                        if(search_or_not == 1){
                                                            var result = $.grep(half_org_nodes, function(e){ return e.domain == domain; });
                                                            if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                                                                var the_domain = domain;
                                                                while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                                                    the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                                                    var org_lookup = $.grep(half_org_nodes, function(e){ return e.domain == the_domain; })
                                                                    if(org_lookup.length == 1){//we find the only one. should be the correct org.
                                                                        if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                                                            org_lookup[0].member_size++;
                                                                            org_lookup[0].nodes.push(node);
                                                                        } 
                                                                        if(($.grep(org_lookup[0].owns_contacts[i2], function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i2)];})).length == 0){
                                                                            org_lookup[0].owns[i2]++;
                                                                            org_lookup[0].owns_contacts[i2].push({id: node.owns_before_ids[node.owns.indexOf(i2)], name: node.attr.contact.name});
                                                                        }
                                                                        if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                                                            node.orgs.push(org_lookup[0].id);
                                                                        }
                                                                        break;
                                                                    }
                                                                    else if(org_lookup.length > 1){//more than one results, should pick up the right one
                                                                        if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i2)];})).length == 0){
                                                                            org_lookup[0].member_size++;
                                                                            org_lookup[0].nodes.push(node);
                                                                        } 
                                                                        if(($.grep(org_lookup[0].owns_contacts, function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i2)];})).length == 0){
                                                                            org_lookup[0].owns[i2]++;
                                                                            org_lookup[0].owns_contacts[i2].push({id: node.owns_before_ids[node.owns.indexOf(i2)], name: node.attr.contact.name});
                                                                        }
                                                                        if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                                                            node.orgs.push(org_lookup[0].id);
                                                                        }
                                                                        break;
                                                                    }
                                                                }
                                                                if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                                                                    the_domain = domain;

                                                                    if(domain in VMail.App.org_domains){
                                                                        result = VMail.App.org_domains[domain];
                                                                        var the_node = { domain: result.domain, name: result.name, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], owns:[], owns_contacts: [], id: (VMail.App.domainToid[result.domain]).toString(), attr: {}, skip: false, skip_removed: []};
                                                                        for(var tt=0; tt<VMail.App.usersinfo.length; tt++){ the_node.owns.push(0); the_node.owns_contacts.push([]);}
                                                                        the_node.owns[i2]++;
                                                                        the_node.owns_contacts[i2].push({id: node.owns_before_ids[node.owns.indexOf(i2)], name: node.attr.contact.name});
                                                                        half_org_nodes.push(the_node);
                                                                        the_node.nodes.push(node);
                                                                        half_org_idToNode[(VMail.App.domainToid[result.domain]).toString()] = the_node;
                                                                        if(node.orgs.indexOf((VMail.App.domainToid[result.domain]).toString()) == -1){
                                                                            node.orgs.push((VMail.App.domainToid[result.domain]).toString());
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            else{
                                                                if(($.grep(result[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                                                    result[0].member_size++;
                                                                    result[0].nodes.push(node);
                                                                }2
                                                                if(($.grep(result[0].owns_contacts[i2], function(e){ return e.id == node.owns_before_ids[node.owns.indexOf(i2)];})).length == 0){
                                                                    result[0].owns[i2]++;
                                                                    result[0].owns_contacts[i2].push({id: node.owns_before_ids[node.owns.indexOf(i2)], name: node.attr.contact.name}); 
                                                                }
                                                                if(node.orgs.indexOf(result[0].id) == -1){
                                                                    node.orgs.push(result[0].id);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                
                                                // if(VMail.App.init_time == 0){
                                                //     VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                //     VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact).toString());
                                                // }
                                            }
                                        });
                                    });
                                }
                                console.timeEnd('half_contacts');
                            }
                            console.timeEnd('contacts');            
                            
                            if(VMail.App.init_time == 0) num_contact += db[i].contactDetails.length;
                            num_contact2 += db[i].contactDetails.length; num_contact = num_contact2;
        //                    if(VMail.App.idSwitch_before[0].indexOf("1636")!=-1) alert("1636");
                            
                            //see if members after this person have been removed
                            var rest_removed = 0;
                            // var rest_removed=1;
                            // for(var ii=i+1; ii<db.length; ii++){
                            //     if(VMail.App.removed[ii] == 0) rest_removed = 0;
                            // }
                            if(rest_removed || i == db.length - 1){
                                //those members who are not in nodes list, add them in
                                for(var iii = 0; iii < member_shown.length; iii++){
                                    if(member_shown[iii] == 0){ //this member not in the nodes
                                        member_shown[iii] = 1; console.log("member not in nodes");
                                        // if(VMail.App.removed[iii] == 0){ //not a removed member node
                                        var node = { attr: undefined, links: [], id: null, skip: false, skip_removed: false, skipslack: false, orgs: [], owns: [], owns_before_ids: [], owns_ids: [] };
                                        node.attr = {
                                            contact: { aliases: VMail.App.db[iii].aliases, id: (-1 * iii), name: VMail.App.usersinfo[iii].name, new: 0, rcv: 0, sent: 0, slack_sent: 0, slack_rcv: 0 },
                                            size: 0,
                                            size_slack: 0,
                                            size_general: 0
                                        };
                                        node.owns.push(iii);
                                        node.owns_before_ids.push((-1 * iii).toString()); 
                                        if(VMail.App.first_time_graph == 1){
                                            for(var tt = 0; tt < VMail.App.whole_graph.member_nodes.length; tt++){
                                                if(VMail.App.whole_graph.member_nodes[tt].attr.contact.name == VMail.App.usersinfo[iii].name){
                                                    node.id = VMail.App.whole_graph.member_nodes[tt].id;
                                                    node.owns_ids.push(VMail.App.whole_graph.member_nodes[tt].id);
                                                    idToNode[VMail.App.whole_graph.member_nodes[tt].id] = node;
                                                    break;
                                                }
                                            }
                                        }
                                        else{
                                            if(VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                                node.id = (parseInt(iii) + num_contact2).toString();
                                                node.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                                idToNode[(parseInt(iii) + num_contact2).toString()] = node;
                                                VMail.App.idSwitch_before[iii].push((-1 * iii).toString());
                                                VMail.App.idSwitch_after[iii].push((parseInt(iii) + num_contact2).toString());
                                            }
                                            else{
                                                var the_id = (VMail.App.idSwitch_after[iii][VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString())]).toString();
                                                node.id = the_id;
                                                node.owns_ids.push(the_id); //contactScore.contact.id
                                                idToNode[the_id] = node;
                                            }
                                        }
                                        // node.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                        // idToNode[parseInt(iii) + num_contact2] = node;
                                        nodes.push(node);
                                        // }
                                        
                                        var node2 = { attr: undefined, links: [], id: null, skip: false, skip_removed: false, skipslack: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                        node2.attr = {
                                            contact: { aliases: VMail.App.db[iii].aliases, id: (-1 * iii), name: VMail.App.usersinfo[iii].name, new: 0, rcv: 0, sent: 0, slack_sent: 0, slack_rcv: 0 },
                                            size: 0,
                                            size_slack: 0,
                                            size_general: 0
                                        };
                                        node2.owns.push(iii);
                                        node2.owns_before_ids.push((-1 * iii).toString()); 
                                        if(VMail.App.first_time_graph == 1){
                                            for(var tt = 0; tt < VMail.App.whole_graph.member_nodes.length; tt++){
                                                if(VMail.App.whole_graph.member_nodes[tt].attr.contact.name == VMail.App.usersinfo[iii].name){
                                                    node2.id = VMail.App.whole_graph.member_nodes[tt].id;
                                                    node2.owns_ids.push(VMail.App.whole_graph.member_nodes[tt].id);
                                                    member_idToNode[VMail.App.whole_graph.member_nodes[tt].id] = node2;
                                                    break;
                                                }
                                            }
                                        }
                                        else{
                                            if(VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                                node2.id = (parseInt(iii) + num_contact2).toString();
                                                node2.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                                member_idToNode[(parseInt(iii) + num_contact2).toString()] = node2;
                                                VMail.App.idSwitch_before[iii].push((-1 * iii).toString());
                                                VMail.App.idSwitch_after[iii].push((parseInt(iii) + num_contact2).toString());
                                                VMail.App.member_idSwitch_before[iii].push((-1 * iii).toString());
                                                VMail.App.member_idSwitch_after[iii].push((parseInt(iii) + num_contact2).toString());
                                            }
                                            else{
                                                var the_id = (VMail.App.idSwitch_after[iii][VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString())]).toString();
                                                node2.id = the_id;
                                                node2.owns_ids.push(the_id); //contactScore.contact.id
                                                member_idToNode[the_id] = node2;
                                                if(VMail.App.member_idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                                    VMail.App.member_idSwitch_before[iii].push((-1 * iii).toString());
                                                    VMail.App.member_idSwitch_after[iii].push(the_id);
                                                }
                                            }
                                        }
                                        // node2.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                        // member_idToNode[parseInt(iii) + num_contact2] = node2;
                                        member_nodes.push(node2);
                                    }
                                }
                                if(VMail.App.init_time == 0){
                                    for(var iii = 0; iii < half_member_shown.length; iii++){
                                        if(half_member_shown[iii] == 0){ //this member not in the nodes
                                            half_member_shown[iii] = 1;console.log("member not in nodes");
                                            var found_id = null;
                                            for(var tt = 0; tt < member_nodes.length; tt++){
                                                if(member_nodes[tt].attr.contact.name == VMail.App.usersinfo[iii].name){
                                                    found_id = member_nodes[tt].id;
                                                    break;
                                                }
                                            }
                                            // if(VMail.App.removed[iii] == 0){ //not a removed member node
                                            var node = { attr: undefined, links: [], id: found_id, skip: false, skip_removed: false, skipslack: false, orgs: [], owns: [], owns_before_ids: [], owns_ids: [] };
                                            node.attr = {
                                                contact: { aliases: VMail.App.db[iii].aliases, id: (-1 * iii).toString(), name: VMail.App.usersinfo[iii].name, new: 0, rcv: 0, sent: 0, slack_sent: 0, slack_rcv: 0 },
                                                size: 0,
                                                size_slack: 0,
                                                size_general: 0
                                            };
                                            node.owns.push(iii);
                                            node.owns_before_ids.push((-1 * iii).toString()); 
                                            node.owns_ids.push(found_id);
                                            half_idToNode[found_id] = node;
                                            if(VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                                VMail.App.idSwitch_before[iii].push((-1 * iii).toString());
                                                VMail.App.idSwitch_after[iii].push(found_id);
                                            }
                                            // if(VMail.App.first_time_graph == 1){
                                            //     for(var tt = 0; tt < VMail.App.half_graph.member_nodes.length; tt++){
                                            //         if(VMail.App.half_graph.member_nodes[tt].attr.contact.name == VMail.App.usersinfo[iii].name){
                                            //             node.id = VMail.App.half_graph.member_nodes[tt].id;
                                            //             node.owns_ids.push(VMail.App.half_graph.member_nodes[tt].id);
                                            //             half_idToNode[VMail.App.half_graph.member_nodes[tt].id] = node;
                                            //             break;
                                            //         }
                                            //     }
                                            // }
                                            // else{
                                            //     if(VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                            //         node.id = (parseInt(iii) + num_contact2).toString();
                                            //         node.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                            //         half_idToNode[(parseInt(iii) + num_contact2).toString()] = node;
                                            //         VMail.App.idSwitch_before[iii].push((-1 * iii).toString());
                                            //         VMail.App.idSwitch_after[iii].push((parseInt(iii) + num_contact2).toString());
                                            //     }
                                            //     else{
                                            //         var the_id = (VMail.App.idSwitch_after[iii][VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString())]).toString();
                                            //         node.id = the_id;
                                            //         node.owns_ids.push(the_id); //contactScore.contact.id
                                            //         half_idToNode[the_id] = node;
                                            //     }
                                            // }
                                            half_nodes.push(node);
                                            // }
                                            
                                            var node2 = { attr: undefined, links: [], id: found_id, skip: false, skip_removed: false, skipslack: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                            node2.attr = {
                                                contact: { aliases: VMail.App.db[iii].aliases, id: (-1 * iii), name: VMail.App.usersinfo[iii].name, new: 0, rcv: 0, sent: 0, slack_sent: 0, slack_rcv: 0 },
                                                size: 0,
                                                size_slack: 0,
                                                size_general: 0
                                            };
                                            node2.owns.push(iii);
                                            node2.owns_before_ids.push((-1 * iii).toString()); 
                                            node2.owns_ids.push(found_id);
                                            half_member_idToNode[found_id] = node2;
                                            if(VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                                VMail.App.idSwitch_before[iii].push((-1 * iii).toString());
                                                VMail.App.idSwitch_after[iii].push(found_id);
                                            }
                                            // if(VMail.App.first_time_graph == 1){
                                            //     for(var tt = 0; tt < VMail.App.half_graph.member_nodes.length; tt++){
                                            //         if(VMail.App.half_graph.member_nodes[tt].attr.contact.name == VMail.App.usersinfo[iii].name){
                                            //             node2.id = VMail.App.half_graph.member_nodes[tt].id;
                                            //             node2.owns_ids.push(VMail.App.half_graph.member_nodes[tt].id);
                                            //             half_member_idToNode[VMail.App.half_graph.member_nodes[tt].id] = node2;
                                            //             break;
                                            //         }
                                            //     }
                                            // }
                                            // else{
                                            //     if(VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                            //         node2.id = (parseInt(iii) + num_contact2).toString();
                                            //         node2.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                            //         half_member_idToNode[(parseInt(iii) + num_contact2).toString()] = node2;
                                            //         VMail.App.idSwitch_before[iii].push((-1 * iii).toString());
                                            //         VMail.App.idSwitch_after[iii].push((parseInt(iii) + num_contact2).toString());
                                            //         VMail.App.member_idSwitch_before[iii].push((-1 * iii).toString());
                                            //         VMail.App.member_idSwitch_after[iii].push((parseInt(iii) + num_contact2).toString());
                                            //     }
                                            //     else{
                                            //         var the_id = (VMail.App.idSwitch_after[iii][VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString())]).toString();
                                            //         node2.id = the_id;
                                            //         node2.owns_ids.push(the_id); //contactScore.contact.id
                                            //         half_member_idToNode[the_id] = node2;
                                            //         if(VMail.App.member_idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                            //             VMail.App.member_idSwitch_before[iii].push((-1 * iii).toString());
                                            //             VMail.App.member_idSwitch_after[iii].push(the_id);
                                            //         }
                                            //     }
                                            // }
                                            half_member_nodes.push(node2);
                                        }
                                    }
                                }
                                
                                //create a node for this user, in order to connect all the other nodes belong to this user to this meta node
                                var member_size = new Array(member_nodes.length); //take down original member node size
                                for(var m_id in member_nodes){
                                    for(var id in nodes){
                                        if(member_nodes[m_id].id == nodes[id].id){//found this user node
                                            member_size[m_id] = nodes[id].attr.size;
                                            nodes[id].attr.size = 1000000000; //give a large size so that they will be on top when ranking
        //                                    console.log(id+","+nodes.length);
                                            break; //go to next user
                                        }
                                        else if(id == nodes.length -1){//this user not found //and not removed
                                            var ind=-1;
                                            for(var iiii = 0; iiii < VMail.App.usersinfo.length; iiii++){
                                                if(VMail.App.usersinfo[iiii].name == member_nodes[m_id].attr.contact.name){ ind = iiii; break; }
                                            }
                                            // if(VMail.App.removed[ind] != 1){
                                            var node = { attr: undefined, links: [], id: member_nodes[m_id].id, skip: false, skip_removed: false, skipslack: false, orgs: [], owns: [], owns_before_ids: [], owns_ids: [] };
                                            node.attr = {
                                                contact: {
                                                    'aliases': member_nodes[m_id].attr.contact['aliases'],
                                                    'id': member_nodes[m_id].attr.contact['id'],
                                                    'name': member_nodes[m_id].attr.contact['name'],
                                                    'new': member_nodes[m_id].attr.contact['new'],
                                                    'rcv': member_nodes[m_id].attr.contact['rcv'],
                                                    'sent': member_nodes[m_id].attr.contact['sent'],
                                                    'slack_rcv': member_nodes[m_id].attr.contact['slack_rcv'],
                                                    'slack_sent': member_nodes[m_id].attr.contact['slack_sent']
                                                }, 
                                                size: member_nodes[m_id].attr.size,
                                                size_slack: 0,
                                                size_general: 0
                                            };
                                            for(var iii in member_nodes[m_id].owns) node.owns.push(iii);
                                            for(var iii in member_nodes[m_id].owns_before_ids) node.owns_before_ids.push(member_nodes[m_id].attr.contact.id);
                                            for(var iii in member_nodes[m_id].owns_ids) node.owns_ids.push(iii); //contactScore.contact.id
                                            idToNode[member_nodes[m_id].id] = node;
                                            nodes.push(node);
                                            
                                            member_size[m_id] = node.attr.size;
                                            node.attr.size = 1000000000; 
                                            
                                            console.log(i + " " + ind + " found one");
                                            // }
                                        }
                                    }
                                }
                                //sort the nodes from multiple dbs by score desendingly
                                var comp = function (a, b) {
                                    if (a.attr.size !== b.attr.size) {
                                        return b.attr.size - a.attr.size;
                                    }
                                    return 0;
                                };
                                nodes.sort(comp);

                                if(VMail.App.init_time == 0){
                                    var half_member_size = new Array(half_member_nodes.length); 
                                    for(var m_id in half_member_nodes){
                                        for(var id in half_nodes){
                                            if(half_member_nodes[m_id].id == half_nodes[id].id){//found this user node
                                                half_member_size[m_id] = half_nodes[id].attr.size;
                                                half_nodes[id].attr.size = 1000000000; //give a large size so that they will be on top when ranking
            //                                    console.log(id+","+nodes.length);
                                                break; //go to next user
                                            }
                                            else if(id == half_nodes.length -1){//this user not found //and not removed
                                                var ind = -1;
                                                for(var iiii = 0; iiii < VMail.App.usersinfo.length; iiii++){
                                                    if(VMail.App.usersinfo[iiii].name == half_member_nodes[m_id].attr.contact.name){ ind = iiii; break; }
                                                }
                                                // if(VMail.App.removed[ind] != 1){
                                                var node = { attr: undefined, links: [], id: half_member_nodes[m_id].id, skip: false, skip_removed: false, skipslack: false, orgs: [], owns: [], owns_before_ids: [], owns_ids: [] };
                                                node.attr = {
                                                    contact: {
                                                        'aliases': half_member_nodes[m_id].attr.contact['aliases'],
                                                        'id': half_member_nodes[m_id].attr.contact['id'],
                                                        'name': half_member_nodes[m_id].attr.contact['name'],
                                                        'new': half_member_nodes[m_id].attr.contact['new'],
                                                        'rcv': half_member_nodes[m_id].attr.contact['rcv'],
                                                        'sent': half_member_nodes[m_id].attr.contact['sent'],
                                                        'slack_rcv': half_member_nodes[m_id].attr.contact['slack_rcv'],
                                                        'slack_sent': half_member_nodes[m_id].attr.contact['slack_sent']
                                                    }, 
                                                    size: half_member_nodes[m_id].attr.size,
                                                    size_slack: 0,
                                                    size_general: 0
                                                };
                                                for(var iii in half_member_nodes[m_id].owns) node.owns.push(iii);
                                                for(var iii in half_member_nodes[m_id].owns_before_ids) node.owns_before_ids.push(half_member_nodes[m_id].attr.contact.id);
                                                for(var iii in half_member_nodes[m_id].owns_ids) node.owns_ids.push(iii); //contactScore.contact.id
                                                half_idToNode[half_member_nodes[m_id].id] = node;
                                                half_nodes.push(node);
                                                
                                                half_member_size[m_id] = node.attr.size;
                                                node.attr.size = 1000000000; 
                                                
                                                console.log(i + " " + ind + " found one for half");
                                                // }
                                            }
                                        }
                                    }
                                    half_nodes.sort(comp);
                                }
                                
                                
                                if(VMail.App.type == "multi"){
                                    //make sure every member has 50 nodes belong to them
                                    var num_members = new Array(VMail.App.usersinfo.length), enough_nodes = new Array(VMail.App.usersinfo.length);
                                    for(var i =0; i < VMail.App.usersinfo.length; i++){ num_members[i] = 0; enough_nodes[i] = 0; }
                                    var nnn = nodes.length, mmm = 50 * VMail.App.usersinfo.length - 1; //VMail.App.fixedNNodes * num_members.length, mmm = nnn - 1;
                                    var all_not_enough = 1;
                                    for(var ii = 0; ii < nnn; ii ++){
                                        for(var jj = 0; jj < VMail.App.usersinfo.length; jj++){
                                            if(enough_nodes[jj] != 1 && num_members[jj] >= 40) { enough_nodes[jj] = 1; all_not_enough = 0; }
                                        }
                                        if(all_not_enough == 0 && enough_nodes.indexOf(0) != -1){
                                            var to_swap = 0, no_need_swap = 0;
                                            for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
                                                if(enough_nodes[kk] == 0 && nodes[ii].owns.indexOf(kk) != -1){ no_need_swap = 1; break; }
                                            }
                                            if(!no_need_swap){
                                                do{
                                                    mmm++;
                                                    for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
                                                        if(enough_nodes[kk] == 0 && typeof(nodes[mmm]) != "undefined" && nodes[mmm].owns.indexOf(kk) != -1){ to_swap = 1; break; }
                                                    }
                                                }while(mmm < nodes.length - 1 && to_swap == 0);
                                                if(to_swap == 1){
                                                    var tmp = nodes[mmm];
                                                    nodes[mmm] = nodes[ii];
                                                    nodes[ii] = tmp;
                                                }
                                            }
                                        }
                                        for(var jj = 0; jj < nodes[ii].owns.length; jj++){
                                            num_members[nodes[ii].owns[jj]]++;
                                        }
                                    }

                                    if(VMail.App.init_time == 0){
                                        var num_members = new Array(VMail.App.usersinfo.length), enough_nodes = new Array(VMail.App.usersinfo.length);
                                        for(var i =0; i < VMail.App.usersinfo.length; i++){ num_members[i] = 0; enough_nodes[i] = 0; }
                                        var nnn = half_nodes.length, mmm = 50 * VMail.App.usersinfo.length - 1; //VMail.App.fixedNNodes * num_members.length, mmm = nnn - 1;
                                        var all_not_enough = 1;
                                        for(var ii = 0; ii < nnn; ii ++){
                                            for(var jj = 0; jj < VMail.App.usersinfo.length; jj++){
                                                if(enough_nodes[jj] != 1 && num_members[jj] >= 40) { enough_nodes[jj] = 1; all_not_enough = 0; }
                                            }
                                            if(all_not_enough == 0 && enough_nodes.indexOf(0) != -1){
                                                var to_swap = 0, no_need_swap = 0;
                                                for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
                                                    if(enough_nodes[kk] == 0 && half_nodes[ii].owns.indexOf(kk) != -1){ no_need_swap = 1; break; }
                                                }
                                                if(!no_need_swap){
                                                    do{
                                                        mmm++;
                                                        for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
                                                            if(enough_nodes[kk] == 0 && typeof(half_nodes[mmm]) != "undefined" && half_nodes[mmm].owns.indexOf(kk) != -1){ to_swap = 1; break; }
                                                        }
                                                    }while(mmm < half_nodes.length - 1 && to_swap == 0);
                                                    if(to_swap == 1){
                                                        var tmp = half_nodes[mmm];
                                                        half_nodes[mmm] = half_nodes[ii];
                                                        half_nodes[ii] = tmp;
                                                    }
                                                }
                                            }
                                            for(var jj = 0; jj < half_nodes[ii].owns.length; jj++){
                                                num_members[half_nodes[ii].owns[jj]]++;
                                            }
                                        }
                                    }
                                }
                                
                                //give back the actual member node size
                                for(var m_id in member_nodes){
                                    for(var id in nodes){
                                        if(member_nodes[m_id].id == nodes[id].id){//found this user node
                                            nodes[id].attr.size = member_size[m_id];
                                            break; //go to next user
                                        }
                                    }
                                }
                                member_nodes.sort(comp);
                                if(VMail.App.init_time == 0){
                                    for(var m_id in half_member_nodes){
                                        for(var id in half_nodes){
                                            if(half_member_nodes[m_id].id == half_nodes[id].id){//found this user node
                                                half_nodes[id].attr.size = half_member_size[m_id];
                                                break; //go to next user
                                            }
                                        }
                                    }
                                    half_member_nodes.sort(comp);
                                }
                            }
                          //}
                        });
                        console.timeEnd('nodes');

                        var slackidToNodeid = {}, slack_data = null;
                        if(VMail.App.slack_network == 1){
                            slack_data = VMail.App.slack_data['data'];
                            //update slack user ids to contact ids, remove those are not in contact list / graph.nodes
                            for(var kk = 0; kk < slack_data['members'].length; kk++){
                                for(var jj = 0; jj < member_nodes.length; jj++){
                                    if(member_nodes[jj].attr.contact.aliases.indexOf(slack_data['members'][kk]['email']) != -1){
                                        slack_data['members'][kk]['node_id'] = member_nodes[jj]['id'];
                                        slackidToNodeid[slack_data['members'][kk]['id']] = member_nodes[jj]['id'];
                                        break;
                                    }
                                }
                            }
                        }
                         
                        var sample = {};
                        var year_start = start.getFullYear() - 1, year_end = end.getFullYear();
                        for(var y = year_start; y <= year_end; y++){
                            sample[y] = [];
                        }
                        
                        // //if less users or different users, build links by going through emails
                        // var construct_links = false;
                        // if(VMail.App.graph && VMail.App.graph.member_nodes && VMail.App.first_time_graph == 0){
                        //     //with saved network structure and this is the first time constructing network
                        //     if(VMail.App.last_time_members.length < VMail.App.usersinfo.length) construct_links = true;
                        //     if(VMail.App.last_time_members.length == VMail.App.usersinfo.length){
                        //         for(var k = 0; k < VMail.App.last_time_members.length; k++){
                        //             for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
                        //                 if(VMail.App.last_time_members[k] == VMail.App.usersinfo[kk].email){
                        //                     break;
                        //                 }
                        //                 if(kk == VMail.App.usersinfo.length - 1){
                        //                     construct_links = true; break;
                        //                 }
                        //             }
                        //             if(construct_links == true) break;
                        //         }
                        //     }
                        // }
                        // else{
                        //     construct_links = true;
                        // }

                        //if same users or more users, do next steps
                        //change the saved links to new links based on contact ids
                        //add new links using new emails based on saved timestamps
                        construct_links = true;
                        if(construct_links == false){
                            // for(var k = 0; k < db.length; k++){
                            //     for (var i = 0; i < db[k].emails.length; i++) {
                            //         if(db[k].emails[i].timestamp <= VMail.App.usersinfo[k].timestamp)
                            //             continue;
                            //         //do regular process of the email

                            //     }
                            // }
                        }
                        else{ //construct_links == true
                            console.time('links');
                            
                            for(var k = 0; k < db.length; k++){
            //                  if(VMail.App.removed[k] != 1){ //commented because of "to keep connections of the member's contacts after removing him/her"
                                for (var i = 0; i < db[k].emails.length; i++) {
                                    var ev = db[k].emails[i];
                                    var time = ev.timestamp * 1000;

                                    // remove emails before startt
                                    if(type == "half" && time < startt){
                                        var isSent = !(ev.hasOwnProperty('source'));
                                        if(ev.source_org == "datawheel.com") ev.source_org = "datawheel.us";
                                        var a = ev.source, a_org = VMail.App.domainToid[ev.source_org];
                                        
                                        a = ((VMail.App.idSwitch_before[k].indexOf(ev.source)!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.source)]:"");  //:ev.source
                                        
                                        if (isSent || !(a in idToNode)) { // the mail is send by the member
                                            // if(isSent && VMail.App.removed[k] == 1) continue; //to keep connections of the member's contacts after removing him/her
                                            if(isSent){// the mail is send by the member
                                                for(var jjj in member_nodes){
                                                    if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                                        a = member_nodes[jjj].id; break;
                                                    }
                                                }
                                                if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent--;
                                                
                                                for (var j = 0; j < ev.destinations.length; j++) {
                                                    if(ev.destinations_org[j] == "datawheel.com") ev.destinations_org[j] = "datawheel.us";
                                                    var b = ev.destinations[j], b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                                    b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
                                                    
                                                    if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv--;
                                                    
                                                    //adding links to organization nodes
                                                    var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                                    var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                                    var key = src_org + '#' + trg_org;
                                                    if(src_org != trg_org  && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                                        if ((key in org_idpairToLink)) org_idpairToLink[key].weight--;
                                                        // else console.log("org_idpairToLink exception");
                                                    }

                                                    if (!(b in idToNode) || b == a)
                                                        continue;
                                                    var src = Math.min(parseInt(a), parseInt(b)).toString();
                                                    var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                                    var key = src + '#' + trg;
                                                    if (key in idpairToLink) idpairToLink[key].attr.weight--;
                                                    // else console.log("idpairToLink exception");
                                                    
                                                    if(a in member_idToNode && b in member_idToNode){ 
                                                        if(key in member_idpairToLink) member_idpairToLink[key].attr.weight--; 
                                                    }

                                                }
                                            }
                                            
                                            continue;
                                        }
                                        if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent--;
                                        for (var j = 0; j < ev.destinations.length; j++) {
                                            var b = ev.destinations[j], b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                            b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
                                            if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv--;
                                            
                                            //add links for organization nodes
                                            var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                            var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                            var key = src_org + '#' + trg_org;
                                            if(src_org != trg_org && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                                if ((key in org_idpairToLink)) org_idpairToLink[key].weight--;
                                            }
                                            
                                            if (!(b in idToNode) || b == a)
                                                continue;
                                            
                                            var src = Math.min(parseInt(a), parseInt(b)).toString();
                                            var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                            var key = src + '#' + trg;
                                            if(key in idpairToLink) idpairToLink[key].attr.weight--;
                                            
                                            if(a in member_idToNode && b in member_idToNode){ 
                                                if(key in member_idpairToLink)
                                                    member_idpairToLink[key].attr.weight--; 
                                            }
                                        }
                                        
                                        //the member is a recipient too
                                        for(var jjj in member_nodes){
                                            if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                                // if(VMail.App.removed[k] == 1) b = a;
                                                // else b = member_nodes[jjj].id;
                                                b = member_nodes[jjj].id;
                                            }
                                        }
                                        if(b == a) continue; 
                                        var src = Math.min(parseInt(a), parseInt(b)).toString();
                                        var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                        var key = src + '#' + trg;
                                        if(!(key in idpairToLink)){
                                            // console.log(key);
                                        } 
                                        else idpairToLink[key].attr.weight--;
                                        if(a in member_idToNode && b in member_idToNode){ 
                                            if(key in member_idpairToLink) member_idpairToLink[key].attr.weight--; 
                                        }
                                    }

                                    if(time < this_startt || time > this_endt) {
                                        continue;
                                    }
                                    
//herehere
                                    var isSent = !(ev.hasOwnProperty('source'));
                                    if(ev.source_org == "datawheel.com") ev.source_org = "datawheel.us";
                                    var a = ev.source, a_org = VMail.App.domainToid[ev.source_org];
                                    
                                    a = ((VMail.App.idSwitch_before[k].indexOf(ev.source)!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.source)]:"");  //:ev.source
            //                        a = ((VMail.App.idSwitch_after[k].indexOf(ev.source)!=-1)? ev.source:"");  //:ev.source
                                    
                                    if (isSent || !(a in idToNode)) { // the mail is send by the member
                                        // if(isSent && VMail.App.removed[k] == 1) continue; //to keep connections of the member's contacts after removing him/her
                                        if(isSent){// the mail is send by the member
                                            for(var jjj in member_nodes){
                                                if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                                    a = member_nodes[jjj].id; break;
                                                }
            //                                    if(jjj == member_nodes.length - 1) alert("not found");
                                            }
                                            if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent++;
                                            for (var j = 0; j < ev.destinations.length; j++) {
                                                if(ev.destinations_org[j] == "datawheel.com") ev.destinations_org[j] = "datawheel.us";
                                                var b = ev.destinations[j], b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                                b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
            //                                    b = ((VMail.App.idSwitch_after[k].indexOf(ev.destinations[j])!=-1)? ev.destinations[j]:""); //:ev.destinations[j]
                                                if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv++;
                                                
                                                //adding links to organization nodes
                                                var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                                var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                                var key = src_org + '#' + trg_org;
                                                if(src_org != trg_org  && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                                    if (!(key in org_idpairToLink)) {
                                                        //regular link processing
            //                                                if(typeof(org_idToNode[trg_org]) != "undefined" && typeof(org_idToNode[src_org]) != "undefined"){
                                                            var org_link = { source: org_idToNode[src_org], target: org_idToNode[trg_org], weight: 0, skip: false, skip_removed: [], skip2draw: false, links: [], attr: { weight: 0 }};
                                                            org_idToNode[src_org].links.push(org_link);
                                                            org_idToNode[trg_org].links.push(org_link);
                                                            org_idpairToLink[key] = org_link;
            //                                                }
                                                    }
                                                    if ((key in org_idpairToLink)) org_idpairToLink[key].weight++;
                                                }

                                                if (!(b in idToNode) || b == a)
                                                    continue;
                                                var src = Math.min(parseInt(a), parseInt(b)).toString();
                                                var trg = Math.max(parseInt(a), parseInt(b)).toString();
            //                                    if(b == "1636") console.log(ev);
                                                var key = src + '#' + trg;

                                                // if(key=="1740#3013") console.log(ev);
                                                // if(key=="1692#2239") console.log(ev);
                                                var to_add = 1;
                                                if (!(key in member_idpairToLink)) {
                                                    //links among members
                                                    if(a in member_idToNode && b in member_idToNode){
                                                        
                                                        //see if src and trg are members
                                                        var src_ind = -1, trg_ind = -1;
                                                        for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                            if(member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                                src_ind = i1;
                                                            }
                                                            if(member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                                trg_ind = i1;
                                                            }
                                                        }
                                                        if(src_ind != -1){
                                                            if(member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                                to_add = 0;
                                                                // member_idToNode[trg].owns.push(src_ind); 
                                                                // member_idToNode[trg].owns_before_ids.push(undefined); 
                                                                // member_idToNode[trg].owns_ids.push(undefined);
                                                            }
                                                        }
                                                        if(trg_ind != -1){
                                                            if(member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                                to_add = 0;
                                                                // member_idToNode[src].owns.push(trg_ind); 
                                                                // member_idToNode[src].owns_before_ids.push(undefined); 
                                                                // member_idToNode[src].owns_ids.push(undefined);
                                                            }
                                                        }
                                                        if(to_add == 1){
                                                            var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                            member_idToNode[src].links.push(link);
                                                            member_idToNode[trg].links.push(link);
                                                            member_idpairToLink[key] = link; //console.log(key);
                                                            member_idpairToLink[key].attr.weight++; 
                                                        }
                                                    }
                                                }
                                                else if(a in member_idToNode && b in member_idToNode){ 
                                                    member_idpairToLink[key].attr.weight++; 
                                                    var the_date = new Date(time);
                                                    // if(d3.time.year.offset(endt, -1) < time) 
                                                    sample[the_date.getFullYear()].push({ from: a, to: b, time: time });
                                                }

                                                if (to_add && !(key in idpairToLink)) {
                                                    //regular link processing
                                                    
                                                    //see if src and trg are members
                                                    var src_ind = -1, trg_ind = -1;
                                                    for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                        if(idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                            src_ind = i1;
                                                        }
                                                        if(idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                            trg_ind = i1;
                                                        }
                                                    }
                                                    var to_add2 = 1;
                                                    if(src_ind != -1){
                                                        if(idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                            to_add2 = 0;
                                                            // idToNode[trg].owns.push(src_ind); 
                                                            // idToNode[trg].owns_before_ids.push(undefined); 
                                                            // idToNode[trg].owns_ids.push(undefined);
                                                        }
                                                    }
                                                    if(trg_ind != -1){
                                                        if(idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                            to_add2 = 0;
                                                            // idToNode[src].owns.push(trg_ind); 
                                                            // idToNode[src].owns_before_ids.push(undefined); 
                                                            // idToNode[src].owns_ids.push(undefined);
                                                        }
                                                    }
                                                    if(to_add2 == 1){
                                                        var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skipcommunity: true,
                                                        idToNode[src].links.push(link);
                                                        idToNode[trg].links.push(link);
                                                        idpairToLink[key] = link;
                                                        idpairToLink[key].attr.weight++;
                                                    }
                                                }
                                                else if(to_add) idpairToLink[key].attr.weight++;
                                                

                                            }
                                        }
                                        
                                        continue;
                                    }
                                    if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent++;
                                    for (var j = 0; j < ev.destinations.length; j++) {
                                        var b = ev.destinations[j], b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                        b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
            //                            b = ((VMail.App.idSwitch_after[k].indexOf(ev.destinations[j])!=-1)? ev.destinations[j]:""); //:ev.destinations[j]
                                        if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv++;
                                        
                                        //add links for organization nodes
                                        var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                        var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                        var key = src_org + '#' + trg_org; //if(key == "0#863") console.log((typeof(org_idToNode[src_org]) != "undefined" + " " + typeof(org_idToNode[trg_org]) != "undefined"));
                                        if(src_org != trg_org && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                            if (!(key in org_idpairToLink)) {
                                                //regular link processing
            //                                    if(typeof(org_idToNode[trg_org]) != "undefined" && typeof(org_idToNode[src_org]) != "undefined"){
                                                    var org_link = { source: org_idToNode[src_org], target: org_idToNode[trg_org], weight: 0, skip: false, skip_removed: [], skip2draw: false, links: [], attr: { weight: 0 }};
                                                    org_idToNode[src_org].links.push(org_link);
                                                    org_idToNode[trg_org].links.push(org_link);
                                                    org_idpairToLink[key] = org_link;
            //                                    }
                                            }
                                            if ((key in org_idpairToLink)) org_idpairToLink[key].weight++;
                                        }
                                        
                                        if (!(b in idToNode) || b == a)
                                            continue;
                                        var src = Math.min(parseInt(a), parseInt(b)).toString();
                                        var trg = Math.max(parseInt(a), parseInt(b)).toString();
            //                            if(idToNode[trg].id == "9426"&&idToNode[src].id=="1475") console.log(db[k].emails[i]);
                                        var key = src + '#' + trg;

                                        // if(key=="1740#3013") console.log(ev);
                                        // if(key=="1692#2239") console.log(ev);
                                        var to_add = 1;
                                        if (!(key in member_idpairToLink)) {
                                            //links among members
                                            if(a in member_idToNode && b in member_idToNode){
                                                //see if src and trg are members
                                                var src_ind = -1, trg_ind = -1;
                                                for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                    if(member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                        src_ind = i1;
                                                    }
                                                    if(member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                        trg_ind = i1;
                                                    }
                                                }
                                                if(src_ind != -1){
                                                    if(member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                        to_add = 0;
                                                        // member_idToNode[trg].owns.push(src_ind); 
                                                        // member_idToNode[trg].owns_before_ids.push(undefined); 
                                                        // member_idToNode[trg].owns_ids.push(undefined);
                                                    }
                                                }
                                                if(trg_ind != -1){
                                                    if(member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                        to_add = 0;
                                                        // member_idToNode[src].owns.push(trg_ind);
                                                        // member_idToNode[src].owns_before_ids.push(undefined); 
                                                        // member_idToNode[src].owns_ids.push(undefined);
                                                    }
                                                }
                                                if(to_add == 1){
                                                    var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                    member_idToNode[src].links.push(link);
                                                    member_idToNode[trg].links.push(link);
                                                    member_idpairToLink[key] = link;
                                                    member_idpairToLink[key].attr.weight++;
                                                    var the_date = new Date(time);
                                                    // if(d3.time.year.offset(endt, -1) < time) 
                                                    sample[the_date.getFullYear()].push({ from: a, to: b, time: time }); 
                                                }
                                            }
                                        }
                                        else if(a in member_idToNode && b in member_idToNode){ 
                                            member_idpairToLink[key].attr.weight++;
                                            var the_date = new Date(time);
                                            // if(d3.time.year.offset(endt, -1) < time) 
                                            sample[the_date.getFullYear()].push({ from: a, to: b, time: time }); 
                                        }

                                        if (to_add && !(key in idpairToLink)) {
                                            //regular link processing
                                            
                                            //see if src and trg are members
                                            var src_ind = -1, trg_ind = -1;
                                            for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                if(idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                    src_ind = i1;
                                                }
                                                if(idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                    trg_ind = i1;
                                                }
                                            }
                                            var to_add2 = 1;
                                            if(src_ind != -1){
                                                if(idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                    to_add2 = 0;
                                                    // idToNode[trg].owns.push(src_ind); 
                                                    // idToNode[trg].owns_before_ids.push(undefined); 
                                                    // idToNode[trg].owns_ids.push(undefined);
                                                    
                                                }
                                            }
                                            if(trg_ind != -1){
                                                if(idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                    to_add2 = 0;
                                                    // idToNode[src].owns.push(trg_ind);
                                                    // idToNode[src].owns_before_ids.push(undefined); 
                                                    // idToNode[src].owns_ids.push(undefined);
                                                    
                                                }
                                            }
                                            if(to_add2 == 1){
                                                var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                idToNode[src].links.push(link);
                                                idToNode[trg].links.push(link);
                                                idpairToLink[key] = link;
                                                idpairToLink[key].attr.weight++;
                                            }
                                        }
                                        else if(to_add) idpairToLink[key].attr.weight++;
                                        
                                    }
                                    
                                    //the member is a recipient too
                                    for(var jjj in member_nodes){
                                        if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                            // if(VMail.App.removed[k] == 1) b = a;
                                            // else b = member_nodes[jjj].id;
                                            b = member_nodes[jjj].id;
                                        }
                                    }
                                    if(b == a) continue; 
                                    var src = Math.min(parseInt(a), parseInt(b)).toString();
                                    var trg = Math.max(parseInt(a), parseInt(b)).toString();
            //                            if(idToNode[trg].id == "9426"&&idToNode[src].id=="1475") console.log(db[k].emails[i]);
                                    var key = src + '#' + trg;
                                    // if(key=="1740#3013") console.log(ev);
                                    // if(key=="1692#2239") console.log(ev);

                                    var to_add = 1;
                                    if (!(key in member_idpairToLink)) {
                                        //links among members
                                        if(a in member_idToNode && b in member_idToNode){
                                            //see if src and trg are members
                                            var src_ind = -1, trg_ind = -1;
                                            for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                if(member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                    src_ind = i1;
                                                }
                                                if(member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                    trg_ind = i1;
                                                }
                                            }
                                            if(src_ind != -1){
                                                if(member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                    to_add = 0;
                                                    // member_idToNode[trg].owns.push(src_ind); 
                                                    // member_idToNode[trg].owns_before_ids.push(undefined); 
                                                    // member_idToNode[trg].owns_ids.push(undefined);
                                                     
                                                }
                                            }
                                            if(trg_ind != -1){
                                                if(member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                    to_add = 0;
                                                    // member_idToNode[src].owns.push(trg_ind); 
                                                    // member_idToNode[src].owns_before_ids.push(undefined); 
                                                    // member_idToNode[src].owns_ids.push(undefined);
                                                }
                                            }
                                            if(to_add == 1){
                                                var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                member_idToNode[src].links.push(link);
                                                member_idToNode[trg].links.push(link);
                                                member_idpairToLink[key] = link;
                                                member_idpairToLink[key].attr.weight++; 
                                                var the_date = new Date(time);
                                                // if(d3.time.year.offset(endt, -1) < time) 
                                                sample[the_date.getFullYear()].push({ from: a, to: b, time: time }); 
                                            }
                                        }
                                    }
                                    else if(a in member_idToNode && b in member_idToNode){ 
                                        member_idpairToLink[key].attr.weight++; 
                                        var the_date = new Date(time);
                                        // if(d3.time.year.offset(endt, -1) < time) 
                                        sample[the_date.getFullYear()].push({ from: a, to: b, time: time }); 
                                    }

                                    if(to_add && !(key in idpairToLink)) {
                                        //regular link processing
                                        
                                        //see if src and trg are members
                                        var src_ind = -1, trg_ind = -1;
                                        for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                            if(idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                src_ind = i1;
                                            }
                                            if(idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                trg_ind = i1;
                                            }
                                        }
                                        var to_add2 = 1;
                                        if(src_ind != -1){
                                            if(idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                to_add2 = 0;
                                                // idToNode[trg].owns.push(src_ind); 
                                                // idToNode[trg].owns_before_ids.push(undefined); 
                                                // idToNode[trg].owns_ids.push(undefined);
                                            }
                                        }
                                        if(trg_ind != -1){
                                            if(idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                to_add2 = 0;
                                                // idToNode[src].owns.push(trg_ind);
                                                // idToNode[src].owns_before_ids.push(undefined); 
                                                // idToNode[src].owns_ids.push(undefined);
                                            }
                                        }
                                        if(to_add2 == 1){
                                            var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skipcommunity: true,
                                            idToNode[src].links.push(link);
                                            idToNode[trg].links.push(link);
                                            idpairToLink[key] = link;
                                            idpairToLink[key].attr.weight++;
                                        }
                                    }
                                    else if(to_add) idpairToLink[key].attr.weight++;
                                    
                                }
                            }

                            //for half_network
                            if(VMail.App.init_time == 0){
                                for(var k = 0; k < db.length; k++){
                                    for (var i = 0; i < db[k].emails.length; i++) {
                                        var ev = db[k].emails[i];
                                        var time = ev.timestamp * 1000;
                                        if (time < startt || time > VMail.App.time_points[2] * 1000) {
                                            continue;
                                        }

                                        var isSent = !(ev.hasOwnProperty('source'));
                                        if(ev.source_org == "datawheel.com") ev.source_org = "datawheel.us";
                                        var a = ev.source, a_org = VMail.App.domainToid[ev.source_org];
                                        
                                        a = ((VMail.App.idSwitch_before[k].indexOf(ev.source)!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.source)]:"");  //:ev.source
                                        
                                        if (isSent || !(a in half_idToNode)) { // the mail is send by the member
                                            // if(isSent && VMail.App.removed[k] == 1) continue; //to keep connections of the member's contacts after removing him/her
                                            if(isSent){// the mail is send by the member
                                                for(var jjj in half_member_nodes){
                                                    if(VMail.App.usersinfo[k].name == half_member_nodes[jjj].attr.contact.name){
                                                        a = half_member_nodes[jjj].id; break;
                                                    }
                                                }
                                                if(typeof(half_org_idToNode[a_org]) != "undefined") half_org_idToNode[a_org].email_sent++;
                                                for (var j = 0; j < ev.destinations.length; j++) {
                                                    if(ev.destinations_org[j] == "datawheel.com") ev.destinations_org[j] = "datawheel.us";
                                                    var b = ev.destinations[j], b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                                    b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
                                                    if(typeof(half_org_idToNode[b_org]) != "undefined") half_org_idToNode[b_org].email_rcv++;
                                                    
                                                    //adding links to organization nodes
                                                    var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                                    var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                                    var key = src_org + '#' + trg_org;
                                                    if(src_org != trg_org  && (typeof(half_org_idToNode[src_org]) != "undefined" && typeof(half_org_idToNode[trg_org]) != "undefined")){
                                                        if (!(key in half_org_idpairToLink)) {
                                                            //regular link processing
                                                                var org_link = { source: half_org_idToNode[src_org], target: half_org_idToNode[trg_org], weight: 0, skip: false, skip_removed: [], skip2draw: false, links: [], attr: { weight: 0 }};
                                                                half_org_idToNode[src_org].links.push(org_link);
                                                                half_org_idToNode[trg_org].links.push(org_link);
                                                                half_org_idpairToLink[key] = org_link;
                                                        }
                                                        if ((key in half_org_idpairToLink)) half_org_idpairToLink[key].weight++;
                                                    }

                                                    if (!(b in half_idToNode) || b == a)
                                                        continue;
                                                    var src = Math.min(parseInt(a), parseInt(b)).toString();
                                                    var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                                    var key = src + '#' + trg;

                                                    // if(key=="1740#3013") console.log(ev);
                                                    // if(key=="1692#2239") console.log(ev);
                                                    var to_add = 1;
                                                    if (!(key in half_member_idpairToLink)) {
                                                        //links among members
                                                        if(a in half_member_idToNode && b in half_member_idToNode){
                                                            
                                                            //see if src and trg are members
                                                            var src_ind = -1, trg_ind = -1;
                                                            for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                                if(half_member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                                    src_ind = i1;
                                                                }
                                                                if(half_member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                                    trg_ind = i1;
                                                                }
                                                            }
                                                            if(src_ind != -1){
                                                                if(half_member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                                    to_add = 0;
                                                                }
                                                            }
                                                            if(trg_ind != -1){
                                                                if(half_member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                                    to_add = 0;
                                                                }
                                                            }
                                                            if(to_add == 1){
                                                                var link = { source: half_member_idToNode[src], target: half_member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                                half_member_idToNode[src].links.push(link);
                                                                half_member_idToNode[trg].links.push(link);
                                                                half_member_idpairToLink[key] = link; //console.log(key);
                                                                half_member_idpairToLink[key].attr.weight++; 
                                                            }
                                                        }
                                                    }
                                                    else if(a in half_member_idToNode && b in half_member_idToNode){ 
                                                        half_member_idpairToLink[key].attr.weight++; 
                                                    }

                                                    if (to_add && !(key in half_idpairToLink)) {
                                                        //regular link processing
                                                        
                                                        //see if src and trg are members
                                                        var src_ind = -1, trg_ind = -1;
                                                        for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                            if(half_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                                src_ind = i1;
                                                            }
                                                            if(half_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                                trg_ind = i1;
                                                            }
                                                        }
                                                        var to_add2 = 1;
                                                        if(src_ind != -1){
                                                            if(half_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                                to_add2 = 0;
                                                            }
                                                        }
                                                        if(trg_ind != -1){
                                                            if(half_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                                to_add2 = 0;
                                                            }
                                                        }
                                                        if(to_add2 == 1){
                                                            var link = { source: half_idToNode[src], target: half_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skipcommunity: true,
                                                            half_idToNode[src].links.push(link);
                                                            half_idToNode[trg].links.push(link);
                                                            half_idpairToLink[key] = link;
                                                            half_idpairToLink[key].attr.weight++;
                                                        }
                                                    }
                                                    else if(to_add) half_idpairToLink[key].attr.weight++;
                                                    
                                                }
                                            }
                                            
                                            continue;
                                        }
                                        if(typeof(half_org_idToNode[a_org]) != "undefined") half_org_idToNode[a_org].email_sent++;
                                        for (var j = 0; j < ev.destinations.length; j++) {
                                            var b = ev.destinations[j], b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                            b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
                                            if(typeof(half_org_idToNode[b_org]) != "undefined") half_org_idToNode[b_org].email_rcv++;
                                            
                                            //add links for organization nodes
                                            var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                            var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                            var key = src_org + '#' + trg_org; //if(key == "0#863") console.log((typeof(org_idToNode[src_org]) != "undefined" + " " + typeof(org_idToNode[trg_org]) != "undefined"));
                                            if(src_org != trg_org && (typeof(half_org_idToNode[src_org]) != "undefined" && typeof(half_org_idToNode[trg_org]) != "undefined")){
                                                if (!(key in half_org_idpairToLink)) {
                                                    //regular link processing
                                                        var org_link = { source: half_org_idToNode[src_org], target: half_org_idToNode[trg_org], weight: 0, skip: false, skip_removed: [], skip2draw: false, links: [], attr: { weight: 0 }};
                                                        half_org_idToNode[src_org].links.push(org_link);
                                                        half_org_idToNode[trg_org].links.push(org_link);
                                                        half_org_idpairToLink[key] = org_link;
                                                }
                                                if ((key in half_org_idpairToLink)) half_org_idpairToLink[key].weight++;
                                            }
                                            
                                            if (!(b in half_idToNode) || b == a)
                                                continue;
                                            var src = Math.min(parseInt(a), parseInt(b)).toString();
                                            var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                            var key = src + '#' + trg;

                                            // if(key=="1740#3013") console.log(ev);
                                            // if(key=="1692#2239") console.log(ev);
                                            var to_add = 1;
                                            if (!(key in half_member_idpairToLink)) {
                                                //links among members
                                                if(a in half_member_idToNode && b in half_member_idToNode){
                                                    //see if src and trg are members
                                                    var src_ind = -1, trg_ind = -1;
                                                    for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                        if(half_member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                            src_ind = i1;
                                                        }
                                                        if(half_member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                            trg_ind = i1;
                                                        }
                                                    }
                                                    if(src_ind != -1){
                                                        if(half_member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                            to_add = 0;
                                                        }
                                                    }
                                                    if(trg_ind != -1){
                                                        if(half_member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                            to_add = 0;
                                                        }
                                                    }
                                                    if(to_add == 1){
                                                        var link = { source: half_member_idToNode[src], target: half_member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                        half_member_idToNode[src].links.push(link);
                                                        half_member_idToNode[trg].links.push(link);
                                                        half_member_idpairToLink[key] = link;
                                                        half_member_idpairToLink[key].attr.weight++;
                                                    }
                                                }
                                            }
                                            else if(a in half_member_idToNode && b in half_member_idToNode){ 
                                                half_member_idpairToLink[key].attr.weight++;
                                            }

                                            if (to_add && !(key in half_idpairToLink)) {
                                                //regular link processing
                                                
                                                //see if src and trg are members
                                                var src_ind = -1, trg_ind = -1;
                                                for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                    if(half_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                        src_ind = i1;
                                                    }
                                                    if(half_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                        trg_ind = i1;
                                                    }
                                                }
                                                var to_add2 = 1;
                                                if(src_ind != -1){
                                                    if(half_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                        to_add2 = 0;
                                                        
                                                    }
                                                }
                                                if(trg_ind != -1){
                                                    if(half_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                        to_add2 = 0;
                                                        
                                                    }
                                                }
                                                if(to_add2 == 1){
                                                    var link = { source: half_idToNode[src], target: half_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                    half_idToNode[src].links.push(link);
                                                    half_idToNode[trg].links.push(link);
                                                    half_idpairToLink[key] = link;
                                                    half_idpairToLink[key].attr.weight++;
                                                }
                                            }
                                            else if(to_add) half_idpairToLink[key].attr.weight++;
                                            
                                        }
                                        
                                        //the member is a recipient too
                                        for(var jjj in half_member_nodes){
                                            if(VMail.App.usersinfo[k].name == half_member_nodes[jjj].attr.contact.name){
                                                // if(VMail.App.removed[k] == 1) b = a;
                                                // else b = half_member_nodes[jjj].id;
                                                b = half_member_nodes[jjj].id;
                                            }
                                        }
                                        if(b == a) continue; 
                                        var src = Math.min(parseInt(a), parseInt(b)).toString();
                                        var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                        var key = src + '#' + trg;
                                        // if(key=="1740#3013") console.log(ev);
                                        // if(key=="143230#145146") console.log(ev);

                                        var to_add = 1;
                                        if (!(key in half_member_idpairToLink)) {
                                            //links among members
                                            if(a in half_member_idToNode && b in half_member_idToNode){
                                                //see if src and trg are members
                                                var src_ind = -1, trg_ind = -1;
                                                for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                    if(half_member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                        src_ind = i1;
                                                    }
                                                    if(half_member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                        trg_ind = i1;
                                                    }
                                                }
                                                if(src_ind != -1){
                                                    if(half_member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                        to_add = 0;
                                                         
                                                    }
                                                }
                                                if(trg_ind != -1){
                                                    if(half_member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                        to_add = 0;
                                                    }
                                                }
                                                if(to_add == 1){
                                                    var link = { source: half_member_idToNode[src], target: half_member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                    half_member_idToNode[src].links.push(link);
                                                    half_member_idToNode[trg].links.push(link);
                                                    half_member_idpairToLink[key] = link;
                                                    half_member_idpairToLink[key].attr.weight++; 
                                                }
                                            }
                                        }
                                        else if(a in half_member_idToNode && b in half_member_idToNode){ 
                                            half_member_idpairToLink[key].attr.weight++; 
                                            var the_date = new Date(time);
                                        }

                                        if(to_add && !(key in half_idpairToLink)) {
                                            //regular link processing
                                            
                                            //see if src and trg are members
                                            var src_ind = -1, trg_ind = -1;
                                            for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                if(half_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                    src_ind = i1;
                                                }
                                                if(half_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                    trg_ind = i1;
                                                }
                                            }
                                            var to_add2 = 1;
                                            if(src_ind != -1){
                                                if(half_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                    to_add2 = 0;
                                                }
                                            }
                                            if(trg_ind != -1){
                                                if(half_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                    to_add2 = 0;
                                                }
                                            }
                                            
                                            if(to_add2 == 1){
                                                var link = { source: half_idToNode[src], target: half_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skipcommunity: true,
                                                half_idToNode[src].links.push(link);
                                                half_idToNode[trg].links.push(link);
                                                half_idpairToLink[key] = link;
                                                half_idpairToLink[key].attr.weight++;
                                            }
                                        }
                                        else if(to_add) half_idpairToLink[key].attr.weight++;
                                        
                                    }
                                }
                            }
                            console.timeEnd('links');
                        }
                        
                        if(type == "half"){
                            console.time('member-involved links');
                            //adding link to nodes belong to a user and the user
                            for(var id in member_nodes){
                                var a = member_nodes[id].id, b;
                                for(var iii in member_nodes[id].owns){
                                    for(var jjj in member_nodes){
                                        if(VMail.App.usersinfo[member_nodes[id].owns[iii]].name == member_nodes[jjj].attr.contact.name){
                                            b = member_nodes[jjj].id;
                                        }
                                    }
                                
                                    var src = Math.min(parseInt(a), parseInt(b)).toString();
                                    var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                    if (!(src in member_idToNode) || !(trg in member_idToNode) || src == trg)
                                        continue;
                                    var key = src + '#' + trg;
                                    console.log("added last");
                                    // if(key=="1740#3013"){ console.log(member_nodes[id]); }
                                    // if(key=="1692#2239") console.log(ev);
                                    if (!(key in member_idpairToLink)) {
                                        var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                                        member_idToNode[src].links.push(link);
                                        member_idToNode[trg].links.push(link);
                                        member_idpairToLink[key] = link;
                                        member_idpairToLink[key].attr.weight += 1;
                                        if (!(key in idpairToLink)) {
                                            var link2 = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                                            idToNode[src].links.push(link2);
                                            idToNode[trg].links.push(link2);
                                            idpairToLink[key] = link2;
                                            idpairToLink[key].attr.weight += 1;
                                        }
                                    }
                                    
                                }
                                
                            }
                            console.timeEnd('member-involved links');

                            var comp = function (a, b) {
                                if (a.email_size !== b.email_size) {
                                    return b.email_size - a.email_size;
                                }
                                return 0;
                            };
                            org_nodes.sort(comp);

                            for(var hh = nodes.length - 1; hh >= 0; hh--){
                                if(nodes[hh].attr.contact.rcv <= 0 || nodes[hh].attr.contact.sent <= 0){
                                    //remove the node from org_nodes (member_size, nodes, owns, owns_contacts)
                                    for(var jj = 0; jj < nodes[hh].orgs.length; jj++){
                                        // console.log(nodes[hh].orgs[jj]);
                                        if(nodes[hh].orgs[jj].id in org_idToNode){
                                            org_idToNode[nodes[hh].orgs[jj].id].member_size--;
                                            for(var kk = 0; kk < nodes[hh].owns.length; kk++){
                                                org_idToNode[nodes[hh].orgs[jj].id].owns[nodes[hh].owns[kk]]--;
                                                org_idToNode[nodes[hh].orgs[jj].id].owns_contacts[nodes[hh].owns[kk]];
                                                var index = org_idToNode[nodes[hh].orgs[jj].id].owns_contacts.map(function(x) {return x.id; }).indexOf(nodes[hh].id)
                                                org_idToNode[nodes[hh].orgs[jj].id].owns_contacts.splice(index, 1);
                                                var index2 = org_idToNode[nodes[hh].orgs[jj].id].nodes.map(function(x) {return x.id; }).indexOf(nodes[hh].id)
                                                org_idToNode[nodes[hh].orgs[jj].id].nodes.splice(index2, 1);
                                            }
                                        }
                                    }
                                    //remove the node from nodes list
                                    if(!(nodes[hh].id in member_idToNode)){ 
                                        nodes[hh].skip = true;
                                        for(var mm = 0; mm < nodes[hh].links.length; mm++){
                                            var key = nodes[hh].links[mm].src + '#' + nodes[hh].links[mm].trg;
                                            delete idpairToLink[key];
                                        }
                                        nodes.splice(hh, 1);
                                    }
                                    else if(nodes[hh].owns.length == 0){
                                        for(var mm = 0; mm < nodes[hh].links.length; mm++){
                                            var key = nodes[hh].links[mm].src + '#' + nodes[hh].links[mm].trg;
                                            delete idpairToLink[key];
                                        }
                                        for(var mm = 0; mm < member_idToNode[nodes[hh].id].links.length; mm++){
                                            var key = member_idToNode[nodes[hh].id].links[mm].src + '#' + member_idToNode[nodes[hh].id].links[mm].trg;
                                            delete member_idpairToLink[key];
                                        }
                                        var ind = $.map(VMail.App.usersinfo, function(obj, index){ 
                                            if(obj.name == member_idToNode[nodes[hh].id].attr.contact.name)
                                                return index;
                                        });
                                        if(ind != -1){ 
                                            member_idToNode[nodes[hh].id].owns.push(ind[0]);
                                            nodes[hh].owns.push(ind[0]);
                                        }
                                    }
                                }
                                else{
                                    var p = -3;
                                    nodes[hh].attr.size = Math.pow((Math.pow(nodes[hh].attr.contact.sent, p) + Math.pow(nodes[hh].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                    if(nodes[hh].attr.contact.slack_rcv == 0 && nodes[hh].attr.contact.slack_sent == 0) nodes[hh].skipslack = true;
                                    else nodes[hh].attr.size_slack = Math.pow((Math.pow(nodes[hh].attr.contact.slack_rcv, p) + Math.pow(nodes[hh].attr.contact.slack_sent, p)) / 2.0, 1.0 / p);
                                    nodes[hh].attr.size_general = Math.pow(
                                        (Math.pow((nodes[hh].attr.contact.slack_rcv + nodes[hh].attr.contact.rcv), p) + 
                                         Math.pow((nodes[hh].attr.contact.slack_sent + nodes[hh].attr.contact.sent), p)) / 2.0, 1.0 / p);
                                }
                            }
                            for(var hh = member_nodes.length - 1; hh >= 0; hh--){
                                if(member_nodes[hh].attr.contact.rcv <= 0 || member_nodes[hh].attr.contact.sent <= 0){
                                    //remove the member node from member_nodes list
                                    // member_nodes.splice(hh, 1);
                                }
                                else{
                                    var p = -3;
                                    member_nodes[hh].attr.size = Math.pow((Math.pow(member_nodes[hh].attr.contact.sent, p) + Math.pow(member_nodes[hh].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                    if(member_nodes[hh].attr.contact.slack_rcv == 0 && member_nodes[hh].attr.contact.slack_sent == 0) member_nodes[hh].skipslack = true;
                                    else member_nodes[hh].attr.size_slack = Math.pow((Math.pow(member_nodes[hh].attr.contact.slack_rcv, p) + Math.pow(member_nodes[hh].attr.contact.slack_sent, p)) / 2.0, 1.0 / p);
                                    member_nodes[hh].attr.size_general = Math.pow(
                                        (Math.pow((member_nodes[hh].attr.contact.slack_rcv + member_nodes[hh].attr.contact.rcv), p) + 
                                         Math.pow((member_nodes[hh].attr.contact.slack_sent + member_nodes[hh].attr.contact.sent), p)) / 2.0, 1.0 / p);
                                }

                                if(member_nodes[hh].owns.length == 0){
                                    var index = 0;
                                    for(var iii=0; iii<VMail.App.usersinfo.length; iii++){
                                        if(VMail.App.usersinfo[iii].name == member_nodes[hh].name){
                                            index = iii; break;
                                        }
                                    }
                                    if(member_nodes[hh].owns.length == 0){
                                        idToNode[member_nodes[hh].id].owns.push(index);
                                        member_nodes[hh].owns.push(index);
                                    }
                                }
                            }

                            for(var hh = org_nodes.length - 1; hh >= 0; hh--){//cubic mean
                                if(org_nodes[hh].email_rcv <= 0 && org_nodes[hh].email_sent <= 0){
                                    //remove the org node from org_nodes list
                                    org_nodes.splice(hh, 1);
                                }
                                else{
                                    org_nodes[hh].email_size = Math.sqrt(org_nodes[hh].email_rcv + org_nodes[hh].email_sent);
                                }
                            }
                            var links = [], member_links = [], org_links = [];
                            for (var idpair in idpairToLink) {
                                if(idpairToLink[idpair].attr.weight > 0){
                                    idpairToLink[idpair].attr.weight_general = idpairToLink[idpair].attr.weight + idpairToLink[idpair].attr.weight_slack;
                                    if(idpairToLink[idpair].attr.weight_slack == 0) idpairToLink[idpair].skipslack = true;
                                    links.push(idpairToLink[idpair]);

                                    var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                    idToNode[src].links.push(idpairToLink[idpair]);
                                    idToNode[trg].links.push(idpairToLink[idpair]);
                                }
                                else if(idpairToLink[idpair].attr.weight_slack > 0){
                                    idpairToLink[idpair].skipslack = false;
                                    inks.push(idpairToLink[idpair]);
                                    idpairToLink[idpair].attr.weight_general = idpairToLink[idpair].attr.weight_slack;
                                    var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                    idToNode[src].links.push(idpairToLink[idpair]);
                                    idToNode[trg].links.push(idpairToLink[idpair]);
                                }
                                else delete idpairToLink[idpair];
                            }
                            links.sort(function (a, b) {
                                return b.attr.weight - a.attr.weight;
                            });
                            for (var idpair in member_idpairToLink) {
                                if(member_idpairToLink[idpair].attr.weight > 0){
                                    member_idpairToLink[idpair].attr.weight_general = member_idpairToLink[idpair].attr.weight + member_idpairToLink[idpair].attr.weight_slack;
                                    if(member_idpairToLink[idpair].attr.weight_slack == 0) member_idpairToLink[idpair].skipslack = true;
                                    member_links.push(member_idpairToLink[idpair]);

                                    var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                    member_idToNode[src].links.push(member_idpairToLink[idpair]);
                                    member_idToNode[trg].links.push(member_idpairToLink[idpair]);
                                }
                                else if(member_idpairToLink[idpair].attr.weight_slack > 0){
                                    member_idpairToLink[idpair].attr.weight_general = member_idpairToLink[idpair].attr.weight_slack;
                                    member_idpairToLink[idpair].skipslack = false;
                                    member_links.push(member_idpairToLink[idpair]);

                                    var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                    member_idToNode[src].links.push(member_idpairToLink[idpair]);
                                    member_idToNode[trg].links.push(member_idpairToLink[idpair]);
                                }
                                else delete member_idpairToLink[idpair];
                            }
                            member_links.sort(function (a, b) {
                                return b.attr.weight - a.attr.weight;
                            });
                            for (var idpair in org_idpairToLink) {
                                if(org_idpairToLink[idpair].weight != 0){
                                    org_links.push(org_idpairToLink[idpair]);

                                    var src = idpair.substring(0, idpair.indexOf('#')), trg = idpair.substring(idpair.indexOf('#') + 1, idpair.length);
                                    org_idToNode[src].links.push(org_idpairToLink[idpair]);
                                    org_idToNode[trg].links.push(org_idpairToLink[idpair]);
                                }
                            }
                            org_links.sort(function (a, b) {
                                return b.weight - a.weight;
                            });

                        }
                        else if(type == null){
                            //computing the size of org nodes
                            var p = -3;
                            for(var hh = 0; hh < org_nodes.length; hh++){//cubic mean
            //                    org_nodes[hh].email_size = Math.pow((Math.pow(org_nodes[hh].email_rcv, p) + Math.pow(org_nodes[hh].email_sent, p)) / 2.0, 1.0 / p);
                                org_nodes[hh].email_size = Math.sqrt(org_nodes[hh].email_rcv + org_nodes[hh].email_sent);
            //                    org_nodes[hh].email_size = Math.sqrt(Math.pow((Math.pow(org_nodes[hh].email_rcv, p) + Math.pow(org_nodes[hh].email_sent, p)) / 2.0, 1.0 / p));
            //                    org_nodes[hh].email_size = Math.log(1 + Math.pow((Math.pow(org_nodes[hh].email_rcv, p) + Math.pow(org_nodes[hh].email_sent, p)) / 2.0, 1.0 / p));
                            }
                            for(var hh = 0; hh < half_org_nodes.length; hh++){//cubic mean
                                half_org_nodes[hh].email_size = Math.sqrt(half_org_nodes[hh].email_rcv + half_org_nodes[hh].email_sent);
                            } 
                            //rank the org nodes
                            var comp = function (a, b) {
            //                    if (a.member_size !== b.member_size) {
            //                        return b.member_size - a.member_size;
            //                    }
                                if (a.email_size !== b.email_size) {
                                    return b.email_size - a.email_size;
                                }
                                return 0;
                            };
                            org_nodes.sort(comp);
                            half_org_nodes.sort(comp);
                            console.time('member-involved links');
                            //adding link to nodes belong to a user and the user
                            for(var id in member_nodes){
                                var a = member_nodes[id].id, b;
                                for(var iii in member_nodes[id].owns){
                                    for(var jjj in member_nodes){
                                        if(VMail.App.usersinfo[member_nodes[id].owns[iii]].name == member_nodes[jjj].attr.contact.name){
                                            b = member_nodes[jjj].id;
                                        }
                                    }
                                
                                    var src = Math.min(parseInt(a), parseInt(b)).toString();
                                    var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                    if (!(src in member_idToNode) || !(trg in member_idToNode) || src == trg)
                                        continue;
                                    var key = src + '#' + trg;
                                    console.log("added last");
                                    // if(key=="1740#3013"){ console.log(member_nodes[id]); }
                                    // if(key=="1692#2239") console.log(ev);
                                    if (!(key in member_idpairToLink)) {
                                        var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                                        member_idToNode[src].links.push(link);
                                        member_idToNode[trg].links.push(link);
                                        member_idpairToLink[key] = link;
                                        member_idpairToLink[key].attr.weight += 1;
                                        if (!(key in idpairToLink)) {
                                            var link2 = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                                            idToNode[src].links.push(link2);
                                            idToNode[trg].links.push(link2);
                                            idpairToLink[key] = link2;
                                            idpairToLink[key].attr.weight += 1;
                                        }
                                    }
                                    
                                }
                                
                            }
                            // for(var id in nodes){
                            //     var a = nodes[id].id, b;
                            //     for(var iii in nodes[id].owns){
                            //         for(var jjj in member_nodes){
                            //             if(VMail.App.usersinfo[nodes[id].owns[iii]].name == member_nodes[jjj].attr.contact.name){
                            //                 b = member_nodes[jjj].id;
                            //             }
                            //         }
                                
                            //         var src = Math.min(parseInt(a), parseInt(b)).toString();
                            //         var trg = Math.max(parseInt(a), parseInt(b)).toString();
                            //         if (!(src in idToNode) || !(trg in idToNode) || src == trg)
                            //             continue;
                            //         var key = src + '#' + trg; //console.log("add "+key);
                            //         // if (!(key in idpairToLink)) {
                            //         //     var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                            //         //     idToNode[src].links.push(link);
                            //         //     idToNode[trg].links.push(link);
                            //         //     idpairToLink[key] = link;
                            //         //     idpairToLink[key].attr.weight += 1;
                            //         // }
                                    
                            //     }
                                
                            // }
                            if(VMail.App.init_time == 0){
                                for(var id in half_member_nodes){
                                    var a = half_member_nodes[id].id, b;
                                    for(var iii in half_member_nodes[id].owns){
                                        for(var jjj in half_member_nodes){
                                            if(VMail.App.usersinfo[half_member_nodes[id].owns[iii]].name == half_member_nodes[jjj].attr.contact.name){
                                                b = half_member_nodes[jjj].id;
                                            }
                                        }
                                    
                                        var src = Math.min(parseInt(a), parseInt(b)).toString();
                                        var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                        if (!(src in half_member_idToNode) || !(trg in half_member_idToNode) || src == trg)
                                            continue;
                                        var key = src + '#' + trg;
                                        console.log("added last");
                                        if (!(key in half_member_idpairToLink)) {
                                            var link = { source: half_member_idToNode[src], target: half_member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                                            half_member_idToNode[src].links.push(link);
                                            half_member_idToNode[trg].links.push(link);
                                            half_member_idpairToLink[key] = link;
                                            half_member_idpairToLink[key].attr.weight += 1;
                                            if (!(key in idpairToLink)) {
                                                var link2 = { source: half_idToNode[src], target: half_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                                                half_idToNode[src].links.push(link2);
                                                half_idToNode[trg].links.push(link2);
                                                half_idpairToLink[key] = link2;
                                                half_idpairToLink[key].attr.weight += 1;
                                            }
                                        }
                                        
                                    }
                                    
                                }
                            }
                            console.timeEnd('member-involved links');

                            VMail.App.slack_network = 0;
                            // if(VMail.App.slack_network == 1){//control timestamp!!!
                            //     //update node.attr.contact.slack_sent and slack_rcv
                            //     //add links that doesn't exist
                            //     // console.log(idToNode);
                            //     for(var kk = 0; kk < slack_data['messages'].length; kk++){
                            //         var users = slack_data['messages'][kk]['users'];
                            //         for(var jj = 0; jj < slack_data['messages'][kk]['events'].length; jj++){
                            //             var from = slack_data['messages'][kk]['events'][jj]['user'];
                            //             if(!(from in slackidToNodeid) || !(slackidToNodeid[from] in idToNode)) continue;
                            //             idToNode[slackidToNodeid[from]].attr.contact.slack_sent++;
                            //             member_idToNode[slackidToNodeid[from]].attr.contact.slack_sent++;
                            //             for(var ii = 0; ii < users.length; ii++){
                            //                 if(users[ii] != from){ //they are TO
                            //                     var to = users[ii];
                            //                     if(!(to in slackidToNodeid) || !(slackidToNodeid[to] in idToNode)) continue;
                            //                     idToNode[slackidToNodeid[to]].attr.contact.slack_rcv++;
                            //                     member_idToNode[slackidToNodeid[to]].attr.contact.slack_rcv++;
                                                
                            //                     var src = Math.min(parseInt(slackidToNodeid[from]), parseInt(slackidToNodeid[to])).toString();
                            //                     var trg = Math.max(parseInt(slackidToNodeid[from]), parseInt(slackidToNodeid[to])).toString();
                            //                     var key = src + '#' + trg;
                            //                     if (!(key in idpairToLink)) {console.log("new link from slcak");
                            //                         var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: true, skipslack: false}; //skip2draw: true
                            //                         idToNode[src].links.push(link);
                            //                         idToNode[trg].links.push(link);
                            //                         idpairToLink[key] = link;
                            //                     }
                            //                     if (!(key in member_idpairToLink)) {console.log("new link from slcak");
                            //                         var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip2draw: false, skipcommunity: true, skipslack: false}; //skip2draw: true
                            //                         member_idToNode[src].links.push(link);
                            //                         member_idToNode[trg].links.push(link);
                            //                         member_idpairToLink[key] = link;
                            //                     }
                            //                     idpairToLink[key].attr.weight_slack += 1;
                            //                     member_idpairToLink[key].attr.weight_slack += 1;
                            //                 }
                            //             }
                            //         }
                            //     }

                            //     //compute size_slack and size_general
                            //     var p = -3;
                            //     for(var hh = 0; hh < nodes.length; hh++){//cubic mean
                            //         nodes[hh].attr.size_slack = Math.pow((Math.pow(nodes[hh].attr.contact.slack_rcv, p) + Math.pow(nodes[hh].attr.contact.slack_sent, p)) / 2.0, 1.0 / p);
                            //         if(nodes[hh].attr.contact.slack_rcv == 0 && nodes[hh].attr.contact.slack_sent == 0) nodes[hh].skipslack = true;
                            //         nodes[hh].attr.size_general = Math.pow(
                            //             (Math.pow((nodes[hh].attr.contact.slack_rcv + nodes[hh].attr.contact.rcv), p) + 
                            //              Math.pow((nodes[hh].attr.contact.slack_sent + nodes[hh].attr.contact.sent), p)) / 2.0, 1.0 / p);
                            //     }
                            //     for(var hh = 0; hh < member_nodes.length; hh++){//cubic mean
                            //         member_nodes[hh].attr.size_slack = Math.pow((Math.pow(member_nodes[hh].attr.contact.slack_rcv, p) + Math.pow(member_nodes[hh].attr.contact.slack_sent, p)) / 2.0, 1.0 / p);
                            //         if(member_nodes[hh].attr.contact.slack_rcv == 0 && member_nodes[hh].attr.contact.slack_sent == 0) member_nodes[hh].skipslack = true;
                            //         member_nodes[hh].attr.size_general = Math.pow(
                            //             (Math.pow((member_nodes[hh].attr.contact.slack_rcv + member_nodes[hh].attr.contact.rcv), p) + 
                            //              Math.pow((member_nodes[hh].attr.contact.slack_sent + member_nodes[hh].attr.contact.sent), p)) / 2.0, 1.0 / p);
                            //     } 
                            // }

                            console.time('sort');
                            var links = [], half_links = [];
                            var member_links = [], half_member_links = [];
                            var org_links = [], half_org_links = [];
                            for (var idpair in idpairToLink) {
                                idpairToLink[idpair].attr.weight_general = idpairToLink[idpair].attr.weight + idpairToLink[idpair].attr.weight_slack;
                                if(idpairToLink[idpair].attr.weight_slack == 0) idpairToLink[idpair].skipslack = true;
                                links.push(idpairToLink[idpair]);
                            }
                            links.sort(function (a, b) {
                                return b.attr.weight - a.attr.weight;
                            });
                            for (var idpair in member_idpairToLink) {
                                member_idpairToLink[idpair].attr.weight_general = member_idpairToLink[idpair].attr.weight + member_idpairToLink[idpair].attr.weight_slack;
                                if(member_idpairToLink[idpair].attr.weight_slack == 0) member_idpairToLink[idpair].skipslack = true;
                                member_links.push(member_idpairToLink[idpair]);
                            }
                            member_links.sort(function (a, b) {
                                return b.attr.weight - a.attr.weight;
                            });//console.log(member_links);
                            for (var idpair in org_idpairToLink) {
                                org_links.push(org_idpairToLink[idpair]);
                            }
                            org_links.sort(function (a, b) {
                                return b.weight - a.weight;
                            });

                            //for half_network
                            if(VMail.App.init_time == 0){
                                for (var idpair in half_idpairToLink) {
                                    half_idpairToLink[idpair].attr.weight_general = half_idpairToLink[idpair].attr.weight + half_idpairToLink[idpair].attr.weight_slack;
                                    if(half_idpairToLink[idpair].attr.weight_slack == 0) half_idpairToLink[idpair].skipslack = true;
                                    half_links.push(half_idpairToLink[idpair]);
                                }
                                half_links.sort(function (a, b) {
                                    return b.attr.weight - a.attr.weight;
                                });
                                for (var idpair in half_member_idpairToLink) {
                                    half_member_idpairToLink[idpair].attr.weight_general = half_member_idpairToLink[idpair].attr.weight + half_member_idpairToLink[idpair].attr.weight_slack;
                                    if(half_member_idpairToLink[idpair].attr.weight_slack == 0) half_member_idpairToLink[idpair].skipslack = true;
                                    half_member_links.push(half_member_idpairToLink[idpair]);
                                }
                                half_member_links.sort(function (a, b) {
                                    return b.attr.weight - a.attr.weight;
                                });
                                for (var idpair in half_org_idpairToLink) {
                                    half_org_links.push(half_org_idpairToLink[idpair]);
                                }
                                half_org_links.sort(function (a, b) {
                                    return b.weight - a.weight;
                                });
                            }
                            VMail.App.init_time = 1;console.timeEnd('sort');
                            
                            
            //                $.ajax({
            //                    dataType: "json",
            //                    type: 'POST',
            //                    url: "/networkanalysis/&json=" + JSON.stringify(network_data),
            ////                    success: function (returned_data) {
            //////                        console.log(returned_data);
            ////                        alert("ha");
            ////                    }
            //                });

                            //save network structure to the DB
                            if(!VMail.App.graph || (VMail.App.graph && VMail.App.graph.member_nodes && VMail.App.first_time_graph == 0)){
                                var member_network = {nodes:[], links:[]}, org_network = {nodes:[], links:[]}, the_members = [];
                                var shared_network = {nodes:[], links:[]};
                                var all_network = {nodes:[], links:[]};
                                var names = [], names_org = [], names_shared = [], names_all = [];
                                for(var kk = 0; kk < VMail.App.usersinfo.length; kk++){
                                    the_members.push(VMail.App.usersinfo[kk].email);
                                }

                                var filteredNodes = nodes.filter(function (node) {
                                    if(VMail.App.slack_network && VMail.App.data_source == 1) return !node.skipslack;

                                    for(var ii = 0; ii < member_nodes.length; ii++){
                                        if(node.id == member_nodes[ii].id){
                                            return 1;
                                        }
                                    }if(node.owns.length > 1 && !node.skip) return 1;
                                    else return 0;
                                });
                                for(var kk = 0; kk < nodes.length; kk++){
                                    all_network.nodes.push({
                                        attr: {
                                            contact: nodes[kk].attr.contact, 
                                            size: nodes[kk].attr.size,
                                            size_slack: nodes[kk].attr.size_slack,
                                            size_general: nodes[kk].attr.size_general
                                        },
                                        // owns: [],
                                        temp_id: kk
                                    });
                                    names_all.push(nodes[kk].id);
                                }
                                for(var kk = 0; kk < links.length; kk++){
                                    all_network.links.push({
                                        attr: {
                                            weight: links[kk].attr.weight,
                                            weight_slack: links[kk].attr.weight_slack,
                                            weight_general: links[kk].attr.weight_general
                                        },
                                        source: names_all.indexOf(links[kk].source.id), //member_nodes.indexOf(member_links[kk].source),
                                        target: names_all.indexOf(links[kk].target.id), //member_nodes.indexOf(member_links[kk].target)
                                    });
                                }

                                for(var kk = 0; kk < member_nodes.length; kk++){
                                    member_network.nodes.push({
                                        attr: {
                                            contact: member_nodes[kk].attr.contact, 
                                            size: member_nodes[kk].attr.size,
                                            size_slack: member_nodes[kk].attr.size_slack,
                                            size_general: member_nodes[kk].attr.size_general
                                        },
                                        temp_id: kk
                                    });
                                    names.push(member_nodes[kk].id);
                                }
                                for(var kk = 0; kk < member_links.length; kk++){
                                    member_network.links.push({
                                        attr: {
                                            weight: member_links[kk].attr.weight,
                                            weight_slack: member_links[kk].attr.weight_slack,
                                            weight_general: member_links[kk].attr.weight_general
                                        },
                                        source: names.indexOf(member_links[kk].source.id), //member_nodes.indexOf(member_links[kk].source),
                                        target: names.indexOf(member_links[kk].target.id), //member_nodes.indexOf(member_links[kk].target)
                                    });
                                }
                                for(var kk = 0; kk < org_nodes.length; kk++){
                                    org_network.nodes.push({
                                        temp_id: kk,
                                        domain: org_nodes[kk].domain,
                                        name: org_nodes[kk].name,
                                        email_rcv: org_nodes[kk].email_rcv,
                                        email_sent: org_nodes[kk].email_sent,
                                        email_size: org_nodes[kk].email_size,
                                        member_size: org_nodes[kk].member_size
                                    });
                                    names_org.push(org_nodes[kk].id);
                                }
                                for(var kk = 0; kk < org_links.length; kk++){
                                    org_network.links.push({
                                        attr: {weight: org_links[kk].attr.weight},
                                        source: names_org.indexOf(org_links[kk].source.id), //org_nodes.indexOf(org_links[kk].source),
                                        target: names_org.indexOf(org_links[kk].target.id), //org_nodes.indexOf(org_links[kk].target),
                                        weight: org_links[kk].weight
                                    });
                                }
                                try {
                                    $.post('/save_network_structure', {'json': JSON.stringify({id: VMail.App.team_id, members: the_members, network: member_network, org_network: org_network})}) //contact.name
                                        .success(function () {
                                            // VMail.App.network_structure_saved = 1;
                                            // alert("Network structure saved");
                                        }
                                    );
                                }
                                catch(err) {
                                    console.log("json stringify error");
                                }

                                // var nodes_version = Math.ceil(all_network.nodes.length/3000), links_version = Math.ceil(all_network.links.length/6000);
                                // $.post('/save_whole_network_version', {'json': JSON.stringify({id: VMail.App.team_id, nodes_version: nodes_version, links_version: links_version })})
                                //     .success(function (returned_data) {
                                //         if(returned_data['success'] == true){ 
                                //             // alert("network batches: "+whole_network_version);
                                //         }
                                //     }
                                // );
                                // d3.range(nodes_version + links_version).forEach(function (l){
                                //     setTimeout(function(){
                                //         if(l < nodes_version){ //save nodes
                                //             var ll = l;
                                //             var part_of_nodes = {id: VMail.App.team_id, batch: ll, type: "nodes", data: all_network.nodes.slice(ll * 3000, (ll + 1) * 3000)};
                                //             $.post('/save_whole_network', {'json': JSON.stringify(part_of_nodes)})
                                //                 .success(function (returned_data) {
                                //                     if(returned_data['success'] == true){ 
                                //                         // alert("nodes batch "+ll+" saved");
                                //                     }
                                //                 }
                                //             );
                                //         }
                                //         else{ //save links
                                //             var ll = l - nodes_version;
                                //             var part_of_links = {id: VMail.App.team_id, batch: ll, type: "links", data: all_network.links.slice(ll * 6000, (ll + 1) * 6000)};
                                //             $.post('/save_whole_network', {'json': JSON.stringify(part_of_links)})
                                //                 .success(function (returned_data) {
                                //                     if(returned_data['success'] == true){ 
                                //                         // alert("links batch "+ll+" saved");
                                //                     }
                                //                 }
                                //             );
                                //         }
                                //     }, l*200);
                                // });
                            }
                            //console.log(member_links);

                            if(VMail.App.graph && VMail.App.graph.member_nodes && VMail.App.first_time_graph == 0){
                                VMail.App.first_time_graph = 1;
                                // for(var kk = 0; kk < member_nodes.length; kk++){
                                //     var find = 0;
                                //     for(var jj = 0; jj < VMail.App.graph.member_nodes.length; jj++){
                                //         if(VMail.App.graph.member_nodes[jj].attr.contact.name == member_nodes[kk].attr.contact.name){
                                //             VMail.App.graph.member_nodes[jj].attr.contact = { 
                                //                 'name': member_nodes[kk].attr.contact.name, 
                                //                 'aliases': member_nodes[kk].attr.contact.aliases.slice(), 
                                //                 'sent': member_nodes[kk].attr.contact.sent, 
                                //                 'rcv': member_nodes[kk].attr.contact.rcv, 
                                //                 'slack_sent': member_nodes[kk].attr.contact.slack_sent, 
                                //                 'slack_rcv': member_nodes[kk].attr.contact.slack_rcv, 
                                //                 'new': member_nodes[kk].attr.contact.new, 
                                //                 'id': member_nodes[kk].attr.contact.id
                                //             };
                                //             VMail.App.graph.member_nodes[jj].id = member_nodes[kk].id;
                                //             VMail.App.graph.member_nodes[jj].attr.size = member_nodes[kk].attr.size;
                                //             VMail.App.graph.member_nodes[jj].attr.size_slack = member_nodes[kk].attr.size_slack;
                                //             VMail.App.graph.member_nodes[jj].attr.size_general = member_nodes[kk].attr.size_general;
                                //             VMail.App.graph.member_nodes[jj].attr.color = member_nodes[kk].attr.color;
                                //             VMail.App.graph.member_nodes[jj].owns = member_nodes[kk].owns.slice();
                                //             VMail.App.graph.member_nodes[jj].owns_ids = member_nodes[kk].owns_ids.slice();
                                //             VMail.App.graph.member_nodes[jj].owns_before_ids = member_nodes[kk].owns_before_ids.slice();
                                //             VMail.App.graph.member_nodes[jj].skipslack = member_nodes[kk].skipslack;
                                //             VMail.App.graph.member_nodes[jj].skip_removed = member_nodes[kk].skip_removed;
                                //             // VMail.App.graph.member_nodes[jj].links = member_nodes[kk].links.slice();
                                //             find = 1;
                                //             break;
                                //         }
                                //     }
                                //     if(find == 0){ 
                                //         try{
                                //             VMail.App.graph.member_nodes.push(JSON.parse(JSON.stringify(member_nodes[kk])));
                                //         }
                                //         catch(err) {
                                //             console.log("json stringify error2");
                                //         }
                                //     }
                                // }
                                VMail.App.graph.member_nodes = member_nodes;
                                //update links here
                                // for(var kk = 0; kk < member_links.length; kk++){
                                //     var find = 0;
                                //     for(var jj = 0; jj < VMail.App.graph.member_links.length; jj++){
                                //         if(VMail.App.graph.member_links[jj].source.id == member_links[kk].source.id && VMail.App.graph.member_links[jj].target.id == member_links[kk].target.id){
                                //             VMail.App.graph.member_links[jj].attr = { 
                                //                 'weight': member_links[kk].attr.weight, 
                                //                 'weight_slack': member_links[kk].attr.weight_slack,
                                //                 'weight_general': member_links[kk].attr.weight_general
                                //             };
                                //             VMail.App.graph.member_links[jj].skipslack = member_links[kk].skipslack;
                                //             VMail.App.graph.member_links[jj].skip_removed = member_links[kk].skip_removed;
                                //             find = 1;
                                //             break;
                                //         }
                                //     }
                                //     if(find == 0){ 
                                //         try{
                                //             VMail.App.graph.member_links.push(JSON.parse(JSON.stringify(member_links[kk])));
                                //         }
                                //         catch(err) {
                                //             console.log("json stringify error3");
                                //         }
                                //     }
                                // }
                                VMail.App.graph.member_links = member_links;

                                // member_nodes = VMail.App.graph.member_nodes;
                                // member_links = VMail.App.graph.member_links;

                                // org_nodes= VMail.App.graph.org_nodes;
                                // org_links= VMail.App.graph.org_links;
                                VMail.App.whole_graph.nodes = nodes; VMail.App.whole_graph.links = links;
                                VMail.App.whole_graph.member_nodes = member_nodes; VMail.App.whole_graph.member_links = member_links;
                                VMail.App.whole_graph.org_nodes = org_nodes; VMail.App.whole_graph.org_links = org_links;
                                console.log(half_nodes); console.log(half_org_nodes);
                                VMail.App.half_graph.nodes = half_nodes; VMail.App.half_graph.links = half_links;
                                VMail.App.half_graph.member_nodes = half_member_nodes; VMail.App.half_graph.member_links = half_member_links;
                                VMail.App.half_graph.org_nodes = half_org_nodes; VMail.App.half_graph.org_links = half_org_links;
                                // VMail.App.idpairToLink = idpairToLink; VMail.App.org_idpairToLink = org_idpairToLink; VMail.App.member_idpairToLink = member_idpairToLink; 
                                // sample = VMail.App.graph.sample;
                            }
                            else if(!VMail.App.graph){
                                VMail.App.whole_graph.nodes = nodes; VMail.App.whole_graph.links = links;
                                VMail.App.whole_graph.member_nodes = member_nodes; VMail.App.whole_graph.member_links = member_links;
                                VMail.App.whole_graph.org_nodes = org_nodes; VMail.App.whole_graph.org_links = org_links;

                                VMail.App.half_graph.nodes = half_nodes; VMail.App.half_graph.links = half_links;
                                VMail.App.half_graph.member_nodes = half_member_nodes; VMail.App.half_graph.member_links = half_member_links;
                                VMail.App.half_graph.org_nodes = half_org_nodes; VMail.App.half_graph.org_links = half_org_links;
                            }
                        }
                    }
                    
                    if(VMail.App.removed.indexOf(1) != -1){
                        for(var jj = 0; jj < VMail.App.removed.length; jj++){
                            if(VMail.App.removed[jj] == 1){
                                var user_index = jj;
                                var org_idpairToLink2 = {}, org_idToNode2 = {};
                                for(var kk = 0; kk < org_links.length; kk++){
                                    var src = org_links[kk].source.id, trg = org_links[kk].target.id;
                                    var key = src + "#" + trg;
                                    org_idpairToLink2[key] = org_links[kk];
                                }
                                for(var kk = 0; kk < org_nodes.length; kk++){
                                    org_idToNode2[org_nodes[kk].id] = org_nodes[kk];
                                }

                                var the_member_id = null;
                                var the_member_node = null, the_node = null, the_member_index = null, the_index = null;
                                for(var j in member_nodes){
                                    if(VMail.App.usersinfo[user_index].name == member_nodes[j].attr.contact.name){
                                        the_member_id = member_nodes[j].id; 
                                        the_member_index = j;
                                        the_member_node = member_nodes[j];
                                        the_index = nodes.map(function(x) {return x.id; }).indexOf(the_member_id);
                                        var results = $.grep(nodes, function(e){ return e.id == the_member_id; })
                                        if(results.length != 0) the_node = results[0];
                                        break;
                                    }
                                }

                                if(the_member_id == null) alert("error with member names");
                                else{
                                    //org_network
                                    var k = user_index;
                                    for (var i = 0; i < db[k].emails.length; i++) {
                                        var ev = db[k].emails[i];
                                        var time = ev.timestamp * 1000;
                                        if (time >= startt && time <= endt) {
                                            continue;
                                        }

                                        var isSent = !(ev.hasOwnProperty('source'));
                                        if(ev.source_org == "datawheel.com") ev.source_org = "datawheel.us";
                                        var a_org = VMail.App.domainToid[ev.source_org];
                                        
                                        if(isSent){// the mail is send by the member
                                            for (var j = 0; j < ev.destinations.length; j++) {
                                                if(ev.destinations_org[j] == "datawheel.com") ev.destinations_org[j] = "datawheel.us";
                                                var b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                                
                                                //adding links to organization nodes
                                                var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                                var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                                var key = src_org + '#' + trg_org;
                                                if(src_org != trg_org  && (typeof(org_idToNode2[src_org]) != "undefined" && typeof(org_idToNode2[trg_org]) != "undefined")){
                                                    if ((key in org_idpairToLink2)) org_idpairToLink2[key].weight--;
                                                    else console.log("org_idpairToLink exception");
                                                }
                                            }
                                        }
                                        continue;

                                        for (var j = 0; j < ev.destinations.length; j++) {
                                            var b_org = VMail.App.domainToid[ev.destinations_org[j]];
                                            
                                            //add links for organization nodes
                                            var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                            var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                            var key = src_org + '#' + trg_org;
                                            if(src_org != trg_org && (typeof(org_idToNode2[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                                if ((key in org_idpairToLink2)) org_idpairToLink2[key].weight--;
                                            }
                                        }
                                    }

                                    for (var idpair in org_idpairToLink2) {
                                        if(org_idpairToLink2[idpair].weight == 0){
                                            org_idpairToLink2[idpair].skip_removed = true;
                                        }
                                    }
                                    org_links.sort(function (a, b) {
                                        return b.weight - a.weight;
                                    });

                                    for(var kk = 0; kk < the_node.orgs.length; kk++){
                                        var results = $.grep(org_nodes, function(e){ return e.id == the_node.orgs[kk]; })
                                        results[0].skip_removed.push(user_index);
                                    }

                                    //member network
                                    var index = $.map(member_links, function(x, index){ 
                                        if(x.source.id == the_member_id || x.target.id == the_member_id)
                                            return index;
                                    });
                                    for(var ind = index.length - 1; ind >= 0; ind--){
                                        member_links[index[ind]].skip_removed.push(user_index);
                                    }

                                    //network
                                    var index = $.map(links, function(x, index){ 
                                        if(x.source.id == the_member_id || x.target.id == the_member_id)
                                            return index;
                                    });
                                    for(var ind = index.length - 1; ind >= 0; ind--){
                                        links[index[ind]].skip_removed.push(user_index);
                                    }
                                    nodes[the_index].skip_removed = true;
                                }
                            }
                        }
                    }

                    return { nodes: nodes, links: links, member_nodes: member_nodes, member_links: member_links, org_nodes: org_nodes, org_links: org_links, sample: sample }; 
                }
            }
            else{
                var the_db = db[0];  
//                var flag=0;
                the_db.getTopContacts(nnodes, start, end).forEach(function (contactScore) {
//                    if(flag==0) {console.log(contactScore); flag=1;}
                    var node = { attr: undefined, links: [], id: contactScore.contact.id, skip: false, new: contactScore.contact.new, orgs: [], owns: [], owns_before_ids: [], owns_ids: []};
                    node.attr = {
                        contact: contactScore.contact,
                        size: contactScore.scores[0]
                    };
                    node.owns.push(0);
                    node.owns_ids.push(contactScore.contact.id);
                    node.owns_before_ids.push(contactScore.contact.id);
                    idToNode[contactScore.contact.id] = node;
                    nodes.push(node);
                    
                    //get a list of different email ending (organizations) by going through all the emails
                    for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                        var domain = contactScore.contact.aliases[jj].substring(contactScore.contact.aliases[jj].indexOf("@") + 1, contactScore.contact.aliases[jj].length);
                        var search_or_not = 1;
                        for(var tt=0; tt<VMail.App.not_orgs.length; tt++){
                            if(domain.indexOf(VMail.App.not_orgs[tt]) != -1){
                                search_or_not = 0; break;
                            }
                        }
                        if(search_or_not == 1){
                            var result = $.grep(org_nodes, function(e){ return e.domain == domain; });
                            if(result.length == 0){//not found in the list, next we make sure its family domains are not in the list
                                var the_domain = domain;
                                while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                    the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                    var org_lookup = $.grep(org_nodes, function(e){ return e.domain == the_domain; })
                                    if(org_lookup.length == 1){//we find the only one. should be the correct org.
                                        if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                            org_lookup[0].member_size++;
                                            org_lookup[0].nodes.push(node);
                                        }
                                        if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                            node.orgs.push(org_lookup[0].id);
                                        }
                                        break;
                                    }
                                    else if(org_lookup.length > 1){//more than one results, should pick up the right one
                                        if(($.grep(org_lookup[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                            org_lookup[0].member_size++;
                                            org_lookup[0].nodes.push(node);
                                        }
                                        if(node.orgs.indexOf(org_lookup[0].id) == -1){
                                            node.orgs.push(org_lookup[0].id);
                                        }
                                        break;
                                    }
                                }
                                if(the_domain.indexOf(".") == -1){//no we didn't find it in the list, we should check the univ_data
                                    the_domain = domain;
                                    result = $.grep(VMail.App.orgs, function(e){ return e.domain == domain; });
                                    if(result.length == 0){//not found in the univ_list, next we make sure its family domains are not in the list
                                        while(the_domain.indexOf(".") != -1){//e.g. mail.ustc.edu.cn->ustc.edu.cn->edu.cn->cn
                                            the_domain = the_domain.substring(the_domain.indexOf(".") + 1, the_domain.length);
                                            var univ_lookup = $.grep(VMail.App.orgs, function(e){ return e.domain == the_domain; })
                                            if(univ_lookup.length == 1){//we find the only one. should be the correct org.
                                                var the_node = { domain: univ_lookup[0].domain, name: univ_lookup[0].org, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], id: (VMail.App.orgs.indexOf(univ_lookup[0])).toString(), attr: {}, skip: false, skip_removed: []};
                                                org_nodes.push(the_node);
                                                the_node.nodes.push(node);
                                                org_idToNode[(VMail.App.orgs.indexOf(univ_lookup[0])).toString()] = the_node;
                                                if(node.orgs.indexOf((VMail.App.orgs.indexOf(univ_lookup[0])).toString()) == -1){
                                                    node.orgs.push((VMail.App.orgs.indexOf(univ_lookup[0])).toString());
                                                }
                                                break;
                                            }
                                            else if(univ_lookup.length > 1){//more than one results, should pick up the right one
                                                var the_node = { domain: univ_lookup[0].domain, name: univ_lookup[0].org, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], id: (VMail.App.orgs.indexOf(univ_lookup[0])).toString(), attr: {}, skip: false, skip_removed: []};
                                                org_nodes.push(the_node);
                                                the_node.nodes.push(node);
                                                org_idToNode[(VMail.App.orgs.indexOf(univ_lookup[0])).toString()] = the_node;
                                                if(node.orgs.indexOf((VMail.App.orgs.indexOf(univ_lookup[0])).toString()) == -1){
                                                    node.orgs.push((VMail.App.orgs.indexOf(univ_lookup[0])).toString());
                                                }
                                                break;
                                            }
                                        }
                                        if(the_domain.indexOf(".") == -1){//not in org list? shouldn't be
//                                            alert("not in org list, wierd");
                                            // console.log("exception, "+domain);
                                        }
                                    }
                                    else{
                                        var the_node = { domain: result[0].domain, name: result[0].org, member_size: 1, email_size: 0, email_rcv: 0, email_sent: 0, links: [], link_weight: 0, nodes: [], id: (VMail.App.orgs.indexOf(result[0])).toString(), attr: {}, skip: false, skip_removed: []};
                                        org_nodes.push(the_node);
                                        the_node.nodes.push(node);
                                        org_idToNode[(VMail.App.orgs.indexOf(result[0])).toString()] = the_node;
                                        if(node.orgs.indexOf((VMail.App.orgs.indexOf(result[0])).toString()) == -1){
                                            node.orgs.push((VMail.App.orgs.indexOf(result[0])).toString());
                                        }
                                    }
                                }
                            }
                            else{
                                //if(result[0].id== undefined){console.log(result[0]); console.log(result[0].id);}
                                if(($.grep(result[0].nodes, function(e){ return e.id == node.id;})).length == 0){
                                    result[0].member_size++;
                                    result[0].nodes.push(node);
                                }
                                if(node.orgs.indexOf(result[0].id) == -1){
                                    node.orgs.push(result[0].id);
                                }
                            }
                        }
                    }
                });//alert(nodes.length+" single");
                
                // map a link to a link object
                var idpairToLink = {};
                var org_idpairToLink = {};
                if(VMail.App.type == "single"){
                    for (var i = 0; i < the_db.emails.length; i++) {
                        var ev = the_db.emails[i];
                        var time = ev.timestamp * 1000;
                        if (time < startt || time > endt) {
                            continue;
                        }

                        var isSent = !(ev.hasOwnProperty('source'));
                        if(ev.source_org == "datawheel.com") ev.source_org = "datawheel.us";
                        var a = ev.source, a_org = VMail.App.domainToid[ev.source_org];

    //                    a = ((VMail.App.idSwitch_before[k].indexOf(ev.source)!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.source)]:"");  //:ev.source
    //                        a = ((VMail.App.idSwitch_after[k].indexOf(ev.source)!=-1)? ev.source:"");  //:ev.source

                        if (isSent || !(a in idToNode)) { // the mail is send by the memberå
                            continue;
                        }
                        if(typeof(org_idToNode[a_org]) != "undefined") org_idToNode[a_org].email_sent++;
                        for (var j = 0; j < ev.destinations.length; j++) {
                            var b = ev.destinations[j], b_org = VMail.App.domainToid[ev.destinations_org[j]];
    //                        b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
    //                            b = ((VMail.App.idSwitch_after[k].indexOf(ev.destinations[j])!=-1)? ev.destinations[j]:""); //:ev.destinations[j]
                            if(typeof(org_idToNode[b_org]) != "undefined") org_idToNode[b_org].email_rcv++;

                            //add links for organization nodes
                            var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                            var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                            var key = src_org + '#' + trg_org;
                            if(src_org != trg_org && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                if (!(key in org_idpairToLink)) {
                                    //regular link processing
    //                                    if(typeof(org_idToNode[trg_org]) != "undefined" && typeof(org_idToNode[src_org]) != "undefined"){
                                        var org_link = { source: org_idToNode[src_org], target: org_idToNode[trg_org], weight: 0, skip: false, skip_removed: [], skip2draw: false, links: [], attr: { weight: 0 }};
                                        org_idToNode[src_org].links.push(org_link);
                                        org_idToNode[trg_org].links.push(org_link);
                                        org_idpairToLink[key] = org_link;
    //                                    }
                                }
                                if ((key in org_idpairToLink)) org_idpairToLink[key].weight++;
                            }

                            if (!(b in idToNode) || b == a)
                                continue;
                            var src = Math.min(parseInt(a), parseInt(b)).toString();
                            var trg = Math.max(parseInt(a), parseInt(b)).toString();
    //                            if(idToNode[trg].id == "9426"&&idToNode[src].id=="1475") console.log(db[k].emails[i]);
                            var key = src + '#' + trg;
                            if (!(key in idpairToLink)) {
                                //regular link processing
                                var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false};
                                // if(idToNode[src] == undefined) 
                                idToNode[src].links.push(link);
                                idToNode[trg].links.push(link);
                                idpairToLink[key] = link;
                            }
                            idpairToLink[key].attr.weight++;
                        }
                    }

                    //computing the size of org nodes
                    var p = -3;
                    for(var hh = 0; hh < org_nodes.length; hh++){
                        org_nodes[hh].email_size = Math.sqrt(org_nodes[hh].email_rcv + org_nodes[hh].email_sent);
//                        org_nodes[hh].email_size = Math.sqrt(Math.pow((Math.pow(org_nodes[hh].email_rcv, p) + Math.pow(org_nodes[hh].email_sent, p)) / 2.0, 1.0 / p));
//                        org_nodes[hh].email_size = Math.log(1 + Math.pow((Math.pow(org_nodes[hh].email_rcv, p) + Math.pow(org_nodes[hh].email_sent, p)) / 2.0, 1.0 / p));
                    }
                    //rank the org nodes
                    var comp = function (a, b) {
                        if (a.email_size !== b.email_size) {
                            return b.email_size - a.email_size;
                        }
                        return 0;
                    };
                    org_nodes.sort(comp);

                    var links = [];
                    var org_links = [];

                    for (var idpair in idpairToLink) {
                        links.push(idpairToLink[idpair]);
                    }
                    links.sort(function (a, b) {
                        return b.attr.weight - a.attr.weight;
                    });
                    for (var idpair in org_idpairToLink) {
                        org_links.push(org_idpairToLink[idpair]);
                    }
                    org_links.sort(function (a, b) {
                        return b.weight - a.weight;
                    });
                }
                else{
                    for (var i = 0; i < the_db.emails.length; i++) {
                        var ev = the_db.emails[i];
                        var time = ev.timestamp * 1000;
                        if (time < startt || time > endt) {
                            continue;
                        }
    
                        var isSent = !(ev.hasOwnProperty('source'));
                        if (isSent || !(ev.source in idToNode)) {
                            continue;
                        }
                        var a = ev.source;
                        for (var j = 0; j < ev.destinations.length; j++) {
                            var b = ev.destinations[j];
                            if (!(b in idToNode) || b == a)
                                continue;
    
                            var src = Math.min(parseInt(a), parseInt(b)).toString();
                            var trg = Math.max(parseInt(a), parseInt(b)).toString();
                            var key = src + '#' + trg;
                            if (!(key in idpairToLink)) {
                                var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false };
                                idToNode[src].links.push(link);
                                idToNode[trg].links.push(link);
                                idpairToLink[key] = link;
                            }
                            idpairToLink[key].attr.weight++;
                            
                            //add links for organization nodes
    //                        var result_a = $.grep(VMail.App.orgs, function(e){ return e.domain == a_org; });
    //                        var result_b = $.grep(VMail.App.orgs, function(e){ return e.domain == b_org; });
    //                        if(result_a.length && result_b.length){
    //                            var src_org = Math.min(parseInt(VMail.App.orgs.indexOf(result_a[0])),parseInt(VMail.App.orgs.indexOf(result_b[0]))).toString();
    //                            var trg_org = Math.max(parseInt(VMail.App.orgs.indexOf(result_a[0])),parseInt(VMail.App.orgs.indexOf(result_b[0]))).toString();
                                var src_org = Math.min(parseInt(a_org),parseInt(b_org)).toString();
                                var trg_org = Math.max(parseInt(a_org),parseInt(b_org)).toString();
                                var key = src_org + '#' + trg_org;
                                if(src_org != trg_org && (typeof(org_idToNode[src_org]) != "undefined" && typeof(org_idToNode[trg_org]) != "undefined")){
                                    if (!(key in org_idpairToLink)) {
                                        //regular link processing
    //                                    if(typeof(org_idToNode[trg_org]) != "undefined" && typeof(org_idToNode[src_org]) != "undefined"){
                                            var org_link = { source: org_idToNode[src_org], target: org_idToNode[trg_org], weight: 0, skip: false, skip_removed: [], skip2draw: false, links: [], attr: { weight: 0 }};
                                            org_idToNode[src_org].links.push(org_link);
                                            org_idToNode[trg_org].links.push(org_link);
                                            org_idpairToLink[key] = org_link;
    //                                    }
                                    }
                                    if ((key in org_idpairToLink)) org_idpairToLink[key].weight++;
                                }
                        }
                    }
                    //rank the org nodes
                    var comp = function (a, b) {
                        if (a.email_size !== b.email_size) {
                            return b.email_size - a.email_size;
                        }
                        return 0;
                    };
                    org_nodes.sort(comp);

                    var links = [];
                    var org_links = [];

                    for (var idpair in idpairToLink) {
                        links.push(idpairToLink[idpair]);
                    }
                    links.sort(function (a, b) {
                        return b.attr.weight - a.attr.weight;
                    });
                    for (var idpair in org_idpairToLink) {
                        org_links.push(org_idpairToLink[idpair]);
                    }
                    org_links.sort(function (a, b) {
                        return b.weight - a.weight;
                    });
                }
    //            console.log(nodes);
    //            console.log(links);
                return { nodes: nodes, links: links, org_nodes: org_nodes, org_links: org_links, member_nodes: [], member_links: []};
            }
        };//OrginduceNetwork

        Graph.induceMemberNetwork = function (db, nnodes, start, end) {
            //initial setup
            var startt = +start;
            var endt = +end;
            var init_start = 100000000000, init_end = 0;
            for(var t = 0; t < db.length; t++){
                if(db[t].emails[0].timestamp < init_start){ init_start = db[t].emails[0].timestamp; }
                if(db[t].emails[db[t].emails.length - 1].timestamp > init_end){ init_end = db[t].emails[db[t].emails.length - 1].timestamp; }
            }

            var init_startt = init_start, init_endt = init_end;
            
            //whole timeline and no member removed, use saved whole_graph
            
            init_start = new Date(init_start * 1000);
            init_end = new Date(init_end * 1000);
            
            // maps from id to node
            var member_nodes = [];
            var member_idToNode = {};

            function arrayUnique(array) {
                var a = array.concat();
                for(var i=0; i<a.length; ++i) {
                    for(var j=i+1; j<a.length; ++j) {
                        if(a[i] === a[j])
                            a.splice(j--, 1);
                    }
                }
                return a;
            }
            
            if(db.length > 1 || VMail.App.type == "multi"){
                var construct_network = 1;//
                return redo_network(null, construct_network);

                function redo_network(type, construct_network){
                    // console.log(startt+" "+endt+" "+construct_network+" "+type);
                    var network_to_use = null;
                    
                    var num_contact = 0, num_contact2 = 0;
                    var member_shown = new Array(VMail.App.db.length);
                    for(var iii = 0; iii<member_shown.length; iii++){ 
                        member_shown[iii] = 0;
                    }

                    // map a link to a link object
                    var member_idpairToLink = {}, half_member_idpairToLink = {};
                    
                    var this_endt = endt, this_startt = startt;

                    console.time('nodes');
                    d3.range(db.length).forEach(function (i){
                      //if(VMail.App.removed[i] != 1){
                        start = init_start; end = init_end; console.log("next user");
                        var nnodes = Math.max(500, parseInt(db[i].nCollaborators / 2)); console.time('contacts');
                        
                        db[i].getTopMemberContacts_multi(i, nnodes, startt, endt).forEach(function (contactScore) { 
                            var member_node_already = -1;
                            if(i != 0){
                                for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                                    for(var iii = 0; iii < member_nodes.length; iii++){
                                        var member_email_add = member_nodes[iii].attr.contact.aliases;
                                        if(member_email_add.indexOf(contactScore.contact.aliases[jj])!= -1){
                                            member_node_already = iii; 
                                            for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){ 
                                                if(VMail.App.usersinfo[tt].name == contactScore.contact.name){
                                                    member_shown[tt] = 1; break;
                                                }
                                            }
                                        }
                                    }
                                    jj = contactScore.contact.aliases.length;                                       
                                }
                            }
                            //if(contactScore.contact.name=="Mishel Johns") console.log("new "+i+" "+node_already);
                            if((i != 0) && member_node_already != -1){//add email info to the existing node
                                var p = -3; 
                                member_nodes[member_node_already].attr.contact.sent = member_nodes[member_node_already].attr.contact.sent + contactScore.sentrcv.sent;
                                member_nodes[member_node_already].attr.contact.rcv = member_nodes[member_node_already].attr.contact.rcv + contactScore.sentrcv.rcv;
                                member_nodes[member_node_already].attr.size = Math.pow((Math.pow(member_nodes[member_node_already].attr.contact.sent, p) + Math.pow(member_nodes[member_node_already].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                if(member_nodes[member_node_already].owns.indexOf(i) == -1){
                                    member_nodes[member_node_already].owns.push(i);
                                    member_nodes[member_node_already].owns_before_ids.push(contactScore.contact.id);
                                    member_nodes[member_node_already].owns_ids.push(VMail.App.idSwitch_after[i][VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id)]);
                                    // member_nodes[member_node_already].owns_ids.push(nodes[node_already].id); //contactScore.contact.id
                                    if(VMail.App.member_idSwitch_before[i].indexOf(contactScore.contact.id) == -1){//first time seeing this contact for user i
                                        VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                        VMail.App.member_idSwitch_after[i].push(member_nodes[member_node_already].id); //(parseInt(contactScore.contact.id) + num_contact).toString()
                                    }
                                }
    //                            nodes[node_already].attr.size = Math.pow((Math.pow(nodes[node_already].attr.size, p) + Math.pow(contactScore.scores[0], p)), 1.0 / p);
                            }
                            else {//create a new node
                                //member nodes
                                var removed_member = 0;
                                for(var iii=0; iii<VMail.App.usersinfo.length; iii++){
                                    if(VMail.App.usersinfo[iii].name == contactScore.contact.name){
                                        // if(VMail.App.removed[iii] == 1){ removed_member = 1; }
                                        if(member_shown[iii] == 0){
                                            member_shown[iii] = 1;
                                            var node2 = { attr: undefined, links: [], id: null, skip: false, skip_removed: false, skipslack: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                            node2.attr = {
                                                contact: {
                                                    'aliases': contactScore.contact['aliases'],
                                                    'id': contactScore.contact['id'],
                                                    'name': contactScore.contact['name'],
                                                    'new': contactScore.contact['new'],
                                                    'rcv': contactScore.sentrcv['rcv'],
                                                    'sent': contactScore.sentrcv['sent'],
                                                    'slack_rcv': contactScore.contact['slack_rcv'],
                                                    'slack_sent': contactScore.contact['slack_sent']
                                                }, //contactScore.contact,
                                                size: contactScore.scores[0],
                                                size_slack: 0,
                                                size_general: 0
                                            };
                                            node2.attr.contact.aliases = VMail.App.db[iii].aliases;
                                            node2.owns.push(i);
                                            node2.owns_before_ids.push(contactScore.contact.id); 
                                            if(VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id) == -1){
                                                if(type == "half"){
                                                    var exist_node = $.grep(VMail.App.whole_graph.member_nodes, function(e){ return e.attr.contact.name == contactScore.contact.name; });
                                                    if(exist_node.length > 0){
                                                        node2.id = exist_node[0].id;
                                                        node2.owns_ids.push(exist_node[0].id); 
                                                        VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                        VMail.App.idSwitch_after[i].push(exist_node[0].id);
                                                        VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                        VMail.App.member_idSwitch_after[i].push(exist_node[0].id);
                                                    }
                                                    else{
                                                        node2.id = (parseInt(contactScore.contact.id) + num_contact2).toString();
                                                        node2.owns_ids.push((parseInt(contactScore.contact.id) + num_contact2).toString()); //contactScore.contact.id
                                                        VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                        VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                        VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                        VMail.App.member_idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                    }
                                                }
                                                else{
                                                    node2.id = (parseInt(contactScore.contact.id) + num_contact).toString();
                                                    node2.owns_ids.push((parseInt(contactScore.contact.id) + num_contact).toString()); //contactScore.contact.id
                                                    member_idToNode[parseInt(contactScore.contact.id) + num_contact] = node2;
                                                    VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                                    VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                    VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                    VMail.App.member_idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString());
                                                }
                                            }
                                            else{
                                                var the_id = (VMail.App.idSwitch_after[i][VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id)]).toString();
                                                node2.id = the_id;
                                                node2.owns_ids.push(the_id); //contactScore.contact.id
                                                member_idToNode[the_id] = node2;
                                                VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                                VMail.App.member_idSwitch_after[i].push((VMail.App.idSwitch_after[i][VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id)]).toString());
                                            }
                                            member_nodes.push(node2);
                                        }
                                        if(VMail.App.member_idSwitch_before[i].indexOf(contactScore.contact.id) == -1){//first time seeing this contact for user i
                                            VMail.App.member_idSwitch_before[i].push(contactScore.contact.id);
                                            VMail.App.member_idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact2).toString()); //(parseInt(contactScore.contact.id) + num_contact).toString()
                                        }
                                    }
                                }
                            
                            }
                        });
                        console.timeEnd('contacts');            
                        
                        if(VMail.App.init_time == 0) num_contact += db[i].contactDetails.length;
                        num_contact2 += db[i].contactDetails.length; num_contact = num_contact2;
    //                    if(VMail.App.idSwitch_before[0].indexOf("1636")!=-1) alert("1636");
                        
                        //see if members after this person have been removed
                        var rest_removed = 0;
                        // var rest_removed=1;
                        // for(var ii=i+1; ii<db.length; ii++){
                        //     if(VMail.App.removed[ii] == 0) rest_removed = 0;
                        // }
                        if(rest_removed || i == db.length - 1){
                            //those members who are not in nodes list, add them in
                            for(var iii = 0; iii < member_shown.length; iii++){
                                if(member_shown[iii] == 0){ //this member not in the nodes
                                    member_shown[iii] = 1; console.log("member not in nodes");
                                    
                                    var node2 = { attr: undefined, links: [], id: null, skip: false, skip_removed: false, skipslack: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                    node2.attr = {
                                        contact: { aliases: VMail.App.db[iii].aliases, id: (-1 * iii), name: VMail.App.usersinfo[iii].name, new: 0, rcv: 0, sent: 0, slack_sent: 0, slack_rcv: 0 },
                                        size: 0,
                                        size_slack: 0,
                                        size_general: 0
                                    };
                                    node2.owns.push(iii);
                                    node2.owns_before_ids.push((-1 * iii).toString()); 
                                    if(VMail.App.first_time_graph == 1){
                                        for(var tt = 0; tt < VMail.App.whole_graph.member_nodes.length; tt++){
                                            if(VMail.App.whole_graph.member_nodes[tt].attr.contact.name == VMail.App.usersinfo[iii].name){
                                                node2.id = VMail.App.whole_graph.member_nodes[tt].id;
                                                node2.owns_ids.push(VMail.App.whole_graph.member_nodes[tt].id);
                                                member_idToNode[VMail.App.whole_graph.member_nodes[tt].id] = node2;
                                                break;
                                            }
                                        }
                                    }
                                    else{
                                        for(var tt = 0; tt < VMail.App.whole_graph.member_nodes.length; tt++){
                                            if(VMail.App.whole_graph.member_nodes[tt].attr.contact.name == VMail.App.usersinfo[iii].name){
                                                node2.id = VMail.App.whole_graph.member_nodes[tt].id;
                                                node2.owns_ids.push(VMail.App.whole_graph.member_nodes[tt].id);
                                                member_idToNode[VMail.App.whole_graph.member_nodes[tt].id] = node2;
                                                break;
                                            }
                                        }
                                        // if(VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                        //     node2.id = (parseInt(iii) + num_contact2).toString();
                                        //     node2.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                        //     member_idToNode[(parseInt(iii) + num_contact2).toString()] = node2;
                                        //     VMail.App.idSwitch_before[iii].push((-1 * iii).toString());
                                        //     VMail.App.idSwitch_after[iii].push((parseInt(iii) + num_contact2).toString());
                                        //     VMail.App.member_idSwitch_before[iii].push((-1 * iii).toString());
                                        //     VMail.App.member_idSwitch_after[iii].push((parseInt(iii) + num_contact2).toString());
                                        // }
                                        // else{
                                        //     var the_id = (VMail.App.idSwitch_after[iii][VMail.App.idSwitch_before[iii].indexOf((-1 * iii).toString())]).toString();
                                        //     node2.id = the_id;
                                        //     node2.owns_ids.push(the_id); //contactScore.contact.id
                                        //     member_idToNode[the_id] = node2;
                                        //     if(VMail.App.member_idSwitch_before[iii].indexOf((-1 * iii).toString()) == -1){
                                        //         VMail.App.member_idSwitch_before[iii].push((-1 * iii).toString());
                                        //         VMail.App.member_idSwitch_after[iii].push(the_id);
                                        //     }
                                        // }
                                    }
                                    // node2.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                    // member_idToNode[parseInt(iii) + num_contact2] = node2;
                                    member_nodes.push(node2);
                                }
                            }
                            //give back the actual member node size
                            for(var m_id in member_nodes){
                                for(var id in nodes){
                                    if(member_nodes[m_id].id == nodes[id].id){//found this user node
                                        nodes[id].attr.size = member_size[m_id];
                                        break; //go to next user
                                    }
                                }
                            }
                            var comp = function (a, b) {
                                if (a.attr.size !== b.attr.size) {
                                    return b.attr.size - a.attr.size;
                                }
                                return 0;
                            };
                            member_nodes.sort(comp);
                        }
                      //}
                    });
                    console.timeEnd('nodes');

                    //if same users or more users, do next steps
                    //change the saved links to new links based on contact ids
                    //add new links using new emails based on saved timestamps
                    construct_links = true;
                    if(construct_links == false){
                        // for(var k = 0; k < db.length; k++){
                        //     for (var i = 0; i < db[k].emails.length; i++) {
                        //         if(db[k].emails[i].timestamp <= VMail.App.usersinfo[k].timestamp)
                        //             continue;
                        //         //do regular process of the email

                        //     }
                        // }
                    }
                    else{ //construct_links == true
                        console.time('links');
                        
                        for(var k = 0; k < db.length; k++){
        //                  if(VMail.App.removed[k] != 1){ //commented because of "to keep connections of the member's contacts after removing him/her"
                            for (var i = 0; i < db[k].emails.length; i++) {
                                var ev = db[k].emails[i];
                                var time = ev.timestamp * 1000;

                                if(time < this_startt || time > this_endt) {
                                    continue;
                                }
                                
                                var isSent = !(ev.hasOwnProperty('source'));
                                if(ev.source_org == "datawheel.com") ev.source_org = "datawheel.us";
                                var a = ev.source;
                                
                                a = ((VMail.App.member_idSwitch_before[k].indexOf(ev.source)!=-1)? VMail.App.member_idSwitch_after[k][VMail.App.member_idSwitch_before[k].indexOf(ev.source)]:"");  //:ev.source
        //                        a = ((VMail.App.idSwitch_after[k].indexOf(ev.source)!=-1)? ev.source:"");  //:ev.source
                                
                                if (isSent || !(a in member_idToNode)) { // the mail is send by the member
                                    // if(isSent && VMail.App.removed[k] == 1) continue; //to keep connections of the member's contacts after removing him/her
                                    if(isSent){// the mail is send by the member
                                        for(var jjj in member_nodes){
                                            if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                                a = member_nodes[jjj].id; break;
                                            }
        //                                    if(jjj == member_nodes.length - 1) alert("not found");
                                        }
                                        for (var j = 0; j < ev.destinations.length; j++) {
                                            var b = ev.destinations[j];
                                            b = ((VMail.App.member_idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.member_idSwitch_after[k][VMail.App.member_idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]

                                            if (!(b in member_idToNode) || b == a)
                                                continue;
                                            var src = Math.min(parseInt(a), parseInt(b)).toString();
                                            var trg = Math.max(parseInt(a), parseInt(b)).toString();
        //                                    if(b == "1636") console.log(ev);
                                            var key = src + '#' + trg;

                                            // if(key=="1740#3013") console.log(ev);
                                            // if(key=="1692#2239") console.log(ev);
                                            var to_add = 1;
                                            if (!(key in member_idpairToLink)) {
                                                //links among members
                                                if(a in member_idToNode && b in member_idToNode){
                                                    
                                                    //see if src and trg are members
                                                    var src_ind = -1, trg_ind = -1;
                                                    for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                        if(member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                            src_ind = i1;
                                                        }
                                                        if(member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                            trg_ind = i1;
                                                        }
                                                    }
                                                    if(src_ind != -1){
                                                        if(member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                            to_add = 0;
                                                        }
                                                    }
                                                    if(trg_ind != -1){
                                                        if(member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                            to_add = 0;
                                                        }
                                                    }
                                                    if(to_add == 1){
                                                        var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                        member_idToNode[src].links.push(link);
                                                        member_idToNode[trg].links.push(link);
                                                        member_idpairToLink[key] = link; //console.log(key);
                                                        member_idpairToLink[key].attr.weight++; 
                                                    }
                                                }
                                            }
                                            else if(a in member_idToNode && b in member_idToNode){ 
                                                member_idpairToLink[key].attr.weight++; 
                                                var the_date = new Date(time);
                                            }
                                        }
                                    }
                                    
                                    continue;
                                }
                                for (var j = 0; j < ev.destinations.length; j++) {
                                    var b = ev.destinations[j];
                                    b = ((VMail.App.member_idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.member_idSwitch_after[k][VMail.App.member_idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]                          
                                    
                                    if (!(b in member_idToNode) || b == a)
                                        continue;
                                    var src = Math.min(parseInt(a), parseInt(b)).toString();
                                    var trg = Math.max(parseInt(a), parseInt(b)).toString();
        //                            if(idToNode[trg].id == "9426"&&idToNode[src].id=="1475") console.log(db[k].emails[i]);
                                    var key = src + '#' + trg;

                                    var to_add = 1;
                                    if (!(key in member_idpairToLink)) {
                                        //links among members
                                        if(a in member_idToNode && b in member_idToNode){
                                            //see if src and trg are members
                                            var src_ind = -1, trg_ind = -1;
                                            for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                                if(member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                    src_ind = i1;
                                                }
                                                if(member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                    trg_ind = i1;
                                                }
                                            }
                                            if(src_ind != -1){
                                                if(member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                    to_add = 0;
                                                    // member_idToNode[trg].owns.push(src_ind); 
                                                    // member_idToNode[trg].owns_before_ids.push(undefined); 
                                                    // member_idToNode[trg].owns_ids.push(undefined);
                                                }
                                            }
                                            if(trg_ind != -1){
                                                if(member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                    to_add = 0;
                                                    // member_idToNode[src].owns.push(trg_ind);
                                                    // member_idToNode[src].owns_before_ids.push(undefined); 
                                                    // member_idToNode[src].owns_ids.push(undefined);
                                                }
                                            }
                                            if(to_add == 1){
                                                var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                                member_idToNode[src].links.push(link);
                                                member_idToNode[trg].links.push(link);
                                                member_idpairToLink[key] = link;
                                                member_idpairToLink[key].attr.weight++;
                                            }
                                        }
                                    }
                                    else if(a in member_idToNode && b in member_idToNode){ 
                                        member_idpairToLink[key].attr.weight++;
                                    }
                                }
                                
                                //the member is a recipient too
                                for(var jjj in member_nodes){
                                    if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                        // if(VMail.App.removed[k] == 1) b = a;
                                        // else b = member_nodes[jjj].id;
                                        b = member_nodes[jjj].id;
                                    }
                                }
                                if(b == a) continue; 
                                var src = Math.min(parseInt(a), parseInt(b)).toString();
                                var trg = Math.max(parseInt(a), parseInt(b)).toString();
        //                            if(idToNode[trg].id == "9426"&&idToNode[src].id=="1475") console.log(db[k].emails[i]);
                                var key = src + '#' + trg;
                                // if(key=="1740#3013") console.log(ev);
                                // if(key=="1692#2239") console.log(ev);

                                var to_add = 1;
                                if (!(key in member_idpairToLink)) {
                                    //links among members
                                    if(a in member_idToNode && b in member_idToNode){
                                        //see if src and trg are members
                                        var src_ind = -1, trg_ind = -1;
                                        for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                                            if(member_idToNode[src].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                src_ind = i1;
                                            }
                                            if(member_idToNode[trg].attr.contact.name == VMail.App.usersinfo[i1].name){
                                                trg_ind = i1;
                                            }
                                        }
                                        if(src_ind != -1){
                                            if(member_idToNode[trg].owns.indexOf(src_ind) == -1){ 
                                                to_add = 0;
                                                // member_idToNode[trg].owns.push(src_ind); 
                                                // member_idToNode[trg].owns_before_ids.push(undefined); 
                                                // member_idToNode[trg].owns_ids.push(undefined);
                                                 
                                            }
                                        }
                                        if(trg_ind != -1){
                                            if(member_idToNode[src].owns.indexOf(trg_ind) == -1){ 
                                                to_add = 0;
                                                // member_idToNode[src].owns.push(trg_ind); 
                                                // member_idToNode[src].owns_before_ids.push(undefined); 
                                                // member_idToNode[src].owns_ids.push(undefined);
                                            }
                                        }
                                        if(to_add == 1){
                                            var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false};
                                            member_idToNode[src].links.push(link);
                                            member_idToNode[trg].links.push(link);
                                            member_idpairToLink[key] = link;
                                            member_idpairToLink[key].attr.weight++; 
                                        }
                                    }
                                }
                                else if(a in member_idToNode && b in member_idToNode){ 
                                    member_idpairToLink[key].attr.weight++; 
                                }

                            }
                        }
                        
                        console.timeEnd('links');
                    }
                    
                    if(type == null){
                        console.time('member-involved links');
                        //adding link to nodes belong to a user and the user
                        for(var id in member_nodes){
                            var a = member_nodes[id].id, b;
                            for(var iii in member_nodes[id].owns){
                                for(var jjj in member_nodes){
                                    if(VMail.App.usersinfo[member_nodes[id].owns[iii]].name == member_nodes[jjj].attr.contact.name){
                                        b = member_nodes[jjj].id;
                                    }
                                }
                            
                                var src = Math.min(parseInt(a), parseInt(b)).toString();
                                var trg = Math.max(parseInt(a), parseInt(b)).toString();
                                if (!(src in member_idToNode) || !(trg in member_idToNode) || src == trg)
                                    continue;
                                var key = src + '#' + trg;
                                console.log("added last");
                                // if(key=="1740#3013"){ console.log(member_nodes[id]); }
                                // if(key=="1692#2239") console.log(ev);
                                if (!(key in member_idpairToLink)) {
                                    var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false, skipslack: false}; //skip2draw: true //skipcommunity: true,
                                    member_idToNode[src].links.push(link);
                                    member_idToNode[trg].links.push(link);
                                    member_idpairToLink[key] = link;
                                    member_idpairToLink[key].attr.weight += 1;
                                    
                                }
                                
                            }
                            
                        }
                        
                        console.timeEnd('member-involved links');
                        
                        console.time('sort');
                        var member_links = [], half_member_links = [];
                        for (var idpair in member_idpairToLink) {
                            member_idpairToLink[idpair].attr.weight_general = member_idpairToLink[idpair].attr.weight + member_idpairToLink[idpair].attr.weight_slack;
                            if(member_idpairToLink[idpair].attr.weight_slack == 0) member_idpairToLink[idpair].skipslack = true;
                            member_links.push(member_idpairToLink[idpair]);
                        }
                        member_links.sort(function (a, b) {
                            return b.attr.weight - a.attr.weight;
                        });//console.log(member_links);
                        
                        VMail.App.init_time = 1;console.timeEnd('sort');
                        
                    }
                    return { member_nodes: member_nodes, member_links: member_links}; 
                }
            }
        };
        
        Graph.induceNetwork = function (db, nnodes, start, end) {
            //initial setup
            var startt = +start;
            var endt = +end;
            var init_start = 100000000000, init_end = 0;
            for(var t = 0; t < db.length; t++){
                if(db[t].emails[0].timestamp < init_start){ init_start = db[t].emails[0].timestamp; }
                if(db[t].emails[db[t].emails.length - 1].timestamp > init_end){ init_end = db[t].emails[db[t].emails.length - 1].timestamp; }
            }
            init_start = new Date(init_start * 1000);
            init_end = new Date(init_end * 1000);

            //var SENT = 0;
            //var RCV = 1;
            //var contactDetails = db.getContactDetails(start, end);
            // maps from id to node
            var nodes = [];
            var idToNode = {};
            var member_nodes = [];
            var member_idToNode = {};
            if(VMail.App.init_time == 0){ //first time setting up the ids
                VMail.App.idSwitch_before = new Array(db.length); VMail.App.idSwitch_after = new Array(db.length); 
                for(var m=0; m<db.length; m++){
                    VMail.App.idSwitch_before[m] = [];
                    VMail.App.idSwitch_after[m] = [];
                }
            }
            if(db.length > 1){
                var num_contact = 0, num_contact2 = 0;
                var member_shown = new Array(VMail.App.db.length);
                for(var iii = 0; iii<member_shown.length; iii++) member_shown[iii] = 0;
                d3.range(db.length).forEach(function (i){
                  if(VMail.App.removed[i] != 1){
                    start = init_start; end = init_end; console.log("next user");
                   
                    db[i].getTopContacts(nnodes, startt, endt).forEach(function (contactScore) { //
//                        contactScore.contact.aliases
                        var node_already = -1;
                        var member_node_already = -1;
                        if(i != 0){ 
                            for(var ii = 0; ii < nodes.length; ii++){
                                var email_add = nodes[ii].attr.contact.aliases;
                                if(nodes[ii].attr.contact.name == contactScore.contact.name){
                                    node_already = ii;
                                    for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                                        if(email_add.indexOf(contactScore.contact.aliases[jj])!= -1){ //already had the node recorded
                                            
    //                                        idSwitch_before[i].push(contactScore.contact.id);
    //                                        idSwitch_after[i].push((parseInt(nodes[ii].id) + num_contact)).toString();
    //                                        nodes[ii].owns.push(i);
    //                                        nodes[ii].owns_ids.push((parseInt(contactScore.contact.id) + num_contact).toString()); //contactScore.contact.id

                                            for(var iii = 0; iii < member_nodes.length; iii++){
                                                var member_email_add = member_nodes[iii].attr.contact.aliases;
                                                if(member_email_add.indexOf(contactScore.contact.aliases[jj])!= -1){
                                                    member_node_already = iii; 
    //                                                member_nodes[iii].owns.push(i);
    //                                                member_nodes[iii].owns_before_ids.push(contactScore.contact.id);
    //                                                member_nodes[iii].owns_ids.push((parseInt(contactScore.contact.id) + num_contact).toString());
                                                }
                                            }
                                            jj = contactScore.contact.aliases.length;                                       
                                        }
                                    }
                                    ii = nodes.length;
                                }
                            }
                        }
                        //if(contactScore.contact.name=="Mishel Johns") console.log("new "+i+" "+node_already);
                        if(i != 0 && node_already != -1){//add email info to the existing node
                            var p = -3;
                            // nodes[node_already].attr.size = nodes[node_already].attr.size + contactScore.scores[0];
                            nodes[node_already].attr.contact.sent = nodes[node_already].attr.contact.sent + contactScore.contact.sent;
                            nodes[node_already].attr.contact.rcv = nodes[node_already].attr.contact.rcv + contactScore.contact.rcv;
                            nodes[node_already].attr.size = Math.pow((Math.pow(nodes[node_already].attr.contact.sent, p) + Math.pow(nodes[node_already].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                            if(nodes[node_already].owns.indexOf(i) == -1){
                                nodes[node_already].owns.push(i);
                                nodes[node_already].owns_before_ids.push(contactScore.contact.id);
                                nodes[node_already].owns_ids.push(nodes[node_already].id); 
                                if(VMail.App.idSwitch_before[i].indexOf(contactScore.contact.id) == -1){//first time seeing this contact for user i
                                    VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                    VMail.App.idSwitch_after[i].push(nodes[node_already].id); //(parseInt(contactScore.contact.id) + num_contact).toString()
                                }
                            }
                            
                            if(member_node_already != -1){
                                // member_nodes[member_node_already].attr.size = member_nodes[member_node_already].attr.size + contactScore.scores[0];
                                member_nodes[member_node_already].attr.contact.sent = member_nodes[member_node_already].attr.contact.sent + contactScore.contact.sent;
                                member_nodes[member_node_already].attr.contact.rcv = member_nodes[member_node_already].attr.contact.rcv + contactScore.contact.rcv;
                                member_nodes[member_node_already].attr.size = Math.pow((Math.pow(member_nodes[member_node_already].attr.contact.sent, p) + Math.pow(member_nodes[member_node_already].attr.contact.rcv, p)) / 2.0, 1.0 / p);
                                if(member_nodes[member_node_already].owns.indexOf(i) == -1){
                                    member_nodes[member_node_already].owns.push(i);
                                    member_nodes[member_node_already].owns_before_ids.push(contactScore.contact.id);
                                    member_nodes[member_node_already].owns_ids.push(nodes[node_already].id); //contactScore.contact.id
                                }
                            }
//                            nodes[node_already].attr.size = Math.pow((Math.pow(nodes[node_already].attr.size, p) + Math.pow(contactScore.scores[0], p)), 1.0 / p);
                        }
                        else {//create a new node
                            //member nodes
                            for(var iii=0; iii<VMail.App.usersinfo.length; iii++){
                                if(VMail.App.usersinfo[iii].name == contactScore.contact.name){
                                    member_shown[iii] = 1;
                                    var node2 = { attr: undefined, links: [], id: (parseInt(contactScore.contact.id) + num_contact).toString(), skip: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                    node2.attr = {
                                        contact: contactScore.contact,
                                        size: contactScore.scores[0]
                                    };
                                    node2.attr.contact.aliases = VMail.App.db[iii].aliases;
                                    node2.owns.push(i);
                                    node2.owns_before_ids.push(contactScore.contact.id); 
                                    node2.owns_ids.push((parseInt(contactScore.contact.id) + num_contact).toString()); //contactScore.contact.id
                                    member_idToNode[parseInt(contactScore.contact.id) + num_contact] = node2;
                                    member_nodes.push(node2);
//                                    if(i != 0){
//                                        idSwitch_before[i].push(contactScore.contact.id);
//                                        idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact).toString());
//                                    }
                                }
                            }
                            //regular processing of nodes
//                            if(i==2 && contactScore.contact.id == "259"){ console.log("259 found. " + num_contact); console.log(contactScore);}
                            var node = { attr: undefined, links: [], id: (parseInt(contactScore.contact.id) + num_contact).toString(), skip: false, owns: [], owns_before_ids: [], owns_ids: [] };
                            node.attr = {
                                contact: contactScore.contact,
                                size: contactScore.scores[0]
                            };//if(contactScore.contact.id==3524) console.log(parseInt(contactScore.contact.id) + num_contact);
                            node.owns.push(i);
                            node.owns_before_ids.push(contactScore.contact.id);
                            node.owns_ids.push((parseInt(contactScore.contact.id) + num_contact).toString()); //contactScore.contact.id
                            idToNode[(parseInt(contactScore.contact.id) + num_contact).toString()] = node;
                            nodes.push(node);
                            
//                            if(i != 0){
                            if(VMail.App.init_time == 0){
                                VMail.App.idSwitch_before[i].push(contactScore.contact.id);
                                VMail.App.idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact).toString());
                            }
//                            }
                        }
                    });
                    if(VMail.App.init_time == 0) num_contact += db[i].contactDetails.length;
                    num_contact2 += db[i].contactDetails.length;
                    
                    //see if members after this person have been removed
                    var rest_removed=1;
                    for(var ii=i+1; ii<db.length; ii++){
                        if(VMail.App.removed[ii] == 0) rest_removed = 0;
                    }
                    if(rest_removed || i == db.length-1){
                        //add people in the group to the nodes
                        //check if they are in node list, if not, add them in
//                        d3.range(VMail.App.usersinfo.length).forEach(function (ind){
//                            var in_list = 0;
//                            for(var ii = 0; ii < nodes.length; ii++){
//                                var email_add = nodes[ii].attr.contact.aliases;
//                                if(email_add.indexOf(VMail.App.usersinfo[ind].email)!= -1){//already in the node list
//                                    in_list = 1; break;
//                                }
//                            }
//                            if(in_list == 0){//the person not found in node list
//                                var node = { attr: undefined, links: [], id: (num_contact + ind).toString(), skip: false, owns: [], owns_ids: [] };
//                                node.attr = {
//                                    contact: contactScore.contact,
//                                    size: contactScore.scores[0]
//                                };//if(contactScore.contact.id==3524) console.log(parseInt(contactScore.contact.id) + num_contact);
//                                node.owns.push(i);
//                                node.owns_ids.push(contactScore.contact.id);
//                                idToNode[parseInt(contactScore.contact.id) + num_contact] = node;
//                                nodes.push(node);
//
//                                if(i != 0){
//                                    idSwitch_before[i].push(contactScore.contact.id);
//                                    idSwitch_after[i].push((parseInt(contactScore.contact.id) + num_contact).toString());
//                                } 
//                            }
//                        });
                        
                        //those members who are not in nodes list, add them in
                        for(var iii=0; iii<member_shown.length; iii++){
                            if(member_shown[iii] == 0){ //this member not in the nodes
                                member_shown[iii] = 1;
                                var node = { attr: undefined, links: [], id: (parseInt(iii) + num_contact2).toString(), skip: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                node.attr = {
                                    contact: { aliases: VMail.App.db[iii].aliases, id: (iii), name: VMail.App.usersinfo[iii].name, new: 0, rcv: 0, sent: 0 },
                                    size: 0
                                };
                                node.owns.push(iii);
                                node.owns_before_ids.push(iii); 
                                node.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                idToNode[parseInt(iii) + num_contact2] = node;
                                nodes.push(node);
                                
                                var node2 = { attr: undefined, links: [], id: (parseInt(iii) + num_contact2).toString(), skip: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                node2.attr = {
                                    contact: { aliases: VMail.App.db[iii].aliases, id: (iii), name: VMail.App.usersinfo[iii].name, new: 0, rcv: 0, sent: 0 },
                                    size: 0
                                };
                                node2.owns.push(iii);
                                node2.owns_before_ids.push(iii); 
                                node2.owns_ids.push((parseInt(iii) + num_contact2).toString()); //contactScore.contact.id
                                member_idToNode[parseInt(iii) + num_contact2] = node2;
                                member_nodes.push(node2);
                            }
                        }
                        
                        //create a node for this user, in order to connect all the other nodes belong to this user to this meta node
                        var member_size = new Array(member_nodes.length); //take down original member node size
                        for(var m_id in member_nodes){
                            for(var id in nodes){
                                if(member_nodes[m_id].id == nodes[id].id){//found this user node
                                    member_size[m_id] = nodes[id].attr.size;
                                    nodes[id].attr.size = 1000000000; //give a large size so that they will be on top when ranking
//                                    console.log(id+","+nodes.length);
                                    break; //go to next user
                                }
                                else if(id == nodes.length -1){//this user not found
                                    var node = { attr: undefined, links: [], id: member_nodes[m_id].id, skip: false, owns: [], owns_before_ids: [], owns_ids: [] };
                                    node.attr = {
                                        contact: member_nodes[m_id].attr.contact,
                                        size: member_nodes[m_id].attr.size
                                    };//if(contactScore.contact.id==3524) console.log(parseInt(contactScore.contact.id) + num_contact);
                                    for(var iii in member_nodes[m_id].owns) node.owns.push(iii);
                                    for(var iii in member_nodes[m_id].owns_before_ids) node.owns_before_ids.push(iii);
                                    for(var iii in member_nodes[m_id].owns_ids) node.owns_ids.push(iii); //contactScore.contact.id
                                    idToNode[member_nodes[m_id].id] = node;
                                    nodes.push(node);alert("found one");
                                }
                            }
                        }
                        
                        //sort the nodes from multiple dbs by score desendingly
                        var comp = function (a, b) {
                            if (a.attr.size !== b.attr.size) {
                                return b.attr.size - a.attr.size;
                            }
                            return 0;
                        };
                        nodes.sort(comp);
                        
                        if(VMail.App.type == "multi"){
                            //make sure every member has 50 nodes belong to them
                            var num_members = new Array(VMail.App.usersinfo.length), enough_nodes = new Array(VMail.App.usersinfo.length);
                            for(var i =0; i < VMail.App.usersinfo.length; i++){ num_members[i] = 0; enough_nodes[i] = 0; }
                            var nnn = VMail.App.fixedNNodes * num_members.length, mmm = nnn;
                            var all_not_enough = 1;
                            for(var ii = 0; ii < nnn; ii ++){
                                for(var jj = 0; jj < VMail.App.usersinfo.length; jj++){
                                    if(enough_nodes[jj] != 1 && num_members[jj] >= 40) { enough_nodes[jj] = 1; all_not_enough = 0; }
                                    if(all_not_enough == 0 && enough_nodes[jj] == 0){
                                        do{
                                            mmm++;
                                        }while(mmm < nodes.length && nodes[mmm].owns.indexOf(jj) == -1);
                                        if(mmm < nodes.length && nodes[mmm].owns.indexOf(jj) != -1){//swap two nodes
                                            var tmp = nodes[mmm];
                                            nodes[mmm] = nodes[ii];
                                            nodes[ii] = tmp;
                                            break;
                                        }
                                    }   
                                }
                                for(var jj = 0; jj < nodes[ii].owns.length; jj++){
                                    num_members[nodes[ii].owns[jj]]++;
                                }

                            }
                        }
                        
                        member_nodes.sort(comp);
                        //give back the actual member node size
                        for(var m_id in member_nodes){
                            for(var id in nodes){
                                if(member_nodes[m_id].id == nodes[id].id){//found this user node
                                    nodes[id].attr.size = member_size[m_id];
                                    break; //go to next user
                                }
                            }
                        }
                        //test. to see if all group members are here
//                        if(VMail.App.usersinfo){
//                            for(var ii=0; ii<VMail.App.usersinfo.length; ii++){
//                                for (var tt=0; tt<nodes.length; tt++) {
//                                    var node = nodes[tt];
//                                    if(node.attr.contact.name == VMail.App.usersinfo[ii].name){
//                                        console.log("Find "+node.attr.contact.name+","+tt);
//                                        console.log(nodes[tt]);
//                                    }
//                                }
//                            }
//                        }
                    }
                  }
                });
                
                //change ids in source and destinations for each email
                if(VMail.App.init_time == 0){
                    num_contact = 0;
                    for(var k = 0;k < db.length; k++){
                        for (var i = 0; i < db[k].emails.length; i++) {
                            var ev = db[k].emails[i];
                            var a = (ev.source == undefined? "":ev.source.toString()).toString(); //if email sent from the user, it has no source
                            if(a != "" && VMail.App.idSwitch_before[k].indexOf(a) != -1){
                                ev.source = VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(a)]; 
                                if(VMail.App.db[k].contacts[ev.source.toString()] == undefined){
                                    VMail.App.db[k].contacts[ev.source.toString()] = { 
                                        'name': VMail.App.db[k].contacts[a].name, 
                                        'aliases': VMail.App.db[k].contacts[a].aliases, 
                                        'sent': VMail.App.db[k].contacts[a].sent, 
                                        'rcv': VMail.App.db[k].contacts[a].rcv, 
                                        'new': VMail.App.db[k].contacts[a].new, 
                                        'slack_sent': VMail.App.db[k].contacts[a].slack_sent, 
                                        'slack_rcv': VMail.App.db[k].contacts[a].slack_rcv, 
                                        'id': ev.source };
                                    VMail.App.db[k].contactDetails[ev.source.toString()] = {
                                        id: ev.source,
                                        nRcvEmails: VMail.App.db[k].contactDetails[a].nRcvEmails,
                                        nSentEmails: VMail.App.db[k].contactDetails[a].nSentEmails,
                                        nRcvEmailsPvt: VMail.App.db[k].contactDetails[a].nRcvEmailsPvt,
                                        nSentEmailsPvt: VMail.App.db[k].contactDetails[a].nSentEmailsPvt,
                                        nSentEmailsNorm: VMail.App.db[k].contactDetails[a].nSentEmailsNorm,
                                        nRcvEmailsNorm: VMail.App.db[k].contactDetails[a].nRcvEmailsNorm,
                                        firstEmail: VMail.App.db[k].contactDetails[a].firstEmail,
                                        lastEmail: VMail.App.db[k].contactDetails[a].lastEmail,
                                        newEmails: VMail.App.db[k].contactDetails[a].newEmails
                                    };
                                }
//                                else if(VMail.App.idSwitch_before[k].indexOf(ev.source) != -1){//the id has been taken, we need to rewrite the info in this place
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].id = ev.source;
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].nRcvEmails = VMail.App.db[k].contactDetails[a].nRcvEmails;
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].nSentEmails = VMail.App.db[k].contactDetails[a].nSentEmails;
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].nRcvEmailsPvt = VMail.App.db[k].contactDetails[a].nRcvEmailsPvt;
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].nSentEmailsPvt = VMail.App.db[k].contactDetails[a].nSentEmailsPvt;
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].nSentEmailsNorm = VMail.App.db[k].contactDetails[a].nSentEmailsNorm;
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].nRcvEmailsNorm = VMail.App.db[k].contactDetails[a].nRcvEmailsNorm;
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].firstEmail = VMail.App.db[k].contactDetails[a].firstEmail;
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].lastEmail = VMail.App.db[k].contactDetails[a].lastEmail;
//                                    VMail.App.db[k].contactDetails[ev.source.toString()].newEmails = VMail.App.db[k].contactDetails[a].newEmails;
//                                }
                                //else console.log("changed already");
                            }
                            for (var j = 0; j < ev.destinations.length; j++) {
                                var b = ev.destinations[j].toString();
                                if(b != "" && VMail.App.idSwitch_before[k].indexOf(b) != -1){
                                    ev.destinations[j] = VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(b)]; 
                                    if(VMail.App.db[k].contacts[ev.destinations[j].toString()] == undefined){
                                        VMail.App.db[k].contacts[ev.destinations[j].toString()] = { 
                                            'name': VMail.App.db[k].contacts[b].name, 
                                            'aliases': VMail.App.db[k].contacts[b].aliases, 
                                            'sent': VMail.App.db[k].contacts[b].sent, 
                                            'rcv': VMail.App.db[k].contacts[b].rcv, 
                                            'new': VMail.App.db[k].contacts[b].new, 
                                            'slack_sent': VMail.App.db[k].contacts[b].slack_sent, 
                                            'slack_rcv': VMail.App.db[k].contacts[b].slack_rcv, 
                                            'id': ev.destinations[j] };
                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()] = {
                                            id: ev.destinations[j],
                                            nRcvEmails: VMail.App.db[k].contactDetails[b].nRcvEmails,
                                            nSentEmails: VMail.App.db[k].contactDetails[b].nSentEmails,
                                            nRcvEmailsPvt: VMail.App.db[k].contactDetails[b].nRcvEmailsPvt,
                                            nSentEmailsPvt: VMail.App.db[k].contactDetails[b].nSentEmailsPvt,
                                            nSentEmailsNorm: VMail.App.db[k].contactDetails[b].nSentEmailsNorm,
                                            nRcvEmailsNorm: VMail.App.db[k].contactDetails[b].nRcvEmailsNorm,
                                            firstEmail: VMail.App.db[k].contactDetails[b].firstEmail,
                                            lastEmail: VMail.App.db[k].contactDetails[b].lastEmail,
                                            newEmails: VMail.App.db[k].contactDetails[b].newEmails
                                        };
                                    }
//                                    else if(VMail.App.idSwitch_before[k].indexOf(ev.destinations[j]) != -1){//the id has been taken, we need to rewrite the info in this place
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].id = ev.destinations[j];
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].nRcvEmails = VMail.App.db[k].contactDetails[b].nRcvEmails;
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].nSentEmails = VMail.App.db[k].contactDetails[b].nSentEmails;
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].nRcvEmailsPvt = VMail.App.db[k].contactDetails[b].nRcvEmailsPvt;
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].nSentEmailsPvt = VMail.App.db[k].contactDetails[b].nSentEmailsPvt;
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].nSentEmailsNorm = VMail.App.db[k].contactDetails[b].nSentEmailsNorm;
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].nRcvEmailsNorm = VMail.App.db[k].contactDetails[b].nRcvEmailsNorm;
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].firstEmail = VMail.App.db[k].contactDetails[b].firstEmail;
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].lastEmail = VMail.App.db[k].contactDetails[b].lastEmail;
//                                        VMail.App.db[k].contactDetails[ev.destinations[j].toString()].newEmails = VMail.App.db[k].contactDetails[b].newEmails;
//                                    }
                                }
    //                            else if(!isNaN(b) && ev.destinations[j] != ""){
    //                                ev.destinations[j] = (parseInt(b) + num_contact).toString();
    //                                VMail.App.db[k].contacts[ev.destinations[j].toString()] = { 'name': VMail.App.db[k].contacts[b].name, 'aliases': VMail.App.db[k].contacts[b].aliases, 'sent': VMail.App.db[k].contacts[b].sent, 'rcv': VMail.App.db[k].contacts[b].rcv, 'new': VMail.App.db[k].contacts[b].new, 'id': ev.destinations[j] };
    //                                VMail.App.db[k].contactDetails[ev.destinations[j].toString()] = {
    //                                    id: ev.destinations[j],
    //                                    nRcvEmails: VMail.App.db[k].contactDetails[b].nRcvEmails,
    //                                    nSentEmails: VMail.App.db[k].contactDetails[b].nSentEmails,
    //                                    nRcvEmailsPvt: VMail.App.db[k].contactDetails[b].nRcvEmailsPvt,
    //                                    nSentEmailsPvt: VMail.App.db[k].contactDetails[b].nSentEmailsPvt,
    //                                    nSentEmailsNorm: VMail.App.db[k].contactDetails[b].nSentEmailsNorm,
    //                                    nRcvEmailsNorm: VMail.App.db[k].contactDetails[b].nRcvEmailsNorm,
    //                                    firstEmail: VMail.App.db[k].contactDetails[b].firstEmail,
    //                                    lastEmail: VMail.App.db[k].contactDetails[b].lastEmail,
    //                                    newEmails: VMail.App.db[k].contactDetails[b].newEmails
    //                                };
    //                            }
                            }
                        } 
                        num_contact += db[k].contactDetails.length;
                    }
                }
                
                // map a link to a link object
                var idpairToLink = {};
                var member_idpairToLink = {};
                for(var k = 0;k < db.length; k++){
                  if(VMail.App.removed[k] != 1){
                    for (var i = 0; i < db[k].emails.length; i++) {
                        var ev = db[k].emails[i];
                        var time = ev.timestamp * 1000;
                        if (time < startt || time > endt) {
                            continue;
                        }

                        var isSent = !(ev.hasOwnProperty('source'));
                        var a = ev.source;
                        
//                        a = ((VMail.App.idSwitch_before[k].indexOf(ev.source)!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.source)]:"");  //:ev.source
                        a = ((VMail.App.idSwitch_after[k].indexOf(ev.source)!=-1)? ev.source:"");  //:ev.source
                        
                        
                        if (isSent || !(a in idToNode)) { // the mail is send by the member
                            
                            
                            if(isSent){// the mail is send by the member
                                for(var jjj in member_nodes){
                                    if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                        a = member_nodes[jjj].id; break;
                                    }
//                                    if(jjj == member_nodes.length - 1) alert("not found");
                                }
                                for (var j = 0; j < ev.destinations.length; j++) {
                                    var b = ev.destinations[j];
        //                            b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
                                    b = ((VMail.App.idSwitch_after[k].indexOf(ev.destinations[j])!=-1)? ev.destinations[j]:""); //:ev.destinations[j]

                                    if (!(b in idToNode) || b == a)
                                        continue;
                                    var src = Math.min(parseInt(a), parseInt(b)).toString();
                                    var trg = Math.max(parseInt(a), parseInt(b)).toString();
//                                    if(b == "1636") console.log(ev);
                                    var key = src + '#' + trg;
                                    if (!(key in idpairToLink)) {
                                        //regular link processing
                                        var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false}; //skipcommunity: true,
                                        idToNode[src].links.push(link);
                                        idToNode[trg].links.push(link);
                                        idpairToLink[key] = link;
                                    }
                                    idpairToLink[key].attr.weight++;

                                    if (!(key in member_idpairToLink)) {
                                        //links among members
                                        if(a in member_idToNode && b in member_idToNode){
                                            var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false};
                                            member_idToNode[src].links.push(link);
                                            member_idToNode[trg].links.push(link);
                                            member_idpairToLink[key] = link;
                                        }
                                    }
                                    if(a in member_idToNode && b in member_idToNode){ member_idpairToLink[key].attr.weight++; }
                                }
                            }
                            
                            continue;
                        }
                        for (var j = 0; j < ev.destinations.length; j++) {
                            var b = ev.destinations[j];
//                            b = ((VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])!=-1)? VMail.App.idSwitch_after[k][VMail.App.idSwitch_before[k].indexOf(ev.destinations[j])]:""); //:ev.destinations[j]
                            b = ((VMail.App.idSwitch_after[k].indexOf(ev.destinations[j])!=-1)? ev.destinations[j]:""); //:ev.destinations[j]
                            
                            if (!(b in idToNode) || b == a)
                                continue;
                            var src = Math.min(parseInt(a), parseInt(b)).toString();
                            var trg = Math.max(parseInt(a), parseInt(b)).toString();
//                            if(idToNode[trg].id == "9426"&&idToNode[src].id=="1475") console.log(db[k].emails[i]);
                            var key = src + '#' + trg;
                            if (!(key in idpairToLink)) {
                                //regular link processing
                                var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false};
                                idToNode[src].links.push(link);
                                idToNode[trg].links.push(link);
                                idpairToLink[key] = link;
                            }
                            idpairToLink[key].attr.weight++;
                            
                            if (!(key in member_idpairToLink)) {
                                //links among members
                                if(a in member_idToNode && b in member_idToNode){
                                    var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false};
                                    member_idToNode[src].links.push(link);
                                    member_idToNode[trg].links.push(link);
                                    member_idpairToLink[key] = link;
                                }
                            }
                            if(a in member_idToNode && b in member_idToNode){ member_idpairToLink[key].attr.weight++; }
                        }
                        
                        
                        //the member is a recipient too
                        for(var jjj in member_nodes){
                            if(VMail.App.usersinfo[k].name == member_nodes[jjj].attr.contact.name){
                                b = member_nodes[jjj].id;
                            }
                        }
                        if(b == a) continue; 
                        var src = Math.min(parseInt(a), parseInt(b)).toString();
                        var trg = Math.max(parseInt(a), parseInt(b)).toString();
//                            if(idToNode[trg].id == "9426"&&idToNode[src].id=="1475") console.log(db[k].emails[i]);
                        var key = src + '#' + trg;
                        if (!(key in idpairToLink)) {
                            //regular link processing
                            var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false}; //skipcommunity: true,
                            idToNode[src].links.push(link);
                            idToNode[trg].links.push(link);
                            idpairToLink[key] = link;
                        }
                        idpairToLink[key].attr.weight++;

                        if (!(key in member_idpairToLink)) {
                            //links among members
                            if(a in member_idToNode && b in member_idToNode){
                                var link = { source: member_idToNode[src], target: member_idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: false};
                                member_idToNode[src].links.push(link);
                                member_idToNode[trg].links.push(link);
                                member_idpairToLink[key] = link;
                            }
                        }
                        if(a in member_idToNode && b in member_idToNode){ member_idpairToLink[key].attr.weight++; }
                        
                    }
                  }
                }
                
                
//                //amplify the weight for each link
//                for(var key in idpairToLink){
//                    idpairToLink[key].attr.weight *= 50;
//                }
                //adding link to nodes belong to a user and the user
                for(var id in nodes){
                    var a = nodes[id].id, b;
                    for(var iii in nodes[id].owns){
                        for(var jjj in member_nodes){
                            if(VMail.App.usersinfo[nodes[id].owns[iii]].name == member_nodes[jjj].attr.contact.name){
                                b = member_nodes[jjj].id;
                            }
                        }
                    
                        var src = Math.min(parseInt(a), parseInt(b)).toString();
                        var trg = Math.max(parseInt(a), parseInt(b)).toString();
                        if (!(src in idToNode) || !(trg in idToNode) || src == trg)
                            continue;
                        var key = src + '#' + trg;
                        if (!(key in idpairToLink)) {
                            var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false, skip_removed: [], skip2draw: false, skipcommunity: true}; //skip2draw: true
                            idToNode[src].links.push(link);
                            idToNode[trg].links.push(link);
                            idpairToLink[key] = link;
                        }
                        idpairToLink[key].attr.weight += 1; //0.001 / (VMail.App.db[nodes[id].owns[iii]].nCollaborators * VMail.App.db[nodes[id].owns[iii]].nCollaborators);
                    }
                    
                }
                
                
                var links = [];
                var member_links = [];
                for (var idpair in idpairToLink) {
                    links.push(idpairToLink[idpair]);
                }
                links.sort(function (a, b) {
                    return b.attr.weight - a.attr.weight;
                });
                for (var idpair in member_idpairToLink) {
                    member_links.push(member_idpairToLink[idpair]);
                }
                member_links.sort(function (a, b) {
                    return b.attr.weight - a.attr.weight;
                });
                VMail.App.init_time = 1;
                
                
//                $.ajax({
//                    dataType: "json",
//                    type: 'POST',
//                    url: "/networkanalysis/&json=" + JSON.stringify(network_data),
////                    success: function (returned_data) {
//////                        console.log(returned_data);
////                        alert("ha");
////                    }
//                });
                
                return { nodes: nodes, links: links, member_nodes: member_nodes, member_links: member_links };
            }
            else{
                var the_db = db[0];  
//                var flag=0;
                the_db.getTopContacts(nnodes, start, end).forEach(function (contactScore) {
//                    if(flag==0) {console.log(contactScore); flag=1;}
                    var node = { attr: undefined, links: [], id: contactScore.contact.id, skip: false, new: contactScore.contact.new, owns: [], owns_before_ids: [], owns_ids: []};
                    node.attr = {
                        contact: contactScore.contact,
                        size: contactScore.scores[0]
                    };
                    node.owns.push(0);
                    node.owns_ids.push(contactScore.contact.id);
                    node.owns_before_ids.push(contactScore.contact.id);
                    idToNode[contactScore.contact.id] = node;
                    nodes.push(node);
                });//alert(nodes.length+" single");
                
                // map a link to a link object
                var idpairToLink = {};
                for (var i = 0; i < the_db.emails.length; i++) {
                    var ev = the_db.emails[i];
                    var time = ev.timestamp * 1000;
                    if (time < startt || time > endt) {
                        continue;
                    }

                    var isSent = !(ev.hasOwnProperty('source'));
                    if (isSent || !(ev.source in idToNode)) {
                        continue;
                    }
                    var a = ev.source;
                    for (var j = 0; j < ev.destinations.length; j++) {
                        var b = ev.destinations[j];
                        if (!(b in idToNode) || b == a)
                            continue;

                        var src = Math.min(parseInt(a), parseInt(b)).toString();
                        var trg = Math.max(parseInt(a), parseInt(b)).toString();
                        var key = src + '#' + trg;
                        if (!(key in idpairToLink)) {
                            var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0, weight_slack: 0, weight_general: 0 }, skip: false };
                            idToNode[src].links.push(link);
                            idToNode[trg].links.push(link);
                            idpairToLink[key] = link;
                        }
                        idpairToLink[key].attr.weight++;
                    }
                }
                var links = [];
                for (var idpair in idpairToLink) {
                    links.push(idpairToLink[idpair]);
                }
                links.sort(function (a, b) {
                    return b.attr.weight - a.attr.weight;
                });
    //            console.log(nodes);
    //            console.log(links);
                return { nodes: nodes, links: links };
            }
            /*
             * node: Object {
             *  attr{
             *      color, 
             *      contact{aliases:array, id, name, rcv, sent}
             *      size
             *  }
             *  id,
             *  index,
             *  link,
             *  px, py,
             *  skip,
             *  weight,
             *  x, y
             * }
             */
            /*
             * link: Object {
             *  attr{weight}
             *  skip,
             *  source:node,
             *  target:node,
             * }
             */

        };
    })(VMail.Graph || (VMail.Graph = {}));
    var Graph = VMail.Graph;
})(VMail || (VMail = {}));
//# sourceMappingURL=graph.js.map
