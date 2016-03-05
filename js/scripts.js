var map;
var infowindow;
var request;
var service;
var drawn_shape;
var infoWindow;
var searchBox;
var markers = [];
var places_array = [];

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
		clear(markers);

		// For each place, get the icon, name and location and place them into map
		bounds = new google.maps.LatLngBounds();
		places.forEach(function(place) {
			var icon = create_icon(place);
			if(drawn_shape == null){
				side_bar_html = push_place_sidebar(place, icon, bounds, side_bar_html);
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
		if(drawn_shape != null){
			drawn_shape.overlay.setMap(null);
			drawn_shape = null;
		}
		document.getElementById("places").innerHTML = side_bar_html;
	});

	//Listens for any drawing events with circle rectangle or polygon
	google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event){
		if(drawn_shape != null){
			drawn_shape.overlay.setMap(null);
			drawn_shape = null;
		} 
		drawn_shape = event;
		drawingManager.setDrawingMode(null);
		if(markers.length != 0) google.maps.event.trigger(searchBox, 'places_changed');
	});
}

function push_place_sidebar(place, icon, bounds, side_bar_html){
	places.push(place);
	push_marker(place, icon);
	place_marker_info(place, bounds);
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

function place_marker_info(place, bounds){
	if (place.geometry.viewport) {
		// Only geocodes have viewport.
		bounds.union(place.geometry.viewport);
		} 
	else {
		bounds.extend(place.geometry.location);
	}
}

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
		}
	});
	return drawingManager;
}

//Clears markers 
function clear(markers){
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

function sort_by_price(){
	var side_bar_html = "";
	places_array.forEach(function(place){
		if(place.price == 2){
			var icon = create_icon(place);
		}
	});
}

