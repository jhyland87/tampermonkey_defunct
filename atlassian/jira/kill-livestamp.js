// ==UserScript==
// @name          Kill Jira Livestamp
// @namespace     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/atlassian/jira/
// @version       0.1
// @description   This changes the friendly timestamp display values in Atlassian from values like: Now, Today, Yesterday, n Hours Ago, etc Then changes the <time> tags to <span> tags (since <time> tags get updated every couple seconds)
// @author        Justin Hyland (j@linux.com)
// @match         /^https?://.*\.atlassian\.com/
// @homepage      https://github.com/jhyland87/tampermonkey
// @grant         none
// @run-at        document-start
// @downloadURL   https://raw.githubusercontent.com/jhyland87/tampermonkey/master/atlassian/jira/kill-livestamp.js
// @updateURL     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/atlassian/jira/kill-livestamp.js
// ==/UserScript==
(function() {
  'use strict';

  var $time = $( 'time' );
  ;
  if ( $time.length ) {
    console.debug( 'Found %s <time> elements in DOM', $time.length );

    $time.each(function( idx, elm ){
      $( elm )
        .text( new Date( $( elm ).attr( 'datetime' ) ).toGMTString() )
        .replaceWith(function() { 
          return '<span>' + this.innerHTML + '</span>';
        });
    });
  }
  else {
    console.debug( 'No <time> elements found in DOM' );
  }
})();