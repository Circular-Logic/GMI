var map;
var infowindow;
var request;
var service;
var markers = [];

//  Displays map
function initMap(){
  var center = new google.maps.LatLng(34.0569172,-117.8239381);
  map = new google.maps.Map(document.getElementById('map'),{
    center: center,zoom:11
  });

  request = {
    location: center,
    radius: 8047,
    types: ['atm']
  };

  infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, callback);

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.MARKER,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.CIRCLE,
        google.maps.drawing.OverlayType.POLYGON,
        google.maps.drawing.OverlayType.POLYLINE,
        google.maps.drawing.OverlayType.RECTANGLE
      ]
    },
    circleOptions: {
      fillColor: '#ffff00',
      fillOpacity: .1,
      strokeWeight: 1,
      clickable: false,
      editable: true,
      zIndex: 1
    }
  });
  drawingManager.setMap(map);


  //User can search by region when they right click a section on the map. Radius is set to
  //5 miles to start and looks only for places containing atm for demostration.

  google.maps.event.addListener(map, 'center_changed', function(event){
    map.setCenter(event.latLng)
    clearResults(markers)

    var request = {
      location: event.latLng,
      radius:8047,
      types:['atm']
    };
    service.nearbySearch(request, callback);

  })

  //Autocomplete functionality
  var ac = new google.maps.places.Autocomplete(document.getElementById('autocomplete'));
  google.maps.event.addListener(ac, 'place_changed', function(){
    var place = ac.getPlace();
    console.log(place.formatted_address);
    console.log(place.url);
    console.log(place.geometry.location);
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
////Displays results when page is fully loaded
//google.maps.event.addDomListener(window,'load',initialize);
