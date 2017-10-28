// ==UserScript==
// @name          Amazon product page title and URL path simplifier
// @namespace     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/alter-product-page-attributes.js
// @version       0.1
// @description   Changes the URL by taking out any useless parameters or hash values and setting it to the proper URL; Removes the "Amazon.com: " prefix from the HTML title.
// @author        Justin Hyland (j@linux.com)
// @include       /^https?:\/\/www\.amazon\.com\/.*
// @match         /^https?:\/\/www\.amazon\.com\/.*
// @homepage      https://github.com/jhyland87/tampermonkey
// @grant         none
// @run-at        document-body
// @downloadURL   https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/alter-product-page-attributes.js
// @updateURL     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/alter-product-page-attributes.js
// ==/UserScript==

document.addEventListener("DOMContentLoaded", function modifyUrl( event ){
  var docTitle = document.querySelector("title"),
      titlePtrn = new RegExp('^Amazon.com\\s*:\\s*'),
      origPath = window.location.pathname;

  if ( titlePtrn.test( docTitle.innerText ) )
    docTitle.innerText = docTitle.innerText.replace( titlePtrn, '' );

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
    catch ( err ){
      console.error('Error changing pathname from %s to %s - details below', origPath, newPath);

      var errDat = Object.keys(Object.getOwnPropertyDescriptors(err));

      for ( i in errDat ) 
        console.error( '  %s: %o', errDat[i], err[errDat[i]] );
    }

    return false;
  })
});