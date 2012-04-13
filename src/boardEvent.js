/**
 * BoardEvent represents an event dispatched by Board
 * a BoardEvent object contains event type and corresponding details
 */
 
var BoardEvent = function(type, details) {
    ////////////////////////////////////////////////
    // Representation
    //
	this.type = type;
	this.details = details;
}