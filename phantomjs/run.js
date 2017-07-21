var webpage = require('webpage');
var system = require('system');

var opts = {
    url : '',
    file : '',
    width : 0,
    height : 0,
    delay : 0,
    evaldelay : 0,
    evalcode : '',
    clip : '',
    clipwidth : 0,
    clipheight : 0,
    clipwithiframe : ''
};

var arg_opts = JSON.parse( system.args[1] );

for ( var property in arg_opts ) {
    if ( arg_opts.hasOwnProperty(property) ) {
        opts[ property ] = arg_opts[ property ];
    }
}

['width','height','delay','evaldelay','clipwidth','clipheight'].forEach( function( property ) {
    opts[ property ] = parseInt( opts[ property ] );
} );

var page = webpage.create();

page.viewportSize = { width: opts.width, height: opts.height };

if ( opts.clip || opts.clipwidth || opts.clipheight ) {
    var clipwidth = opts.clipwidth || opts.width;
    var clipheight = opts.clipheight || opts.height;
    page.clipRect = { top: 0, left: 0, width: clipwidth, height: clipheight };
}

if ( ( opts.clip || opts.clipwidth || opts.clipheight ) && opts.clipwithiframe ) {
    page.open( 'about:blank', function( status ) {
        page.evaluate(function(u,w,h){
            var obj = document.createElement("object");
            obj.name = "realpage";
            obj.data = u;
            obj.width = w;
            obj.height = h;
            obj.style.width = w + 'px';
            obj.style.height = h + 'px';
            document.body.appendChild(obj);
            document.body.style.margin = '0px';
            document.body.style.padding = '0px';

        }, opts.url, page.clipRect.width, page.clipRect.height );
        page.switchToFrame("realpage");
        page.onLoadFinished = function( status ) {
            if ( status !== 'success' ) {
                console.log('ERROR: Loading address "' + url + '" was not succesfull');
                phantom.exit(1);
            }
            else {
                if ( opts.evalcode ) {
                    window.setTimeout( function() {
                        page.evaluate( function( codetoeval ){
                            eval( codetoeval );
                        }, opts.evalcode );
                    }, opts.evaldelay );
                }
                window.setTimeout( function() {
                    page.render(opts.file);
                    phantom.exit();
                }, opts.delay );
            }
        };
    });
}
else {
    page.open( opts.url, function( status ) {
        if ( status !== 'success' ) {
            console.log('ERROR: Loading address "' + url + '" was not succesfull');
            phantom.exit(1);
        }
        else {
            if ( opts.evalcode ) {
                window.setTimeout( function() {
                    page.evaluate( function( codetoeval ){
                        eval( codetoeval );
                    }, opts.evalcode );
                }, opts.evaldelay );
            }
            window.setTimeout( function() {
                page.render(opts.file);
                phantom.exit();
            }, opts.delay );
        }
    });
}
