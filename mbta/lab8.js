// station coordinates
var southStation      = new google.maps.LatLng(42.352271, -71.05524200000001);
var andrew            = new google.maps.LatLng(42.330154, -71.057655);
var porterSquare      = new google.maps.LatLng(42.3884, -71.11914899999999);
var harvardSquare     = new google.maps.LatLng(42.373362, -71.118956);
var jfkUmass          = new google.maps.LatLng(42.320685, -71.052391);
var savinHill         = new google.maps.LatLng(42.31129, -71.053331);
var parkStreet	      = new google.maps.LatLng(42.35639457, -71.0624242);
var broadway	        = new google.maps.LatLng(42.342622, -71.056967);
var northQuincy       = new google.maps.LatLng(42.275275, -71.029583);
var shawmut	          = new google.maps.LatLng(42.29312583, -71.06573796000001);
var davisSquare	      = new google.maps.LatLng(42.39674, -71.121815);
var alewife	      = new google.maps.LatLng(42.395428, -71.142483);
var kendallMIT	      = new google.maps.LatLng(42.36249079, -71.08617653);
var charlesMGH        = new google.maps.LatLng(42.361166, -71.070628);
var downtownCrossing  = new google.maps.LatLng(42.355518, -71.060225);
var quincyCenter      = new google.maps.LatLng(42.251809, -71.005409);
var quincyAdams       = new google.maps.LatLng(42.233391, -71.007153);
var ashmont	      = new google.maps.LatLng(42.284652, -71.06448899999999);
var wollaston	      = new google.maps.LatLng(42.2665139, -71.0203369);
var fieldsCorner      = new google.maps.LatLng(42.300093, -71.061667);
var centralSquare     = new google.maps.LatLng(42.365486, -71.103802);
var braintree         = new google.maps.LatLng(42.2078543, -71.0011385);

// array of stations
var stations = [
  ['South Station',    42.352271,   -71.05524200000001], 
  ['Andrew',           42.330154,   -71.057655], 
  ['Porter Square',    42.3884,     -71.11914899999999], 
  ['Harvard Square',   42.373362,   -71.118956], 
  ['JFK/UMass',        42.320685,   -71.052391], 
  ['Savin Hill',       42.31129,    -71.053331], 
  ['Park Street',      42.35639457, -71.0624242], 
  ['Broadway',         42.342622,   -71.056967], 
  ['North Quincy',     42.275275,   -71.029583],
  ['Shawmut',          42.29312583, -71.06573796000001],
  ['Davis',            42.39674,    -71.121815],
  ['Alewife',          42.395428,   -71.142483],
  ['Kendall/MIT',      42.36249079, -71.08617653],
  ['Charles/MGH',      42.36249079, -71.08617653],
  ['Downtown Crossing',42.355518,   -71.060225],
  ['Quincy Center',    42.251809,   -71.005409],
  ['Quincy Adams',     42.233391,   -71.007153],
  ['Ashmont',          42.284652,   -71.06448899999999],
  ['Wollaston',        42.2665139,  -71.0203369],
  ['Fields Corner',    42.300093,   -71.061667],
  ['Central Square',   42.365486,   -71.103802],
  ['Braintree',        42.2078543,  -71.0011385]
] 

function init()
{
  var settings = {
    zoom: 13,
    center: southStation, // centers map at South Station
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  // create map
  var map = new google.maps.Map(document.getElementById("map_canvas"), settings);

  // locate user and place marker/infoWindow	
  findMe(map);

  var schedule = [];
  // get data using XML request
  var request = new XMLHttpRequest();
  request.open("GET", "https://powerful-depths-66091.herokuapp.com/redline.json", true);
  request.onreadystatechange = function() {
    getTrips(request, map);
  };
  request.send();

  drawPolylines(map);
}

// getTrips
// args: XML request 
// parses JSON data to find trips per stop
function getTrips(request, map)
{
  if(request.readyState == 4 && request.status == 200){
    var schedPerStation = [];
    var raw = request.responseText;
    var trainsData = JSON.parse(raw);
    for(var i=0;i<trainsData.TripList.Trips.length;i++){
      for(var j=0;j<trainsData.TripList.Trips[i].Predictions.length;j++){
        schedPerStation.push({"Station": trainsData.TripList.Trips[i].Predictions[j].Stop,
          "Destination": trainsData.TripList.Trips[i].Destination,
          "Time": trainsData.TripList.Trips[i].Predictions[j].Seconds,
          "TripID": trainsData.TripList.Trips[i].TripID});
      }
    }
    drawMarkers(map, schedPerStation);
  }

}

// findMe
// arguments: map
// finds user's current position and draws a marker
function findMe(map)
{
  if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position) {
      var myPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };



      // find closest station, display name and distance
      var closestStation = findClosestStop(myPos.lat, myPos.lng);
      var distance = haversine(myPos.lat, myPos.lng, closestStation[1], closestStation[2]);
      var displayD = distance.toString();
      var message  = String(closestStation[0] + ' is the closest stop. \n'+  displayD + ' miles away.');

      // create and place an infoWindow
      var infoWindow = new google.maps.InfoWindow({
        map: map,
        content: message
      });
      infoWindow.close();

      // place a marker on position	
      var myMarker = new google.maps.Marker({
        map: map,
        title: 'Your Location',
        animation: google.maps.Animation.DROP,
        infoWindow: infoWindow
      });

      myMarker.setPosition(myPos);
      myMarker.addListener('click', function() {
        infoWindow.open(map, myMarker);
      });

      lineToStop(map, myPos, closestStation);
    });
  }
  else {
    console.log("Failed");
  }
}

// lineToStop
// args: map, your position, the closest station
// renders a line between current position and the closest stop
function lineToStop(map, myPos, closestStation)
{
  var path = [myPos, {lat: closestStation[1], lng: closestStation[2]}];
  var line = new google.maps.Polyline({
    path: path,
    strokeColor: '#ff0000',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });

  line.setMap(map);
}

// use the haversine formula to find the closest stop
function findClosestStop(myLat, myLng)
{
  var shortestDistance = 9999999999999; //initializing shortestDistance as the large number so that
  //the first station distance will be lower
  var closestStation;

  for(var i=0;i<stations.length;i++) {
    var station = stations[i];
    var distance = haversine(myLat, myLng, station[1], station[2]);
    if(distance < shortestDistance){
      shortestDistance = distance;
      closestStation = station;

    }
  }	

  return closestStation;
}

// Haversine formula in JavaScript from Stack Overflow
function haversine(lat1, lng1, lat2, lng2)
{
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }

  var R = 6371; // earth in km
  var x1 = lat2-lat1;
  var dLat = x1.toRad();
  var x2 = lng2-lng1;
  var dLng = x2.toRad();
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
    Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;

  return d;		
}

// drawMarkers
// arguments: map
// draws markers at all red line stations
function drawMarkers(map, schedule)
{
  var image = {
    url: 'marker.png',
    anchor: new google.maps.Point(0,60),
  }


  for(var i = 0; i < stations.length; i++){
    var station = stations[i];
    var content = "";
    if(schedule.length > 0){
      content = "<table style> <tr><th>Destination</th><th>Station</th><th>Seconds Away</th><th>Trip ID</th></tr>";

      // infoWindows
      for(var j=0;j<schedule.length;j++){
        if(schedule[j].Station == station[0]){
          content += "<tr><td>" + schedule[j].Destination + "</td> <td>" + schedule[j].Station + "</td> <td>" 
            + schedule[j].Time + "</td> <td>" + schedule[j].TripID + "</td></tr>";

        }
      }

      content += "</table>"
    }
    else{
      content = "No Trains Available";
    }

    var infoWindow = new google.maps.InfoWindow({
      map: map,
      content: content
    });
    infoWindow.close();

    var marker = new google.maps.Marker({
      position: {lat: station[1], lng: station[2]},
      map: map,
      icon: image,
      title: station[0],
      infoWindow: infoWindow
    });

    google.maps.event.addListener(marker, 'click', function () {
      this.infoWindow.open(map, this);
    });
  }
}


// drawPolyLines
// arguments: map
// draws the path of the red line using polylines
function drawPolylines(map)
{
  var trainPath = [alewife, davisSquare, porterSquare, harvardSquare, centralSquare,
    kendallMIT, charlesMGH, parkStreet, downtownCrossing, southStation,
    broadway, andrew, jfkUmass, northQuincy, wollaston, quincyCenter,
    quincyAdams, braintree];	
  var trainPathLines = new google.maps.Polyline({
    path: trainPath,
    strokeColor: '#ff0000',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });


  var ashmontBound = [jfkUmass, savinHill, fieldsCorner, shawmut, ashmont];
  var ashmontPathLines = new google.maps.Polyline({
    path: ashmontBound,
    strokeColor: '#ff0000',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });

  trainPathLines.setMap(map);
  ashmontPathLines.setMap(map);
}
