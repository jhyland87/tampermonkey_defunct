(function( $ ) {
  'use strict';

  if ( ! $ || typeof $ !== 'function' ){
    console.error( 'Unable to load custom jQuery functionality - jQuery not loaded' );
    return;
  }

  $.fn.extend({
    /**
     * jQuery function to get the DOM path to a specific element
     *  
     * @see       Source #1: http://stackoverflow.com/a/5708130
     * @see       Source #2: http://stackoverflow.com/a/22072325
     * @returns   string
     * @todo  Configure a "short" option, which will return the path that starts 
     *        at the nearest element with a unique ID (including the current item)
     */
    getPath: function () {
      var node = this[0],
          path = [], 
          i, innerText, tag, selector, classes;

      for ( i = 0; node && node.nodeType == 1; node = node.parentNode, i++ ) {
        innerText = node.childNodes.length === 0 ? node.innerHTML : '';
        tag = node.tagName.toLowerCase();
        classes = node.className;

        // Skip <html> and <body> tags
        if (tag === 'html' || tag === 'body')
          continue;

        if (node.id !== '') {
          // If node has an ID, use only the ID of the node
          selector = '#' + node.id;

          // To use this with jQuery, return a path once we have an ID
          // as it's no need to look for more parents afterwards.
          //return selector + ' ' + path;
        } else if (classes.length > 0) {
          // If node has classes, use the node tag with the class names appended
          selector = tag + '.' + classes.replace( / /g , '.' );
        } else {
          // If node has neither, print tag with containing text appended (if any)
          selector = tag + ( ( innerText.length > 0 ) ? ':contains("' + innerText + '")' : '' );
        }

        path.push( selector );
      }

      return path.reverse().join( ' > ' );
    }
  });
})( jQuery );