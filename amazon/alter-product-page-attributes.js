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

/**
 * Check if the browser supports ES6. If it doesn't, then self destruct.
 */
try {
  new Function("(a = 0) => a");
}
catch ( err ){
  throw new Error( 'What?! Your browser doesn\'t support ES6? To hell with you.' );
}

/**
 * Tampermonkey Debug function - Only outputs data if document.tampermonkeyDebug == true
 */
function _log( ){
  var args      = Array.from(arguments),
      logType   = 'log',
      logTypes  = [ 'log','debug','error','info','warn' ];

  if ( args.length === 0 ) return null;

  if ( logTypes.indexOf( args[0] ) !== -1 )
    logType = args.shift();

  console[ logType ].apply( this, args );
}

/**
 * Processes Amazin Page Info
 * @name      processPageInfo
 * @desc      This function processes the amazon page to check if its a valid product page. If so,
 *            set document.originalData with some original info, and set/return document.amznPageInfo 
 *            with amazon specific info.
 * @event     document#keypress
 * @param     {KeyboardEvent}   event                                     Instance of KeyboardEvent
 * @property  {object}          document.originalData                     Some preserved original page data, defined 
 *                                                                        before any changes
 * @property  {string}          document.originalData.title               Original document.title value
 * @property  {string}          document.originalData.location            Original window.location value
 * @property  {string}          document.originalData.uri                 Original document.documentURI value
 * @property  {object}          document.amznPageInfo                     Amazon page specific data
 * @property  {object}          document.amznPageInfo.product             Amazon product specific data
 * @property  {object}          document.amznPageInfo.product.prodTitle   Value of product title with 'Amazon.com' 
 *                                                                        removed (to shorten it up for bookmarks)
 * @property  {object}          document.amznPageInfo.product.href        Full product page href
 * @property  {object}          document.amznPageInfo.product.pathname    Pathanme (EG: Product-Name/dp/B00ABCDEF)
 * @property  {object}          document.amznPageInfo.product.ID          Product ID (EG: B00ABCDEF)
 * @property  {object}          document.amznPageInfo.product.UrlValue    Product name in URL (EG: Product-Name)
 * @property  {object}          document.amznPageInfo.product.shortHref   Products tiny URL (EG: http://amzn.com/B00ABCDEF)
 * @return    {object|boolean}  Should set document.amznPageInfo and document.originalData, or false if processing fails
 */
function processPageInfo (){
  var pageInfo = {
        product:{}
      },
      linkElem      = document.getElementsByTagName('link'),
      locationPath  = window.location.pathname,
      titleElem     = document.querySelector('title'),
      docTitle      = document.title,
      prodTitlePtrn = new RegExp('^Amazon.com\\s*[:|]\\s*'),
      cononicalLink = Array.from( document.getElementsByTagName('link')).filter( link => link.getAttribute('rel') === 'canonical' );

  if ( document.originalData === undefined ){
    _log( 'debug', 'Looks like document.originalData was NOT previously defined - populating it' );

    document.originalData = {
      title     : document.title,
      location  : window.location,
      uri       : document.documentURI
    };
  }
  else {
    _log( 'debug', 'Looks like document.originalData WAS previously defined' );
  }

  // If the product info has been populated before, then just return that.
  if ( document.amznPageInfo !== undefined ){
    _log( 'debug', 'Looks like document.amznPageInfo WAS previously defined - returning it' );
    return document.amznPageInfo;
  }

  _log( 'debug', 'Looks like document.amznPageInfo was NOT previously defined - moving forward with processing' );

  // If a cononical link was found, then redefine the cononicalLink to the first result, or null
  cononicalLink = cononicalLink.length > 0 ? 
    cononicalLink[0] :
    null;

  if ( locationPath.substr(1).length !== 0 )
    pageInfo.origHref = locationPath.substr(1);

  // If theres a title set (which would be weird if it wasnt), then check if its a product title
  if ( docTitle !== null ){
    pageInfo.docTitle = docTitle.trim();

    // If the document title matches the product title pattern, then update the document title
    if ( prodTitlePtrn.test( docTitle ) ){
      var prodTitle = docTitle.replace( prodTitlePtrn, '' );

      if ( prodTitle === document.title )
        _log( 'debug', 'The original document title (%s) and the product page title (%s) are the same - Not setting product.title', document.title, prodTitle );
      else
        pageInfo.product.title = prodTitle;
    }
  }

  // If any <link> elements are found, then iterate through them looking for the products cononical HREF
  if ( cononicalLink ){
    pageInfo.product.href       = cononicalLink.getAttribute('href');
    pageInfo.product.pathname   = '/' + pageInfo.product.href.split('/').slice(-3).join('/');
    pageInfo.product.ID         = pageInfo.product.href.split('/').slice(-1)[0];
    pageInfo.product.UrlValue   = pageInfo.product.href.split('/').slice(-3)[0];
    pageInfo.product.shortHref  = "http://amzn.com/" + pageInfo.product.ID;
  }

  if ( Object.keys( pageInfo.product ).length === 0 )
    delete pageInfo.product;

  document.amznPageInfo = Object.keys(pageInfo).length === 0 ? 
    false : 
    pageInfo;

  _log( 'debug', 'Setting document.amznPageInfo to:',document.amznPageInfo);

  return document.amznPageInfo;
}

/**
 * Update the document href to the real product URL
 * @name    setProductUrl
 * @desc    This function processes the data set/returned by processPageInfo() and sets the page URL to the proper 
 *          product URL without any extra $_GET data or hash value. Makes it easier to share and bookmark
 * @event   document#DOMContentLoaded
 * @param   {Event} event   Instance of Event, triggered by DOMContentLoaded event
 */
function setProductUrl( event ){
  var pageInfo = processPageInfo();

  if ( ! pageInfo.product.href || pageInfo.product.href === pageInfo.origHref ){
    console.error( 'Could not find the products true HREF value - pageInfo object:', pageInfo );
    return;
  }

  if ( pageInfo.product.title ){
    _log( 'debug', 'Setting the page title to the product title: %s', pageInfo.product.title );
    document.title = pageInfo.product.title;
  }

  if ( pageInfo.product.pathname ){
    try {
      history.pushState(
        history.state,
        pageInfo.product.title,
        pageInfo.product.pathname );

      _log( 'debug','Successfully changed pathname from %s to %s', document.originalData.location.pathname, pageInfo.product.pathname );
    }
    catch ( err ){
      _log( 'error','Error changing pathname from %s to %s - details below', document.originalData.location.pathname, pageInfo.product.pathname);

      var errDat = Object.keys( Object.getOwnPropertyDescriptors(err) );

      for ( var errIdx in errDat )
        _log( 'error', '  %s: %o', errDat[errIdx], err[errDat[errIdx]] );
    }
  }
}

/**
 * Display products short URL value
 * @name      processPageInfo
 * @desc      This function processes the amazon page to check if its a valid product page. If so, then create an event
 *            that will prompt the products short URL if a hotkey is pressed (alt + a). This URL is much shorter and 
 *            easier to handle.
 * @note      Its not possible to set the current document HREF due to the fact that the short URL (http://amzn.com) is
 *            not the same as the current URL (https://amazon.com).
 * @param     {KeyboardEvent}   event           
 */
function showShortUrl( event ){
  var pageInfo = processPageInfo();

  if ( ! pageInfo )
    throw new Error( 'Failed to retrieve the processed page information object from processPageInfo()' );

  if ( ! pageInfo.product.href ||  pageInfo.product.href === pageInfo.origHref ){
    _log( 'error', 'Could not find the products true HREF value - pageInfo object:', pageInfo );
    return;
  }

  if ( event.type === 'keypress' &&
    event.code &&
    event.code.toLowerCase() === 'keya' &&
    event.altKey === true ){

    if ( ! pageInfo.product && pageInfo.product.shortHref ){
      _log( 'debug', 'Hotkey pressed, but no cononical URL for this product is available' );
      return;
    }

    prompt( "The short URL for this product is:", pageInfo.product.shortHref );
  }
}

if ( supportsES6 === false )
  throw new Error( 'What?! Your browser doesn\'t support ES6? To hell with you.' );

_log( 'debug','Woot, you support ES6. God bless your heart.');

document.addEventListener( 'DOMContentLoaded', setProductUrl );
document.addEventListener( 'keypress', showShortUrl );