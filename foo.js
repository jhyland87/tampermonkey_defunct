// ==UserScript==
// @name          Miscellaneous Javascript utilities
// @namespace     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/foo.js
// @version       0.1
// @description   Add some additional methods to the standard javascript prototypes
// @author        Justin Hyland (j@linux.com)
// @include       *
// @match         *
// @homepage      https://github.com/jhyland87/tampermonkey
// @grant         none
// @run-at        document-body
// @downloadURL   https://raw.githubusercontent.com/jhyland87/tampermonkey/master/foo.js
// @updateURL     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/foo.js
// ==/UserScript==

(function() {
    'use strict';

    Object.prototype.filter = function( predicate, noErr ){
    if ( typeof predicate !== 'function' )
    throw new TypeError( 'Expected to receive a function as predicate - received typeof: '+ typeof predicate );

    var results = {};

    Object.keys( this ).forEach( key => {
    try {
      if ( predicate( this[ key ], key ) )
      results[ key ] = this[ key ];
    }
    catch( err ){
      if ( noErr !== true )
      throw err;
    }
    });

    return results;
  };

  console.log("LOADED 2!!");
})();