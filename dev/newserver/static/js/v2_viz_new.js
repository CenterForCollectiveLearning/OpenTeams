var VMail;
(function (VMail) {
    (function (Viz) {
        var NetworkViz = (function () {
            function NetworkViz(settings, for_guestbook) {
                var _this = this;
                this.LABEL_THRESHOLD = 1;
                this.clustercolors = true;
                this.neighbors_num = null;
                this.drag_node = null;
                this.recolorTimer = null;
                this.text_order = null;
                this.baseNodeColor = "#000";
                this.baseLabelColor = "#111";
                this.baseStrokeColor = "#B1B1B1";
                this.baseStrokeOpacity = 0.1;
                this.baseNodeStrokeColor = "#999999";
                this.highlightedNodeColor = "#999999"; //"#222"
                this.moveContact = function (d) {
                    d.fixed = true;
                    var r = this.settings.nodeSizeFunc(d.attr);
                    var r_member = this.settings.nodeMemberSizeFunc(d.attr);
                    var newx = d3.event.x + d.x;
                    var newy = d3.event.y + d.y;
                    newx = Math.max(r, Math.min(this.settings.size.width - r, newx));
                    newy = Math.max(r, Math.min(this.settings.size.height - r - 17, newy));
                    d.x = newx;
                    d.y = newy;
                    d.px = newx;
                    d.py = newy;
                    this.forceTick();
                    var g = d3.select(d.parentNode);
                    g.attr("transform", function (d) {
                        return "translate(" + newx + "," + newy + ")";
                    });
                };
                this.centeredNode = null;
                this.settings = settings;
                this.svg = d3.select(settings.svgHolder);
                this.svg.attr("pointer-events", "all");
                this.svg.attr("width", this.settings.size.width);
                this.svg.attr("height", this.settings.size.height);
                this.svg.on("click", function () {
                    _this.undoCenterNode();
                    _this.settings.clickHandler(null);
                });
                this.defs = this.svg.append("svg:defs");
                this.defs.append("svg:filter").attr("id", "blur").append("svg:feGaussianBlur").attr("stdDeviation", 1);

                this.linksG = this.svg.append("g").attr("id", "links").attr("class", "for_ppl");
                this.nodesG = this.svg.append("g").attr("id", "nodes").attr("class", "for_ppl");
                this.glowing = false;
                this.labelsVisible = true;
                this.guestbook = for_guestbook;

//                if (!this.guestbook && d3.select("#network").select("image")[0][0] == null) {
//                    this.svg.append("svg:image").attr("width", 388).attr("height", 81).attr("xlink:href", "/static/images/basic-url-logo2.png").attr("x", 10).attr("y", 18).attr("opacity", 0.8);
//                }
            }
            NetworkViz.prototype.updateNetwork = function (graph) {
                var _this = this;
                this.svg.on("click", function () {
                    _this.undoCenterNode();
                    _this.settings.clickHandler(null);
                });
                //remember centered node
                //var centeredNode = this.centeredNode;
                //undo centering
                //this.undoCenterNode();
                var centeredNode = null;
                if(VMail.App.type != "multi" || VMail.App.member_selected == 0){
                    this.filteredNodes = graph.nodes.filter(function (node) {
//                        if(VMail.App.hideMembers == 1){
//                            for(var t = 0; t < VMail.App.graph.member_nodes.length; t++){
//                                if(node.id == VMail.App.graph.member_nodes[t].id){
//                                    node.skip = 1; return !node.skip;
//                                }
//                            }
//                        }
//                        else{
//                            for(var t = 0; t < VMail.App.graph.member_nodes.length; t++){
//                                if(node.id == VMail.App.graph.member_nodes[t].id){
//                                    node.skip = 0;
//                                }
//                            }
//                        }
                        return !node.skip;
                    });
                }
                else{
                    this.filteredNodes = graph.nodes.filter(function (node) {
                        for(var i = 0; i < VMail.App.graph.member_nodes.length; i++){
                            if(node.id == VMail.App.graph.member_nodes[i].id){
                                if(VMail.App.hideMembers == 1){
                                    return 0;
                                }
                                return 1;
                            }
                        }
                        if(node.owns.length > 1){
                            var shared_by = 0;
                            for(var i = 0; i < node.owns.length; i++){
                                if(VMail.App.removed[i] != 1) shared_by++;
                            }
                        }
                        if(shared_by > 1 && !node.skip) return 1;
                        else return 0;
                    });
                }
                var idToNode2 = {};

                this.filteredNodes.forEach(function (node) {
                    if (_this.idToNode !== undefined && node.id in _this.idToNode) {
                        var oldNode = _this.idToNode[node.id];
                        if (oldNode === _this.centeredNode) {
                            centeredNode = node;
                        }
                        node['x'] = oldNode['x'];
                        node['px'] = oldNode['px'];
                        node['y'] = oldNode['y'];
                        node['py'] = oldNode['py'];
                    }
                    idToNode2[node.id] = node;
                    
                });
//                //email alert box thing 
//                if(VMail.App.type != "multi"){
//                    d3.selectAll(".email_alert_box")
//                            .style("display",function(node){
//                                if(node.new != 0) return "block";
//                                else return "none";
//                            });
//                    d3.selectAll(".new_email_alert").attr("dy", function (node) {
//                                return -2-_this.settings.nodeSizeFunc(node.attr)/1.414;
//                            }).attr("dx", function(node){ return (3+_this.settings.nodeSizeFunc(node.attr)/1.414);})
//                            .style("display",function(node){
//                                if(node.new != 0) return "block";
//                                else return "none";
//                            });
//                }
                this.idToNode = idToNode2;
                if(VMail.App.type != "multi" || VMail.App.member_selected == 0){
                    this.filteredLinks = graph.links.filter(function (link) {
                        return !link.skip && !link.source.skip && !link.target.skip;
                    });
                    this.filteredLinksToDraw = graph.links.filter(function (link) {
                        return !link.skip2draw && !link.skip && !link.source.skip && !link.target.skip;
                    });
                }
                else{
                    this.filteredLinks = graph.links.filter(function (link) {
//                        return !link.skip && !link.source.skip && !link.target.skip;
                        var shared_by_src = 0, shared_by_trg = 0;
                        var member_src = 0, member_trg = 0;
                        for(var i = 0; i < VMail.App.graph.member_nodes.length; i++){
                            if(link.source.id == VMail.App.graph.member_nodes[i].id) member_src = 1;
                        }
                        for(var i = 0; i < VMail.App.graph.member_nodes.length; i++){
                            if(link.target.id == VMail.App.graph.member_nodes[i].id) member_trg = 1;
                        }
                        if((!link.skip && !link.source.skip && !link.target.skip) && ((link.source.owns.length > 1 || member_src == 1) && (link.target.owns.length > 1 || member_trg == 1))){
                            for(var i = 0; i < link.source.owns.length; i++){
                                if(VMail.App.removed[i] != 1) shared_by_src++;
                            }
                            for(var i = 0; i < link.target.owns.length; i++){
                                if(VMail.App.removed[i] != 1) shared_by_trg++;
                            }
                            
                        }
                        if(shared_by_src > 1 && shared_by_trg > 1) return 1;
                        else if((shared_by_src > 1 && member_trg == 1) || (shared_by_trg > 1 && member_src == 1)) return 1;
                        else return 0;
                    });
                    this.filteredLinksToDraw = graph.links.filter(function (link) {
//                        return !link.skip2draw && !link.skip && !link.source.skip && !link.target.skip;
                        var shared_by_src = 0, shared_by_trg = 0;
                        var member_src = 0, member_trg = 0;
                        for(var i = 0; i < VMail.App.graph.member_nodes.length; i++){
                            if(link.source.id == VMail.App.graph.member_nodes[i].id) member_src = 1;
                        }
                        for(var i = 0; i < VMail.App.graph.member_nodes.length; i++){
                            if(link.target.id == VMail.App.graph.member_nodes[i].id) member_trg = 1;
                        }
                        if((!link.skip && !link.source.skip && !link.target.skip) && ((link.source.owns.length > 1 || member_src == 1) && (link.target.owns.length > 1 || member_trg == 1))){
                            for(var i = 0; i < link.source.owns.length; i++){
                                if(VMail.App.removed[i] != 1) shared_by_src++;
                            }
                            for(var i = 0; i < link.target.owns.length; i++){
                                if(VMail.App.removed[i] != 1) shared_by_trg++;
                            }
                            for(var i = 0; i < VMail.App.graph.member_nodes.length; i++){
                                if(link.source.id == VMail.App.graph.member_nodes[i].id) member_src = 1;
                            }
                            for(var i = 0; i < VMail.App.graph.member_nodes.length; i++){
                                if(link.target.id == VMail.App.graph.member_nodes[i].id) member_trg = 1;
                            }
                        }
                        if(shared_by_src > 1 && shared_by_trg > 1) return 1;
                        else if((shared_by_src > 1 && member_trg == 1) || (shared_by_trg > 1 && member_src == 1)) return 1;
                        else return 0;
                    });
                }
                if (centeredNode) {
                    this.draw(false);
                } else {
                    this.undoCenterNode();
                    this.draw(true);
                }

                //redo centering after network has been updated
                if (centeredNode) {
                    //console.log("previously centered node ", centeredNode.attr.contact.name)
                    this.centerNode(centeredNode);
                }
            };
            
            NetworkViz.prototype.updateMemberNetwork = function (graph) {
                var _this = this;
                //remember centered node
                //var centeredNode = this.centeredNode;
                //undo centering
                //this.undoCenterNode();
                var centeredNode = null;
                this.filteredNodes = graph.member_nodes.filter(function (node) {
                    return !node.skip;
                });
                var idToNode2 = {};

                this.filteredNodes.forEach(function (node) {
                    if (_this.idToNode !== undefined && node.id in _this.idToNode) {
                        var oldNode = _this.idToNode[node.id];
                        if (oldNode === _this.centeredNode) {
                            centeredNode = node;
                        }
                        node['x'] = oldNode['x'];
                        node['px'] = oldNode['px'];
                        node['y'] = oldNode['y'];
                        node['py'] = oldNode['py'];
                    }
                    idToNode2[node.id] = node;
                    
                });
                this.idToNode = idToNode2;
                this.filteredLinks = graph.member_links.filter(function (link) {
                    return !link.skip && !link.source.skip && !link.target.skip;
                });
                this.filteredLinksToDraw = graph.member_links.filter(function (link) {
                    return !link.skip2draw && !link.source.skip && !link.target.skip;
                });
                if (centeredNode) {
                    this.draw(false);
                } else {
                    this.undoCenterNode();
                    this.draw(true);
                }

                //redo centering after network has been updated
                if (centeredNode) {
                    //console.log("previously centered node ", centeredNode.attr.contact.name)
                    this.centerNode(centeredNode);
                }
            };

            NetworkViz.prototype.rescale = function () {
                var trans = d3.event.translate;
                var scale = d3.event.scale;
                this.svg.attr("transform", "translate(" + trans + ")" + " scale(" + scale + ")");
            };

            NetworkViz.prototype.resume = function () {
                //this.force.stop();
                this.force.alpha(.15);
            };
            
            NetworkViz.prototype.stop = function(){
                this.force.stop();
            };

            NetworkViz.prototype.draw = function (live) {
                var _this = this;
                if (live === undefined) {
                    live = this.settings.forceParameters.live;
                }
                if (this.force !== undefined) {
                    this.force.stop();
                } else {
                    this.force = d3.layout.force(); 
                }
                this.force.size([this.settings.size.width, this.settings.size.height]);
                this.force.charge(this.settings.forceParameters.charge);
                this.force.linkDistance(this.settings.forceParameters.linkDistance);
                this.force.gravity(this.settings.forceParameters.gravity);
                this.force.friction(this.settings.forceParameters.friction);
                this.force.nodes(this.filteredNodes);
                this.force.links(this.filteredLinks);
                if (live) {
                    this.force.on("tick", function () {
                        return _this.forceTick();
                    });
                    
                }

                this.redraw();

                this.force.start();
                if (!live) {
                    for (var i = 0; i < 150; ++i) { 
                        this.force.tick();
                    }
                    this.force.stop();
                }
            };

            NetworkViz.prototype.redraw = function () {
                this.drawNodes();
                this.drawLinks();
                //member nodes always on top
                d3.selection.prototype.moveToFront = function() {  
                    return this.each(function(){
                        this.parentNode.appendChild(this);
                    });
                };
                var selectedNode = this.nodeBind.filter(function (node, i) {
                    for(var ii = 0; ii < VMail.App.graph.member_nodes.length; ii++){
                        if(!node.skip && node.id == VMail.App.graph.member_nodes[ii].id) return 1;
                    }
                    return 0;
                });
                selectedNode.moveToFront();
            };

            NetworkViz.prototype.forceTick = function () {
                var _this = this;
                var tmp = function (node) {
                    return node.id;
                };
                this.nodeBind.attr("transform", function (node) {
                    var r = _this.settings.nodeSizeFunc(node.attr);

                    //node.x += Math.random()*5 - 2.5;
                    //node.y += Math.random()*5 - 2.5;
                    node.x = Math.max(r, Math.min(_this.settings.size.width - r, node.x));
                    node.y = Math.max(r, Math.min(_this.settings.size.height - r - 17, node.y));
                    
                    //fixed position for members
                    if(VMail.App.type == "multi"){
                        for(var i1 = 0; i1 < VMail.App.usersinfo.length; i1++){
                            if(node.attr.contact.name == VMail.App.usersinfo[i1].name){
                                node.x = VMail.App.memberNodesPosition[i1].x + _this.settings.size.width / 2.0; 
                                node.y = VMail.App.memberNodesPosition[i1].y + _this.settings.size.height / 2.0;
                            }
                        }
                    }
                    
                    return "translate(" + node.x + "," + node.y + ")";
                });//.style("transition-duration","0.5s").style("-webkit-transition-duration","0.5s");

                //make nodes always on the top
                this.text_order.attr("transform", function (node) {
                    var r = _this.settings.nodeSizeFunc(node.attr);

                    //node.x += Math.random()*5 - 2.5;
                    //node.y += Math.random()*5 - 2.5;
                    node.x = Math.max(r, Math.min(_this.settings.size.width - r, node.x));
                    node.y = Math.max(r, Math.min(_this.settings.size.height - r - 17, node.y));
                    return "translate(" + node.x + "," + node.y + ")"; 
                });//.style("transition-duration","0.5s").style("-webkit-transition-duration","0.5s");

                this.linkBind.attr("x1", function (link) {
                    return link.source.x;
                }).attr("y1", function (link) {
                    return link.source.y;
                }).attr("x2", function (link) {
                    return link.target.x;
                }).attr("y2", function (link) {
                    return link.target.y;
                });//.style("transition-duration","0.5s").style("-webkit-transition-duration","0.5s");
            };

            NetworkViz.prototype.clickNode = function (node) {
                if(VMail.App.rightPanel != 2){
                    //focus on the selectedNode
                    var selectedNode = this.nodeBind.filter(function (d, i) {
                        return node === d;
                    });
                    var e = document.createEvent('UIEvents');
                    e.initUIEvent('click', true, true, window, 1);
                    selectedNode.node().dispatchEvent(e);
                } 
                else{//shortest paths
                    
                }
            };

            NetworkViz.prototype.highlightNode = function (node) {
                //focus on the selectedNode
                var selectedNode = this.nodeBind.filter(function (d, i) {
                    return node === d;
                });
                var selectedTextOrder = this.text_order.filter(function (d, i) {
                    return node === d;
                });
                
                selectedNode.select("circle").transition().attr("stroke-width", 3.0).attr("stroke", "#555").style("opacity", "0.8").attr("fill", this.highlightedNodeColor); //.attr("stroke", "#333")
                selectedNode.select("text").transition().style("opacity", "0.8");
                //change the looks of the text
                selectedNode.select(".nodelabeltext").transition().style("visibility", "visible")
                        .style("opacity", "0.8").style("font-size", "25px"); 
                selectedTextOrder.transition().style("font-size", "25px");
            };
            
            NetworkViz.prototype.mouseoverNode = function (node) {
                //focus on the selectedNode
                var selectedNode = this.nodeBind.filter(function (d, i) {
                    return node === d;
                });
                var selectedTextOrder = this.text_order.filter(function (d, i) {
                    return node === d;
                });
                
                this.nodeBind.select(".nodelabeltext")//.transition()
                .style("opacity", function(){
                    if(VMail.App.viz.labelsVisible) return 0.15;
                    else return 0;
                });
                this.text_order//.transition()
                .style("opacity", function(){
                    if(VMail.App.viz.labelsVisible) return 0.15;
                    else return 0;
                });
                
                //change the looks of the circle
                selectedNode.select("circle")//.transition()
                        .attr("stroke-width", 3.0).style("stroke-width", 3.0).attr("stroke", "#555").style("opacity", "0.8").attr("fill", this.highlightedNodeColor); //.attr("stroke", "#333")
                selectedNode.select("text")//.transition()
                        .style("opacity", "0.8");
                //.attr("filter", (d) => {var verdict = this.glowing ? "url(#blur)" : "none"; return verdict;} )
                //change the looks of the text
                selectedNode.select(".nodelabeltext")//.transition()
                .style("visibility", "visible")
                        .style("opacity", "0.8").style("font-size", "25px").text(this.settings.nodeLabelFuncHover(node.attr)); //.style("font-size", "20px")
                selectedTextOrder//.transition()
                        .style("opacity", "1.0").style("font-size", "25px");//.style("font-size", "20px")
                this.linkBind.style("stroke-opacity", 0).filter(function (link, i) {
                    return link.source === node || link.target === node;
                }).style("stroke-opacity", 0.5);
            };

            NetworkViz.prototype.mouseoutNode = function (node) {
                var _this = this;
                //console.log("mouseout:" + node.attr.contact.name);
                //focus on the selectedNode
                var selectedNode = this.nodeBind.filter(function (d, i) {
                    return node === d;
                });
                var selectedTextOrder = this.text_order.filter(function (d, i) {
                    return node === d;
                });
                
                if(VMail.App.centerNodeView == 0){
                    this.text_order//.transition()
                    .style("opacity", function(){
                        if(VMail.App.viz.labelsVisible) return 1;
                        else return 0;
                    });
                }
                this.nodeBind.select(".nodelabeltext")//.transition()
                    .style("opacity", function(){
                        if(VMail.App.viz.labelsVisible) return 0.8;
                        else return 0;
                    });
                
                selectedNode.select("circle")//.transition()
                .attr("stroke", this.baseNodeStrokeColor).attr("stroke-opacity", 1).attr("stroke-width", 0.5).style("stroke-width", 0.5).style("opacity", "0.8").attr("fill", function (d) {
                    if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                        if (_this.clustercolors)
                            return _this.settings.colorFunc(d.attr);
                        else
                            return _this.baseNodeColor;
                    }
                    else if(VMail.App.colorMethod == 1){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return _this.settings.colorMemberFunc(tt);
                            }
                        }
                        if(node.owns.length > 1){
                            var r = 0, g = 0, b = 0;
                            for(var cc = 0; cc < node.owns.length; cc++){
                                r += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(1, 3), 16);
                                g += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(3, 5), 16);
                                b += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(5, 7), 16);
                            }
                            r /= node.owns.length; g /= node.owns.length; b /= node.owns.length; 
                            r = Math.round(r); g = Math.round(g); b = Math.round(b);
                            r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                            return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
                        }
                        else return _this.settings.colorPeopleFunc(d.owns[0]);
                    }
                });
                
                selectedNode.select(".nodelabeltext")//.transition()
                .text(function (node) {
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return _this.settings.nodeLabelFunc(node.attr);
                            }
                        }
                    }
                    if(VMail.App.member_selected == 1 || VMail.App.member_selected == 2){
                        return _this.settings.nodeLabelFunc(node.attr);
                    }
                    else if(_this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ return _this.settings.nodeLabelFunc(node.attr);}
                    else{ return ""; }
                })//.text(this.settings.nodeLabelFunc(node.attr))
                .style("font-size", function(node){
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                if(VMail.App.member_selected == 1){
                                    return _this.settings.textMemberSizeFunc(node.attr);
                                }
                                else if(VMail.App.member_selected == 2){
                                    return _this.settings.textSizeFuncSpecial(node.attr);
                                }
                                else{ return _this.settings.textSizeFuncSpecial(node.attr);}
                            }
                        }
                    }
                    
                    if(VMail.App.member_selected == 1){
                        return _this.settings.textMemberSizeFunc(node.attr);
                    }
                    else if(VMail.App.member_selected == 2){
                        return _this.settings.textSizeFunc(node.attr);
                    }
                    else if(_this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ return _this.settings.textSizeFunc(node.attr);}
                    else{ return ""; }
                }).style("visibility", function (d) {
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(VMail.App.member_selected != 1 && d.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return "visible";
                            }
                        } 
                    }
                    if(VMail.App.member_selected == 1 || VMail.App.member_selected == 2){
                        return "visible";
                    }
                    else if (_this.centeredNode === null && _this.settings.nodeSizeFunc(d.attr) < _this.LABEL_THRESHOLD)
                        return "hidden";
//                    return "hidden";
                })
                .style("opacity", function(){
                    if(VMail.App.viz.labelsVisible) return 0.8;
                    else return 0;
                });
                selectedTextOrder//.transition()
                .style("font-size", function(node){
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                if(VMail.App.member_selected == 1){
                                    return _this.settings.textMemberSizeFunc(node.attr);
                                }
                                else if(VMail.App.member_selected == 2){
                                    return _this.settings.textSizeFuncSpecial(node.attr);
                                }
                                else{ return _this.settings.textSizeFuncSpecial(node.attr);}
                            }
                        }
                    }
                    
                    if(VMail.App.member_selected == 1){
                        return _this.settings.textMemberSizeFunc(node.attr);
                    }
                    else if(VMail.App.member_selected == 2){
                        return _this.settings.textSizeFunc(node.attr);
                    }
                    else if(_this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ return _this.settings.textSizeFunc(node.attr);}
                    else{ return ""; }
                })
                .style("font-weight", "150");
//                .style("visibility", function (d) {
//                    //always show members' names
//                    if(VMail.App.type == "multi"){
//                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
//                            if(VMail.App.member_selected != 1 && d.attr.contact.name == VMail.App.usersinfo[tt].name){
//                                return "visible";
//                            }
//                        }
//                    }
//                    if(VMail.App.member_selected == 1 || VMail.App.member_selected == 2){
//                        return "visible";
//                    }
//                    else if (_this.centeredNode === null && _this.settings.nodeSizeFunc(d.attr) < _this.LABEL_THRESHOLD)
//                        return "hidden";
////                    return "hidden";
//                });
                this.linkBind.style("stroke-opacity", this.baseStrokeOpacity);
            };

            NetworkViz.prototype.undoCenterNode = function () {
                var _this = this; VMail.App.centerNodeView = 0;
                if (d3.event) {
                    d3.event.stopPropagation();
                }

                // don't undo if there is noone centered
                if (this.centeredNode === null) {
                    return;
                }

                //un-highlight the node if uncentering
                this.mouseoutNode(this.centeredNode);

                var centerNode = this.centeredNode;

                // find the neighbors of the centered node (this takes o(1) time given the underlying graph structure)
                var neighbors = {};
                centerNode.links.forEach(function (link) {
                    if (link.skip || link.skip2draw || link.source.skip || link.target.skip) {
                        return;
                    }
                    if (link.source !== centerNode)
                        neighbors[link.source.id] = link.source;
                    if (link.target !== centerNode)
                        neighbors[link.target.id] = link.target;
                });

                // === ANIMATION CODE ===
                var centeringNodes = this.nodeBind.style("opacity", 1.0).style("pointer-events", 'all').filter(function (d2, i) {
                    return d2 === centerNode || d2.id in neighbors;
                });

                centeringNodes//.transition()
                .attr("transform", function (d, i) {
                    d.x = d.px;
                    d.y = d.py;
                    return "translate(" + d.x + "," + d.y + ")";
                });

                this.text_order.style("opacity", 1).filter(function (d2, i) {
                    return d2 === centerNode || d2.id in neighbors;
                })//.transition()
                .attr("transform", function (d, i) {
                    d.x = d.px;
                    d.y = d.py;
                    return "translate(" + d.x + "," + d.y + ")";
                }).style("visibility", 'visible');

                //return the original styles of the cirles of the centering nodes
                centeringNodes.select("circle").attr("stroke", this.baseNodeStrokeColor).attr("stroke-opacity", 0.8).attr("stroke-width", 1.0).attr("fill", function (node) {
                    if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){ //2 is color by community
                        if (_this.clustercolors)
                            return _this.settings.colorFunc(node.attr);
                        else
                            return _this.baseNodeColor;
                    }
                    else if(VMail.App.colorMethod == 1){ //1 is color by people
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return _this.settings.colorMemberFunc(tt);
                            }
                        }
                        if(node.owns.length > 1){
                            var r = 0, g = 0, b = 0;
                            for(var cc = 0; cc < node.owns.length; cc++){
                                r += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(1, 3), 16);
                                g += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(3, 5), 16);
                                b += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(5, 7), 16);
                            }
                            r /= node.owns.length; g /= node.owns.length; b /= node.owns.length; 
                            r = Math.round(r); g = Math.round(g); b = Math.round(b);
                            r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                            return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
                        }
                        else return _this.settings.colorPeopleFunc(node.owns[0]);
                    }
                });

                //return the original style and position of the text of the centering nodes
                centeringNodes.select(".nodelabeltext").attr("text-anchor", "middle").attr("dy", function (node) {
                    var shift = 0;
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                shift = (VMail.App.member_selected == 1? _this.settings.textMemberSizeFunc(node.attr):_this.settings.textSizeFuncSpecial(node.attr)) / 2;
                                return shift - 4;
                            }
                        }
                    }
                    if(shift == 0 && _this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ shift = _this.settings.textSizeFunc(node.attr) / 2;}
                    return shift - 2;//_this.settings.nodeSizeFunc(node.attr);
//                    return _this.settings.nodeSizeFunc(node.attr) + 13;
                }).attr("dx", '0em').attr("transform", null).style("visibility", function (node) {
                    if(VMail.App.member_selected == 1 || VMail.App.member_selected == 2){
                        return "visible";
                    }
                    if (_this.settings.nodeSizeFunc(node.attr) < _this.LABEL_THRESHOLD)
                        return "hidden";
//                    return "hidden";
                });

                this.linkBind.style("opacity", 1.0).filter(function (link, i) {
                    return link.source === centerNode || link.target === centerNode;
                })//.transition()
                .attr("x1", function (link) {
                    return link.source.x;
                }).attr("y1", function (link) {
                    return link.source.y;
                }).attr("x2", function (link) {
                    return link.target.x;
                }).attr("y2", function (link) {
                    return link.target.y;
                });
                
                //uncenter the node
                this.centeredNode = null;
            };

            NetworkViz.prototype.centerNode = function (centerNode) {
                var _this = this; 
                // stop any animation before animating the "centering"
                this.force.stop();

                //un-highlight the node
                //this.mouseoutNode(centerNode);
                if (this.centeredNode === centerNode) {
                    this.undoCenterNode();
                    return;
                }
                this.undoCenterNode();
                VMail.App.centerNodeView = 1;
                // remember the centered node
                this.centeredNode = centerNode;
                
                // store all the neighbors of the centered node (neighbors are found in O(1) time from the graph data structure)
                var neighbors = {};
                var nneighbors = 0;
                centerNode.links.forEach(function (link) {
                    if (link.skip || link.skip2draw || link.source.skip || link.target.skip) {
                        return;
                    } else {
                        nneighbors += 1;
                    }
                    if (link.source !== centerNode)
                        neighbors[link.source.id] = link.source;
                    if (link.target !== centerNode)
                        neighbors[link.target.id] = link.target;
                });

                // radius of the "centering" circle
                var radius = 250;
                var angle = (2 * Math.PI) / nneighbors;

                //  ===COORDINATES COMPUTATION CODE===
                //  ---center node---
                //store old coordinates. Need them when we undo the centering to return objects to their original position.
                centerNode.px = centerNode.x;
                centerNode.py = centerNode.y;
                centerNode.x = this.settings.size.width / 2.0;
                centerNode.y = this.settings.size.height / 2.0;

                //  ---neighboring nodes---
                var idx = 0;
                var neighbors_array = [];
                for (var id in neighbors) {
                    neighbors_array.push(neighbors[id]);
                }
                neighbors_array.sort(function (na, nb) {
//                    if(VMail.App.colorMethod == 2) return a.attr.color - b.attr.color;
//                    else return a.owns[0] - b.owns[0];
                    if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                        if (_this.clustercolors) {
                            return na.attr.color - nb.attr.color;
//                            return _this.org_settings.colorFunc(na.attr) - _this.org_settings.colorFunc(b.attr);
                        } else {
                            return 0;
                        }
                    }
                    else if(VMail.App.colorMethod == 1){
                        var r = 0, g = 0, b = 0;
                        var nn = na.owns.length;
                        if(VMail.App.node_as_org == 0){
                            for(var cc = 0; cc < na.owns.length; cc++){
                                r += parseInt(_this.settings.colorPeopleFunc(na.owns[cc]).substring(1, 3), 16);
                                g += parseInt(_this.settings.colorPeopleFunc(na.owns[cc]).substring(3, 5), 16);
                                b += parseInt(_this.settings.colorPeopleFunc(na.owns[cc]).substring(5, 7), 16);
                            }
                        }
                        r /= nn; g /= nn; b /= nn; 
                        //r = Math.round(r); g = Math.round(g); b = Math.round(b);
                        var color1 = r * 256 + g + b / 256;

                        r = 0; g = 0; b = 0; nn = nb.owns.length;
                        if(VMail.App.node_as_org == 0){
                            for(var cc = 0; cc < nb.owns.length; cc++){
                                r += parseInt(_this.settings.colorPeopleFunc(nb.owns[cc]).substring(1, 3), 16);
                                g += parseInt(_this.settings.colorPeopleFunc(nb.owns[cc]).substring(3, 5), 16);
                                b += parseInt(_this.settings.colorPeopleFunc(nb.owns[cc]).substring(5, 7), 16);
                            }
                        }
                        r /= nn; g /= nn; b /= nn; 
                        //r = Math.round(r); g = Math.round(g); b = Math.round(b);
                        var color2 = r * 256 + g + b / 256;

                        return color1 - color2;
                    }
                });

                for (var id in neighbors_array) {
                    var node = neighbors_array[id];
                    node.px = node.x;
                    node.py = node.y;
                    node.x = centerNode.x + radius * Math.cos(idx * angle);
                    node.y = centerNode.y + radius * Math.sin(idx * angle);
                    node.angle = idx * angle;
                    idx += 1;
                } 
                this.neighbors_num = neighbors_array.length - 1;

                // === ANIMATION CODE ===
                // ---neighboring nodes---
                this.nodeBind.style("opacity", 0.05).style("pointer-events", 'none').filter(function (d2, i) {
                    return d2.id in neighbors;
                }).style("opacity", 1)//.transition()
                .attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).style("pointer-events", 'all').select(".nodelabeltext").attr("text-anchor", function (d, i) {
                    var ang = 180 * d.angle / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return "end";
                    }
                    return "start";
                }).attr("dx", function (d, i) {
                    var ang = 180 * d.angle / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return -_this.settings.nodeSizeFunc(d.attr) - 10;
                    }
                    return _this.settings.nodeSizeFunc(d.attr) + 10;
                }).attr("dy", function (d, i) {
                    return 5;
                }).attr("transform", function (d, i) {
                    var ang = 180 * d.angle / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return "rotate(" + ang + " 0 0) scale(-1,-1)";
                    }
                    return "rotate(" + ang + " 0 0)";
                }).style("visibility", null);

                //---center node---
                var tmp = this.nodeBind.filter(function (d2, i) {
                    return d2 === centerNode;
                });
                
                this.text_order.style("opacity", 0.05).filter(function (d2, i) {
                    return d2.id in neighbors;
                }).style("opacity", 1)//.transition()
                .attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).style("visibility", 'hidden');
//                .select(".nodelabeltext").attr("text-anchor", function (d, i) {
//                    var ang = 180 * d.angle / Math.PI;
//                    if (ang > 90 && ang < 270) {
//                        return "end";
//                    }
//                    return "start";
//                }).attr("dx", function (d, i) {
//                    var ang = 180 * d.angle / Math.PI;
//                    if (ang > 90 && ang < 270) {
//                        return -_this.settings.nodeSizeFunc(d.attr) - 10;
//                    }
//                    return _this.settings.nodeSizeFunc(d.attr) + 10;
//                }).attr("dy", function (d, i) {
//                    return 5;
//                }).attr("transform", function (d, i) {
//                    var ang = 180 * d.angle / Math.PI;
//                    if (ang > 90 && ang < 270) {
//                        return "rotate(" + ang + " 0 0) scale(-1,-1)";
//                    }
//                    return "rotate(" + ang + " 0 0)";
//                }).style("visibility", null);
               
                //make the center node fully vizible
                tmp.select(".nodelabeltext").style("opacity", 0.8).style("visibility", null);
                tmp.style("opacity", 1.0)//.transition()
                .style("pointer-events", 'all').attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).select("circle").attr("stroke-width", 3.0).attr("stroke", "#000").attr("fill", this.highlightedNodeColor);

                this.text_order.filter(function (d2, i) {
                    return d2 === centerNode;
                }).attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).style("visibility", 'hidden');
                
                //un-highlight the node
                this.mouseoutNode(centerNode);

                //---links---
                this.linkBind.style("opacity", 0).filter(function (link, i) {
                    return link.source === centerNode || link.target === centerNode;
                }).style("opacity", 1.0)//.transition()
                .attr("x1", function (link) {
                    return link.source.x;
                }).attr("y1", function (link) {
                    return link.source.y;
                }).attr("x2", function (link) {
                    return link.target.x;
                }).attr("y2", function (link) {
                    return link.target.y;
                });
            };

            NetworkViz.prototype.recolorNodes = function () {
                var _this = this;
                if (this.clustercolors) {
                    this.nodeBind.select("circle").transition().duration(750).attr("fill", function (node) {
                        if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){ //2 is color by community
                            return _this.settings.colorFunc(node.attr);
                        }
                        else if(VMail.App.colorMethod == 1){ //1 is color by people
                            for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                                if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                    return _this.settings.colorMemberFunc(tt);
                                }
                            }
                            if(node.owns.length > 1){
                                var r = 0, g = 0, b = 0;
                                for(var cc = 0; cc < node.owns.length; cc++){
                                    r += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(1, 3), 16);
                                    g += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(3, 5), 16);
                                    b += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(5, 7), 16);
                                }
                                r /= node.owns.length; g /= node.owns.length; b /= node.owns.length; 
                                r = Math.round(r); g = Math.round(g); b = Math.round(b);
                                r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                                return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
                            }
                            else return _this.settings.colorPeopleFunc(node.owns[0]);
                        }
                    });
                } else {
                    this.nodeBind.select("circle").attr("fill", function(node){
                        if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){ //2 is color by community
                            return this.baseNodeColor;
                        }
                        else if(VMail.App.colorMethod == 1){ //1 is color by people
                            var color = d3.scale.category10();
                            return color(node.owns[0]);
                        }
                    });
                }
            };

            NetworkViz.prototype.glowNodes = function () {
                if (!this.glowing) {
                    this.nodeBind.select("circle").transition().style("filter", "url(#blur)");
                    this.glowing = true;
                } else {
                    this.nodeBind.select("circle").transition().style("filter", "none");
                    this.glowing = false;
                }
            };

            NetworkViz.prototype.toggleLabelVisibility = function () {
                if (this.labelsVisible) {
                    this.nodeBind.select("text").transition().style("opacity", 0);
                    this.text_order.transition().style("opacity", 0);
                    this.labelsVisible = false;
                } else {
                    console.log('displaying labels..');
                    this.nodeBind.select("text").transition().style("opacity", 0.8);
                    this.text_order.transition().style("opacity", 1);
                    this.labelsVisible = true;
                }
            };

            NetworkViz.prototype.drawNodes = function () {
                var _this = this;
                var tmp = function (node) {
                    return node.id;
                };
                this.nodeBind = this.nodesG.selectAll("g.node").data(this.filteredNodes, tmp);
                //console.log(this.filteredNodes);
                if (this.guestbook) {
                    var filteredNodes_length = this.filteredNodes.length;
                    for (var u = 0; u < filteredNodes_length; u++) {
                        if (this.filteredNodes[u].attr.contact.userinfo.picture !== undefined)
                            var picurl = this.filteredNodes[u].attr.contact.userinfo.picture;
                        else
                            var picurl = '/static/images/default_user_pic.jpg';
                        this.defs.append("pattern").attr("id", this.filteredNodes[u].attr.contact.userinfo.id + '_pic').attr('patternUnits', 'userSpaceOnUse').attr("width", 50).attr("height", 50).attr('x', -25).attr('y', 25).append('svg:image').attr('xlink:href', picurl).attr("width", 50).attr("height", 50).attr('x', 0).attr('y', 0);
                    }
                }

                //update
                this.nodeBind.attr("transform", function (node) {
                    return "translate(" + node.x + "," + node.y + ")"; //maybe an error here
                });
                var circles = this.nodeBind.select("circle");
                circles.transition().duration(1000).attr("r", function (node) {
                    if(VMail.App.type == "multi"){
                        if(VMail.App.member_selected==1) return _this.settings.nodeMemberSizeFunc(node.attr);
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return _this.settings.nodeSizeFuncSpecial(node.attr);
                            }
                        }
                    }
                    return _this.settings.nodeSizeFunc(node.attr);
                }).attr("fill", function (node) {
                    if (!_this.guestbook) {
                        if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                            if (_this.clustercolors) {
                                return _this.settings.colorFunc(node.attr);
                            } else {
                                return _this.baseNodeColor;
                            }
                        }
                        else if(VMail.App.colorMethod == 1){
                            for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                                if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                    return _this.settings.colorMemberFunc(tt);
                                }
                            }
                            if(node.owns.length > 1){
                                var r = 0, g = 0, b = 0;
                                for(var cc = 0; cc < node.owns.length; cc++){
                                    r += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(1, 3), 16);
                                    g += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(3, 5), 16);
                                    b += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(5, 7), 16);
                                }
                                r /= node.owns.length; g /= node.owns.length; b /= node.owns.length; 
                                r = Math.round(r); g = Math.round(g); b = Math.round(b);
                                r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                                return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
                            }
                            else return _this.settings.colorPeopleFunc(node.owns[0]);
                        }
                    } else {
                        return "url(#" + node.attr.contact.userinfo.id + "_pic)";
                    }
                });

                var labels = this.nodeBind.select(".nodelabeltext");
                labels//.transition()
                .style("visibility", function (node) {
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return "visible";
                            }
                        }
                    }
                    if(VMail.App.member_selected == 1 || VMail.App.member_selected == 2){
                        return "visible";
                    }
                    else if (_this.settings.nodeSizeFunc(node.attr) < _this.LABEL_THRESHOLD)
                        return "hidden";
                    else return "visible";
//                    return "hidden";
                }).attr("dx", '0em')
//                .attr("dy", function (node) {
//                    return _this.settings.nodeSizeFunc(node.attr) + 15;
//                })       
                .attr("dy", function (node) {
                    var shift = 0;
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                shift = (VMail.App.member_selected == 1? _this.settings.textMemberSizeFunc(node.attr):_this.settings.textSizeFuncSpecial(node.attr)) / 2;
                                return shift - 4;
                            }
                        }
                    }
                    if(shift == 0 && _this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ shift = (VMail.App.member_selected == 1? _this.settings.textMemberSizeFunc(node.attr):_this.settings.textSizeFunc(node.attr)) / 2;}
                    return shift - 2;//_this.settings.nodeSizeFunc(node.attr);
//                    return _this.settings.nodeSizeFunc(node.attr) + 13;
                })
                .style("font-size", function(node){
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                if(VMail.App.member_selected == 1){
                                    return _this.settings.textMemberSizeFunc(node.attr);
                                }
                                else if(VMail.App.member_selected == 2){
                                    return _this.settings.textSizeFuncSpecial(node.attr);
                                }
                                else{ return _this.settings.textSizeFuncSpecial(node.attr);}
                            }
                        }
                    }
                    
                    if(VMail.App.member_selected == 1){
                        return _this.settings.textMemberSizeFunc(node.attr);
                    }
                    else if(VMail.App.member_selected == 2){
                        return _this.settings.textSizeFunc(node.attr);
                    }
                    else if(_this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ return _this.settings.textSizeFunc(node.attr);}
                    else{ return null;}
                })
                .text(function (node) {
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return _this.settings.nodeLabelFunc(node.attr);
                            }
                        }
                    }
                    if(VMail.App.member_selected == 1 || VMail.App.member_selected == 2){
                        return _this.settings.nodeLabelFunc(node.attr);
                    }
                    else if(_this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ return _this.settings.nodeLabelFunc(node.attr);}
                    else{ return ""; }
                });
                
                this.nodesG.selectAll("use")//.transition()
                .style("visibility", function (node) {
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return "visible";
                            }
                        }
                    }
                    
                    if(VMail.App.member_selected == 1 || VMail.App.member_selected == 2){
                        return "visible";
                    }
                    else if (_this.settings.nodeSizeFunc(node.attr) < _this.LABEL_THRESHOLD)
                        return "hidden";
                    else return "visible";
                }).attr("dy", function (node) {
                    var shift = 0;
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                shift = (VMail.App.member_selected == 1? _this.settings.textMemberSizeFunc(node.attr):_this.settings.textSizeFuncSpecial(node.attr)) / 2;
                                return shift - 4;
                            }
                        }
                    }
                    if(shift == 0 && _this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ shift = (VMail.App.member_selected == 1? _this.settings.textMemberSizeFunc(node.attr):_this.settings.textSizeFunc(node.attr)) / 2;}
                    return shift - 2;
//                    return _this.settings.nodeSizeFunc(node.attr) + 15;
                }).attr("dx", '0em')
                .style("font-size", function(node){
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                if(VMail.App.member_selected == 1){
                                    return _this.settings.textMemberSizeFunc(node.attr);
                                }
                                else if(VMail.App.member_selected == 2){
                                    return _this.settings.textSizeFuncSpecial(node.attr);
                                }
                                else{ return _this.settings.textSizeFuncSpecial(node.attr);}
                            }
                        }
                    }
                    
                    if(VMail.App.member_selected == 1){
                        return _this.settings.textMemberSizeFunc(node.attr);
                    }
                    else if(VMail.App.member_selected == 2){
                        return _this.settings.textSizeFunc(node.attr);
                    }
                    else if(_this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ return _this.settings.textSizeFunc(node.attr);}
                    else{ return null;}
                });

                //enter
                var enteringNodes = this.nodeBind.enter().append("g");
                enteringNodes.attr("class", "node").attr("id", function (node) {
                    return node.id;
                });

                enteringNodes.attr("transform", function (node) {//if(typeof(node.x)=="undefined") console.log(node.px);
                    return "translate(" + node.x + "," + node.y + ")"; //maybe an error here
                });
                
                this.text_order = this.nodesG.selectAll("use").data(this.filteredNodes, tmp);
                this.text_order.attr("transform", function (node) {
                    return "translate(" + node.x + "," + node.y + ")"; //maybe an error here
                });
                var enteringUses = this.text_order.enter().append("use");
                enteringUses.attr("id", "use");

                enteringUses.attr("transform", function (node) {
                    return "translate(" + node.x + "," + node.y + ")"; 
                });
                
                if (!this.guestbook) {
                    if (this.settings.clickHandler !== undefined) {
                        enteringNodes.on("click.1", this.settings.clickHandler);
                        enteringNodes.on("click.centerNode", function (d, i) {
                            _this.centerNode(d);
                        });
                    }
                }

                var circles = enteringNodes.append("circle");
                circles.attr("r", function (node) {
                    if(VMail.App.type == "multi"){
                        if(VMail.App.member_selected==1) return _this.settings.nodeMemberSizeFunc(node.attr);
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return _this.settings.nodeSizeFuncSpecial(node.attr);
                            }
                        }
                    }
                    return _this.settings.nodeSizeFunc(node.attr);
                });
                circles.attr("fill", function (node, i) {
                    if (!_this.guestbook) {
                        if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                            if (_this.clustercolors) {
                                return _this.settings.colorFunc(node.attr);
                            } else {
                                return _this.baseNodeColor;
                            }
                        }
                        else if(VMail.App.colorMethod == 1){
                            for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                                if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                    return _this.settings.colorMemberFunc(tt);
                                }
                            }
                            if(node.owns.length > 1){
                                //more circles for shared contact
                                var r = 0, g = 0, b = 0;
                                for(var cc = 0; cc < node.owns.length; cc++){
                                    r += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(1, 3), 16);
                                    g += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(3, 5), 16);
                                    b += parseInt(_this.settings.colorPeopleFunc(node.owns[cc]).substring(5, 7), 16);
                                }
                                r /= node.owns.length; g /= node.owns.length; b /= node.owns.length; 
                                r = Math.round(r); g = Math.round(g); b = Math.round(b); 
                                r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                                return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
                            }
                            else return _this.settings.colorPeopleFunc(node.owns[0]);
                        }
                    } else {
                        return "url(#" + node.attr.contact.userinfo.id + "_pic)";
                    }
                });
                circles.style("opacity", "0.8").attr("stroke", this.baseNodeStrokeColor).attr("stroke-opacity", 1).attr("stroke-width", 0.5);
                
              
//                //new email icon
//                if(VMail.App.type != "multi"){
//                    var new_email_icon = enteringNodes.append("circle").attr("class","email_alert_box");
//                    new_email_icon.attr("r", 12).attr("fill","black")
//                            .attr("cx", function(node){ return 6+_this.settings.nodeSizeFunc(node.attr)/1.414; }).attr("cy", function(node){ return -6-1*_this.settings.nodeSizeFunc(node.attr)/1.414;})
//                            .style("display",function(node){
//                                if(node.new != 0) return "block";
//                                else return "none";
//                            });
//                    enteringNodes.append("text").attr("class","new_email_alert").text(function(node){return node.new;})
//                            //.attr("x", function(node){ return (0+_this.settings.nodeSizeFunc(node.attr)/1.414);}).attr("y", function(node){ return -2-_this.settings.nodeSizeFunc(node.attr)/1.414;})
//                            .attr("dy", function (node) {
//                                return -2-_this.settings.nodeSizeFunc(node.attr)/1.414;
//                            }).attr("dx", function(node){ return (3+_this.settings.nodeSizeFunc(node.attr)/1.414);})
//                            .style("display",function(node){
//                                if(node.new != 0) return "block";
//                                else return "none";
//                            }).attr("fill", "white");//.attr("text-anchor", "middle")
//                }

                //.style("filter", () => {var verdict = this.glowing ? "url(#blur)" : "none"; return verdict;} )
                if (!this.guestbook) {
                    circles.on("mouseover", function (d, i) {
                        _this.mouseoverNode(d);
                    }).on("mouseout.1", function (d, i) {
                        _this.mouseoutNode(d);
                    }).call(d3.behavior.drag().on("drag", function (node) {
                        return _this.moveContact(node);
                    }));
                }
                enteringNodes.append("text").attr("id", function(node){ return "text_" + node.id; }).attr("text-anchor", "middle").attr("dy", function (node) {
                    var shift = 0;
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                shift = (VMail.App.member_selected == 1? _this.settings.textMemberSizeFunc(node.attr):_this.settings.textSizeFuncSpecial(node.attr)) / 2;
                                return shift - 4;
                            }
                        }
                    }
                    if(shift == 0 && _this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ shift = (VMail.App.member_selected == 1? _this.settings.textMemberSizeFunc(node.attr):_this.settings.textSizeFunc(node.attr)) / 2;}
                    return shift - 2;//_this.settings.nodeSizeFunc(node.attr);
                    
//                    var shift = 0;
//                    if(_this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ shift = _this.settings.textSizeFunc(node.attr) / 2;}
//                    return shift - 2;
                }).attr("dx", '0em').attr("class", "nodelabeltext").style("visibility", function (node) {
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return "visible";
                            }
                        }
                    }
                    if(VMail.App.member_selected == 1 || VMail.App.member_selected == 2){
                        return "visible";
                    }
                    else if(_this.settings.nodeSizeFunc(node.attr) < _this.LABEL_THRESHOLD)
                        return "hidden";
                    else return "visible";
//                    return "hidden";
                }).style("font-size", function(node){
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                if(VMail.App.member_selected == 1){
                                    return _this.settings.textMemberSizeFunc(node.attr);
                                }
                                else if(VMail.App.member_selected == 2){
                                    return _this.settings.textSizeFuncSpecial(node.attr);
                                }
                                else{ return _this.settings.textSizeFuncSpecial(node.attr);}
                            }
                        }
                    }
                    
                    if(VMail.App.member_selected == 1){
                        return _this.settings.textMemberSizeFunc(node.attr);
                    }
                    else if(VMail.App.member_selected == 2){
                        return _this.settings.textSizeFunc(node.attr);
                    }
                    else if(_this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ return _this.settings.textSizeFunc(node.attr);}
                    else{ return null; }
                }).attr("fill", this.baseLabelColor)
                .style("opacity", function(){
                    if(VMail.App.viz.labelsVisible){ return 0.8; }
                    else{ return 0; }
                })
                .style("pointer-events", 'none').text(function (node) {
                    //always show members' names
                    if(VMail.App.type == "multi"){
                        for(var tt = 0; tt < VMail.App.usersinfo.length; tt++){
                            if(node.attr.contact.name == VMail.App.usersinfo[tt].name){
                                return _this.settings.nodeLabelFunc(node.attr);
                            }
                        }
                    }
                    if(VMail.App.member_selected == 1 || VMail.App.member_selected == 2){
                        return _this.settings.nodeLabelFunc(node.attr);
                    }
                    else if(_this.settings.nodeSizeFunc(node.attr) >= VMail.App.thresholdForText){ return _this.settings.nodeLabelFunc(node.attr);}
                    else{ return ""; }
                });
                
//                this.text_order = this.nodesG.selectAll("use").data(this.filteredNodes, tmp);
//                var enteringUses = this.text_order.enter().append("use");
//                enteringUses.attr("id", "use");
//
//                enteringUses.attr("transform", function (node) {
//                    return "translate(" + node.x + "," + node.y + ")"; 
//                })
                enteringUses.style("opacity", function(){
                    if(VMail.App.viz.labelsVisible){ return 1; }
                    else{ return 0; }
                });
                enteringUses.attr("xlink:href", function(node){ return "#text_" + node.id; });
                
                
                    //exit
                    this.nodeBind.exit().remove();
                    this.text_order.exit().remove();
                

                
            };

            NetworkViz.prototype.showLabel = function (radius) {
                return (radius < 5);
            };

            NetworkViz.prototype.drawLinks = function () {
                var _this = this;
                var tmp = function (link) {
                    return link.source.id + "#" + link.target.id;
                };
                this.linkBind = this.linksG.selectAll("line.link").data(this.filteredLinksToDraw, tmp);
                var sizeExtent = d3.extent(this.filteredLinksToDraw, function (link) {
                    return link.weight;
                });

                //var linkWidth = d3.scale.linear();
                //linkWidth.range([this.settings.linkWidthPx.min, this.settings.linkWidthPx.max]);
                //linkWidth.domain(sizeExtent);
                //update
                this.linkBind.attr("stroke-width", function (link) {
                    return _this.settings.linkSizeFunc(link.attr);
                });
                this.linkBind.attr("x1", function (link) {
                    return link.source.x;
                });
                this.linkBind.attr("y1", function (link) {
                    return link.source.y;
                });
                this.linkBind.attr("x2", function (link) {
                    return link.target.x;
                });
                this.linkBind.attr("y2", function (link) {
                    return link.target.y;
                });

                //enter
                var lines = this.linkBind.enter().append("line");
                lines.attr("class", "link");
                lines.attr("stroke", this.baseStrokeColor);
                lines.attr("stroke-opacity", this.baseStrokeOpacity);
                lines.attr("stroke-width", function (link) {
                    return _this.settings.linkSizeFunc(link.attr);
                });
                lines.attr("x1", function (link) {
                    return link.source.x;
                });
                lines.attr("y1", function (link) {
                    return link.source.y;
                });
                lines.attr("x2", function (link) {
                    return link.target.x;
                });
                lines.attr("y2", function (link) {
                    return link.target.y;
                });

                //exit
                this.linkBind.exit().remove();
            };
            return NetworkViz;
        })();
        Viz.NetworkViz = NetworkViz;
        
        //herehere
        var OrgNetworkViz = (function () {
            function OrgNetworkViz(settings, for_guestbook) {
                var _this = this;
                this.LABEL_THRESHOLD = 1;
                this.clustercolors = true;
                this.neighbors_num = null;
                this.drag_node = null;
                this.recolorTimer = null;
                this.text_order = null;
                this.baseNodeColor = "#000";
                this.baseLabelColor = "#111";
                this.baseStrokeColor = "#B1B1B1";
                this.baseStrokeOpacity = 0.1;
                this.baseNodeStrokeColor = "#999999";
                this.highlightedNodeColor = "#999999"; //"#222"
                this.moveContact = function (d) {
                    d.fixed = true;
                    var r = this.org_settings.nodeSizeFunc(d.email_size);
                    var newx = d3.event.x + d.x;
                    var newy = d3.event.y + d.y;
                    newx = Math.max(r, Math.min(this.org_settings.size.width - r, newx));
                    newy = Math.max(r, Math.min(this.org_settings.size.height - r - 17, newy));
                    d.x = newx;
                    d.y = newy;
                    d.px = newx;
                    d.py = newy;
                    this.forceTick();
                    var g = d3.select(d.parentNode);
                    g.attr("transform", function (d) {
                        return "translate(" + newx + "," + newy + ")";
                    });
                };
                this.centeredNode = null;
                this.org_settings = settings;
                this.svg = d3.select(settings.svgHolder);
                this.svg.attr("pointer-events", "all");
                this.svg.attr("width", this.org_settings.size.width);
                this.svg.attr("height", this.org_settings.size.height);
                this.svg.on("click", function () {
                    _this.undoCenterNode();
                    _this.org_settings.clickHandler(null);
                });
                this.defs = this.svg.append("svg:defs");
                this.defs.append("svg:filter").attr("id", "blur").append("svg:feGaussianBlur").attr("stdDeviation", 1);

//                d3.select("#links").remove(); d3.select("#nodes").remove();
                
                this.linksG = this.svg.append("g").attr("id", "links").attr("class", "for_org");
                this.nodesG = this.svg.append("g").attr("id", "nodes").attr("class", "for_org");
                this.glowing = false;
                this.labelsVisible = true;
                this.guestbook = for_guestbook;
//                if (!this.guestbook && d3.select("#network").select("image")[0][0] == null) {
//                    this.svg.append("svg:image").attr("width", 250).attr("height", 35).attr("xlink:href", "/static/images/basic-url-logo.png").attr("x", 10).attr("y", 18).attr("opacity", 0.8);
//                }
            }
            OrgNetworkViz.prototype.updateNetwork = function (graph) {
                var _this = this;
                this.svg.on("click", function () {
                    _this.undoCenterNode();
                    _this.org_settings.clickHandler(null);
                });
                //remember centered node
                //var centeredNode = this.centeredNode;
                //undo centering
                //this.undoCenterNode();
                var centeredNode = null;
                this.filteredNodes = graph.org_nodes.filter(function (node) {
                    return !node.skip;
                });
                var idToNode2 = {};

                this.filteredNodes.forEach(function (node) {
                    if (_this.org_idToNode !== undefined && node.id in _this.org_idToNode) {
                        var oldNode = _this.org_idToNode[node.id];
                        if (oldNode === _this.centeredNode) {
                            centeredNode = node;
                        }
                        node['x'] = oldNode['x'];
                        node['px'] = oldNode['px'];
                        node['y'] = oldNode['y'];
                        node['py'] = oldNode['py'];
                    }
                    idToNode2[node.id] = node;
                    
                });
                this.org_idToNode = idToNode2;
                this.filteredLinks = graph.org_links.filter(function (link) {
                    return !link.skip && !link.source.skip && !link.target.skip;
                });
                this.filteredLinksToDraw = graph.org_links.filter(function (link) {
                    return !link.skip2draw && !link.skip && !link.source.skip && !link.target.skip;
                });
                if (centeredNode) {
                    this.draw(false);
                } else {
                    this.undoCenterNode();
                    this.draw(true);
                }

                //redo centering after network has been updated
                if (centeredNode) {
                    //console.log("previously centered node ", centeredNode.attr.contact.name)
                    this.centerNode(centeredNode);
                }
            };
            

            OrgNetworkViz.prototype.rescale = function () {
                var trans = d3.event.translate;
                var scale = d3.event.scale;
                this.svg.attr("transform", "translate(" + trans + ")" + " scale(" + scale + ")");
            };

            OrgNetworkViz.prototype.resume = function () {
                //this.force.stop();
                this.force.alpha(.15);
            };
            
            OrgNetworkViz.prototype.stop = function(){
                this.force.stop();
            }

            OrgNetworkViz.prototype.draw = function (live) {
                var _this = this;
                if (live === undefined) {
                    live = this.org_settings.forceParameters.live;
                }
                if (this.force !== undefined) {
                    this.force.stop();
                } else {
                    this.force = d3.layout.force(); 
                }
                this.force.size([this.org_settings.size.width, this.org_settings.size.height]);
                this.force.charge(this.org_settings.forceParameters.charge);
                this.force.linkDistance(this.org_settings.forceParameters.linkDistance);
                this.force.gravity(this.org_settings.forceParameters.gravity);
                this.force.friction(this.org_settings.forceParameters.friction);
                this.force.nodes(this.filteredNodes);
                this.force.links(this.filteredLinks);
                if (live) {
                    this.force.on("tick", function () {
                        return _this.forceTick();
                    });
                  
                }

                this.redraw();

                this.force.start();
                if (!live) {
                    for (var i = 0; i < 150; ++i) { 
                        this.force.tick();
                    }
                    this.force.stop();
                }
            };

            OrgNetworkViz.prototype.redraw = function () {
                this.drawOrgNodes();
                this.drawOrgLinks();
            };

            OrgNetworkViz.prototype.forceTick = function () {
                var _this = this;
                var tmp = function (node) {
                    return node.id;
                };
                this.nodeBind.attr("transform", function (node) {
                    var r = _this.org_settings.nodeSizeFunc(node.email_size); //node.member_size

                    //node.x += Math.random()*5 - 2.5;
                    //node.y += Math.random()*5 - 2.5;
                    node.x = Math.max(r, Math.min(_this.org_settings.size.width - r, node.x));
                    node.y = Math.max(r, Math.min(_this.org_settings.size.height - r - 17, node.y));
                    
                    return "translate(" + node.x + "," + node.y + ")";
                });//.style("transition-duration","0.5s").style("-webkit-transition-duration","0.5s");

                this.linkBind.attr("x1", function (link) {
                    return link.source.x;
                }).attr("y1", function (link) {
                    return link.source.y;
                }).attr("x2", function (link) {
                    return link.target.x;
                }).attr("y2", function (link) {
                    return link.target.y;
                });//.style("transition-duration","0.5s").style("-webkit-transition-duration","0.5s");
                
                //make nodes always on the top
//                text_order = this.nodesG.selectAll("use").data(this.filteredNodes, tmp);
                this.text_order.attr("transform", function (node) {
                    var r = _this.org_settings.nodeSizeFunc(node.email_size); //node.member_size

                    //node.x += Math.random()*5 - 2.5;
                    //node.y += Math.random()*5 - 2.5;
                    node.x = Math.max(r, Math.min(_this.org_settings.size.width - r, node.x));
                    node.y = Math.max(r, Math.min(_this.org_settings.size.height - r - 17, node.y));
                    return "translate(" + node.x + "," + node.y + ")"; 
                });//.style("transition-duration","0.5s").style("-webkit-transition-duration","0.5s");
            };

            OrgNetworkViz.prototype.clickNode = function (node) {
                //focus on the selectedNode
                var selectedNode = this.nodeBind.filter(function (d, i) {
                    return node === d;
                });
                var e = document.createEvent('UIEvents');
                e.initUIEvent('click', true, true, window, 1);
                selectedNode.node().dispatchEvent(e);
            };

            OrgNetworkViz.prototype.mouseoverNode = function (node) {
                //focus on the selectedNode
                var selectedNode = this.nodeBind.filter(function (d, i) {
                    return node === d;
                });
                var selectedTextOrder = this.text_order.filter(function (d, i) {
                    return node === d;
                });
                
                this.nodeBind.select(".nodelabeltext")//.transition()
                .style("opacity", function(){
                    if(VMail.App.viz.labelsVisible) return 0.15;
                    else return 0;
                });
                this.text_order//.transition()
                .style("opacity", function(){
                    if(VMail.App.viz.labelsVisible) return 0.15;
                    else return 0;
                });
                //change the looks of the circle
                selectedNode.select("circle")//.transition()
                      .attr("stroke-width", 3.0).style("stroke-width", 3.0).attr("stroke", "#555").style("opacity", "0.9").attr("fill", this.highlightedNodeColor); //.attr("stroke", "#333")

                //.attr("filter", (d) => {var verdict = this.glowing ? "url(#blur)" : "none"; return verdict;} )
                //change the looks of the text
                selectedNode.select(".nodelabeltext")//.transition()
                .style("visibility", "visible")
                        .style("opacity", 0.8).style("font-size", "25px").text(this.org_settings.nodeLabelFuncHover(node.name)); //.style("font-size", "20px")
                selectedTextOrder//.transition()
                .style("font-size", "25px");//.style("font-size", "20px")
                this.linkBind.style("stroke-opacity", 0).filter(function (link, i) {
                    return link.source === node || link.target === node;
                }).style("stroke-opacity", 0.5);
                
                //pack
//                var pack = d3.pack().size([_this.org_settings.nodeSizeFunc(node.member_size) * 2, _this.org_settings.nodeSizeFunc(node.member_size) * 2]);

                
            };

            OrgNetworkViz.prototype.mouseoutNode = function (node) {
                var _this = this;
                //console.log("mouseout:" + node.attr.contact.name);
                //focus on the selectedNode
                var selectedNode = this.nodeBind.filter(function (d, i) {
                    return node === d;
                });
                var selectedTextOrder = this.text_order.filter(function (d, i) {
                    return node === d;
                });
                
                if(VMail.App.centerNodeView == 0){
                    this.text_order//.transition()
                    .style("opacity", function(){
                        if(VMail.App.viz.labelsVisible) return 1;
                        else return 0;
                    });
                }
                this.nodeBind.select(".nodelabeltext")//.transition()
                .style("opacity", function(){
                    if(VMail.App.viz.labelsVisible) return 0.8;
                    else return 0;
                });
                
                selectedNode.select("circle")//.transition()
                .attr("stroke", this.baseNodeStrokeColor).attr("stroke-opacity", 1.0).attr("stroke-width", 0.5).style("stroke-width", 0.5).style("opacity", "0.8").attr("fill", function (d) {
                    if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                        if (_this.clustercolors) {
                            return _this.org_settings.colorFunc(node.attr);
                        } else {
                            return _this.baseNodeColor;
                        }
                    }
                    else if(VMail.App.colorMethod == 1){
//                            if(node.owns.length > 1){
                            var r = 0, g = 0, b = 0;
                            var nn = 0;
                            if(VMail.App.node_as_org == 1){
                                for(var cc = 0; cc < node.owns.length; cc++){
                                    if(node.owns[cc] != 0){ nn++;
                                        r += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(1, 3), 16);
                                        g += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(3, 5), 16);
                                        b += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(5, 7), 16);
                                    }
                                }
                            }
                            r /= nn; g /= nn; b /= nn; 
                            r = Math.round(r); g = Math.round(g); b = Math.round(b);
                            r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                            return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
//                            }
//                            else return _this.settings.colorPeopleFunc(node.owns[0]);
                    }
                });
                
                selectedNode.select("text")//.transition()
                .text(function (d) {
                    if(_this.org_settings.nodeSizeFunc(d.email_size) >= VMail.App.thresholdForOrgText){ return _this.org_settings.nodeLabelFunc(d.name);}
                    else{ return ""; }
                })
                .style("font-size", function(d){
                    if(_this.org_settings.nodeSizeFunc(d.email_size) >= VMail.App.thresholdForOrgText){ return _this.org_settings.textSizeFunc(d.email_size) + "px";}
                    else{ return 0; }
                }).style("visibility", function (d) {
                    if(_this.centeredNode === null && _this.org_settings.nodeSizeFunc(d.email_size) < _this.LABEL_THRESHOLD)
                        return "hidden";
                });
                selectedTextOrder//.transition()
                .style("font-size", function(d){
                    if(_this.org_settings.nodeSizeFunc(d.email_size) >= VMail.App.thresholdForOrgText){ return _this.org_settings.textSizeFunc(d.email_size);}
                    else{ return 0; }
                })
                .style("font-weight", "150")//.style("font-weight", "200")
                .style("visibility", function (d) {
                    if (_this.centeredNode === null && _this.org_settings.nodeSizeFunc(d.email_size) < _this.LABEL_THRESHOLD)
                        return "hidden";
                })
                .style("opacity", function(){
                    if(VMail.App.viz.labelsVisible) return 1;
                    else return 0;
                });
                this.linkBind.style("stroke-opacity", this.baseStrokeOpacity);
            };

            OrgNetworkViz.prototype.undoCenterNode = function () {
                var _this = this; VMail.App.centerNodeView = 0;
                if (d3.event) {
                    d3.event.stopPropagation();
                }

                // don't undo if there is noone centered
                
                if (this.centeredNode === null) {
                    return;
                }

                //un-highlight the node if uncentering
                this.mouseoutNode(this.centeredNode);

                var centerNode = this.centeredNode;

                // find the neighbors of the centered node (this takes o(1) time given the underlying graph structure)
                var neighbors = {};
                centerNode.links.forEach(function (link) {
                    if (link.skip || link.skip2draw || link.source.skip || link.target.skip) {
                        return;
                    }
                    if (link.source !== centerNode)
                        neighbors[link.source.id] = link.source;
                    if (link.target !== centerNode)
                        neighbors[link.target.id] = link.target;
                });

                // === ANIMATION CODE ===
                var centeringNodes = this.nodeBind.style("opacity", 1.0).style("pointer-events", 'all').filter(function (d2, i) {
                    return d2 === centerNode || d2.id in neighbors;
                });

                centeringNodes//.transition()
                .attr("transform", function (d, i) {
                    d.x = d.px;
                    d.y = d.py;
                    return "translate(" + d.x + "," + d.y + ")";
                });

                this.text_order.style("opacity", 1).filter(function (d2, i) {
                    return d2 === centerNode || d2.id in neighbors;
                })//.transition()
                .attr("transform", function (d, i) {
                    d.x = d.px;
                    d.y = d.py;
                    return "translate(" + d.x + "," + d.y + ")";
                }).style("visibility", 'visible');

                //return the original styles of the cirles of the centering nodes
                centeringNodes.select("circle").attr("stroke", this.baseNodeStrokeColor).attr("stroke-opacity", 0.8).attr("stroke-width", 1.0).attr("fill", function (node) {
                    if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                        if (_this.clustercolors) {
                            return _this.org_settings.colorFunc(node.attr);
                        } else {
                            return _this.baseNodeColor;
                        }
                    }
                    else if(VMail.App.colorMethod == 1){
//                            if(node.owns.length > 1){
                            var r = 0, g = 0, b = 0;
                            var nn = 0;
                            if(VMail.App.node_as_org == 1){
                                for(var cc = 0; cc < node.owns.length; cc++){
                                    if(node.owns[cc] != 0){ nn++;
                                        r += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(1, 3), 16);
                                        g += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(3, 5), 16);
                                        b += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(5, 7), 16);
                                    }
                                }
                            }
//                            else{
//                                for(var cc = 0; cc < node.owns.length; cc++){
//                                    if(node.owns[cc] != 0){
//                                        r += parseInt(_this.settings.colorPeopleFunc(cc).substring(1, 3), 16);
//                                        g += parseInt(_this.settings.colorPeopleFunc(cc).substring(3, 5), 16);
//                                        b += parseInt(_this.settings.colorPeopleFunc(cc).substring(5, 7), 16);
//                                    }
//                                }
//                            }
                            r /= nn; g /= nn; b /= nn; 
                            r = Math.round(r); g = Math.round(g); b = Math.round(b);
                            r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                            return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
//                            }
//                            else return _this.settings.colorPeopleFunc(node.owns[0]);
                    }
                });

                //return the original style and position of the text of the centering nodes
                centeringNodes.select(".nodelabeltext").attr("text-anchor", "middle").attr("dy", function (node) {
                    var shift = 0;
                    if(_this.org_settings.nodeSizeFunc(node.email_size) >= VMail.App.thresholdForOrgText){ shift = _this.org_settings.textSizeFunc(node.email_size) / 2;}
                    return shift - 2;
                }).attr("dx", '0em').attr("transform", null).style("visibility", function (node) {
                    if (_this.org_settings.nodeSizeFunc(node.email_size) < _this.LABEL_THRESHOLD)
                        return "hidden";
                });

                this.linkBind.style("opacity", 1.0).filter(function (link, i) {
                    return link.source === centerNode || link.target === centerNode;
                })//.transition()
                .attr("x1", function (link) {
                    return link.source.x;
                }).attr("y1", function (link) {
                    return link.source.y;
                }).attr("x2", function (link) {
                    return link.target.x;
                }).attr("y2", function (link) {
                    return link.target.y;
                });
                
                //uncenter the node
                this.centeredNode = null;
            };

            OrgNetworkViz.prototype.centerNode = function (centerNode) {
                var _this = this;
                // stop any animation before animating the "centering"
                this.force.stop();

                //un-highlight the node
                //this.mouseoutNode(centerNode);
                if (this.centeredNode === centerNode) {
                    this.undoCenterNode();
                    return;
                }
                this.undoCenterNode();
                VMail.App.centerNodeView = 1;
                // remember the centered node
                this.centeredNode = centerNode;

                // store all the neighbors of the centered node (neighbors are found in O(1) time from the graph data structure)
                var neighbors = {};
                var nneighbors = 0;
                centerNode.links.forEach(function (link) {
                    if (link.skip || link.skip2draw || link.source.skip || link.target.skip) {
                        return;
                    } else {
                        nneighbors += 1;
                    }
                    if (link.source !== centerNode)
                        neighbors[link.source.id] = link.source;
                    if (link.target !== centerNode)
                        neighbors[link.target.id] = link.target;
                });

                // radius of the "centering" circle
                var radius = 250;
                var angle = (2 * Math.PI) / nneighbors;

                //  ===COORDINATES COMPUTATION CODE===
                //  ---center node---
                //store old coordinates. Need them when we undo the centering to return objects to their original position.
                centerNode.px = centerNode.x;
                centerNode.py = centerNode.y;
                centerNode.x = this.org_settings.size.width / 2.0;
                centerNode.y = this.org_settings.size.height / 2.0;

                //  ---neighboring nodes---
                var idx = 0;
                var neighbors_array = [];
                for (var id in neighbors) {
                    neighbors_array.push(neighbors[id]);
                }
                neighbors_array.sort(function (na, nb) {//herehere
//                    return a.attr.color - b.attr.color;
                    if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                        if (_this.clustercolors) {
                            return na.attr.color - nb.attr.color;
//                            return _this.org_settings.colorFunc(na.attr) - _this.org_settings.colorFunc(b.attr);
                        } else {
                            return 0;
                        }
                    }
                    else if(VMail.App.colorMethod == 1){
                        var r = 0, g = 0, b = 0;
                        var nn = 0;
                        if(VMail.App.node_as_org == 1){
                            for(var cc = 0; cc < na.owns.length; cc++){
                                if(na.owns[cc] != 0){ nn++;
                                    r += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(1, 3), 16);
                                    g += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(3, 5), 16);
                                    b += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(5, 7), 16);
                                }
                            }
                        }
                        r /= nn; g /= nn; b /= nn; 
                        //r = Math.round(r); g = Math.round(g); b = Math.round(b);
                        var color1 = r * 256 + g + b / 256;

                        r = 0; g = 0; b = 0; nn = 0;
                        if(VMail.App.node_as_org == 1){
                            for(var cc = 0; cc < nb.owns.length; cc++){
                                if(nb.owns[cc] != 0){ nn++;
                                    r += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(1, 3), 16);
                                    g += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(3, 5), 16);
                                    b += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(5, 7), 16);
                                }
                            }
                        }
                        r /= nn; g /= nn; b /= nn; 
                        //r = Math.round(r); g = Math.round(g); b = Math.round(b);
                        var color2 = r * 256 + g + b / 256;

                        return color1 - color2;
                    }
                });

                for (var id in neighbors_array) {
                    var node = neighbors_array[id];
                    node.px = node.x;
                    node.py = node.y;
                    node.x = centerNode.x + radius * Math.cos(idx * angle);
                    node.y = centerNode.y + radius * Math.sin(idx * angle);
                    node.angle = idx * angle;
                    idx += 1;
                }
                this.neighbors_num = neighbors_array.length - 1;

                // === ANIMATION CODE ===
                // ---neighboring nodes---
                this.nodeBind.style("opacity", 0.05).style("pointer-events", 'none').filter(function (d2, i) {
                    return d2.id in neighbors;
                }).style("opacity", 1.0)//.transition()
                .style("pointer-events", 'all').attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).select(".nodelabeltext").attr("text-anchor", function (d, i) {
                    var ang = 180 * d.angle / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return "end";
                    }
                    return "start";
                }).attr("dx", function (d, i) {
                    var ang = 180 * d.angle / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return -_this.org_settings.nodeSizeFunc(d.email_size) - 10;
                    }
                    return _this.org_settings.nodeSizeFunc(d.email_size) + 10;
                }).attr("dy", function (d, i) {
                    return 5;
                }).attr("transform", function (d, i) {
                    var ang = 180 * d.angle / Math.PI;
                    if (ang > 90 && ang < 270) {
                        return "rotate(" + ang + " 0 0) scale(-1,-1)";
                    }
                    return "rotate(" + ang + " 0 0)";
                }).style("visibility", null);

                //---center node---
                var tmp = this.nodeBind.filter(function (d2, i) {
                    return d2 === centerNode;
                });
                
                this.text_order.style("opacity", 0.05).filter(function (d2, i) {
                    return d2.id in neighbors;
                }).style("opacity", 1)//.transition()
                .attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).style("visibility", 'hidden');

                //make the center node fully vizible
                tmp.select(".nodelabeltext").style("opscity", 0.8).style("visibility", null);
                tmp.style("opacity", 1.0)//.transition()
                .style("pointer-events", 'all').attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).select("circle").attr("stroke-width", 3.0).attr("stroke", "#000").attr("fill", this.highlightedNodeColor);

                this.text_order.filter(function (d2, i) {
                    return d2 === centerNode;
                }).attr("transform", function (d, i) {
                    return "translate(" + d.x + "," + d.y + ")";
                }).style("visibility", 'hidden');
                
                //un-highlight the node
                this.mouseoutNode(centerNode);

                //---links---
                this.linkBind.style("opacity", 0).filter(function (link, i) {
                    return link.source === centerNode || link.target === centerNode;
                }).style("opacity", 1.0)//.transition()
                .attr("x1", function (link) {
                    return link.source.x;
                }).attr("y1", function (link) {
                    return link.source.y;
                }).attr("x2", function (link) {
                    return link.target.x;
                }).attr("y2", function (link) {
                    return link.target.y;
                });
            };

            OrgNetworkViz.prototype.recolorNodes = function () {
                var _this = this;
                if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                    if (this.clustercolors) {
                        this.nodeBind.select("circle").transition().duration(750).attr("fill", function (node) {
                            return _this.org_settings.colorFunc(node.attr);//modify later
                        });
                    } else {
                        this.nodeBind.select("circle").transition().duration(750).attr("fill", function (node) {
                            return _this.baseNodeColor;
                        });
                    }
                }
                else if(VMail.App.colorMethod == 1){
//                            if(node.owns.length > 1){
                    this.nodeBind.select("circle").transition().duration(750).attr("fill", function (node) {
                        var r = 0, g = 0, b = 0;
                        var nn = 0;
                        if(VMail.App.node_as_org == 1){
                            for(var cc = 0; cc < node.owns.length; cc++){
                                if(node.owns[cc] != 0){ nn++;
                                    r += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(1, 3), 16);
                                    g += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(3, 5), 16);
                                    b += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(5, 7), 16);
                                }
                            }
                        }
//                        else{
//                            for(var cc = 0; cc < node.owns.length; cc++){
//                                if(node.owns[cc] != 0){
//                                    r += parseInt(_this.settings.colorPeopleFunc(cc).substring(1, 3), 16);
//                                    g += parseInt(_this.settings.colorPeopleFunc(cc).substring(3, 5), 16);
//                                    b += parseInt(_this.settings.colorPeopleFunc(cc).substring(5, 7), 16);
//                                }
//                            }
//                        }
                        r /= nn; g /= nn; b /= nn; 
                        r = Math.round(r); g = Math.round(g); b = Math.round(b);
                        r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                        return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
                    });
                }
            
//                if (this.clustercolors) {
//                    this.nodeBind.select("circle").transition().duration(750).attr("fill", function (node) {
//                        return _this.org_settings.colorFunc(node.attr);//modify later
//                    });
//                } else {
//                    this.nodeBind.select("circle").attr("fill", function(node){
//                        return this.baseNodeColor;
//                    });
//                }
            };

            OrgNetworkViz.prototype.glowNodes = function () {
                if (!this.glowing) {
                    this.nodeBind.select("circle").transition().style("filter", "url(#blur)");
                    this.glowing = true;
                } else {
                    this.nodeBind.select("circle").transition().style("filter", "none");
                    this.glowing = false;
                }
            };

            OrgNetworkViz.prototype.toggleLabelVisibility = function () {
                if (this.labelsVisible) {
                    this.nodeBind.select("text").transition().style("opacity", 0);
                    this.text_order.transition().style("opacity", 0);
                    this.labelsVisible = false;
                } else {
                    console.log('displaying labels..');
                    this.nodeBind.select("text").transition().style("opacity", 0.8);
                    this.text_order.transition().style("opacity", 1);
                    this.labelsVisible = true;
                }
            };

            OrgNetworkViz.prototype.drawOrgNodes = function () {
                var _this = this;
                var tmp = function (node) {
                    return node.id;
                };
                this.nodeBind = this.nodesG.selectAll("g.node").data(this.filteredNodes, tmp);
                //console.log(this.filteredNodes);
                if (this.guestbook) {
                    var filteredNodes_length = this.filteredNodes.length;
                    for (var u = 0; u < filteredNodes_length; u++) {
//                        if (this.filteredNodes[u].attr.contact.userinfo.picture !== undefined)
//                            var picurl = this.filteredNodes[u].attr.contact.userinfo.picture;
//                        else
//                            var picurl = '/static/images/default_user_pic.jpg';
//                        this.defs.append("pattern").attr("id", this.filteredNodes[u].attr.contact.userinfo.id + '_pic').attr('patternUnits', 'userSpaceOnUse').attr("width", 50).attr("height", 50).attr('x', -25).attr('y', 25).append('svg:image').attr('xlink:href', picurl).attr("width", 50).attr("height", 50).attr('x', 0).attr('y', 0);
                        
                        var picurl = '/static/images/default_user_pic.jpg';
                        this.defs.append("pattern").attr("id", this.filteredNodes[u].attr.contact.userinfo.id + '_pic').attr('patternUnits', 'userSpaceOnUse').attr("width", 50).attr("height", 50).attr('x', -25).attr('y', 25).append('svg:image').attr('xlink:href', picurl).attr("width", 50).attr("height", 50).attr('x', 0).attr('y', 0);
                    }
                }

                //update
                this.nodeBind.attr("transform", function (node) {
                    return "translate(" + node.x + "," + node.y + ")"; //maybe an error here
                });
                var circles = this.nodeBind.select("circle");
                circles.transition().duration(1000).attr("r", function (node) {
                    return _this.org_settings.nodeSizeFunc(node.email_size);
                }).attr("fill", function (node) {
                    if (!_this.guestbook) {
                        if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                            if (_this.clustercolors) {
                                return _this.org_settings.colorFunc(node.attr);
                            } else {
                                return _this.baseNodeColor;
                            }
                        }
                        else if(VMail.App.colorMethod == 1){
//                            if(node.owns.length > 1){
                                var r = 0, g = 0, b = 0;
                                var nn = 0;
                                if(VMail.App.node_as_org == 1){
                                    for(var cc = 0; cc < node.owns.length; cc++){
                                        if(node.owns[cc] != 0){ nn++;
                                            r += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(1, 3), 16);
                                            g += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(3, 5), 16);
                                            b += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(5, 7), 16);
                                        }
                                    }
                                }
//                                else{
//                                    for(var cc = 0; cc < node.owns.length; cc++){
//                                        if(node.owns[cc] != 0){
//                                            r += parseInt(_this.settings.colorPeopleFunc(cc).substring(1, 3), 16);
//                                            g += parseInt(_this.settings.colorPeopleFunc(cc).substring(3, 5), 16);
//                                            b += parseInt(_this.settings.colorPeopleFunc(cc).substring(5, 7), 16);
//                                        }
//                                    }
//                                }
                                r /= nn; g /= nn; b /= nn; 
                                r = Math.round(r); g = Math.round(g); b = Math.round(b);
                                r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                                return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
//                            }
//                            else return _this.settings.colorPeopleFunc(node.owns[0]);
                        }
                    }else {
                        return "url(#" + node.attr.contact.userinfo.id + "_pic)";
                    }
                });

                var labels = this.nodeBind.select(".nodelabeltext");
                labels.transition().style("visibility", function (node) {
                    if (_this.org_settings.nodeSizeFunc(node.email_size) < _this.LABEL_THRESHOLD)
                        return "hidden";
                }).attr("dy", function (node) {
                    return _this.org_settings.nodeSizeFunc(node.email_size) + 15;
                }).attr("dx", '0em')
                .style("font-size", function(node){
                    if(_this.org_settings.nodeSizeFunc(node.email_size) >= VMail.App.thresholdForOrgText){ return _this.org_settings.textSizeFunc(node.email_size);}
                    else{ return null; }
                });

                //enter
                var enteringNodes = this.nodeBind.enter().append("g");
                enteringNodes.attr("class", "node").attr("id", function (node) {
                    return node.id;
                });

                enteringNodes.attr("transform", function (node) {//if(typeof(node.x)=="undefined") console.log(node.px);
                    return "translate(" + node.x + "," + node.y + ")"; //maybe an error here
                });
                
                this.text_order = this.nodesG.selectAll("use").data(this.filteredNodes, tmp);
                this.text_order.attr("transform", function (node) {
                    return "translate(" + node.x + "," + node.y + ")"; //maybe an error here
                });
                var enteringUses = this.text_order.enter().append("use");
                enteringUses.attr("id", "use");

                enteringUses.attr("transform", function (node) {
                    return "translate(" + node.x + "," + node.y + ")"; 
                });
                
                if (!this.guestbook) {
                    if (this.org_settings.clickHandler !== undefined) {
                        enteringNodes.on("click.1", this.org_settings.clickHandler);
                        enteringNodes.on("click.centerNode", function (d, i) {
                            _this.centerNode(d);
                        });
                    }
                }

                var circles = enteringNodes.append("circle");
                circles.attr("r", function (node) {
                    return _this.org_settings.nodeSizeFunc(node.email_size);
                });
                circles.attr("fill", function (node, i) {
                    if (!_this.guestbook) {
                        if(VMail.App.type != "multi" || VMail.App.colorMethod == 2){
                            if (_this.clustercolors) {
                                return _this.org_settings.colorFunc(node.attr);
                            } else {
                                return _this.baseNodeColor;
                            }
                        }
                        else if(VMail.App.colorMethod == 1){
//                            if(node.owns.length > 1){
                                var r = 0, g = 0, b = 0;
                                var nn = 0;
                                if(VMail.App.node_as_org == 1){ 
                                    for(var cc = 0; cc < node.owns.length; cc++){
                                        if(node.owns[cc] != 0){ nn++;
                                            r += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(1, 3), 16);
                                            g += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(3, 5), 16);
                                            b += parseInt(_this.org_settings.colorPeopleFunc(cc).substring(5, 7), 16);
                                        }
                                    }
                                }
//                                else{
//                                    for(var cc = 0; cc < node.owns.length; cc++){
//                                        if(node.owns[cc] != 0){
//                                            r += parseInt(_this.settings.colorPeopleFunc(cc).substring(1, 3), 16);
//                                            g += parseInt(_this.settings.colorPeopleFunc(cc).substring(3, 5), 16);
//                                            b += parseInt(_this.settings.colorPeopleFunc(cc).substring(5, 7), 16);
//                                        }
//                                    }
//                                }
                                r /= nn; g /= nn; b /= nn; 
                                r = Math.round(r); g = Math.round(g); b = Math.round(b);
                                r = r.toString(16); g = g.toString(16); b = b.toString(16); 
                                return "#" + (r.length == 1 ? "0" + r : r) + (g.length == 1 ? "0" + g : g) + (b.length == 1 ? "0" + b : b);
//                            }
//                            else return _this.settings.colorPeopleFunc(node.owns[0]);
                        }
                    } else {
                        return "url(#" + node.attr.contact.userinfo.id + "_pic)";
                    }
                });
                circles.style("opacity", "0.8").attr("stroke", this.baseNodeStrokeColor).attr("stroke-opacity", 1).attr("stroke-width", 0.5);
                

                //.style("filter", () => {var verdict = this.glowing ? "url(#blur)" : "none"; return verdict;} )
                if (!this.guestbook) {
                    circles.on("mouseover", function (d, i) {
                        _this.mouseoverNode(d);
                    }).on("mouseout.1", function (d, i) {
                        _this.mouseoutNode(d);
                    }).call(d3.behavior.drag().on("drag", function (node) {
                        return _this.moveContact(node);
                    }));
                }
                
                enteringNodes.append("text").attr("id", function(node){ return "text_org_" + node.id; }).attr("text-anchor", "middle").attr("dy", function (node) {
                    var shift = 0;
                    if(_this.org_settings.nodeSizeFunc(node.email_size) >= VMail.App.thresholdForOrgText){ shift = _this.org_settings.textSizeFunc(node.email_size) / 2;}
                    return shift - 2;//_this.org_settings.nodeSizeFunc(node.attr);
//                    return _this.org_settings.nodeSizeFunc(node.attr) + 13;
                }).attr("dx", '0em').attr("class", "nodelabeltext").style("visibility", function (node) {
                    if (_this.org_settings.nodeSizeFunc(node.email_size) < _this.LABEL_THRESHOLD)
                        return "hidden";
                }).style("font-size", function(node){
                    if(_this.org_settings.nodeSizeFunc(node.email_size) >= VMail.App.thresholdForOrgText){ return _this.org_settings.textSizeFunc(node.email_size);}
                    else{ return null; }
                }).attr("fill", this.baseLabelColor)
                .style("opacity", function(){
                    if(VMail.App.viz.labelsVisible){ return 0.8; }
                    else{ return 0; }
                })
                .style("pointer-events", 'none').text(function (node) {
                    if(_this.org_settings.nodeSizeFunc(node.email_size) >= VMail.App.thresholdForOrgText){ return _this.org_settings.nodeLabelFunc(node.name);}
                    else{ return ""; }
                });
                
                enteringUses.style("opacity", function(){
                    if(VMail.App.viz.labelsVisible){ return 1; }
                    else{ return 0; }
                });
                enteringUses.attr("xlink:href", function(node){ return "#text_org_" + node.id; });
                
//                    this.nodesG.selectAll("use").data(this.filteredNodes, tmp).enter().append("use")
//                    .attr("id","use").attr("xlink:href", function(node){ return "#text_org_" + node.id; })
//                    .attr("transform", function (node) {
//                        setTimeout(function(){
//                        return (d3.select("body").select("#network").select("#nodes").select('[id="' + node.id + '"]').attr("transform"));
//                        }, 20);
////                        return "translate(" + node.px + "," + node.py + ")"; 
//                    });
                    //exit
                    this.nodeBind.exit().remove();
                    this.text_order.exit().remove();
                

                
            };

            OrgNetworkViz.prototype.showLabel = function (radius) {
                return (radius < 5);
            };

            OrgNetworkViz.prototype.drawOrgLinks = function () {
                var _this = this;
                var tmp = function (link) {
                    return link.source.id + "#" + link.target.id;
                };
                this.linkBind = this.linksG.selectAll("line.link").data(this.filteredLinksToDraw, tmp);
                var sizeExtent = d3.extent(this.filteredLinksToDraw, function (link) {
                    return link.weight;
                });

                //var linkWidth = d3.scale.linear();
                //linkWidth.range([this.org_settings.linkWidthPx.min, this.org_settings.linkWidthPx.max]);
                //linkWidth.domain(sizeExtent);
                //update
                this.linkBind.attr("stroke-width", function (link) {
                    return _this.org_settings.linkSizeFunc(link.weight);
                });
                this.linkBind.attr("x1", function (link) {
                    return link.source.x;
                });
                this.linkBind.attr("y1", function (link) {
                    return link.source.y;
                });
                this.linkBind.attr("x2", function (link) {
                    return link.target.x;
                });
                this.linkBind.attr("y2", function (link) {
                    return link.target.y;
                });

                //enter
                var lines = this.linkBind.enter().append("line");
                lines.attr("class", "link");
                lines.attr("stroke", this.baseStrokeColor);
                lines.attr("stroke-opacity", this.baseStrokeOpacity);
                lines.attr("stroke-width", function (link) {
                    return _this.org_settings.linkSizeFunc(link.weight);
                });
                lines.attr("x1", function (link) {
                    return link.source.x;
                });
                lines.attr("y1", function (link) {
                    return link.source.y;
                });
                lines.attr("x2", function (link) {
                    return link.target.x;
                });
                lines.attr("y2", function (link) {
                    return link.target.y;
                });

                //exit
                this.linkBind.exit().remove();
            };
            return OrgNetworkViz;
        })();
        Viz.OrgNetworkViz = OrgNetworkViz;

        Viz.plotIntroductionTrees = function (trees) {
            trees.forEach(function (root) {
                if (root.father !== undefined || root.children === undefined || root.children.length === 0) {
                    return;
                }
                var width = 300;
                var height = 400;

                var cluster = d3.layout.cluster().size([height, width - 180]);

                var diagonal = d3.svg.diagonal().projection(function (d) {
                    return [d.y, d.x];
                });

                var svg = d3.select("body").append("svg").attr("class", "introductions").attr("width", width).attr("height", height).append("g").attr("transform", "translate(100,0)");

                var nodes = cluster.nodes(root), links = cluster.links(nodes);

                var link = svg.selectAll(".link").data(links).enter().append("path").attr("class", "link").attr("d", diagonal);

                var node = svg.selectAll(".node").data(nodes).enter().append("g").attr("class", "node").attr("transform", function (d) {
                    return "translate(" + d.y + "," + d.x + ")";
                });

                node.append("circle").attr("r", 4.5);

                node.append("text").attr("dx", function (d) {
                    return d.children ? -8 : 8;
                }).attr("dy", 3).style("text-anchor", function (d) {
                    return d.children ? "end" : "start";
                }).text(function (d) {
                    return d.contact.name;
                });

                d3.select(self.frameElement).style("height", height + "px");
            });
        };

        Viz.plotTimeHistogram = function (timestamps, settings) {
            if (timestamps === undefined || timestamps.length === 0) {
                return;
            }
            var margin = { top: 20, right: 20, bottom: 50, left: 50 };
            var width = settings.width - margin.left - margin.right;
            var height = settings.height - margin.top - margin.bottom;

            //bin the events
            var firstTime = timestamps[0].date;
            if (settings.start !== undefined) {
                firstTime = settings.start;
            }

            var lastTime = timestamps[timestamps.length - 1].date;
            if (settings.end !== undefined) {
                lastTime = settings.end;
            }
            var binDates = settings.interval.range(settings.interval.floor(firstTime), lastTime);
            var scale = d3.time.scale().domain(binDates).rangeRound(d3.range(0, binDates.length));
            var dataset = new Array(binDates.length);
            for (var i = 0; i < dataset.length; i++) {
                dataset[i] = 0;
            }
            for (var i = 0; i < timestamps.length; i++) {
                var tmp = scale(settings.interval.floor(timestamps[i].date));
                if (tmp < 0 || tmp >= binDates.length) {
                    continue;
                }
                ;
                dataset[tmp] += timestamps[i].weight;
            }

            var barPadding = 1;
            var barHeight = d3.scale.linear();

            if (settings.prediction) {
                var timespan = (new Date().getTime() - settings.interval.floor(new Date())) / (settings.interval.ceil(new Date()) - settings.interval.floor(new Date()));
                var prediction = dataset[dataset.length - 1] * ((1 - timespan) / timespan);
            }

            barHeight.domain([0, d3.max(dataset.concat(prediction + dataset[dataset.length - 1]))]);
            barHeight.range([height, 0]);

            //Create SVG element
            var svg = settings.position.append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            /*
            var tmpScale = d3.time.scale()
            .domain([firstTime, lastTime])
            .range([0, width]);
            
            */
            // Draw X-axis grid lines
            svg.append("line").attr("x1", 0).attr("x2", width).attr("y1", height).attr("y2", height).attr("stroke", "black").attr("stroke-width", '1px');

            var tickEvery = dataset.length / settings.nTicks;
            var t = svg.selectAll("axistext").data(binDates.filter(function (d, i) {
                return Math.floor(i / tickEvery) > Math.floor((i - 1) / tickEvery);
            })).enter().append("g").attr("class", "axistext");
            t.append("text").attr('text-anchor', 'middle').attr("x", function (d, i) {
                return (Math.ceil(i * tickEvery) + 0.5) * (width / dataset.length);
            }).attr("y", height + 20).text(function (d, i) {
                return d3.time.format(settings.dateformat)(d);
            });
            t.append("line").attr("x1", function (d, i) {
                return (Math.ceil(i * tickEvery) + 0.5) * (width / dataset.length);
            }).attr("x2", function (d, i) {
                return (Math.ceil(i * tickEvery) + 0.5) * (width / dataset.length);
            }).attr("y1", height).attr("y2", height + 6).attr("stroke", "black").attr("stroke-width", '1px');

            //var xAxis = d3.svg.axis()
            //.scale(scale)
            //.ticks(10)
            //.tickFormat(d3.time.format('%b'));
            //.tickFormat(timeformatter);
            //.orient("bottom");
            //.tickSize(-100)
            //.tickSubdivide(true);
            var yAxis = d3.svg.axis().scale(barHeight).ticks(5).orient("left");

            svg.selectAll("rect").data(dataset).enter().append("rect").attr("x", function (d, i) {
                return i * (width / dataset.length);
            }).attr("y", function (d) {
                return barHeight(d);
            }).attr("width", (width / dataset.length - barPadding)<0.5? 0.5:(width / dataset.length - barPadding)).attr("height", function (d) {
                return height - barHeight(d);
            });

            if (settings.prediction) {
                svg.append("rect").style("fill", "gray").attr("x", function () {
                    return (dataset.length - 1) * (width / dataset.length);
                }).attr("y", function () {
                    return barHeight(dataset[dataset.length - 1]) - (height - barHeight(prediction));
                }).attr("width", (width / dataset.length - barPadding)<0.5? 0.5:(width / dataset.length - barPadding)).attr("height", function () {
                    return height - barHeight(prediction);
                });
            }

            svg.append("g").attr("class", "axis").attr("transform", "translate(0," + height + ")");

            //.call(xAxis);
            svg.append("g").attr("class", "axis").append("text").attr("text-anchor", "left").attr("x", -30).attr("y", -10).attr("class", "histogram_title").text(settings.ylabel);

            svg.append("g").attr("class", "axis").call(yAxis);
            //.append("text")
            //.attr("class", "y label")
            //.attr("text-anchor", "end")
            //.attr("y", -50)
            //.attr("dy", "0")
            //.attr("transform", "rotate(-90)")
            //.text(settings.ylabel);
        };
        
        Viz.plotAccumuTimeHistogram = function (timestamps, settings) {
            if (timestamps === undefined || timestamps.length === 0) {
                return;
            }
            var margin = { top: 20, right: 20, bottom: 50, left: 50 };
            var width = settings.width - margin.left - margin.right;
            var height = settings.height - margin.top - margin.bottom;

            //bin the events
            var firstTime = (timestamps[0].length > 0? timestamps[0][0].date : timestamps[1][0].date);
            for(var i1 = 1; i1 < timestamps.length; i1++){
                if(timestamps[i1][0].date < firstTime) firstTime = timestamps[i1][0].date;
            }
            if (settings.start !== undefined) {
                firstTime = settings.start;
            }

            var lastTime = (timestamps[0].length > 0? timestamps[0][timestamps[0].length - 1].date : timestamps[1][timestamps[1].length - 1].date);
            for(var i1 = 1; i1 < timestamps.length; i1++){
                if(timestamps[i1][timestamps[i1].length - 1].date > lastTime) lastTime = timestamps[i1][timestamps[i1].length - 1].date;
            }
            if (settings.end !== undefined) {
                lastTime = settings.end;
            }
            var binDates = settings.interval.range(settings.interval.floor(firstTime), lastTime);
            var scale = d3.time.scale().domain(binDates).rangeRound(d3.range(0, binDates.length));
            var dataset = new Array(binDates.length);
            for (var i = 0; i < dataset.length; i++) {
                dataset[i] = 0;
            }
            for (var i1 = 0; i1 < timestamps.length; i1++) {
                for (var i = 0; i < timestamps[i1].length; i++) {
                    var tmp = scale(settings.interval.floor(timestamps[i1][i].date));
                    if (tmp < 0 || tmp >= binDates.length) {
                        continue;
                    }
                    
                    dataset[tmp] += timestamps[i1][i].weight;
                }
            }

            var barPadding = 1;
            var barHeight = d3.scale.linear();

            if (settings.prediction) {
                var timespan = (new Date().getTime() - settings.interval.floor(new Date())) / (settings.interval.ceil(new Date()) - settings.interval.floor(new Date()));
                var prediction = dataset[dataset.length - 1] * ((1 - timespan) / timespan);
            }

            barHeight.domain([0, d3.max(dataset.concat(prediction + dataset[dataset.length - 1]))]);
            barHeight.range([height, 0]);

            //Create SVG element
            var svg = settings.position.append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            /*
            var tmpScale = d3.time.scale()
            .domain([firstTime, lastTime])
            .range([0, width]);
            
            */
            // Draw X-axis grid lines
            svg.append("line").attr("x1", 0).attr("x2", width).attr("y1", height).attr("y2", height).attr("stroke", "black").attr("stroke-width", '1px');

            var tickEvery = dataset.length / settings.nTicks;
            var t = svg.selectAll("axistext").data(binDates.filter(function (d, i) {
                return Math.floor(i / tickEvery) > Math.floor((i - 1) / tickEvery);
            })).enter().append("g").attr("class", "axistext");
            t.append("text").attr('text-anchor', 'middle').attr("x", function (d, i) {
                return (Math.ceil(i * tickEvery) + 0.5) * (width / dataset.length);
            }).attr("y", height + 20).text(function (d, i) {
                return d3.time.format(settings.dateformat)(d);
            });
            t.append("line").attr("x1", function (d, i) {
                return (Math.ceil(i * tickEvery) + 0.5) * (width / dataset.length);
            }).attr("x2", function (d, i) {
                return (Math.ceil(i * tickEvery) + 0.5) * (width / dataset.length);
            }).attr("y1", height).attr("y2", height + 6).attr("stroke", "black").attr("stroke-width", '1px');

            //var xAxis = d3.svg.axis()
            //.scale(scale)
            //.ticks(10)
            //.tickFormat(d3.time.format('%b'));
            //.tickFormat(timeformatter);
            //.orient("bottom");
            //.tickSize(-100)
            //.tickSubdivide(true);
            var yAxis = d3.svg.axis().scale(barHeight).ticks(5).orient("left");

            svg.selectAll("rect").data(dataset).enter().append("rect").attr("x", function (d, i) {
                return i * (width / dataset.length);
            }).attr("y", function (d) {
                return barHeight(d);
            }).attr("width", (width / dataset.length - barPadding)<0.5? 0.5:(width / dataset.length - barPadding)).attr("height", function (d) {
                return height - barHeight(d);
            });

            if (settings.prediction) {
                svg.append("rect").style("fill", "gray").attr("x", function () {
                    return (dataset.length - 1) * (width / dataset.length);
                }).attr("y", function () {
                    return barHeight(dataset[dataset.length - 1]) - (height - barHeight(prediction));
                }).attr("width", (width / dataset.length - barPadding)<0.5? 0.5:(width / dataset.length - barPadding)).attr("height", function () {
                    return height - barHeight(prediction);
                });
            }

            svg.append("g").attr("class", "axis").attr("transform", "translate(0," + height + ")");

            //.call(xAxis);
            svg.append("g").attr("class", "axis").append("text").attr("text-anchor", "left").attr("x", -30).attr("y", -10).attr("class", "histogram_title").text(settings.ylabel);

            svg.append("g").attr("class", "axis").call(yAxis);
            //.append("text")
            //.attr("class", "y label")
            //.attr("text-anchor", "end")
            //.attr("y", -50)
            //.attr("dy", "0")
            //.attr("transform", "rotate(-90)")
            //.text(settings.ylabel);
        };
        
        Viz.plotAnaCharts = function (data, settings) {
            if (data === undefined || data.length === 0) {
                return;
            }
            var margin = { top: 20, right: 20, bottom: 50, left: 50 };
            var width = settings.width - margin.left - margin.right;
            var height = settings.height - margin.top - margin.bottom;

            //bin the events
            var firstTime = VMail.App.timeline[0];
            if (settings.start !== undefined) {
                firstTime = settings.start;
            }

            var lastTime = VMail.App.timeline[VMail.App.timeline.length - 1];
            if (settings.end !== undefined) {
                lastTime = settings.end;
            }
            var binDates = settings.interval.range(settings.interval.floor(firstTime), lastTime);
            var scale = d3.time.scale().domain(d3.extent(data, function(d, i) { return VMail.App.timeline[i]; }));
//            var dataset = new Array(binDates.length);
//            for (var i = 0; i < dataset.length; i++) {
//                dataset[i] = 0;
//            }
//            for (var i = 0; i < data.length; i++) {
//                var tmp = scale(settings.interval.floor(VMail.App.timeline[i]));
//                if (tmp < 0 || tmp >= binDates.length) {
//                    continue;
//                }
//                ;
//                dataset[tmp] += data[i];
//            }

            var barPadding = 1;
            var barHeight = d3.scale.linear();

            barHeight.domain([0, d3.max(data)]);
            barHeight.range([height, 0]);

            //Create SVG element
            var svg = settings.position.append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            /*
            var tmpScale = d3.time.scale()
            .domain([firstTime, lastTime])
            .range([0, width]);
            
            */
            // Draw X-axis grid lines
            svg.append("line").attr("x1", 0).attr("x2", width).attr("y1", height).attr("y2", height).attr("stroke","rgb(240,240,240)").attr("stroke-width", '1px');
            
            //for merge time
            for(var ii = 0; ii < VMail.App.mergeTime.length; ii++)
                svg.append("line").attr("x1", scale(VMail.App.mergeTime[ii]) * width).attr("x2", scale(VMail.App.mergeTime[ii]) * width).attr("y1", 0).attr("y2", height).attr("stroke","rgb(230, 10, 10)").attr("stroke-width", '1px');
            
            var tickEvery = data.length / settings.nTicks;
            var t = svg.selectAll("axistext").data(binDates.filter(function (d, i) {
                return Math.floor(i / tickEvery) > Math.floor((i - 1) / tickEvery);
            })).enter().append("g").attr("class", "axistext");
            t.append("text").attr('text-anchor', 'middle').attr("x", function (d, i) {
                return (Math.ceil(i * tickEvery) + 0.5) * (width / data.length);
            }).attr("y", height + 20).text(function (d, i) {
                return d3.time.format(settings.dateformat)(d);
            }).attr("stroke","rgb(240,240,240)");
            t.append("line").attr("x1", function (d, i) {
                return (Math.ceil(i * tickEvery) + 0.5) * (width / data.length);
            }).attr("x2", function (d, i) {
                return (Math.ceil(i * tickEvery) + 0.5) * (width / data.length);
            }).attr("y1", height).attr("y2", height + 6).attr("stroke","rgb(240,240,240)").attr("stroke-width", '1px');

            //var xAxis = d3.svg.axis()
            //.scale(scale)
            //.ticks(10)
            //.tickFormat(d3.time.format('%b'));
            //.tickFormat(timeformatter);
            //.orient("bottom");
            //.tickSize(-100)
            //.tickSubdivide(true);
            
            var line = d3.svg.line()
//                .x(function(d, i) { return i * (width / data.length); })
                .x(function(d, i) { return scale(VMail.App.timeline[i]) * width; })
                .y(function(d) { return barHeight(d); });
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "rgb(240,240,240)")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("d", line);
        
        
            var yAxis = d3.svg.axis().scale(barHeight).ticks(5).orient("left");

//            svg.selectAll("rect").data(data).enter().append("rect").attr("x", function (d, i) {
//                return i * (width / data.length);
//            }).attr("y", function (d) {
//                return barHeight(d);
//            }).attr("width", (width / data.length - barPadding)<0.5? 0.5:(width / data.length - barPadding)).attr("height", function (d) {
//                return height - barHeight(d);
//            }).style("fill","rgb(240,240,240)");

            svg.append("g").attr("class", "axis").attr("transform", "translate(0," + height + ")").style("stroke","rgb(240,240,240)").style("fill","rgb(240,240,240)");

            //.call(xAxis);
            svg.append("g").attr("class", "axis").append("text").attr("text-anchor", "left").attr("x", -30).attr("y", -10).attr("class", "histogram_title").text(settings.ylabel).style("fill","rgb(240,240,240)");

            svg.append("g").attr("class", "axis").attr("fill","rgb(240,240,240)").attr("stroke","rgb(240,240,240)").style("stroke","rgb(240,240,240)").call(yAxis);
            svg.selectAll("path").style("stroke","rgb(240,240,240)");
            //.append("text")
            //.attr("class", "y label")
            //.attr("text-anchor", "end")
            //.attr("y", -50)
            //.attr("dy", "0")
            //.attr("transform", "rotate(-90)")
            //.text(settings.ylabel);
        };
    })(VMail.Viz || (VMail.Viz = {}));
    var Viz = VMail.Viz;
})(VMail || (VMail = {}));
//# sourceMappingURL=viz.js.map
