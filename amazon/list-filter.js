// ==UserScript==
// @name          Amazon List Filter
// @namespace     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/list-filter.js
// @version       0.1
// @description   Inserts a text box at the top of the item list dropdown, which will filter the list when changed
// @author        Justin Hyland (j@linux.com)
// @todo          Add list filter history, stored in localStorage perhaps
// @todo          Add a debug option that will show debugging output in the console
// @todo          Auto complete? (Of existing list titles)
// @include       /^https?:\/\/www\.amazon\.com\/.*
// @match         /^https?:\/\/www\.amazon\.com\/.*
// @homepage      https://github.com/jhyland87/tampermonkey
// @grant         none
// @run-at        document-body
// @downloadURL   https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/list-filter.js
// @updateURL     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/list-filter.js
// ==/UserScript==
 
/**
 * Filter Config stuff
 * @desc      Object containing the config values for the search input, filter logic, etc.
 * @namespace
 * @property  {object}        input                 -   Settings that pertain to the filter input element
 * @property  {string}        input.id              -   The ID of the filter input
 * @property  {string|array}  input.class           -   Custom classes (may be used for other scripts)
 * @property  {object}        input.css             -   CSS style(s)
 * @property  {object}        filter                -   Settings that pertain to the filter action
 * @property  {number}        filter.delay          -   Milliseconds to wait after input changes to filter
 * @property  {string|array}  filter.delimiters     -   Search delimiters, may be more than 1 char (EG: || or &&)
 * @property  {boolean}       filter.trim           -   Determines if the search strings should be trimmed
 * @property  {string|array}  filter.regexFlags     -   Any custom regex pattern matching flags
 * @property  {string|array}  filter.events         -   What events to execute the filter function on. This function
 *                                                      works best when limited to the events: keydown, keypress,
 *                                                      keyup, blur, click, dblclick, focus, focusin and focusout
 * @property  {object}        dropdownList          -   Settings that pertain to the dropdown element of list names
 * @property  {number}        dropdownList.interval -   Millisecond interval to wait when checking for list visibility
 * @property  {string}        dropdownList.selector -   CSS Selector for element in dropdown to search for
 */
var _CFG = {
  input: {
    id    : 'favlist-filter-input',
    class : '',
    css   : {
      width: '100%'
    }
  },
  filter: {
    delay         : 200,
    delimiters    : [ ';' ],
    trim          : true,
    regexFlags    : [],
    casesensitive : false,
    events        : [
      // This functionality works best when limited to the following events:
      //    keydown   - Fired when a key is pressed down
      //    keypress  - Fired when a key that produces a character value is pressed down
      //    keyup     - Fired when a key is released
      //    blur      - Fired when an element has lost focus
      //    click     - Fired when a pointing device button is pressed and released on a single element
      //    dblclick  - Fired when a pointing device button is clicked twice on a single element
      //    focus     - Fired when an element has received focus
      //    focusin   - Fired when an element is about to receive focus
      //    focusout  - Fired when an element is about to lose focus
      'keyup'
    ]
  },
  prioritizeRecent: {
    limit: 5,
    storage: window.sessionStorage // window.sessionStorage or window.localStorage
  },
  // Interval to wait when checking if the Favorites List menu is expanded or not
  dropdownList: {
    interval  : 100,
    selector  :  '#atwl-dd-ul'
    //selector:  '[id^=a-popover-content-]'
  }
};



/**
 *
 * TODO:
 * @todo    Search phrases in which an item list WAS clicked should be saved to history
 * @todo    Last N item lists that were clicked should be saved in history
 *
 */
 var x = window.AmazonUIPageJS._namespace("CommonDetailPageScripts")
x.when("jQuery").execute(function($) {
  console.debug('[CommonDetailPageScripts] arg "%s":', 'arguments', arguments)

  console.debug(Object.keys($))
})

(function( $ ) {
  'use strict';

  if ( ! $ ) {
    console.warn( 'jQuery not defined - aborting Amazon list filter' );
    return;
  }

  /**
   * Unique the value of an array
   * @param     {*}         elem  Array element value
   * @param     {number}    idx   Index of the current array element
   * @param     {array}     arr   Array being iterated over
   * @returns   {boolean}   Returns true if the element is in the array
   * @example   Array( 'a','b','c','b','c' ).filter( uniqueArray ) // ["a", "b", "c"]
   */
  function uniqueArray( elem, idx, arr ) {
    return arr.indexOf( elem ) === idx;
  }

  /**
   * Check if a provided value actually contains some legitimate data, Checks for things like strings w/ only spaces
   * and empty Symbol objects.
   * @desc      Function to determine if a provided value is empty. This makes checking some unorthodox value types
   *            much easier, such as Symbols.
   * @param     {*}   val   Value to analyze
   * @returns   {boolean}   True if analyzed value is empty
   * @example
   *  isEmpty( null )         // true
   *  isEmpty( undefined )    // true
   *  isEmpty( 'test' )       // false
   *  isEmpty( '' )           // true
   *  isEmpty( ' ' )          // true
   *  isEmpty( [1,2] )        // false
   *  isEmpty( [] )           // true
   *  isEmpty( {a:1} )        // false
   *  isEmpty( {} )           // true
   *  isEmpty( 6 )            // false
   *  isEmpty( 0 )            // false
   *  isEmpty( v => !v )      // false
   *  isEmpty( v => !v )      // false
   *  isEmpty( Symbol('a') )  // false
   *  isEmpty( Symbol('') )   // true
   *  isEmpty( Symbol(' ') )  // true
   *  isEmpty( Symbol('a ') ) // false
   */
  function isEmpty( val ){
    // Rule out null and undefined values
    if ( val === null || val === undefined ) {
      return true;
    }

    // Handle functions manually, since the .length will return 0
    if ( typeof val === 'function' ) {
      return false;
    }

      // Handle numbers differently (since the value 0 shouldnt be considered empty)
    if ( typeof val === 'number' ) {
      return ! val.toString().length;
    }

    // If the value is an object, then count the values
    if ( typeof val === 'object' && ! Array.isArray( val ) ) {
      return ! Object.values( val ).length;
    }

    // If it's a string, then trim it before checking
    if ( typeof val === 'string' ) {
      return ! val.trim().length;
    }

    // If its a Symbol, then check that the value within Symbol() has some content (other than just spaces)
    if ( typeof val === 'symbol' ) {
      return val.toString().match( RegExp( '^Symbol\\((.*[^ ].*)\\)$' ) ) === null;
    }
    //return val.toString().match(/^Symbol\((.*[^ ].*)\)$/) === null;

    // Anything else should work fine with the length property
    if ( val.hasOwnProperty( 'length' ) ) {
      return ! val.length;
    }

    // Anything else, just convert it to the opposing boolean
    return ! val;
  }

  /**
   * Count List Items
   *
   * @param   {bool,undef}  visMode   Item visibility status to count:
   *                                      true            = visible
   *                                      false           = hidden
   *                                      null/undefined  = all
   */
  function listItems( visMode ){
    //var checkFunc = ( idx, elem ) => ( visMode === null || visMode === undefined ? true : $( elem ).is(":visible") === !!visMode );

    return $( _CFG.dropdownList.selector ).find( 'li.a-dropdown-item' ).filter( function( idx, elem ){
      if ( visMode === null || visMode === undefined )
        return true;

      return $( elem ).is( ':visible' ) === !!visMode;
    });
  }

  function listItemPlaceholder( text ){
    if ( ! text ){
      if ( $('#item-list-placeholder').length ){
        $('#item-list-placeholder').remove()
      }
      return
    }

    if ( $('#item-list-placeholder').length ){
      if ( ! text ){
        $('#item-list-placeholder').remove()
      }
      else {
        $('#item-list-placeholder').html( text )
      }

      return 
    }

    if ( ! text ){
      return
    }

    var $placeholderLi = $('<li/>', {
      id: 'item-list-placeholder',
      class: 'a-dropdown-item',
      html: text, 
      css: { 
        'text-align': 'center',
        'padding': '5px 0 0 0',
        'color': '#b1b1b1',
        'font-style': 'italic'
      }
    })

    $('#atwl-dd-ul').append( $placeholderLi )
  }

  /**
   *
   * @desc    Function to iterate through the list items in the item list dropdown in the Amazon UI. This checks the
   *          list name against the value provided, setting the CSS display attribute.
   * @param     {string=}   txt   String to filter the list with. If null or undefined, all lists will be made visible.
   * @example   filterList( 'personal' )  // Show only lists with 'personal' in the title
   * @example   filterList( 'foo; bar' )  // Show only lists with 'foo' or 'bar' in the title (if delimiter is ';')
   * @example   filterList( null )        // Show all lists
   */
  function filterList( searchInput ){
    listItemPlaceholder()

    var searchTxt   = ( isEmpty( searchInput ) ? null : searchInput.trim() ),
        filterPtrn  = searchTxt,
        filterFlags = [];

    // If some delimiters are set, then split the search text by those delimiters and construct a regex pattern
    if ( ! isEmpty( _CFG.filter.delimiters ) ){
      var searchStrings = null;

      if ( typeof _CFG.filter.delimiters === 'string' ){
        searchStrings = searchTxt.split( _CFG.filter.delimiters );
      }
      else if ( typeof _CFG.filter.delimiters === 'object' && Array.isArray( _CFG.filter.delimiters ) ) {
        searchStrings = searchTxt.split( RegExp( '(' + _CFG.filter.delimiters + ')' ) );
      }

      // Only alter the filter pattern if there's more than 1 value provided after splitting by the delimiters
      if ( searchStrings.length > 1 ){
        filterPtrn = '(' + searchStrings.join( '|' ) + ')';
      }
    }

    // If case sensitivity isn't set to true, then add the 'i'
    if ( _CFG.filter.casesensitive !== true ){
      filterFlags.push( 'i' );
    }

    // If some custom regex flags are found in the config, then add them
    if ( ! isEmpty( _CFG.filter.regexFlags ) ){

      // Flags are single alpha characters, so a multi-charactered string can be split
      if ( typeof _CFG.filter.regexFlags === 'string' ){
        filterFlags.concat( _CFG.filter.regexFlags.split( '' ) );
      }

      // If its an array, then merge it
      else if ( Array.isArray( _CFG.filter.regexFlags ) ){
        filterFlags.concat( _CFG.filter.regexFlags );
      }
    }

    // If any flags are found, then filter out any duplicate values
    if ( filterFlags.length > 1 ){
      filterFlags = filterFlags.filter( uniqueArray );
    }

    var filterRegex = ( filterPtrn ? new RegExp( filterPtrn, filterFlags.join( '' ) ) : false ) ;

    // Iterate through the dropdown items,
    $( '.a-dropdown-item' ).each( function( idx, elem ){
      var $titleElem    = $( elem ).find( '.atwl-hz-dd-list-name' ),
          itemTitleTxt  = $titleElem.text().trim();

      // If theres no search string(s) then clear any HTML from the item title, show the element, then skip to the 
      // next dropdown item
      if ( ! searchTxt || ! filterRegex ){
        $titleElem.html( itemTitleTxt );
        $( elem ).show();
        return true;
      }

      var titleMatch  = itemTitleTxt.match( filterRegex );
      
      if ( titleMatch === null ){
        $( elem ).hide();
        return true;
      }

      var newTitle = itemTitleTxt

      // Unique the matches
      // var matches = Array.from(titleMatch).filter((v,i,s) => s.indexOf(v) === i );
      Array.from( titleMatch ).filter(function( value, index, self ) { 
        return self.indexOf( value ) === index; 
      }).forEach(function( str, idx ){
        var replHtml = $('<span/>', {
              css: {
                'text-decoration': 'underline',
                'color': '#4c91ff',
                'font-weight': 'bold'
              },
              text: str
            })
        var newStr = newTitle.replace( str, replHtml[0].outerHTML )
        $titleElem.html( newStr )
      })

      $( elem ).show();
    })

    if ( listItems( true ).length === 0 ){
      listItemPlaceholder( 'No list items found matching: <strong>' + searchInput + '</strong>' )
    }
  }

  
  /**
   * 
   */
  function listWatcher(){
    /**
     * Example of how to move a list item to the top of the list
    jQuery('a.a-link-normal.a-dropdown-link').click(function(e) {
      e.stopImmediatePropagation();
      var parentLink = jQuery(this).parent().parent()
      parentLink.parent().prepend(parentLink)
      console.log('parent:',parentLink)
    });
    */
    $('a.a-link-normal.a-dropdown-link').click(function(e) {
      var clickedName = $(e.currentTarget).find('.atwl-hz-dd-list-name:eq(0)')
      //e.stopImmediatePropagation();
      console.log('a.a-link-normal.a-dropdown-link CLICKED!')
      console.log('arguments:',arguments)
      console.log('e:',e)
      console.log('clickedName:',clickedName)
      console.log('clickedName.length:',clickedName.length)
      console.log('clickedName.text():',clickedName.text().trim())
    });

    // If the dropdown list is NOT visible, then just continue to the next iteration
    if ( ! $( _CFG.dropdownList.selector ).is( ':visible' ) ) {
      lastState = false;
      return;
    }

    // If this is the first iteration where the dropdown is visible, then insert the filter input
    if ( lastState === false ){
    // if the last state was false, then that means this is the first check in which the list is visible
      // Create a jQuery element for the filter input
      var filterInput = $( '<input/>', {
        id          : _CFG.input.id,
        placeholder : 'Search List'
      });

      // Custom CSS
      if ( typeof _CFG.input.css !== 'undefined' ){
        filterInput.css( _CFG.input.css );
      }

      // If any custom classes are defined, then add them
      if ( ! isEmpty( _CFG.input.class ) ){
        if ( Array.isArray( _CFG.input.class ) ){
          _CFG.input.class = _CFG.input.class.join( ' ' );
        }

        if ( typeof _CFG.input.class === 'string' ){
          filterInput.addClass( _CFG.input.class );
        }
      }

      /**
       * Filter event
       * @desc
       * @param   {e=}  Event   Event being fired (not used, as of yet)
       */
      var fnFilterEvent = function( e ) {
        // If a searchTimeout is defined, then clear it to avoid double searches
        if ( typeof searchTimeout === 'number' ){
          clearTimeout( searchTimeout );
        }

        // Start the timeout to execute the filterList function after the set delay
        searchTimeout = setTimeout( function() {
          var searchTxt = $( '#favlist-filter-input' ).val().trim();
          filterList( searchTxt );
        }, _CFG.filter.delay );
      }

      // If no events, default to keyup
      if ( isEmpty( _CFG.filter.events ) ){
        _CFG.filter.events = [ 'keyup' ];
      }

      // If events is a string, then split it to get multiple
      else if ( typeof _CFG.filter.events === 'string' ){
        _CFG.filter.events = _CFG.filter.events.split( ' ' );
      }

      // If its not an array, then default it and show a warning
      else if ( ! Array.isArray( _CFG.filter.events ) ){
        console.warn( 'Bad filter events value. Defaulting to keyup' );
        _CFG.filter.events = [ 'keyup' ];
      }

      // Iterate over a filtered events list, adding the filter function handler
      _CFG.filter.events.filter( uniqueArray ).forEach( function( e ){
        filterInput[ e ]( fnFilterEvent );
      });

      // Prepend the filter input at the top of the popover content list
      $( '[id^=a-popover-content-]' ).prepend( filterInput );

      // After the filter input is created, focus on it (after giving the dom a sec to load it)
      setTimeout( function(){
        $( '#favlist-filter-input' ).focus();
      }, 100 );
    }

    lastState = true;
  }

  var lastState         = false,  // Tmp val used to compare the current state to the previous state
      searchTimeout     = null,   // Val to assign the setTimeout() instances to
      watchListInterval = setInterval( listWatcher, _CFG.dropdownList.interval );
})( typeof jQuery !=='undefined' ? jQuery : null );
