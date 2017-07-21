'use strict';

const execFile = require('child_process').execFile;
const fs = require('fs');

var config = {
    default_timeoutms : process.env.default_timeoutms || 29000,
    default_delayms : process.env.default_delayms || 10,
    default_width : process.env.default_width || 1280,
    default_height : process.env.default_height || 1024,
    required_secret : process.env.required_secret || 'none',
};

module.exports.get = (event, context, callback) => {
    let data = event.queryStringParameters || {};
    const errorcb = function( code, message ) {
        callback(null, { statusCode: code, body: message, headers: { "Content-Type" : "text/plain" } } );
    }

    if ( ! data.url ) {
        return errorcb( 400, 'Missing url' );
    }
    if ( config.required_secret && config.required_secret != 'none' ) {
        if ( ! data.secret || config.required_secret != data.secret ) {
            return errorcb( 401, 'Wrong secret' );
        }
    }

    const uid = new Date().getTime();
    const file = `/tmp/${uid}.png`;
    const width = data.width || config.default_width || 1280;
    const height = data.height || config.default_height || 1024;
    const timeout = data.timeoutms || config.default_timeoutms || 29000;
    const delay = data.delayms || config.default_delayms || 0;
    const evaldelay = data.evaldelayms || config.default_evaldelayms || 0;
    const url = data.url;
    const clipheight = data.clipheight || 0;
    const clipwidth = data.clipwidth || 0;
    const clipwithiframe = data.clipwithiframe || '';
    const evalcode = data.evalcode || '';

    let childProcess;
    let timeoutHandler;

    timeoutHandler = setTimeout( function() {
        timeoutHandler = false;
        if ( ! childProcess ) {
            return;
        }
        childProcess.kill();
    }, parseInt( timeout ) );

    var opts = {
        url : url,
        file : file,
        width : width,
        height : height,
        delay : delay,
        evaldelay : evaldelay,
        evalcode : evalcode,
        clipwidth : clipwidth,
        clipheight : clipheight,
        clipwithiframe : clipwithiframe
    };
    childProcess = execFile('./phantomjs/phantomjs-2.1.1-linux-x86_64', ['--ignore-ssl-errors=true', './phantomjs/run.js', JSON.stringify(opts) ], { timeout : timeout }, (error, stdout, stderr) => {
        childProcess = false;
        if ( ! timeoutHandler ) {
            return errorcb( 408, 'ERROR: Timeout of '+ timeout +"ms exceeded\n\nSTDERR:\n\n" + error + "\n\nSTDOUT:\n\n" + stdout );
        }

        clearTimeout( timeoutHandler );

        if ( error ) {
            return errorcb( 500, error + "\n\nSTDOUT:\n\n" + stdout );
        }
        else {
            const fb = fs.readFileSync(file);
            return callback(null, { statusCode: 200, body: fb.toString('base64'), isBase64Encoded: true, headers: { "Content-Type" : "image/png" } } );
        }
    } );

};
