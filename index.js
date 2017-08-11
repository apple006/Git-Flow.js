'use strict';

const  FS = require('fs'),  Path = require('path'),  URL = require('url');

const Git = require('simple-git/promise')(),
      Request = require('request-promise-native');


//  Git hook by Husky

var message = FS.readFileSync( process.env.GIT_PARAMS );

var info = message.match( /^([\s\S]+)(Close|Fix)\s+\#(\d+)([\s\S]*)/i )  ||  '';

var issue = parseInt( info[3] ),
    title = (info[1] || '').trim(),
    detail = (info[4] || '').trim();

if (! issue)  process.exit( 0 );


//  GitLab API

const Config = require( Path.join(process.cwd(), 'config.json') );


Promise.all([
    Git.raw(['config', 'remote.origin.url']),
    Git.branchLocal()
]).then(function () {

    var remote = URL.parse( arguments[0][0] ),  branch = arguments[0][1];

    return Request({
        method:     'POST',
        uri:        `${remote.origin}/api/v4/projects/${
            encodeURIComponent( remote.pathname )
        }/merge_requests`,
        headers:    {
            'PRIVATE-TOKEN':    Config.Git_Token,
        },
        json:       {
            source_branch:             '',
            target_branch:             'master',
            title:                     title,
            description:               detail,
            approvals_before_merge:    1
        }
    });
}).then(function () {

    process.exit( 0 );

},  function () {

    process.exit( arguments[0].code );
});