var map;
var infowindow;
var request;
var service;
var drawn_shape;
var infoWindow;
var searchBox;
var pricing;
var rating;
var free_polygon;
var price_filter = false;
var rate_filter = false;
var markers = [];
var places_array = [];
var earthRadius = 6378137.0;

//  Displays map
function initMap(){
	var center = new google.maps.LatLng(34.0569172,-117.8239381);
	map = new google.maps.Map(document.getElementById('map'),{
		center: center,zoom:13,
		zoomControlOptions: {
			position: google.maps.ControlPosition.RIGHT_CENTER
		},
		streetViewControlOptions: {
			position: google.maps.ControlPosition.RIGHT_CENTER
		}
	});
	
	map.addListener('tilesloaded', function() {});

	//create drawing manager at center
	var drawingManager = create_draw_manager();
	drawingManager.setMap(map);

	// Create the search box and link it to the UI element.
	var input = document.getElementById('autocomplete');
	searchBox = new google.maps.places.SearchBox(input);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

	// Bias the SearchBox results towards current map's viewport.
	map.addListener('bounds_changed', function() {
		searchBox.setBounds(map.getBounds());
	});

	//infowindow for the markers
	infoWindow = new google.maps.InfoWindow();
	// Listen for the event fired when the user selects a prediction and retrieve
	// more details for that place.
	searchBox.addListener('places_changed', function() {
		toggle_sidebar();
		var side_bar_html = "";
		var places = searchBox.getPlaces();

		if (places.length == 0) {
			return;
		}

		// Clear out the old markers.
		clear_markers();
		places_array = [];

		// For each place, get the icon, name and location and place them into map
		bounds = new google.maps.LatLngBounds();
		places.forEach(function(place) {
			var icon = create_icon(place);
			if(drawn_shape == null && free_polygon == null){
				side_bar_html = push_place_sidebar(place, icon, bounds, side_bar_html);
			}
			else if(free_polygon != null){
				console.log("test");
				if(google.maps.geometry.poly.containsLocation(place.geometry.location, free_polygon)){
					side_bar_html = push_place_sidebar(place, icon, bounds, side_bar_html);
				}
			}
			else if(drawn_shape.type == google.maps.drawing.OverlayType.POLYGON){
				if(google.maps.geometry.poly.containsLocation(place.geometry.location, drawn_shape.overlay)){
					side_bar_html = push_place_sidebar(place, icon, bounds, side_bar_html);
				}
			}
			else if(drawn_shape.type == google.maps.drawing.OverlayType.CIRCLE){
				if(google.maps.geometry.spherical.computeDistanceBetween(place.geometry.location, 
					drawn_shape.overlay.getCenter()) <= drawn_shape.overlay.getRadius()){
					side_bar_html = push_place_sidebar(place, icon, bounds, side_bar_html);					
				}
			}
			else if(drawn_shape.type == google.maps.drawing.OverlayType.RECTANGLE){
				if(drawn_shape.overlay.getBounds().contains(place.geometry.location)){
					side_bar_html = push_place_sidebar(place, icon, bounds, side_bar_html);
				}
			}
		});
		// if(drawn_shape != null){
			// drawn_shape.overlay.setMap(null);
			// drawn_shape = null;
		// }
		document.getElementById("places").innerHTML = side_bar_html;
	});

	//Listens for any drawing events with circle rectangle or polygon
	google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event){
		if(drawn_shape != null){
			drawn_shape.overlay.setMap(null);
			drawn_shape = null;
		} 
		else if(free_polygon != null){
			free_polygon.setMap(null);
			free_polygon = null;
		} 
		drawn_shape = event;
		drawingManager.setDrawingMode(null);
		if(markers.length != 0) google.maps.event.trigger(searchBox, 'places_changed');
	});
	

	
	var customControlDiv = document.createElement('div');
    var customControl = new CustomControl(customControlDiv, map);

    customControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(customControlDiv);
	
	google.maps.Polygon.prototype.douglasPeucker = function(tolerance){
		var res = null;
		//adjust tolerance depending on the zoom level
		tolerance       = tolerance * Math.pow(2, 20 - map.getZoom());
		if(this.getPath() && this.getPath().getLength()){
			var points = this.getPath().getArray();

			var Line = function( p1, p2 ) {
				this.p1 = p1;
				this.p2 = p2;

				this.distanceToPoint = function( point ) {
					// slope
					var m = ( this.p2.lat() - this.p1.lat() ) / ( this.p2.lng() - this.p1.lng() ),
						// y offset
						b = this.p1.lat() - ( m * this.p1.lng() ),
						d = [];
					// distance to the linear equation
					d.push( Math.abs( point.lat() - ( m * point.lng() ) - b ) / Math.sqrt( Math.pow( m, 2 ) + 1 ) );
					// distance to p1
					d.push( Math.sqrt( Math.pow( ( point.lng() - this.p1.lng() ), 2 ) + Math.pow( ( point.lat() - this.p1.lat() ), 2 ) ) );
					// distance to p2
					d.push( Math.sqrt( Math.pow( ( point.lng() - this.p2.lng() ), 2 ) + Math.pow( ( point.lat() - this.p2.lat() ), 2 ) ) );
					// return the smallest distance
					return d.sort( function( a, b ) {
						return ( a - b ); //causes an array to be sorted numerically and ascending
					} )[0];
				};
			};

			var douglasPeucker = function( points, tolerance ) {
					
				if ( points.length <= 2 ) {
					return [points[0]];
				}
				var returnPoints = [],
					// make line from start to end 
					line = new Line( points[0], points[points.length - 1] ),
					// find the largest distance from intermediate poitns to this line
					maxDistance = 0,
					maxDistanceIndex = 0,
					p;
				for( var i = 1; i <= points.length - 2; i++ ) {
					var distance = line.distanceToPoint( points[ i ] );
					if( distance > maxDistance ) {
						maxDistance = distance;
						maxDistanceIndex = i;
					}
				}
				// check if the max distance is greater than our tollerance allows 
				if ( maxDistance >= tolerance ) {
					p = points[maxDistanceIndex];
					line.distanceToPoint( p, true );
					// include this point in the output 
					returnPoints = returnPoints.concat( douglasPeucker( points.slice( 0, maxDistanceIndex + 1 ), tolerance ) );
					// returnPoints.push( points[maxDistanceIndex] );
					returnPoints = returnPoints.concat( douglasPeucker( points.slice( maxDistanceIndex, points.length ), tolerance ) );
				} else {
					// ditching this point
					p = points[maxDistanceIndex];
					line.distanceToPoint( p, true );
					returnPoints = [points[0]];
				}
				return returnPoints;
			};
			res = douglasPeucker( points, tolerance );
			// always have to push the very last point on so it doesn't get left off
			res.push( points[points.length - 1 ] );
			this.setPath(res);
		}
		return this;
	};
}

function CustomControl(controlDiv, map) {

    // Set CSS for the control border
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#ffffff';
    controlUI.style.borderStyle = 'solid';
    controlUI.style.borderWidth = '1px';
    controlUI.style.borderColor = '#ccc';
    controlUI.style.height = '25px';
    controlUI.style.marginTop = '4px';
    controlUI.style.marginLeft = '-6px';
    controlUI.style.paddingTop = '1px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to set the map to Home';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var controlText = document.createElement('div');
    controlText.style.fontFamily = 'Arial,sans-serif';
    controlText.style.fontSize = '10px';
    controlText.style.paddingLeft = '4px';
    controlText.style.paddingRight = '4px';
    controlText.style.marginTop = '4px';
	controlText.style.fontWeight = 'bold';
    controlText.innerHTML = 'Free';
    controlUI.appendChild(controlText);

    // Setup the click event listeners
    google.maps.event.addDomListener(controlUI, 'click', function () {
		//Free Drawing Listener
		var overlay = new google.maps.OverlayView();
		overlay.draw = function () {};
		overlay.setMap(map);
		var isDrawing = false;
		var polyLine;
		var parcelleHeig = Array();
		map.setOptions({draggable: false});
		google.maps.event.addListenerOnce(map, 'mousedown', function () {
			isDrawing=true;
			polyLine = new google.maps.Polyline({
				map: map,
				clickable: false
			});
			$("#map").mousemove(function (e) {
				if(isDrawing == true)
				{
					var pageX = e.pageX;
					var pageY = e.pageY;
					var point = new google.maps.Point(parseInt(pageX), parseInt(pageY));

					var latLng = overlay.getProjection().fromDivPixelToLatLng(point);

					polyLine.getPath().push(latLng);

					latLng = String(latLng);
					latLng=latLng.replace("(","");
					latLng=latLng.replace(")","");

					var array_lng =  latLng.split(',');
					parcelleHeig.push(new google.maps.LatLng(array_lng[0],array_lng[1])) ;
				}
			});
		});
		google.maps.event.addListenerOnce(map, 'mouseup', function () {
			isDrawing=false;
			//console.log(parcelleHeig);
			if(free_polygon != null){
				free_polygon.setMap(null);
				free_polygon = null;
			} 
			else if(drawn_shape != null){
				drawn_shape.overlay.setMap(null);
				drawn_shape = null;
			} 
			free_polygon = new google.maps.Polygon({
				paths: parcelleHeig,
				strokeColor: "#0FF000",
				strokeOpacity: 0.8,
				strokeWeight: 2,
				fillColor: "#0FF000",
				fillOpacity: 0.35,
				editable:true,
				clickable: false,
				geodesic: false

			});
			
			//simplify polygon
			var douglasPeuckerThreshold = 3; // in meters
			free_polygon.douglasPeucker(360.0 / (2.0 * Math.PI * earthRadius));
			
			parcelleHeig=Array();
			free_polygon.setMap(map);
			if(polyLine != null) polyLine.setMap(null);
			map.setOptions({draggable: true});
			if(markers.length != 0) google.maps.event.trigger(searchBox, 'places_changed');
		});
    });
}

function push_place_sidebar(place, icon, bounds, side_bar_html){
	places_array.push(place);
	push_marker(place, icon);
	side_bar_html += '<a href="javascript:myclick(' + (markers.length-1) + ')">' + place.name + '<\/a><br>';
	return side_bar_html
}

function create_icon(place){
	var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
    };
	return icon;
}

function push_marker(place, icon){
	var marker = new google.maps.Marker({
		map: map,
		//icon: icon,
		title: place.name,
		position: place.geometry.location
	});
	var content_string = place.name.bold() + '<br>' + "Price Level: " + place.price_level;
	marker.addListener('click', function(){//makes markers clickable
		infoWindow.setContent(content_string);
		infoWindow.open(map, marker);
	});
	markers.push(marker);
}

// function place_marker_info(place, bounds){
	// if (place.geometry.viewport) {
		// // Only geocodes have viewport.
		// bounds.union(place.geometry.viewport);
		// } 
	// else {
		// bounds.extend(place.geometry.location);
	// }
// }

function create_draw_manager(){
	drawingManager = new google.maps.drawing.DrawingManager({
		drawingControl: true,
		drawingControlOptions: {
		  position: google.maps.ControlPosition.TOP_CENTER,
		  drawingModes: [
			google.maps.drawing.OverlayType.CIRCLE,
			google.maps.drawing.OverlayType.POLYGON,
			google.maps.drawing.OverlayType.RECTANGLE
		  ]
		},
		circleOptions: {
		  fillColor: '#ffff00',
		  fillOpacity: .2,
		  strokeWeight: .1,
		  clickable: true,
		  editable: true,
		  zIndex: 1
		},
		rectangleOptions:{
			fillColor: '#ffff00',
			fillOpacity: .2,
			strokeWeight: .1,
			clickable: true,
			editable: true,
			zIndex: 1
		},
		polygonOptions:{
			fillColor: '#ffff00',
			fillOpacity: .2,
			strokeWeight: .5,
			clickable: true,
			editable: true,
			zIndex: 1
		}
	});
	return drawingManager;
}

//Clears markers 
function clear_markers(){
	for(var marks in markers){
		markers[marks].setMap(null)
	}
	markers = [];
}

function toggle_sidebar(){
	document.getElementById("side_bar").style.display="inline";
	document.getElementById("map").style.width="80%";
	document.getElementById("map").style.left="20%";
}

function myclick(i){
	google.maps.event.trigger(markers[i], 'click');
}

function sort_by_price(price){
	if(price == 0) price_filter = false;
	else{
		price_filter = true;
		pricing = price;
	}
	if(rate_filter) sort_by_both(price, rating);
	else price_loop(price);
}

function price_loop(price){
	var side_bar_html = "";
	clear_markers();
	places_array.forEach(function(place){
		var icon = create_icon(place);
		if(price != 0){
			if(place.price_level == price){
				side_bar_html = sort_pusher(place, icon, side_bar_html);
			}
		}
		else{
			side_bar_html = sort_pusher(place, icon, side_bar_html);
		}
	});
	document.getElementById("places").innerHTML = side_bar_html;
}

function sort_by_rating(rate){
	if(rate == 0) rate_filter = false;
	else{
		rate_filter = true;
		rating = rate;
	}
	if(price_filter) sort_by_both(pricing, rate);
	else rating_loop(rate);
}

function rating_loop(rate){
	var side_bar_html = "";
	clear_markers();
	places_array.forEach(function(place){
		var icon = create_icon(place);
		if(rate != 0){
			if(place.rating >= rate){
				side_bar_html = sort_pusher(place, icon, side_bar_html);
			}
		}
		else{
			side_bar_html = sort_pusher(place, icon, side_bar_html);
		}
	});
	document.getElementById("places").innerHTML = side_bar_html;
}

function sort_by_both(price, rate){
	var side_bar_html = "";
	clear_markers();
	places_array.forEach(function(place){
		var icon = create_icon(place);
		if(price != 0 && rate != 0){
			if(place.price_level == price && place.rating >= rate){
				side_bar_html = sort_pusher(place, icon, side_bar_html);
			}
		}
		else if(price == 0){
			if(place.rating >= rate){
				side_bar_html = sort_pusher(place, icon, side_bar_html);
			}
		}
		else if(rate == 0){
			if(place.price_level == price){
				side_bar_html = sort_pusher(place, icon, side_bar_html);
			}
		}
		else side_bar_html = sort_pusher(place, icon, side_bar_html);
	});
	document.getElementById("places").innerHTML = side_bar_html;
}

function sort_pusher(place, icon, side_bar_html){
	push_marker(place, icon);
	return side_bar_html += '<a href="javascript:myclick(' + (markers.length-1) + ')">' + place.name + '<\/a><br>';
}



