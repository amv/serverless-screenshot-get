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

if ( opts.clipwidth || opts.clipheight ) {
    var clipwidth = opts.clipwidth || opts.width;
    var clipheight = opts.clipheight || opts.height;
    page.clipRect = { top: 0, left: 0, width: clipwidth, height: clipheight };
}

if ( ( opts.clipwidth || opts.clipheight ) && opts.clipwithiframe ) {
    var page_to_open = 'about:blank';

    // If we need to eval something in the iframe context, we need the same origin
    // so we open the page itself and try to replace it's content with the iframe
    if ( opts.evalcode ) {
        page_to_open = opts.url;
    }

    page.open( page_to_open, function( status ) {
        page.evaluate(function(u,w,h){
            // NOTE: can we do more to make the old page state disappear?
            document.body.parentNode.innerHTML = '<body></body>';

            var obj = document.createElement("object");
            obj.data = u;
            obj.width = w;
            obj.height = h;
            obj.style.width = w + 'px';
            obj.style.height = h + 'px';
            document.body.appendChild(obj);
            document.body.style.margin = '0px';
            document.body.style.padding = '0px';

        }, opts.url, page.clipRect.width, page.clipRect.height );

        if ( opts.evalcode ) {
            window.setTimeout( function() {
                page.evaluate( function( codetoeval ){
                    // contentWindow is not accessible here so we need to execute the
                    // code through contentDocument, using a "bookmarklet" strategy
                    // while hoping JSON wrapper is enough to escape the code string
                    var cteaj = JSON.stringify( [ codetoeval ], null, 0 );
                    var bookmarklet = 'javascript:void((function(){eval('+cteaj+'[0])})())';
                    document.getElementsByTagName("object")[0].contentDocument.location.href = bookmarklet;
                }, opts.evalcode );
            }, opts.evaldelay );
        }
        window.setTimeout( function() {
            page.render(opts.file);
            phantom.exit();
        }, opts.delay );
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
