// Render functions for the classification graph

function createV4SelectableForceDirectedGraph(svg, graph, nodeMap, linkSet, loadedMap, graphConf) {

  let parentWidth = d3.select('svg').node().parentNode.clientWidth;
  let parentHeight = d3.select('svg').node().parentNode.clientHeight;

  // Define Context menu options
	var menu = function(d, i) {
	  var menu = Array();
	  menu = [{
        title: "Info",
        action: function (d, i) {
          console.log(d);
        },
      },
      {
        title: "Restart from this disorder",
        action: function (d, i) {
          if (d.label.startsWith("Orphanet")) {return} // Quickfix for buggy classification head
          var inputLang = $("#mainInputLang").val();
          var inputValue = d.id;
          var Label = d.label;
          freeze();
          classificationEntry(inputLang, inputValue, Label, graphConf, completeness=2, loadedMap);
        },
      },
      {
        divider: true,
      },
      {
        title: "Parents",
      }
    ];
    if (d.queried === -1 || d.queried === 1) {
      menu.push({
        title: "Show parents",
        action: function (d, i) {
            freeze();
            loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf, completeness=0, loadedMap);
        },
      });
    }
    if (d.queried === 0 || d.queried === 2) {
      menu.push({
        title: "Hide parents",
        action: function (d, i) {
          freeze(); // dismiss most graph behavior to prevent loading bug
          removeNodes(d, i, graph, nodeMap, linkSet, graphConf, completeness=0)
        }
      });
    };
    menu.push({
      divider: true,
    });
    menu.push({
      title: "Children",
    });
    if (d.queried === -1 || d.queried === 0) {
      menu.push({
        title: "Show children",
        action: function (d, i) {
            freeze();
            loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf, completeness=1, loadedMap);
        }
      });
    };
    if (d.queried === 1 || d.queried === 2) {
      menu.push({
        title: "Hide children",
        action: function (d, i) {
          freeze(); // dismiss most graph behavior to prevent loading bug
          removeNodes(d, i, graph, nodeMap, linkSet, graphConf, completeness=1)
        }
      });
    };
    menu.push({
      divider: true,
    });
    menu.push({
      title: "Parents & children",
    });
    if (d.queried !== 2) {
      menu.push({
        title: "Show both",
        action: function (d, i) {
          freeze(); // dismiss most graph behavior to prevent loading bug
          loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf, completeness=2, loadedMap);
        }
      });
    };
    if (d.queried === 2) {
      menu.push({
        title: "Hide both",
        action: function (d, i) {
          freeze(); // dismiss most graph behavior to prevent loading bug
          removeNodes(d, i, graph, nodeMap, linkSet, graphConf, completeness=2)
        }
      });
    };
    return menu;
  }

  var svg = d3.select('svg')
  .attr('width', parentWidth)
  .attr('height', parentHeight)
  .on("contextmenu", function(data, index) {
//    stop showing browser menu
    d3.event.preventDefault();
  })

  // remove any previous graphs
  svg.selectAll('.g-main').remove();
  svg.selectAll('circle').remove();
  svg.selectAll('text').remove();

  var gMain = svg.append('g')
  .classed('g-main', true);

//  Background element used to unselect on click
  var unselectPlaceholder = gMain.append('rect')
  .attr('width', parentWidth)
  .attr('height', parentHeight)
  .style('fill', 'white')

  var gDraw = gMain.append('g');

// Limit the mouse wheel delta
  function myWheelDelta() {
    return d3.event.deltaY < 0 ? graphConf.zoomStep: -graphConf.zoomStep;
  }

//  console.log("received", graphConf.zoom);
  gDraw.attr("transform", "translate(" + graphConf.zoom.x + "," + graphConf.zoom.y + ") scale(" + graphConf.zoom.k + ")");

  var zoom = d3.zoom()
  .scaleExtent([0.1, 3])
  .wheelDelta(myWheelDelta)
  .on('zoom', zoomed)

  svg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(graphConf.zoom.x, graphConf.zoom.y).scale(graphConf.zoom.k));

  // Handmade legend
  svg.append("circle").attr("cx",20).attr("cy",parentHeight - 70).attr("r", 10).style("fill", graphConf.color.get("Group of disorders"))
  svg.append("circle").attr("cx",20).attr("cy",parentHeight - 45).attr("r", 10).style("fill", graphConf.color.get("Disorder"))
  svg.append("circle").attr("cx",20).attr("cy",parentHeight - 20).attr("r", 10).style("fill", graphConf.color.get("Subtype of disorder"))
  svg.append("text").attr("x", 35).attr("y", parentHeight - 65).text("Group of disorders").style("font-size", "15px").attr("alignment-baseline","middle")
  svg.append("text").attr("x", 35).attr("y", parentHeight - 40).text("Disorder").style("font-size", "15px").attr("alignment-baseline","middle")
  svg.append("text").attr("x", 35).attr("y", parentHeight - 15).text("Subtype of disorder").style("font-size", "15px").attr("alignment-baseline","middle")

  function wrap(text, width) {
  //    return;
      text.each(function() {
          var text = d3.select(this);
          // Remove the id (orphacode) for the invite message
          var textString = text.text();
          textString = (textString[0] === "0") ? textString.slice(2 ,textString.length + 1) : textString;

          // adding spaces between some terms that are linked by hyphen or slash preventing word split
          var curatedSpace = textString.replaceAll("-", "- ").replaceAll("/", "/ ");
          var words = curatedSpace.split(/\s+/).reverse();
          var word;
          var line = [];
          var lineHeight = graphConf.textLineHeight; // em;
          var paragraphInfo = [];
          var previousLength = 0;
          var textLength = 0;
          var lineOffset = 0;

  //        console.log(curatedSpace);

  //      Compute the tspan
          word = words.pop();
          line = [word];
          text.text(line.join(" "));
          textLength = text.node().getComputedTextLength();

          while(words.length) {
            if (textLength < width) {
              word = words.pop();
              line.push(word);
              text.text(line.join(" "));
              textLength = text.node().getComputedTextLength();
//              console.log("IF", line.join(" "), textLength);
              if (textLength > width & !words.length | !words.length) {
                if (line.length > 1) {
                  line.pop();
                  text.text(line.join(" "));
                  textLength = text.node().getComputedTextLength();
//                  console.log("!words", line.join(" "), textLength);
                  paragraphInfo.push([line.join(" "), previousLength, textLength]);
  //                console.log(paragraphInfo);
                  previousLength = textLength;
                }

                text.text(word);
                textLength = text.node().getComputedTextLength();
  //              console.log("!words", word, textLength);
                paragraphInfo.push([word, previousLength, textLength]);
//                console.log(paragraphInfo);
              }
            } else {
              if (line.length > 1) {
                line.pop();
                text.text(line.join(" "));
                textLength = text.node().getComputedTextLength();
                paragraphInfo.push([line.join(" "), previousLength, textLength]);
  //              console.log(paragraphInfo);
  //              console.log("else", line.join(" "), textLength);
                previousLength = textLength;
                line = [word];
                text.text(line.join(" "));
                textLength = text.node().getComputedTextLength();
              } else {
                paragraphInfo.push([line.join(" "), previousLength, textLength]);
  //              console.log(paragraphInfo);
  //              console.log("else else", line.join(" "), textLength);
                previousLength = textLength;
                line = [];
                text.text("");
                textLength = 0;
              }
            }
          }
//          console.log(paragraphInfo);
          text.text(null);

          var computedOffset = (paragraphInfo.length-1)/2;

  //      Write the computed tspan
          tspan = text.append("tspan")
              .attr("dy", -computedOffset + lineOffset + "em")
              .attr("dx", -paragraphInfo[0][1])
              .text(paragraphInfo[0][0]);

          if (paragraphInfo.length > 1) {
            for (line of paragraphInfo.slice(1, paragraphInfo.length+1)) {
              var adjust = Math.abs(line[1]/2 - line[2]/2);
              adjust = (line[1] > line[2]) ? adjust : -adjust;
  //            console.log(adjust);
              tspan = text.append("tspan")
                          .attr("dy", lineHeight + "em")
                          .attr("dx", -line[1] + adjust)
                          .text(line[0]);
            }
          }
      });
  }

  function zoomed() {
//    console.log("d3.event.transform", d3.event.transform);

    gDraw.attr('transform', d3.event.transform);

    // keep track of the currentZoomScale and currentPosition
    graphConf.zoom = d3.event.transform;
  }

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  if (! ("links" in graph)) {
    console.log("Graph is missing links");
    return;
  }

// dismiss most graph behavior to prevent loading bug
  function freeze() {
    simulation.stop();
    node
      .on("mouseover", null)
      .on("mouseout", null)
      .on("click", null)
      .on("contextmenu", null)
      .call(d3.drag()
      .on("start", null)
      .on("drag", null)
      .on("end", null));

    nodeText
      .on("mouseover", null)
      .on("mouseout", null)
      .on("click", null)
      .on("contextmenu", null)
      .call(d3.drag()
      .on("start", null)
      .on("drag", null)
      .on("end", null));
  }

  var nodes = {};
  var i;
  for (i = 0; i < graph.nodes.length; i++) {
    nodes[graph.nodes[i].id] = graph.nodes[i];
    graph.nodes[i].weight = 1;
  }

  // the brush needs to go before the nodes so that it doesn't
  // get called when the mouse is over a node
  var gBrushHolder = gDraw.append('g');
  var gBrush = null;

  var link = gDraw.append("g")
    .attr("class", "link")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
    .attr("stroke-width", 1);

  var node = gDraw.append("g")
    .attr("class", "node")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("r", graphConf.nodeSize) // radius

    .attr("fill", function(d) {
      if ('color' in d)
        return d.color;
      else
        return color(d.group);
    })

//    on click function
//    .on("click", function(d, i) {
//      if (!d.queried) {
//        freeze(); // dismiss most graph behavior to prevent loading bug
//        console.log("clicked", d.id, d.label);
//        console.log(d);
//        loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf);
//      }
//    })
//  on mouseover / hover function
    .on("mouseover", mouseover)
    .on("mouseout", mouseout)
//  context menu
    .on("contextmenu", d3.contextMenu(menu))
//  node drag
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

  var nodeText = gDraw.append("g")
    .attr("class", "nodeText")
    .selectAll("text")
    .data(graph.nodes)
    .enter().append("text")
      .text(function(d) { return d.id + " " + d.label;})
      .call(wrap, graphConf.textWrapSize)
//      .on("click", function(d, i) {
//        if (!d.queried) {
//          freeze(); // dismiss most graph behavior to prevent loading bug
//          loadNewNodes(d.id, d.label, graph, nodeMap, linkSet, graphConf);
//        }
//      })
//    on mouseover / hover function
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
//    context menu
      .on("contextmenu", d3.contextMenu(menu))
//    node drag
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));


  // add titles for mouseover popup on node and node text
  node.append("title")
    .text(function(d) {
      if ('label' in d)
        return d.id + " " + d.label;
      else
        return d.id;
    });
  nodeText.append("title")
    .text(function(d) {
      if ('label' in d)
        return d.id + " " + d.label;
      else
        return d.id;
    });

  // Write in red the node selected from the search table or from a previous re-root
  d3.select('svg').selectAll(".nodeText").selectAll("text").filter(function(d, i) {return d.id === graphConf.startId;})
  .style("fill", "red");

  var simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
      .id(function(d) { return d.id; })
      .distance(graphConf.force.linkSize)
      .strength(graphConf.force.linkStrength)
    )
    .force("charge", d3.forceManyBody()
      .strength(graphConf.force.charge)
    )
//    .force("center", d3.forceCenter(parentWidth / 2, parentHeight / 2))
    .force("x", d3.forceX(parentWidth / 2)
      .strength(graphConf.force.xCentering)
    )
    .force("y", d3.forceY()
      .y(function(d) {
        return ((parentHeight / 2) + d.depth * graphConf.force.linkSize);
      })
      .strength(graphConf.force.yLayer)
    )
    .force("collide", d3.forceCollide(graphConf.nodeSize)
    );


  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(graph.links);

  simulation.alpha(graphConf.simulation.alpha);
//  simulation.alphaTarget(graphConf.simulation.alphaTarget);
//  simulation.alphaMin(graphConf.simulation.alphaMin);
  simulation.alphaDecay(graphConf.simulation.alphaDecay);

  function ticked() {
    // update node and line positions at every step of
    // the force simulation
    link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

    nodeText.attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; });

//    console.log(simulation.alpha());
  }

  var brushMode = false;
  var brushing = false;

  var brush = d3.brush()
    .extent([[0,0], [parentWidth, parentHeight]])
    .on("start", brushstarted)
    .on("brush", brushed)
    .on("end", brushended);

  function brushstarted() {
    // keep track of whether we're actively brushing so that we
    // don't remove the brush on keyup in the middle of a selection
    brushing = true;

    node.each(function(d) {
      d.previouslySelected = shiftKey && d.selected;
    });
  }

//  Unselect
  unselectPlaceholder.on('click', () => {
    node.each(function(d) {
      d.selected = false;
      d.previouslySelected = false;
    });
    node.classed("selected", false);
  });

  function brushed() {
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return;

    var brushArea = d3.event.selection;
//    console.log(brushArea[0], brushArea[1])

    node.classed("selected", function(d) {
      return d.selected = d.previouslySelected ^
      (brushArea[0][0] <= d.x && d.x < brushArea[1][0]
       && brushArea[0][1] <= d.y && d.y < brushArea[1][1]);
    });
  }

  function brushended() {
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return;
    if (!gBrush) return;

    gBrush.call(brush.move, null);

    if (!brushMode) {
      // the shift key has been release before we ended our brushing
      gBrush.remove();
      gBrush = null;
    }

    brushing = false;
  }

  d3.select('body').on('keydown', keydown);
  d3.select('body').on('keyup', keyup);

  var shiftKey;

  function keydown() {
    shiftKey = d3.event.shiftKey;

    if (shiftKey) {
      // if we already have a brush, don't do anything
      if (gBrush)
        return;

      brushMode = true;

      if (!gBrush) {
        gBrush = gBrushHolder.append('g');

//        console.log(graphConf.zoom)

        if (graphConf.zoom.k < 1) {
          var scaledWidth = parentWidth / graphConf.zoom.k;
          var scaledHeight = parentHeight / graphConf.zoom.k;
        } else {
          var scaledWidth = parentWidth * graphConf.zoom.k;
          var scaledHeight = parentHeight * graphConf.zoom.k;
        }

        brush.extent([[-scaledWidth - graphConf.zoom.x,-scaledHeight - graphConf.zoom.y],
                      [scaledWidth + graphConf.zoom.x, scaledHeight + graphConf.zoom.y]])

        gBrush.call(brush);
      }
    }
  }

  function keyup() {
    shiftKey = false;
    brushMode = false;

    if (!gBrush)
      return;

    if (!brushing) {
      // only remove the brush if we're not actively brushing
      // otherwise it'll be removed when the brushing ends
      gBrush.remove();
      gBrush = null;
    }
  }

  function dragstarted(d) {
    simulation.alphaDecay(0); // stop the decay timer while a node is dragged
    simulation.alpha(1).restart(); // set the alpha to 1 to give energy to the system and restart in case it stopped

    if (!d.selected && !shiftKey) {
      // if this node isn't selected, then we have to unselect every other node
      node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; });
    }

    d3.select(this).classed("selected", function(p) { d.previouslySelected = d.selected; return d.selected = true; });

    node.filter(function(d) { return d.selected; })
    .each(function(d) { //d.fixed |= 2;
      d.fx = d.x;
      d.fy = d.y;
    })
  }

  function dragged(d) {
    //d.fx = d3.event.x;
    //d.fy = d3.event.y;
      node.filter(function(d) { return d.selected; })
      .each(function(d) {
        d.fx += d3.event.dx;
        d.fy += d3.event.dy;
      })
  }

  function dragended(d) {
    simulation.alphaDecay(graphConf.simulation.alphaDecay); // relaunch the timer with normal decay rate

    d.fx = null;
    d.fy = null;
    node.filter(function(d) { return d.selected; })
    .each(function(d) { //d.fixed &= ~6;
      d.fx = null;
      d.fy = null;
    })
  }

// hover
  function mouseover(d,i,nodes) {
//    svg.selectAll(".node").selectAll("circle").filter(function(d, index) {return index === i;}).transition()
//      .duration(500)
//      .attr("r", graphConf.nodeSize*2);
    d3.select(this)
      .call(highlightKin)
  }

  function mouseout(d,i,nodes) {
//    svg.selectAll(".node").selectAll("circle").filter(function(d, index) {return index === i;}).transition()
//        .duration(500)
//        .attr("r", graphConf.nodeSize);
    svg.selectAll(".link").style("stroke-opacity", 1);
    svg.selectAll(".node").style("fill-opacity", 1);
    d3.select(this)
      .call(removeHighlightKin)
  }

  function removeHighlightKin(hoveredNode) {
    var hoveredId = hoveredNode.node().__data__.id;
    var hoveredIndex = hoveredNode.node().__data__.index;
    var hoveredIdParent = hoveredNode.node().__data__.parentId;
    var hoveredIdChildren = hoveredNode.node().__data__.childrenId;

//  self
    svg.selectAll(".node").selectAll("circle").filter(function(d, i) {return i === hoveredIndex;})
    .style("fill-opacity", null)
//  Links
    svg.selectAll("line").filter(function(d) {
      return d.source.id == hoveredId || d.target.id == hoveredId;
    })
    .each(function() {
      //unfade links and nodes connected to the current node
      d3.select(this).style("stroke-opacity", null);
    });
//  Nodes
    svg.selectAll(".node").selectAll("circle").filter(function(d) {
      return hoveredIdParent.has(d.id) || hoveredIdChildren.has(d.id)
    })
    .style("fill-opacity", null);
  }

  function highlightKin(hoveredNode) {
    var hoveredId = hoveredNode.node().__data__.id;
    var hoveredIndex = hoveredNode.node().__data__.index;
    var hoveredIdParent = hoveredNode.node().__data__.parentId;
    var hoveredIdChildren = hoveredNode.node().__data__.childrenId;

//  Dim all nodes and links
    svg.selectAll(".link").style("stroke-opacity", 0.3);
    svg.selectAll(".node").style("fill-opacity", 0.3);

//  restore full opacity to the closely related nodes and links

//  self
    svg.selectAll(".node").selectAll("circle").filter(function(d, i) {return i === hoveredIndex;})
    .style("fill-opacity", 1)
//  Links
    svg.selectAll("line").filter(function(d) {
      return d.source.id == hoveredId || d.target.id == hoveredId;
    })
    .each(function() {
            //unfade links and nodes connected to the current node
            d3.select(this).style("stroke-opacity", 1);
    });
//  Nodes
    svg.selectAll(".node").selectAll("circle").filter(function(d) {
      return hoveredIdParent.has(d.id) || hoveredIdChildren.has(d.id)
    })
    .style("fill-opacity", 1);
  }

  return graph, graphConf;
};
