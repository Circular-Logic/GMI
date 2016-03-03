var map;
var infowindow;
var request;
var service;
var drawn_shape;
var infoWindow;
var can_change_zoom = true;
var markers = [];

//  Displays map
function initMap(){
  var center = new google.maps.LatLng(34.0569172,-117.8239381);
  map = new google.maps.Map(document.getElementById('map'),{
    center: center,zoom:13
  });


  //create drawing manager at center
  var drawingManager = create_draw_manager();
  drawingManager.setMap(map);

  // Create the search box and link it to the UI element.
  var input = document.getElementById('autocomplete');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });
  
  map.addListener('zoom_changed', function(){
	  can_change_zoom = true;
  });
  
  //infowindow for the markers
  infoWindow = new google.maps.InfoWindow();
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
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
			push_marker(place, icon);
			place_marker_info(place, bounds);
		}
		else if(drawn_shape.type == google.maps.drawing.OverlayType.POLYGON){
			if(google.maps.geometry.poly.containsLocation(place.geometry.location, drawn_shape.overlay)){
				push_marker(place, icon);	
				place_marker_info(place, bounds);
			}
		}
		else if(drawn_shape.type == google.maps.drawing.OverlayType.CIRCLE){
			if(google.maps.geometry.spherical.computeDistanceBetween(place.geometry.location, 
				drawn_shape.overlay.getCenter()) <= drawn_shape.overlay.getRadius()){
				push_marker(place, icon);
				place_marker_info(place, bounds);					
			}
		}
		else if(drawn_shape.type == google.maps.drawing.OverlayType.RECTANGLE){
			if(drawn_shape.overlay.getBounds().contains(place.geometry.location)){
				push_marker(place, icon);	
				place_marker_info(place, bounds);
			}
		}
		
	});
    if(can_change_zoom){
		map.fitBounds(bounds);
		can_change_zoom = false;
	}
	if(drawn_shape != null){
		drawn_shape.overlay.setMap(null);
		drawn_shape = null;
	} 	
  });
  
  //Listens for any drawing events with circle rectangle or polygon
  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event){
	  can_change_zoom = true;
	  if(drawn_shape != null){
		drawn_shape.overlay.setMap(null);
		drawn_shape = null;
	  } 
	  drawn_shape = event;
	  drawingManager.setDrawingMode(null);
  });
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

//Displays results
// function callback(results, status){
  // if(status == google.maps.places.PlacesServiceStatus.OK){
    // for(var i = 0; i < results.length; i++){
      // markers.push(createMarker(results[i]));
    // }
  // }
// }

//Clears markers 
function clear(markers){
  for(var marks in markers){
    markers[marks].setMap(null)
  }
  markers = [];
}
//Displays results when page is fully loaded
//google.maps.event.addDomListener(window,'load',initialize);

//hides or jumbotron depending which one we wanna use
function hide_jumbotron(){
	document.getElementById("jumbo").style.display="none";
}
