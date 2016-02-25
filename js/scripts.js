var map;
var infowindow;
var request;
var service;
var drawn_shape;
var markers = [];

//  Displays map
function initMap(){
  var center = new google.maps.LatLng(34.0569172,-117.8239381);
  map = new google.maps.Map(document.getElementById('map'),{
    center: center,zoom:13
  });

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.MARKER,
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
    }
  });
  drawingManager.setMap(map);

  // Create the search box and link it to the UI element.
  var input = document.getElementById('autocomplete');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  var markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }
	
    // Clear out the old markers.
    clear(markers);

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });
  
  //Listens for any drawing events with circle rectangle or polygon
  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event){
	  if(drawn_shape != null){
		drawn_shape.overlay.setMap(null);
		drawn_shape = null;
	  } 
	  drawn_shape = event;
  });
}



//Displays results
function callback(results, status){
  if(status == google.maps.places.PlacesServiceStatus.OK){
    for(var i = 0; i < results.length; i++){
      markers.push(createMarker(results[i]));
    }
  }
}

//Create markers for results
function createMarker(place){
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map:map,
    position: place.geometry.location
  });

  //Shows more info when marker is clicked
  google.maps.event.addListener(marker, 'click', function(){
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
  return marker;
}

//Clears markers when right click
function clear(markers){
  for(var marks in markers){
    markers[marks].setMap(null)
  }
  markers = []
}
//Displays results when page is fully loaded
//google.maps.event.addDomListener(window,'load',initialize);
