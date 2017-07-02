var webpage = require('webpage');
var system = require('system');

var url = system.args[1];
var file = system.args[2];
var width = system.args[3];
var height = system.args[4];
var delay = system.args[5];

var page = webpage.create();

page.viewportSize = { width: parseInt(width), height: parseInt(height) };

page.open( url, function( status ) {
  if ( status !== 'success' ) {
    console.log('ERROR: Loading address "' + url + '" was not succesfull');
    phantom.exit(1);
  }
  else {
    window.setTimeout( function() {
      page.render(file);
      phantom.exit();
    }, delay );
  }
});
