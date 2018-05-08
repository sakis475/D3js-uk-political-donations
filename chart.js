// Configure and load meSpeak library
meSpeak.loadConfig("mespeak/mespeak_config.json");
meSpeak.loadVoice("mespeak/voices/en/en-us.json");

// GLOBALS
var w = 1100,h = 900;
var padding = 2;
var nodes = [];
var force, node, data, maxVal;
var brake = 0.2;
var radius = d3.scale.sqrt().range([10, 20]);
var images = [];

var partyCentres = { 
    con: { x: w / 3, y: h / 3.3}, 
    lab: {x: w / 3, y: h / 2.3}, 
    lib: {x: w / 3	, y: h / 1.8}
  };

var entityCentres = { 
    company: {x: w / 3.65, y: h / 2.3},
		union: {x: w / 3.65, y: h / 1.8},
		other: {x: w / 1.15, y: h / 1.9},
		society: {x: w / 1.12, y: h  / 3.2 },
		pub: {x: w / 1.8, y: h / 2.8},
		individual: {x: w / 3.65, y: h / 3.3},
	};

var fill = d3.scale.ordinal().range(["#008000","#FF0000", "#0000FF"]);

var svgCentre = { 
    x: w / 3.6, y: h / 2
  };




var svg = d3.select("#chart").append("svg")
	.attr("id", "svg")
	.attr("width", w)
	.attr("height", h);





var nodeGroup = svg.append("g");

var tooltip = d3.select("#chart")
 	.append("div")
	.attr("class", "tooltip")
	.attr("id", "tooltip");

var comma = d3.format(",.0f");

function transition(name) {
	if (name === "all-donations") {
		$("#initial-content").fadeIn(250);
		$("#value-scale").fadeIn(1000);
		$("#view-donor-type").fadeOut(250);
		$("#view-source-type").fadeOut(250);
		$("#view-party-type").fadeOut(250);
		$("#view-by-amount").fadeOut(250);
		return total();
		//location.reload();
	}
	if (name === "group-by-party") {
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-by-amount").fadeOut(250);
		$("#view-donor-type").fadeOut(250);
		$("#view-source-type").fadeOut(250);
		$("#view-party-type").fadeIn(1000);
		return partyGroup();
	}
	if (name === "group-by-donor-type") {
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-by-amount").fadeOut(250);
		$("#view-party-type").fadeOut(250);
		$("#view-source-type").fadeOut(250);
		$("#view-donor-type").fadeIn(1000);
		return donorType();
	}
	if (name === "group-by-amount") {
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-donor-type").fadeOut(250);
		$("#view-party-type").fadeOut(250);
		$("#view-source-type").fadeOut(250);
		$("#view-by-amount").fadeIn(1000);
		return amountSort();
	}
	if (name === "group-by-money-source")
		$("#initial-content").fadeOut(250);
		$("#view-by-amount").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-donor-type").fadeOut(250);
		$("#view-party-type").fadeOut(250);
		$("#view-source-type").fadeIn(1000);
		return fundsType();
	}

function start() {

	node = nodeGroup.selectAll("circle")
		.data(nodes)
	.enter().append("circle")
		.attr("class", function(d) { return "node " + d.party; })
		.attr("amount", function(d) { return d.value; })
		.attr("donor", function(d) { return d.donor; })
		.attr("entity", function(d) { return d.entity; })
		.attr("party", function(d) { return d.party; })
		// disabled because of slow Firefox SVG rendering
		// though I admit I'm asking a lot of the browser and cpu with the number of nodes
		//.style("opacity", 0.9)
		.attr("r", 0)
		.style("fill", function(d) { return fill(d.party); })
		.on("mouseover", mouseover)
		.on("mouseout", mouseout)
		// Alternative title based 'tooltips'
		// node.append("title")
		//	.text(function(d) { return d.donor; });
		.on("click", mouseClick);

		force.gravity(0)
			.friction(0.75)
			.charge(function(d) { return -Math.pow(d.radius, 2) / 3; })
			.on("tick", all)
			.start();

		node.transition()
			.duration(2500)
			.attr("r", function(d) { return d.radius; });
}

function total() {

	force.gravity(0)
		.friction(0.9)
		.charge(function(d) { return -Math.pow(d.radius, 2) / 2.8; })
		.on("tick", all)
		.start();
}

function partyGroup() {
	force.gravity(0)
		.friction(0.8)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", parties)
		.start()
		.colourByParty();
}

function donorType() {
	force.gravity(0)
		.friction(0.8)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", entities)
		.start();
}



function fundsType() {
	force.gravity(0)
		.friction(0.75)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", types)
		.start();
}

function parties(e) {
	node.each(moveToParties(e.alpha));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}

function entities(e) {
	node.each(moveToEnts(e.alpha));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}



function amountSort() {
	force.gravity(0)
		.friction(0.8)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", byAmount)
		.start();
}

function byAmount(e) {
	node.each(moveTobyAmount(e.alpha));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}

function types(e) {
	node.each(moveToFunds(e.alpha));


		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}

function all(e) {
	node.each(moveToCentre(e.alpha))
		.each(collide(0.001));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}


function moveToCentre(alpha) {
	return function(d) {
		var centreX = svgCentre.x + 75;
			if (d.value <= 25001) {
				centreY = svgCentre.y + 75;
			} else if (d.value <= 50001) {
				centreY = svgCentre.y + 55;
			} else if (d.value <= 100001) {
				centreY = svgCentre.y + 35;
			} else  if (d.value <= 500001) {
				centreY = svgCentre.y + 15;
			} else  if (d.value <= 1000001) {
				centreY = svgCentre.y - 5;
			} else  if (d.value <= maxVal) {
				centreY = svgCentre.y - 25;
			} else {
				centreY = svgCentre.y;
			}

		d.x += (centreX - d.x) * (brake + 0.06) * alpha * 1.2;
		d.y += (centreY - 100 - d.y) * (brake + 0.06) * alpha * 1.2;
	};
}

function moveToParties(alpha) {
	return function(d) {
		var centreX = partyCentres[d.party].x + 50;
		if (d.entity === 'pub') {
			centreX = 1200;
		} else {
			centreY = partyCentres[d.party].y;
		}

		d.x += (centreX - d.x) * (brake + 0.02) * alpha * 1.1;
		d.y += (centreY - d.y) * (brake + 0.02) * alpha * 1.1;
	};
}

function moveToEnts(alpha) {
	return function(d) {
		var centreY = entityCentres[d.entity].y;
		if (d.entity === 'pub') {
			centreX = 1200;
		} else {
			centreX = entityCentres[d.entity].x + 30;
		}

		d.x += (centreX - d.x) * (brake + 0.02) * alpha * 1.1;
		d.y += (centreY - d.y) * (brake + 0.02) * alpha * 1.1;
	};
}

function moveToFunds(alpha) {
	return function(d) {
		var centreY = entityCentres[d.entity].y;
		var centreX = entityCentres[d.entity].x;
		if (d.entity !== 'pub') {
			centreY = 300;
			centreX = 350;
		} else {
			centreX = entityCentres[d.entity].x + 60;
			centreY = 380;
		}
		d.x += (centreX - d.x) * (brake + 0.02) * alpha * 1.1;
		d.y += (centreY - d.y) * (brake + 0.02) * alpha * 1.1;
	};
}

function moveTobyAmount(alpha) {
	return function(d) {
	var centreX;
	var centreY;
	//	console.log(svgCentre.y);
	//y =+ 100    x = 300 or 750
			if (d.value <= 25001) {
				centreY = 700;
				centreX = 300;
				
			} else if (d.value <= 50001) {
				centreY = 600;
				centreX = 750;
				
			} else if (d.value <= 100001) {
				centreY = 500;
				centreX = 300;
				
			} else  if (d.value <= 1000001) {
				centreY = 400;
				centreX = 750;
				
			} else  if (d.value <= maxVal) {
				centreY = 300;
				centreX = 300;
			}

		d.x += (centreX - d.x) * (brake + 0.06) * alpha * 1.2;
		d.y += (centreY - 100 - d.y) * (brake + 0.06) * alpha * 1.2;
	};
}

// Collision detection function by m bostock
function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = d.radius + radius.domain()[1] + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2
          || x2 < nx1
          || y1 > ny2
          || y2 < ny1;
    });
  };
}

function display(data) {

	maxVal = d3.max(data, function(d) { return d.amount; });

	var radiusScale = d3.scale.sqrt()
		.domain([0, maxVal])
			.range([10, 20]);

	data.forEach(function(d, i) {
		var y = radiusScale(d.amount);
		var node = {
				radius: radiusScale(d.amount) / 5,
				value: d.amount,
				donor: d.donor,
				party: d.party,
				partyLabel: d.partyname,
				entity: d.entity,
				entityLabel: d.entityname,
				color: d.color,
				x: Math.random() * w,
				y: -y
      };
			
      nodes.push(node)
	});

	console.log(nodes);

	force = d3.layout.force()
		.nodes(nodes)
		.size([w, h]);

	return start();
}

//Public variables, gia mouseover kai mouseout
var voiceID;
var playVoice;




function mouseover(d, i) {
	// tooltip popup
	var mosie = d3.select(this);
	var amount = mosie.attr("amount");
	var donor = d.donor;
	var party = d.partyLabel;
	var entity = d.entityLabel;
	var offset = $("svg").offset();
	
	

	


	// image url that want to check
	
	var imageFile = "https://raw.githubusercontent.com/ioniodi/D3js-uk-political-donations/master/photos/" + donor + ".ico";


	/*taken from 
	https://stackoverflow.com/questions/34771777/detect-if-given-url-is-proper-image-in-js-synchronously*/

	function isValidImg( url ) {
	    return new Promise( function ( resolve, reject ) {

	        var image = new Image;

	        image.onload = function ( ) { resolve( image ) };
	        image.onerror = image.onabort = reject;

	        image.src = url;
	    } );
	}

	isValidImg( imageFile ).then( function ( image, donor ) {
    
    	var k = images.indexOf(imageFile);
	
		if(k > 0) {
			images.splice(k, 1);
			images.unshift(imageFile);
		} else if (k == -1) {
			images.unshift(imageFile);
		} else {
			//do nothing
		}

		dynamicPics(donor);

	}, function ( event ) {
	    
	    

	} );
	

	

	

	
	// *******************************************
	
	

	
	var infoBox = "<p> Source: <b>" + donor + "</b> " +  "<span><img src='" + imageFile + 
								"' height='42' width='42' onError='this.src=\"https://github.com/favicon.ico\";'></span></p>"
	
	 							+ "<p> Recipient: <b>" + party + "</b></p>"
								+ "<p> Type of donor: <b>" + entity + "</b></p>"
								+ "<p> Total value: <b>&#163;" + comma(amount) + "</b></p>";
	
	
	mosie.classed("active", true);
	d3.select(".tooltip")
  	.style("left", (parseInt(d3.select(this).attr("cx") - 80) + offset.left) + "px")
    .style("top", (parseInt(d3.select(this).attr("cy") - (d.radius+150)) + offset.top) + "px")
		.html(infoBox)
			.style("display","block");


	




	



	



	
	/*στελνω και το d για να μπορώ να εξακριβώσω αργότερα ποιός έχει τη φωτογραφία*/
	




	//Kanei speech to donor name meta apo 0,3 deytera
    playVoice = setTimeout(function() {
		voiceID = meSpeak.speak(d.donor + " has donated, " + amount + ",pounds");
	}, 300);


	
	
	}










/*render dynamicPics*/

function dynamicPics(donor) {
	
	
	if(images.length > 12) {
		images.pop();
		donImage.remove();
		
		
	}

	for(i = 0; i < 12; i++) {
		
		donImage = svg.append("svg:image")
		.attr('x', 10)
		.attr('y', 10 + i * 70)
		.attr('width', 60)
		.attr('height', 60)
		.attr("xlink:href", images[i]);

	}

	
}






function mouseout() {
	// no more tooltips
		var mosie = d3.select(this);

		mosie.classed("active", false);

		d3.select(".tooltip")
			.style("display", "none");


		//Stamataei opoio setTimeout playVoice htan programatismeno
		window.clearTimeout(playVoice);
		//Stamataei opoia VoiceID paizei twra
		meSpeak.stop(voiceID);
		}


function mouseClick() {
	
		//Anoigei ena link me click se kathe mplala gia ola ta node me click 
		
		
		nodeGroup.selectAll("circle")
		.on('click', function(d) {
        console.log('open tab')
        window.open(
          "http://www.google.com/search?q=" + d.donor,
          '_blank' // <- This is what makes it open in a new window.
        );
      });
	}

$(document).ready(function() {
		d3.selectAll(".switch").on("click", function(d) {
      var id = d3.select(this).attr("id");
      return transition(id);
    });
    return d3.csv("data/7500up.csv", display);

});


