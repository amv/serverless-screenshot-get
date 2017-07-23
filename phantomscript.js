var webpage = require('webpage');
var system = require('system');

var opts = {
    preloadurl : '',
    preloadevalcode : '',
    preloadevaldelay : 0,
    preloaddelay : 0,
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
    cliptop : 0,
    clipleft : 0,
    clipwithiframe : '',
    iframescrollto : 0,
    iframescrolldelay : 0
};

var arg_opts = JSON.parse( system.args[1] );

for ( var property in arg_opts ) {
    if ( arg_opts.hasOwnProperty(property) ) {
        opts[ property ] = arg_opts[ property ];
    }
}

['width','height','delay','evaldelay','clipwidth','clipheight','cliptop','clipleft','iframescrollto','iframescrolldelay','preloadevaldelay','preloaddelay'].forEach( function( property ) {
    opts[ property ] = parseInt( opts[ property ] );
} );

var page = webpage.create();

if ( opts.preloadurl ) {
    page.open( opts.preloadurl, function( success ) {
        if ( opts.preloadevalcode ) {
            page.injectJs('jquery/jquery-1.12.4.min.js');
            setTimeout( function() {
                page.evaluate( function( codetoeval ){
                    eval( codetoeval );
                }, opts.preloadevalcode );
            }, opts.preloadevaldelay );
        }

        setTimeout( function() {
            dorealpageload();
        }, opts.preloaddelay );
    } );
}
else {
    dorealpageload();
}

function dorealpageload() {
    page.viewportSize = { width: opts.width, height: opts.height };

    if ( opts.clip || opts.clipwithiframe || opts.clipwidth || opts.clipheight || opts.cliptop || opts.clipleft ) {
        var clipwidth = opts.clipwidth || opts.width;
        var clipheight = opts.clipheight || opts.height;
        var cliptop = opts.cliptop || 0;
        var clipleft = opts.clipleft || 0;
        page.clipRect = { top: cliptop, left: clipleft, width: clipwidth, height: clipheight };
    }

    if ( opts.clipwithiframe ) {
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
                            page.switchToFrame("realpage");
                            page.injectJs('jquery/jquery-1.12.4.min.js');
                            page.switchToFrame("realpage");
                            page.evaluate( function( codetoeval ){
                                eval( codetoeval );
                            }, opts.evalcode );
                        }, opts.evaldelay );
                    }
                    if ( opts.iframescrollto ) {
                        window.setTimeout( function() {
                            page.switchToFrame("realpage");
                            page.evaluate( function( to ){
                                document.body.scrollTop = to;
                            }, opts.iframescrollto );
                        }, opts.iframescrolldelay );
                    }
                    window.setTimeout( function() {
                        page.switchToFrame("realpage");
                        page.evaluate(function(){
                            document.body.style.overflow = 'hidden';
                        });
                        page.switchToMainFrame();
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
                        page.injectJs('jquery/jquery-1.12.4.min.js');
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
};
