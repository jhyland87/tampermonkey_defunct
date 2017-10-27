// ==UserScript==
// @name          Update Amazon product URL
// @namespace     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/update-product-url.js
// @version       0.1
// @description   Changes the URL by taking out any useless parameters or hash values and setting it to the proper URL
// @author        Justin Hyland (j@linux.com)
// @include       /^https?:\/\/www\.amazon\.com\/.*
// @match         /^https?:\/\/www\.amazon\.com\/.*
// @homepage      https://github.com/jhyland87/tampermonkey
// @grant         none
// @run-at        document-body
// @downloadURL   https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/update-product-url.js
// @updateURL     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/update-product-url.js
// ==/UserScript==

(function() {
  'use strict';

  if ( ! $ || typeof $ !== 'function' ){
    console.error( 'Unable to fully load the Tampermonkey script kill-livestamp.js - jQuery is required, but not found' );
  }
  else {
  document.addEventListener("DOMContentLoaded", modifyUrl );
  }
})();

function modifyUrl( event ){
  var origPath = window.location.pathname;

  Array.from( document.getElementsByTagName('link') ).forEach(function( link, idx ){
    if ( link.getAttribute('rel') !== 'canonical' )
      return;

    var newPath = link.getAttribute('href');

    if ( origPath === newPath )
      return false;

    console.debug( 'Changing URL from %s to %s', origPath, newPath );

    try {
      history.pushState(
        history.state,
        document.title,
        newPath );

      console.info('Successfully changed pathname from %s to %s', origPath, newPath );
    }
    catch (e){
      console.error('Error changing pathname from %s to %s - %s', origPath, newPath, e);
    }

    return false;
  })
}


try {
   throw 'myException'; // generates an exception
}
catch (e) {
   // statements to handle any exceptions
   logMyErrors(e); // pass exception object to error handler
}