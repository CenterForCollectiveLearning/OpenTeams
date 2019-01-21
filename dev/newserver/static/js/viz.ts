module VMail.Viz {

  export class NetworkViz {
    private svg: any;
    private linksG: any;
    private nodesG: any;
    private force: any;
    private defs: any;

    //Note: nodeBind & linkBind are going to be used as d3 selectors
    private nodeBind: any;
    private linkBind: any;
    settings: VizSettings;

    private filteredNodes: VMail.Graph.INode[];
    private idToNode: {[id:string]: VMail.Graph.INode;};
    private filteredLinks: VMail.Graph.ILink[];

    private centeredNode: any;
    private LABEL_THRESHOLD = 1;
    clustercolors = true;
    private neighbors_num = null;
    private drag_node = null;
    private glowing: boolean;
    private labelsVisible: boolean;
    private recolorTimer = null;
    /*private baseNodeColor = "#ffffff";
    private baseLabelColor = "#c2c2c2";
    private baseStrokeColor = "#fff";
    private baseStrokeOpacity = 0.1;*/

    private baseNodeColor = "#000";
    private baseLabelColor = "#111";
    private baseStrokeColor = "#000";
    private baseStrokeOpacity = 0.1;
    private baseNodeStrokeColor = "#555";
    private highlightedNodeColor = "#222";

    guestbook: boolean;

    constructor (settings: VizSettings, for_guestbook: boolean) {
      this.centeredNode = null;
      this.settings = settings;
      this.svg = d3.select(settings.svgHolder)
      this.svg.attr("pointer-events", "all");
      this.svg.attr("width",  this.settings.size.width);
      this.svg.attr("height",  this.settings.size.height);
      this.svg.on("click", () => {this.undoCenterNode(); this.settings.clickHandler(null);})
      this.defs = this.svg.append("svg:defs")
      this.defs.append("svg:filter")
        .attr("id", "blur")
        .append("svg:feGaussianBlur")
        .attr("stdDeviation", 1);

      this.linksG = this.svg.append("g").attr("id", "links");
      this.nodesG = this.svg.append("g").attr("id", "nodes");
      this.glowing = false;
      this.labelsVisible = true;
      this.guestbook = for_guestbook;

      if(!this.guestbook) {
        this.svg.append("svg:image")
          .attr("width", 250)
          .attr("height", 35)
          .attr("xlink:href", "/static/images/basic-url-logo.png")
          .attr("x", 10)
          .attr("y", 18)
          .attr("opacity", 0.8);
      }
    }

    updateNetwork(graph: VMail.Graph.IGraph): void {
      //remember centered node
      //var centeredNode = this.centeredNode;
      //undo centering
      //this.undoCenterNode();
      var centeredNode = null;
      this.filteredNodes = graph.nodes.filter((node: VMail.Graph.INode) => { return !node.skip; });
      var idToNode2:{[id:string]: VMail.Graph.INode;}  = {};

      this.filteredNodes.forEach((node) => {
        if (this.idToNode !== undefined && node.id in this.idToNode) {
          var oldNode = this.idToNode[node.id];
          if(oldNode === this.centeredNode) {
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
      this.filteredLinks = graph.links.filter((link: VMail.Graph.ILink) => {
        return !link.skip && !link.source.skip && !link.target.skip;
      });
      if (centeredNode) {
        this.draw(false);
      } else {
        this.undoCenterNode();
        this.draw(true);
      }
      //redo centering after network has been updated
      if(centeredNode) {
        //console.log("previously centered node ", centeredNode.attr.contact.name)
        this.centerNode(centeredNode);
      }
    }

    rescale(): void {
      var trans = d3.event.translate;
      var scale = d3.event.scale;
      this.svg.attr("transform",
          "translate(" + trans + ")"
          + " scale(" + scale + ")");
    }

    resume(): void  {
      //this.force.stop();
      this.force.alpha(.15);
    }

    draw(live?: boolean): void {
      if(live === undefined) { live = this.settings.forceParameters.live; }
      if(this.force !== undefined) { this.force.stop(); }
      else { this.force = d3.layout.force(); }
      this.force.size([ this.settings.size.width,  this.settings.size.height]);
      this.force.charge(this.settings.forceParameters.charge);
      this.force.linkDistance(this.settings.forceParameters.linkDistance);
      this.force.gravity(this.settings.forceParameters.gravity);
      this.force.friction(this.settings.forceParameters.friction);
      this.force.nodes(this.filteredNodes);
      this.force.links(this.filteredLinks);
      if (live) {
        this.force.on("tick", () => this.forceTick());
      }

      this.redraw();

      this.force.start();
      if (!live) {
        for (var i = 0; i < 150; ++i) { this.force.tick(); }
        this.force.stop();
      }

      //this.force.resume();

      //if(!this.guestbook) {
        //this.nodeBind.selectAll("circle").transition().duration(750).attr("fill", this.baseNodeColor);
        //clear prevous timeouts before starting new ones
        //if(this.recolorTimer !== null) {
        //  clearTimeout(this.recolorTimer);
        //}
        //this.recolorTimer = setTimeout(() => {this.recolorNodes();}, 1000);
      //}
    }

    redraw(): void {
      this.drawNodes();
      this.drawLinks();
    }


    /*private chargeFunc(d) {
      var absDynamiccharge = d.attr.size*10;
      if(absDynamiccharge < 3000)
        absDynamiccharge = 3000;
      return -absDynamiccharge;
    }*/

    forceTick() {
      this.nodeBind.attr("transform", (node) => {
        var r = this.settings.nodeSizeFunc(node.attr);
        //node.x += Math.random()*5 - 2.5;
        //node.y += Math.random()*5 - 2.5;
        node.x = Math.max(r, Math.min(this.settings.size.width - r, node.x));
        node.y = Math.max(r, Math.min(this.settings.size.height - r - 17, node.y));
        return "translate(" + node.x + "," + node.y + ")"
      });

      this.linkBind
        .attr("x1", (link) => {return link.source.x})
        .attr("y1", (link) => {return link.source.y})
        .attr("x2", (link) => {return link.target.x})
        .attr("y2", (link) => {return link.target.y});
    }

    private moveContact = function(d){
        d.fixed = true;
        var r = this.settings.nodeSizeFunc(d.attr);
        var newx = d3.event.x + d.x; //+ parseInt(d.locx*WIDTH);
        var newy = d3.event.y + d.y; //+ parseInt(d.locy*HEIGHT);
        newx = Math.max(r, Math.min(this.settings.size.width - r, newx));
        newy = Math.max(r, Math.min(this.settings.size.height - r - 17, newy));
        d.x = newx;
        d.y = newy;
        d.px = newx;
        d.py = newy;
        this.forceTick();
        var g = d3.select(d.parentNode);
        g.attr("transform", function(d){ return "translate(" + newx + "," + newy + ")"})
    };

    clickNode(node:VMail.Graph.INode) {
      //focus on the selectedNode
      var selectedNode = this.nodeBind.filter((d:VMail.Graph.INode, i:number) => {return node === d});
      var e:any = document.createEvent('UIEvents');
      e.initUIEvent('click', true, true, window, 1);
      selectedNode.node().dispatchEvent(e);
    }

    mouseoverNode(node:VMail.Graph.INode) {
      //focus on the selectedNode
      var selectedNode = this.nodeBind.filter((d:VMail.Graph.INode, i:number) => {return node === d});

      //change the looks of the circle
      selectedNode.select("circle")
        .transition()
        .attr("stroke-width", 3.0)
        .attr("stroke","#000")
        .attr("fill", this.highlightedNodeColor)
        //.attr("filter", (d) => {var verdict = this.glowing ? "url(#blur)" : "none"; return verdict;} )

      //change the looks of the text
      selectedNode.select("text").transition()
        
        .attr("visibility","visible")
        .style("font-size", "20px")
        .text(this.settings.nodeLabelFuncHover(node.attr));

      this.linkBind
        // hide all links
        .style("stroke-opacity", 0)
        // focus on links of highlighted node
        .filter((link:VMail.Graph.ILink, i:number) => { return link.source === node || link.target === node;})
        //.transition()
        //show those links
        .style("stroke-opacity", 0.5)
    }

    mouseoutNode(node:VMail.Graph.INode) {
      //console.log("mouseout:" + node.attr.contact.name);
      //focus on the selectedNode
      var selectedNode = this.nodeBind.filter((d:VMail.Graph.INode, i:number) => {return node === d});

      selectedNode.select("circle").transition()
        .attr("stroke", this.baseNodeStrokeColor)
        .attr("stroke-opacity", 0.8)
        .attr("stroke-width", 1.0)
        .attr("opacity", "1.0")
        .attr("fill", (d) => {
          if(this.clustercolors)
            return this.settings.colorFunc(d.attr);
          else
            return this.baseNodeColor;
        });

      selectedNode.select("text").transition()
        .text(this.settings.nodeLabelFunc(node.attr))
        .style("font-size", "12px")
        .attr("visibility", (d) => { if (this.centeredNode === null && this.settings.nodeSizeFunc(d.attr) < this.LABEL_THRESHOLD) return "hidden" });
      this.linkBind.style("stroke-opacity", this.baseStrokeOpacity);
    }

    undoCenterNode() {
      if(d3.event) {
        d3.event.stopPropagation();
      }
      // don't undo if there is noone centered
      if(this.centeredNode === null) {
        return;
      }
      //un-highlight the node if uncentering
      this.mouseoutNode(this.centeredNode);

      var centerNode = this.centeredNode;

      // find the neighbors of the centered node (this takes o(1) time given the underlying graph structure)
      var neighbors = {};
      centerNode.links.forEach((link: VMail.Graph.ILink) => {
        if(link.skip || link.source.skip || link.target.skip) {
          return;
        }
        if (link.source !== centerNode) neighbors[link.source.id] = link.source;
        if (link.target !== centerNode) neighbors[link.target.id] = link.target;
      });

      // === ANIMATION CODE ===
      var centeringNodes = this.nodeBind
        //show all (nodes & text) with full opacity
        .style("opacity", 1.0)
        //focus on the "central" nodes
        .filter((d2:VMail.Graph.INode, i:number) => {return d2 === centerNode || d2.id in neighbors});

      centeringNodes
        // return the central nodes to their original position
        .transition()
        .attr("transform", (d, i)=> {
          d.x = d.px;
          d.y = d.py;
          return "translate(" + d.x + "," + d.y +")"
        })

      //return the original styles of the cirles of the centering nodes
      centeringNodes
        .select("circle")
        .attr("stroke", this.baseNodeStrokeColor)
        .attr("stroke-opacity", 0.8)
        .attr("stroke-width", 1.0)
        .attr("fill", (node) => {
          if(this.clustercolors)
            return this.settings.colorFunc(node.attr);
          else
            return this.baseNodeColor;
          });

      //return the original style and position of the text of the centering nodes
      centeringNodes
        .select("text")
        .attr("text-anchor", "middle")
        .attr("dy", (node) => { return this.settings.nodeSizeFunc(node.attr) + 15})
        .attr("dx", '0em')
        .attr("transform", null)
        .attr("visibility", (node) => { if(this.settings.nodeSizeFunc(node.attr) < this.LABEL_THRESHOLD) return "hidden" });

      this.linkBind
        //show all the links
        .style("opacity",1.0)
        //focus on the links of the centering node
        .filter((link:VMail.Graph.ILink, i:number) => { return link.source === centerNode || link.target === centerNode;})
        //animate while updating coordinates
        .transition()
        .attr("x1", (link) => {return link.source.x})
        .attr("y1", (link) => {return link.source.y})
        .attr("x2", (link) => {return link.target.x})
        .attr("y2", (link) => {return link.target.y});

      //uncenter the node
      this.centeredNode = null;
    }

    private centerNode(centerNode) {

      // stop any animation before animating the "centering"
      this.force.stop();

      //un-highlight the node
      //this.mouseoutNode(centerNode);

      if(this.centeredNode === centerNode) {
        this.undoCenterNode();
        return;
      }
      this.undoCenterNode();
      // remember the centered node
      this.centeredNode = centerNode;


      // store all the neighbors of the centered node (neighbors are found in O(1) time from the graph data structure)
      var neighbors = {};
      var nneighbors = 0;
      centerNode.links.forEach((link: VMail.Graph.ILink) => {
        if(link.skip || link.source.skip || link.target.skip) {
          return;
        } else {
          nneighbors+=1;
        }
        if (link.source !== centerNode) neighbors[link.source.id] = link.source;
        if (link.target !== centerNode) neighbors[link.target.id] = link.target;
      });

      // radius of the "centering" circle
      var radius = 250;
      var angle = (2*Math.PI)/nneighbors;

      //  ===COORDINATES COMPUTATION CODE===
      //  ---center node---
      //store old coordinates. Need them when we undo the centering to return objects to their original position.
      centerNode.px = centerNode.x;
      centerNode.py = centerNode.y;
      centerNode.x = this.settings.size.width/2.0;
      centerNode.y = this.settings.size.height/2.0;

      //  ---neighboring nodes---
      var idx = 0;
      var neighbors_array: VMail.Graph.INode[] = []
      for(var id in neighbors) {
        neighbors_array.push(neighbors[id])
      }
      neighbors_array.sort((a,b) => { return a.attr.color - b.attr.color});
      //compute the angle and the coordinates for each neighbor
      for(var id in neighbors_array) {
        var node = neighbors_array[id];
        node.px = node.x;
        node.py = node.y;
        node.x = centerNode.x + radius*Math.cos(idx*angle);
        node.y = centerNode.y + radius*Math.sin(idx*angle);
        node.angle = idx*angle;
        idx+=1;
      }
      this.neighbors_num = neighbors_array.length-1;

      // === ANIMATION CODE ===
      // ---neighboring nodes---
      this.nodeBind
        // making the nodes opaque
        .style("opacity",0.05)
        // focus on neighboring nodes
        .filter((d2:VMail.Graph.INode, i:number) => {return d2.id in neighbors})
        // making the neighbors fully vizible
        .style("opacity",1.0)
        .transition()
        // changing x and y coordinates
        .attr("transform", (d,i)=> {return "translate(" + d.x + "," + d.y +")"})
        // focus on the text of the nodes
        .select("text")
        .attr("text-anchor", (d,i)=> {
          var ang = 180*d.angle/Math.PI;
          if(ang>90 && ang < 270) {
            return "end";
          }
          return "start";
        })
        .attr("dx", (d,i)=> {
          var ang = 180*d.angle/Math.PI;
          if(ang>90 && ang < 270) {
            return -this.settings.nodeSizeFunc(d.attr) - 10;
          }
          return this.settings.nodeSizeFunc(d.attr) + 10;
        })
        .attr("dy", (d,i)=> {return 5})
        .attr("transform", (d,i)=> {
          var ang = 180*d.angle/Math.PI;
          if(ang>90 && ang < 270) {
            return "rotate(" + ang + " 0 0) scale(-1,-1)";
          }
          return "rotate(" + ang + " 0 0)";
        })
        .attr("visibility", null);

      //---center node---
      var tmp = this.nodeBind
        //focus on the center node
        .filter((d2:VMail.Graph.INode, i:number) => {return d2 === centerNode});
        //make the center node fully vizible
      tmp.select("text").attr("visibility", null);
      tmp.style("opacity",1.0)
        .transition()
        // changing x and y coordinates
        .attr("transform", (d,i)=> {return "translate(" + d.x + "," + d.y +")"})
        .select("circle")
        .attr("stroke-width", 3.0)
        .attr("stroke","#000")
        .attr("fill", this.highlightedNodeColor);

      //un-highlight the node
      this.mouseoutNode(centerNode);

      //---links---

      this.linkBind
        //hide all the links
        .style("opacity",0)
        //focus on the links of the centering node
        .filter((link:VMail.Graph.ILink, i:number) => { return link.source === centerNode || link.target === centerNode;})
        //show those links
        .style("opacity",1.0)
        .transition()
        //animate while updating coordinates
        .attr("x1", (link) => {return link.source.x})
        .attr("y1", (link) => {return link.source.y})
        .attr("x2", (link) => {return link.target.x})
        .attr("y2", (link) => {return link.target.y});
    }

    private recolorNodes() {
      if(this.clustercolors) {
        this.nodeBind.select("circle")
          .transition().duration(750)
          .attr("fill", (node) => {return this.settings.colorFunc(node.attr)});
      }
      else {
        this.nodeBind.select("circle")
          .attr("fill", this.baseNodeColor);
      }
    }

    glowNodes() {
      if(!this.glowing) {
        this.nodeBind.select("circle")
          .transition()
          .style("filter", "url(#blur)");
        this.glowing = true;
      }
      else {
        this.nodeBind.select("circle")
          .transition()
          .style("filter", "none");
        this.glowing = false;
      }
    }

    toggleLabelVisibility() {
      if(this.labelsVisible) {
        this.nodeBind.select("text")
          .transition()
          .style("opacity", 0);
        this.labelsVisible = false;
      }
      else {
        console.log('displaying labels..')
        this.nodeBind.select("text")
          .transition()
          .style("opacity", 0.8);
        this.labelsVisible = true;
      }
    }

    private drawNodes(): void {
      var tmp = (node) => {return node.id };
      this.nodeBind = this.nodesG.selectAll("g.node").data(this.filteredNodes, tmp);

      if(this.guestbook) {
        var filteredNodes_length = this.filteredNodes.length;
        for(var u=0; u<filteredNodes_length;u++) {
          if(this.filteredNodes[u].attr.contact.userinfo.picture !== undefined)
            var picurl = <string>this.filteredNodes[u].attr.contact.userinfo.picture;
          else
            var picurl = '/static/images/default_user_pic.jpg';
          this.defs.append("pattern")
            .attr("id", this.filteredNodes[u].attr.contact.userinfo.id+'_pic')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr("width", 50)
            .attr("height", 50)
            .attr('x', -25)
            .attr('y', 25)
            .append('svg:image')
            .attr('xlink:href', picurl)
            .attr("width", 50)
            .attr("height", 50)
            .attr('x', 0)
            .attr('y', 0);
        }
      }

      //update
      this.nodeBind.attr("transform", (node) => { return "translate(" + node.x + "," + node.y + ")"});
      var circles = this.nodeBind.select("circle")//.data(this.filteredNodes, tmp);
      circles.transition().duration(1000)
      .attr("r", (node) => { return this.settings.nodeSizeFunc(node.attr)})
      .attr("fill", (node) => {
        if(!this.guestbook) {
            if(this.clustercolors) { return this.settings.colorFunc(node.attr)}
            else { return this.baseNodeColor;}
        } else {
          return "url(#"+node.attr.contact.userinfo.id+"_pic)";
        }
      });

      var labels = this.nodeBind.select("text")//.data(this.filteredNodes, tmp);
      labels
      .transition()
      .attr("visibility", (node) => { if(this.settings.nodeSizeFunc(node.attr) < this.LABEL_THRESHOLD) return "hidden"; })
      .attr("dy", (node) => { return this.settings.nodeSizeFunc(node.attr) + 15})
      .attr("dx", '0em')

      //enter
      var enteringNodes = this.nodeBind.enter().append("g");
      enteringNodes.attr("class", "node").attr("id", (node) => {return node.id})

      enteringNodes.attr("transform", (node) => { return "translate(" + node.x + "," + node.y + ")"});
      if(!this.guestbook) {
        if(this.settings.clickHandler !== undefined) {
          enteringNodes.on("click.1", this.settings.clickHandler);
          enteringNodes.on("click.centerNode", (d,i)=>{this.centerNode(d)});
        }
      }

      var circles = enteringNodes.append("circle");
      circles.attr("r", (node) => { return this.settings.nodeSizeFunc(node.attr)})
      circles.attr("fill", (node) => {
        if(!this.guestbook) {
            if(this.clustercolors) { return this.settings.colorFunc(node.attr)}
            else { return this.baseNodeColor;}
        } else {
          return "url(#"+node.attr.contact.userinfo.id+"_pic)";
        }
      });

      circles
        .style("opacity", "1")
        .attr("stroke", this.baseNodeStrokeColor)
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 1.0)
        //.style("filter", () => {var verdict = this.glowing ? "url(#blur)" : "none"; return verdict;} )
      if(!this.guestbook) {
        circles
          .on("mouseover", (d,i) => {this.mouseoverNode(d);})
          .on("mouseout.1", (d,i)=>{this.mouseoutNode(d);})
          .call(d3.behavior.drag().on("drag", (node) => this.moveContact(node)));
      }

      enteringNodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (node) => { return this.settings.nodeSizeFunc(node.attr) + 13})
      .attr("dx", '0em')
      .attr("class", "nodelabeltext")
      .attr("visibility", (node) => { if(this.settings.nodeSizeFunc(node.attr) < this.LABEL_THRESHOLD) return "hidden" })
      .style("font-size", "12px")
      //.style("stroke", "ffffff")
      .attr("fill", this.baseLabelColor)
      .attr("opacity", 0.8)
      .style("pointer-events", 'none')
      .text((node) => {return this.settings.nodeLabelFunc(node.attr)})

      //exit
      this.nodeBind.exit().remove();

    }

    private showLabel(radius) {
      return (radius < 5);
    }

    private drawLinks(): void {
      var tmp = (link) => { return link.source.id + "#" + link.target.id};
      this.linkBind = this.linksG.selectAll("line.link").data(this.filteredLinks, tmp);

      var sizeExtent = d3.extent(this.filteredLinks, (link) => { return link.weight; });
      //var linkWidth = d3.scale.linear();
      //linkWidth.range([this.settings.linkWidthPx.min, this.settings.linkWidthPx.max]);
      //linkWidth.domain(sizeExtent);

      //update
      this.linkBind.attr("stroke-width", (link) => { return this.settings.linkSizeFunc(link.attr)});
      this.linkBind.attr("x1", (link) => {return link.source.x})
      this.linkBind.attr("y1", (link) => {return link.source.y})
      this.linkBind.attr("x2", (link) => {return link.target.x})
      this.linkBind.attr("y2", (link) => {return link.target.y});
      //enter
      var lines = this.linkBind.enter().append("line");
      lines.attr("class", "link")
      lines.attr("stroke", this.baseStrokeColor)
      lines.attr("stroke-opacity", this.baseStrokeOpacity)
      lines.attr("stroke-width", (link) => { return this.settings.linkSizeFunc(link.attr)})
      lines.attr("x1", (link) => {return link.source.x})
      lines.attr("y1", (link) => {return link.source.y})
      lines.attr("x2", (link) => {return link.target.x})
      lines.attr("y2", (link) => {return link.target.y});

      //exit
      this.linkBind.exit().remove();
    }
  }

  export interface VizSettings {
    svgHolder: string;

    size: {
      width: any;
      height: any;
    };
    forceParameters: {
      friction: number;
      gravity: number;
      linkDistance: number;
      charge: any;
      live: boolean;
    };

    nodeSizeFunc(attr: any) : number;
    nodeLabelFunc(attr: any) : string;
    nodeLabelFuncHover(attr: any) : string;
    linkSizeFunc(attr: any): number;
    colorFunc(attr: any) : string;

    clickHandler?: any;
  }

  export interface IHistogramSettings {
    width: number;
    height: number;
    start?: Date;
    end?: Date;
    interval: any;
    position: any;
    ylabel?: string;

    dateformat: string;
    nTicks: number;
    prediction: boolean;
  }

  export var plotIntroductionTrees = (trees) => {

    trees.forEach((root) => {
      if (root.father !== undefined || root.children === undefined || root.children.length === 0) { return; }
      var width = 300;
      var height = 400;

      var cluster = d3.layout.cluster()
          .size([height, width - 180]);

      var diagonal = d3.svg.diagonal()
          .projection(function(d) { return [d.y, d.x]; });

      var svg = d3.select("body").append("svg")
          .attr("class", "introductions")
          .attr("width", width)
          .attr("height", height)
        .append("g")
          .attr("transform", "translate(100,0)");

      var nodes = cluster.nodes(root),
          links = cluster.links(nodes);

      var link = svg.selectAll(".link")
          .data(links)
        .enter().append("path")
          .attr("class", "link")
          .attr("d", diagonal);

      var node = svg.selectAll(".node")
          .data(nodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

      node.append("circle")
          .attr("r", 4.5);

      node.append("text")
          .attr("dx", function(d) { return d.children ? -8 : 8; })
          .attr("dy", 3)
          .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
          .text(function(d) { return d.contact.name; });

      d3.select(self.frameElement).style("height", height + "px");
    });
  }

  export var plotTimeHistogram = (timestamps: VMail.DB.IDateWeight[], settings: IHistogramSettings) => {
      if (timestamps === undefined || timestamps.length === 0) {
        return;
      }
      var margin = {top: 20, right: 20, bottom: 50, left: 50};
      var width = settings.width - margin.left - margin.right;
      var height = settings.height - margin.top - margin.bottom;

      //bin the events
      var firstTime = timestamps[0].date;
      if(settings.start !== undefined) {
        firstTime = settings.start;
      }

      var lastTime = timestamps[timestamps.length-1].date;
      if(settings.end !== undefined) { lastTime = settings.end; }
      var binDates = settings.interval.range(settings.interval.floor(firstTime), lastTime);
      var scale = d3.time.scale().domain(binDates).rangeRound(d3.range(0,binDates.length));
      var dataset = new Array(binDates.length);
      for(var i=0; i < dataset.length; i++) {
        dataset[i] = 0;
      }
      for(var i=0; i < timestamps.length; i++) {
        var tmp = scale(settings.interval.floor(timestamps[i].date));
        if(tmp <0 || tmp >= binDates.length) { continue; };
        dataset[tmp] += timestamps[i].weight;
      }


      var barPadding = 1;
      var barHeight = d3.scale.linear();

      if(settings.prediction) {
        var timespan = (new Date().getTime()-settings.interval.floor(new Date())) / (settings.interval.ceil(new Date()) - settings.interval.floor(new Date()))
        var prediction = dataset[dataset.length-1]*((1-timespan)/timespan);
      }

      barHeight.domain([0, d3.max(dataset.concat(prediction + dataset[dataset.length-1]))]);
      barHeight.range([height, 0]);

      //Create SVG element
      var svg = settings.position.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      /*
      var tmpScale = d3.time.scale()
        .domain([firstTime, lastTime])
        .range([0, width]);

      */
      // Draw X-axis grid lines
      svg.append("line").attr("x1", 0)
        .attr("x2", width)
        .attr("y1", height)
        .attr("y2", height)
        .attr("stroke", "black")
        //.attr("stroke-opacity", 0.1)
        .attr("stroke-width", '1px')

      var tickEvery = dataset.length/settings.nTicks;
      var t = svg.selectAll("axistext").data(binDates.filter((d,i) => { return Math.floor(i/tickEvery) > Math.floor((i-1)/tickEvery);})).enter()
        .append("g").attr("class", "axistext")
      t.append("text")
        //.attr("class", "axis")
        .attr('text-anchor', 'middle')
        .attr("x", (d, i) => {
            return (Math.ceil(i*tickEvery) + 0.5) * (width / dataset.length);
         })
        .attr("y", height+20)
        //.style("stroke", "#ccc")
        .text((d,i) => {
          return d3.time.format(settings.dateformat)(d);
        })
      t.append("line")
          .attr("x1", (d, i) => {
            return (Math.ceil(i*tickEvery) + 0.5) * (width / dataset.length);
          })
          .attr("x2", (d, i) => {
            return (Math.ceil(i*tickEvery) + 0.5) * (width / dataset.length);
          })
          .attr("y1", height)
          .attr("y2", height+6)
          .attr("stroke", "black")
        //.attr("stroke-opacity", 0.1)
        .attr("stroke-width", '1px')


      //var xAxis = d3.svg.axis()
      //.scale(scale)
      //.ticks(10)
      //.tickFormat(d3.time.format('%b'));
      //.tickFormat(timeformatter);
      //.orient("bottom");
      //.tickSize(-100)
      //.tickSubdivide(true);

      var yAxis = d3.svg.axis()
        .scale(barHeight)
        .ticks(5)
        .orient("left");

      svg.selectAll("rect")
         .data(dataset)
         .enter()
         .append("rect")
         .attr("x", (d, i) => {
            return i * (width / dataset.length);
         })
         .attr("y", (d) => {
            return barHeight(d);
         })
         .attr("width", width / dataset.length - barPadding)
         .attr("height", (d) => {
            return height - barHeight(d);
         });

      if(settings.prediction) {
        svg.append("rect")
           .style("fill","gray")
           .attr("x", () => {
              return (dataset.length-1) * (width / dataset.length);
           })
           .attr("y", () => {
              return barHeight(dataset[dataset.length-1]) - (height - barHeight(prediction));
           })
           .attr("width", width / dataset.length - barPadding)
           .attr("height", () => {
              return height - barHeight(prediction);
           });
      }

      svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      //.call(xAxis);

      svg.append("g")
      .attr("class", "axis")
      //.call(yAxis)
      .append("text")
      //.attr("class", "y label")
      .attr("text-anchor", "left")
      .attr("x",-30)
      .attr("y", -10)
      .attr("class", "histogram_title")
      //.attr("transform", "rotate(-90)")
      .text(settings.ylabel);

      svg.append("g")
      .attr("class", "axis")
      .call(yAxis)
      //.append("text")
      //.attr("class", "y label")
      //.attr("text-anchor", "end")
      //.attr("y", -50)
      //.attr("dy", "0")
      //.attr("transform", "rotate(-90)")
      //.text(settings.ylabel);
    }
}