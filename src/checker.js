/**
 * Checker represents a playing piece on 
 * the checkerboard.  Checkers may be red or black.
 * A checker may also be a king (usually represented in the physical
 * game by a stack of two checkers, but here represented simply by
 * a boolean property, isKing). 
 */
 
var Checker = function(color, isKing) {
    ////////////////////////////////////////////////
    // Representation
    //
	if (color != "red" && color != "black") {
		alert('color must be one of "red" or "black"');
	}

	this.color = color;			
	this.isKing = isKing;			
	this.row;
	this.col;

	////////////////////////////////////////////////
	// Public methods
	//

	this.toString = function(){			
		var name = this.color;
		if (this.isKing) name = name.toUpperCase();
		return name;
	}
}