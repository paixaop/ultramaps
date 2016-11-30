// on startup run resizing event
Meteor.startup(function() {
  $(window).resize(function() {
    $('#map').css('height', window.innerHeight - 82 - 45);
  });
  $(window).resize(); // trigger resize event
});

// create marker collection
var Markers = new Meteor.Collection('markers');
var map = null;
var line = null;
var previousMarker = null;

Meteor.subscribe('markers');

Template.map.rendered = function() {
  L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images/';

  map = L.map('map', {
    doubleClickZoom: false
  });

  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© <a target="_parent" href="http://www.openstreetmap.org">OpenStreetMap</a> and contributors, under an <a target="_parent" href="http://www.openstreetmap.org/copyright">open license</a>'
		}).addTo(map);

  var track = new L.KML("/ultraman_run.kml", {async: true});
  var trackPoints = null;
  var userId = "123";

  track.on("loaded", function(e) {
      map.fitBounds(e.target.getBounds());
      trackPoints = e.target.latLngs;
      line = L.polyline(trackPoints,  {
        distanceMarkers: { offset: 1600 }
      });
      map.addLayer(line);
  });

  //map.addLayer(track);
  //L.tileLayer.provider('Thunderforest.Outdoors').addTo(map);
  var point = 0;
  var timer = setInterval( () => {
    var currentLocation = trackPoints[point++];
    if (point >= trackPoints.length) {
      clearInterval(timer);
    }
    console.log(currentLocation);
    Meteor.call('updateUserPosition', userId,
      currentLocation);
  }, 200);

  map.on('dblclick', function(event) {
    console.log(event.latlng);
    Markers.insert({latlng: event.latlng, user: userId});
  });

  var query = Markers.find({ user : userId });
  query.observe({
    added: function(document) { updateMarker(document); },
    changed: function(document) { updateMarker(document); },
    removed: function (oldDocument) {
      layers = map._layers;
      var key, val;
      for (key in layers) {
        val = layers[key];
        if (val._latlng) {
          if (val._latlng.lat === oldDocument.latlng.lat && val._latlng.lng === oldDocument.latlng.lng) {
            map.removeLayer(val);
          }
        }
      }
    }
  });
};

function distanceOnPath(map, pLine, point, maxDistance) {
    var totalLineLength = L.GeometryUtil.length(pLine) / 1600;
    var closest = L.GeometryUtil.closest(map, pLine, point, true);
    if (closest.distance > maxDistance) {
        console.log('not on path');
        return {
            totalLineLength: totalLineLength,
            distanceFromStart: -1
        };
    }
    var loc = new L.LatLng(closest.lat, closest.lng);
    var ratioFromStart = L.GeometryUtil.locateOnLine(map, pLine, loc);
    var distanceFromStart = ratioFromStart * totalLineLength;
    return {
        totalLineLength: totalLineLength,
        distanceFromStart: distanceFromStart
    };
}

function updateMarker(document) {
    if (!map || !line) {
        console.log('need a map and polyline');
        return;
    }
    var marker = L.marker(document.latlng)
    .on('click', function(event) {
        map.removeLayer(marker);
        Markers.remove({_id: document._id});
    });
    var loc = new L.LatLng(document.latlng.lat, document.latlng.lng);
    var res = distanceOnPath(map, line, loc, 500);
    if (res.distanceFromStart == -1) {
        marker.bindTooltip(`Return to course`, {permanent: true, offset: [0, 0] });
    }
    else {
        marker.bindTooltip(`${res.distanceFromStart.toFixed(1)} mi`, {permanent: true, offset: [0, 0] });
    }

    marker.addTo(map);
    if (previousMarker) {
        map.removeLayer(previousMarker);
    }
    previousMarker = marker;
    //map.panTo(document.latlng);
}