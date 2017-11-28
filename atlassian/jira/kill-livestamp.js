// ==UserScript==
// @name          Kill Jira Livestamp
// @namespace     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/atlassian/jira/
// @version       0.1
// @description   This changes the friendly timestamp display values in Atlassian from values like: Now, Today, Yesterday, n Hours Ago, etc Then changes the <time> tags to <span> tags (since <time> tags get updated every couple seconds)
// @author        Justin Hyland (j@linux.com)
// @include       /^https?:\/\/.*\.atlassian\.net\/?.*/
// @match         /^https?:\/\/.*\.atlassian\.net\/?.*/
// @homepage      https://github.com/jhyland87/tampermonkey
// @grant         none
// @run-at        document-end
// @downloadURL   https://raw.githubusercontent.com/jhyland87/tampermonkey/master/atlassian/jira/kill-livestamp.js
// @updateURL     https://raw.githubusercontent.com/jhyland87/tampermonkey/master/atlassian/jira/kill-livestamp.js
// ==/UserScript==



(function() {
  'use strict';

  if ( ! $ || typeof $ !== 'function' ){
    console.error( 'Unable to fully load the Tampermonkey script kill-livestamp.js - jQuery is required, but not found' );
  }
  else {
    var $time = $( 'time' );

    if ( $time.length ) {
      console.debug( 'Found %s <time/> %s in DOM', 
        $time.length, 
        ( $time.length === 1 ? 'element' : 'elements' ) );

      $time.each(function( idx, elm ){
        var timestamp = new Date( $( elm ).attr( 'datetime' ) ).toGMTString();

        $( elm )
          .text( timestamp )
          .replaceWith('<span>' + this.innerHTML + '</span>')
          .parents( 'dd.date' )
          .prop( 'title', timestamp );
      });
    }
    else {
      console.debug( 'No <time> elements found in DOM' );
    }
  }
})();

//$('time').eq(0).parent('span').parent('dd').prop('title','aaaa')
//$('time').eq(0).parents('dd.date').prop('title')