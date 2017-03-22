/**
 * This changes the friendly timestamp display values in Atlassian from values like: Now, Today, Yesterday, n Hours Ago, etc
 * Then changes the <time> tags to <span> tags (since <time> tags get updated every couple seconds)
 */
var $time = $( 'time' )
if ( $time.length ) {
  console.debug( 'Found %s <time> elements in DOM', $time.length )

  $time.each(function( idx, elm ){
    $( elm )
      .text( new Date( $( elm ).attr( 'datetime' ) ).toGMTString() )
      .replaceWith(function() { 
        return '<span>' + this.innerHTML + '</span>'
      })
  })
}
else {
  console.debug( 'No <time> elements found in DOM' )
}