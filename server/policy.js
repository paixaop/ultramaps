// setup local CORS for Cordova testing
BrowserPolicy.content.allowOriginForAll("meteor.local");
BrowserPolicy.content.allowOriginForAll("*.openstreetmap.org");
BrowserPolicy.content.allowOriginForAll("*.tile.thunderforest.com");
BrowserPolicy.content.allowInlineScripts();
BrowserPolicy.content.allowEval();
