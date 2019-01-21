var VMail;
(function (VMail) {
    (function (Graph) {
        Graph.communityDetection = function (graph) {
            //var nodes = graph.nodes;
            var nodesMap = {};
            for (var i in graph.nodes) {
                if (graph.nodes[i].skip) {
                    continue;
                }
                var node = graph.nodes[i];
                nodesMap[node.id] = { node: node, degree: 0 };
            }
            var m = 0;
            var linksMap = {};

            graph.links.forEach(function (link) {
                a = link.source.id;
                b = link.target.id;
                if (link.skip || link.source.skip || link.target.skip) {
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
                    if (k != maxb) {
                        if (k in linksMap[maxb]) {
                            // k is connected to both a and b
                            linksMap[maxb][k] += linksMap[maxa][k];
                        } else {
                            //k is connected to a but not b
                            linksMap[maxb][k] = linksMap[maxa][k] - 2 * communities[maxb].score * communities[k].score;
                        }
                        linksMap[k][maxb] = linksMap[maxb][k];
                    }
                    delete linksMap[k][maxa];
                }
                for (var k in linksMap[maxb]) {
                    if (!(k in linksMap[maxa]) && k != maxb) {
                        // k is connected to b but not a
                        linksMap[maxb][k] -= 2 * communities[maxa].score * communities[k].score;
                        linksMap[k][maxb] = linksMap[maxb][k];
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
            graph.nodes.forEach(function (node, idx) {
                node.skip = !filter(node.attr, idx);
            });
            //adjustLinks(graph);
        };

        Graph.filterLinks = function (graph, filter) {
            graph.links.forEach(function (link, idx) {
                link.skip = !filter(link.attr, idx);
            });
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
            var idSwitch_before = [], idSwitch_after = []; 
            if(db.length>1){
                var num_contact = 0;
                d3.range(db.length).forEach(function (i){//console.log(db[i].getTopContacts(nnodes, start, end));
                    start = init_start; end = init_end;console.log("next user");
                    db[i].getTopContacts(nnodes, start, end).forEach(function (contactScore) {
//                        contactScore.contact.aliases
                        var node_already = -1;//console.log(contactScore.contact.aliases);
                        if(i != 0){
                            for(var ii = 0; ii < nodes.length; ii++){
                                var email_add = nodes[ii].attr.contact.aliases;
                                for(var jj = 0; jj < contactScore.contact.aliases.length; jj++){
                                    if(email_add.indexOf(contactScore.contact.aliases[jj])!= -1){ //already had the node recorded
                                        node_already = ii;//console.log("found "+email_add);
                                        idSwitch_before.push(contactScore.contact.id);
                                        idSwitch_after.push(nodes[ii].id);
                                        nodes[ii].owns.push(i);
                                        nodes[ii].owns_ids.push(contactScore.contact.id);
                                        ii = nodes.length; jj = contactScore.contact.aliases.length;
                                        break;
                                    }
                                }
                            }
                        }
                        if(i != 0 && node_already != -1){//add email info to the existing node
                            var p = -3;
                            nodes[node_already].attr.size = nodes[node_already].attr.size + contactScore.scores[0];
//                            nodes[node_already].attr.size = Math.pow((Math.pow(nodes[node_already].attr.size, p) + Math.pow(contactScore.scores[0], p)), 1.0 / p);
                        }
                        else {//create a new node
                            var node = { attr: undefined, links: [], id: (parseInt(contactScore.contact.id) + num_contact).toString(), skip: false, owns: [], owns_ids: [] };
                            node.attr = {
                                contact: contactScore.contact,
                                size: contactScore.scores[0]
                            };//if(contactScore.contact.id==3524) console.log(parseInt(contactScore.contact.id) + num_contact);
                            node.owns.push(i);
                            node.owns_ids.push(contactScore.contact.id);
                            idToNode[parseInt(contactScore.contact.id) + num_contact] = node;
                            nodes.push(node);
                            if(i != 0){
                                idSwitch_before.push(contactScore.contact.id);
                                idSwitch_after.push((parseInt(contactScore.contact.id) + num_contact).toString());
                            }
                        }
                    });
                    num_contact += db[i].contactDetails.length; //alert(nodes.length+" multiple "+ i);
                    
                    //sort the nodes from multiple dbs by score desendingly
                    if(i == db.length-1){
                        var comp = function (a, b) {
                            if (a.attr.size !== b.attr.size) {
                                return b.attr.size - a.attr.size;
                            }
                            return 0;
                        };
                        nodes.sort(comp);
                    }
                });
                
                // map a link to a link object
                var idpairToLink = {};
                for(var k = 0;k < db.length;k++){
                    for (var i = 0; i < db[k].emails.length; i++) {
                        var ev = db[k].emails[i];
                        var time = ev.timestamp * 1000;
                        if (time < startt || time > endt) {
                            continue;
                        }

                        var isSent = !(ev.hasOwnProperty('source'));
                        var a = ev.source;
                        
                        if(k != 0) a = ((idSwitch_before.indexOf(ev.source)!=-1)? idSwitch_after[idSwitch_before.indexOf(ev.source)]:ev.source);
                        if (isSent || !(a in idToNode)) {
                            continue;
                        }
                        for (var j = 0; j < ev.destinations.length; j++) {
                            var b = ev.destinations[j];
                            
                            if(k != 0) b = ((idSwitch_before.indexOf(ev.destinations[j])!=-1)? idSwitch_after[idSwitch_before.indexOf(ev.destinations[j])]:ev.destinations[j]);
                            if (!(b in idToNode) || b == a)
                                continue;

                            var src = Math.min(parseInt(a), parseInt(b)).toString();
                            var trg = Math.max(parseInt(a), parseInt(b)).toString();
                            var key = src + '#' + trg;
                            if (!(key in idpairToLink)) {
                                var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0 }, skip: false };
                                idToNode[src].links.push(link);
                                idToNode[trg].links.push(link);
                                idpairToLink[key] = link;
                            }
                            idpairToLink[key].attr.weight++;
                        }
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
            else{
                var the_db = db[0];  
//                var flag=0;
                the_db.getTopContacts(nnodes, start, end).forEach(function (contactScore) {
//                    if(flag==0) {console.log(contactScore); flag=1;}
                    var node = { attr: undefined, links: [], id: contactScore.contact.id, skip: false, owns: [], owns_ids: []};
                    node.attr = {
                        contact: contactScore.contact,
                        size: contactScore.scores[0]
                    };
                    node.owns.push(0);
                    node.owns_ids.push(contactScore.contact.id);
                    //console.log(contactScore.contact.aliases);console.log(contactScore.contact.id);
                    idToNode[contactScore.contact.id] = node;
                    nodes.push(node);
                });//alert(nodes.length+" single");
                
                // map a link to a link object
                var idpairToLink = {};
                for (var i = 0; i < the_db.emails.length; i++) {
                    var ev = the_db.emails[i];//console.log(ev);
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
//                        console.log(a+","+b);
                        var src = Math.min(parseInt(a), parseInt(b)).toString();
                        var trg = Math.max(parseInt(a), parseInt(b)).toString();
//                        if(src==886) console.log("886#"+trg);
                        var key = src + '#' + trg;
                        if (!(key in idpairToLink)) {
                            var link = { source: idToNode[src], target: idToNode[trg], attr: { weight: 0 }, skip: false };
                            idToNode[src].links.push(link);
                            idToNode[trg].links.push(link);
                            idpairToLink[key] = link;
                        }
                        idpairToLink[key].attr.weight++;
                    }
                }//console.log(idpairToLink);
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
