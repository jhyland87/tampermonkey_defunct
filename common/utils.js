'use strict';

/**
 * Static function used to determine if an external value is a string or not.
 * @name      String.isString
 * @summary   A simple static member used to determine if a value is a string
 * @desc      Similar to the isArray method of Array, this simply determines if a provided value is a string value.
 * @memberof  String
 * @param     {mixed}   value     Value to inspect
 * @return    {boolean}           Returns true if value is a string, false otherwise
 * @example   String.isString('foo')  // true
 * @example   String.isString(123)    // false
 * @example   String.isString([])     // false
 * @example   String.isString({})     // false
 */
String.isString = function( value ){
  return typeof value === 'string'
}

/**
 * Static function used to determine if an external value is a number or not.
 * @name      Number.isNumber
 * @summary   A simple static member used to determine if a value is a number
 * @desc      Similar to the isArray method of Array, this simply determines if a provided value is a number value.
 * @memberof  Number
 * @param     {mixed}   value     Value to inspect
 * @return    {boolean}           Returns true if value is a number, false otherwise
 * @example   Number.isNumber(12)   // true
 * @example   Number.isNumber(1.2)  // true
 * @example   Number.isNumber('12') // false
 */
Number.isNumber = function( value ){
  return typeof value === 'number'
}

/**
 * 
 * @name      
 * @summary   
 * @desc      
 * @memberof  
 * @param     
 * @return    
 * @example   
 */
String.isNumber = String.isFloat = Number.strNumber = Number.strFloat = function( value ){
  return parseFloat( value ) == value
}

/**
 * 
 * @name      
 * @summary   
 * @desc      
 * @memberof  
 * @param     
 * @return    
 * @example   
 */
String.isInt = Number.strInt = function( value ){
  return parseInt( value ) == value
}

/**
 * A filter function for plain JS objects, somewhat similar to the Array.prototype.filter() function for arrays.
 * @name      Object#filter
 * @summary   Filter through the contents of an object
 * @desc      Adds the ability to filter through the associated object by iterating through each child element while 
 *            executing the predicate function, handing both the element value and the element key.
 * @memberof  Object.prototype
 * @param     {function}  predicate       Function to use for filtering. 
 * @param     {boolean}   [noErr=false]   If this is set to true, then any exceptions thrown by the predicate 
 *                                        executions will be caught (defaults to false, halting on exceptions)
 * @return    {object}                    Returns an object containing only the filtered results
 * @example  Filtering an object by the value only
 *  { foo : 'bar', baz: '', qux: 'quux', corge: null }.filter( value => !!value ) 
 *      // {foo: "bar", qux: "quux"}
 * @example  Filtering an object by the key and value
 *  window.location.filter(( value, key ) => ['host', 'protocol', 'port', 'search'].indexOf(key) !== -1 && value )
 *      // protocol: "https:", host: "github.com"}
 */
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
    };
  });
  
  return results;
}

/**
 * 
 * @name      Array#remove
 * @summary   
 * @desc      
 * @memberof  Array.prototype
 * @param     {string|number|array|function}   predicate    What to remove from array
 * @return    {null|array}           Returns a list of removed items, or null of nothing removed
 * @example   Number.isNumber(12)   // true
 * @example   Number.isNumber(1.2)  // true
 * @example   Number.isNumber('12') // false
 */
Array.prototype.remove = function( predicate ) {
  console.debug('[Array.prototype.remove]  this: ', this)
  var removed = []

  if ( typeof predicate === 'function' ){
    for( var idx=0; idx<this.length; idx++ ){
    //for( var idx in this ){
      console.debug('#%s (%s):', idx, typeof this[idx], this[idx])
      if ( predicate( this[idx], idx ) === true ){
        removed.push(this[idx])
        this.splice( idx, 1 )
      }
    }
    return removed
  }
  
  if ( String.isString(predicate) || Number.isNumber(predicate) ) 
    predicate = [predicate]

  if ( Array.isArray(predicate) ){
    predicate.forEach(pred => {
      if ( this.indexOf(pred) !== -1 ){
        for( var idx in this ){
          if ( this[idx] === pred ){
            removed.push(this[idx])
            this.splice( idx, 1 )
          }
        }
      }     
    })

    return removed
  }  
}