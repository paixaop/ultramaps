// marker collection
var Markers = new Meteor.Collection('markers');
Meteor.publish("markers", function () {
  return Markers.find();
});

// Listen to incoming HTTP requests, can only be used on the server
WebApp.connectHandlers.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return next();
});

Meteor.methods({

  updateUserPosition: function(user, newPosition, point) {
    Markers.upsert({
        user: user
      }, {
        $set: {
          latlng: newPosition,
          user: user,
          point: point
        }
      });
  }

});