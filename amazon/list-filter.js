// ==UserScript==
// @name          Amazon List Filter
// @namespace     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/list-filter.js
// @version       0.1
// @description   Inserts a text box at the top of the item list dropdown, which will filter the list when changed
// @author        Justin Hyland (j@linux.com)
// @include       /^https?:\/\/www\.amazon\.com\/.*
// @match         /^https?:\/\/www\.amazon\.com\/.*
// @homepage      https://github.com/jhyland87/tampermonkey
// @grant         none
// @run-at        document-body
// @downloadURL   https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/list-filter.js
// @updateURL     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/amazon/list-filter.js
// ==/UserScript==

function filterList(txt){
  jQuery('.a-dropdown-item').each(function(idx,elem){
    var $titleElem = jQuery(elem).find('.atwl-hz-dd-list-name'),
        title = $titleElem.text().trim(),
        searchTxt = txt.trim()

    if ( ! txt || RegExp(txt,'i').test( title ) ){
      jQuery(elem).show()
    }
    else {
      jQuery(elem).hide()
    }
  })
}

(function() {
  'use strict';

  var lastState = false,
      searchDelay = 200,
      searchTimeout = null; // ms

  var interval = setInterval(function () {
    if (jQuery("[id^=a-popover-content-]").is(':visible')) {
      if ( lastState === false ){
        var search = jQuery('<input/>', { 
          id: 'favlist-search-input', 
          placeholder: 'Search List',
          style: 'width: 100%'
        });

        search.keyup(function() {
          if ( typeof searchTimeout === 'number' ){
            clearTimeout( searchTimeout );
          }

          searchTimeout = setTimeout(function(){ 
            var searchTxt = jQuery('#favlist-search-input').val().trim();
            filterList( searchTxt );
          }, searchDelay );
        });

        jQuery("[id^=a-popover-content-]").prepend(search);

        setTimeout(function(){ 
          jQuery('#favlist-search-input').focus()
        },100);
      }

      lastState = true;
    } else {
      lastState = false;
    }
  }, 100 );
})();


