/**
 * Board represents the state of a checkerboard. A checkerboard is a square
 * array of squares. Although checkerboards are normally 8x8, Board can
 * represent any size checkerboard.
 * <p>
 * Each square of the checkboard may contain at most one Checker, or it may be
 * empty. Each square is identified by its row and column, numbered from 0 to
 * size-1.  Square [0,0] is in the upper-left corner of the checkerboard.
 * Rows are numbered downward, and columns are numbered to the right.  Square 
 * [0,0] is white, and black and white squares alternate across each row and 
 * down each column.  
 * <p>
 * Boards are mutable: checkers can be added, removed, and moved
 * (The size of a board is immutable, however.)
 * <p>
 * The board broadcasts three event types: "add",
 * "remove", "move", respectively.  The event parameter in all 
 * cases has type BoardEvent. 
 */

var Board = function(size) {
    ////////////////////////////////////////////////
    // Representation
    //

    // boardSize is number of squares on one side of checkerboard
    this.boardSize = size;
    
    // square is a two dimensional array representating the checkerboard
    // square[row][col] is the Checker in that square, or null if square is empty
    this.square = new Array(this.boardSize);
    // make an empty checkerboard
    for (var i=0; i<=this.boardSize; i++){
		this.square[i] = [];
	}
    
    // if true, enables representation invariant checking
    this.doCheckRep = true;

    this.checkRep = function() {
        if (this.doCheckRep) {
            for (var r in this.square) {
                for (var c in this.square[r]) {
                    if (this.square[r][c]) {
                    	checker = this.square[r][c];
                    	assertTrue(checker.row == r && checker.col == c, "Board representation invariant broken, at " + r + "," + c + "!=" + checker.row + "," + checker.col);
                    }
                }
            }
        }
    };
    
    /*
     * Test whether row and column identify a square.
     * @throws Error if either row or col 
     * is outside the range [0,size-1]
     */
    this.isValidLocation = function(row, col) {
        if (row < 0 || col < 0 || row >= this.boardSize || col >= this.boardSize) {
        	//alert("square [" + row + "," + col + "] is not found " + " in this " + size + "x" + size + " board");
        	return false;
        }
        return true;
    }

    /*
     * Test whether the square at [row,col] is empty.
     * @throws  Error if square is nonempty
     */
    this.isEmptyLocation = function(row, col) {
        if (this.getCheckerAt(row, col)) {
            //alert("square [" + row + "," + col + "] is not empty");
            return false;
        }
        return true;
    }

    function assertTrue(f, s){
        if (!f) {
        	alert(s);
        }
    }
    
    ////////////////////////////////////////////////
    // Public methods
    //
    
    /**
     * board.size is the number of squares on each side of the checkerboard
     */
    this.size = function() {
        return this.boardSize;
    }

    /**
     * Get the checker found on the square at [row,column], or null
     * if the square is empty.  Requires row,column < size.
     */
    this.getCheckerAt = function(row, col){
        if (this.isValidLocation(row,col)){
	        return this.square[row][col];
	    }
    }
    
    /**
     * Get location of checker (row and column) if it's found on this
     * board, or null if not found.
     */
    this.getLocationOf  = function(checker){
    	return {row:checker.row, col:checker.col};
    };

    /**
     * Get a list of all checkers on the board, in no particular order.
     */
    this.getAllCheckers = function(){
    	var results = [];
        for (var r in this.square) {
            for (var c in this.square[r]) {
                if (this.square[r][c]) {
                	results.push(this.square[r][c]);
                }
            }
        }

    	return results;
    }
    
	/**
	 * Add a new checker to the board.  Requires checker to be not currently
	 * on the board, and (row,col) must designate a valid empty square.
	 */
	this.add = function(checker, row, col){
		if (this.isEmptyLocation(row,col)){

			var details = {checker:checker, row:row, col:col};
						
			checker.row = row;
			checker.col = col;
			
			this.square[row][col] = checker;
	    
	        // rep invariant should be satisfied here, before we start
	        // firing events
			this.checkRep();
			
			this.dispatchBoardEvent("add", details);
		}
	} 
	
	/**
	 * Move a checker from its current square to another square.
	 * Requires checker to be already found on this board, and (toRow,toCol)
	 * must denote a valid empty square.
	 */
	this.moveTo = function(checker, toRow, toCol){
		if (this.isEmptyLocation(toRow,toCol)){

			var details = {checker:checker, toRow:toRow, toCol:toCol, fromRow:checker.row, fromCol:checker.col};
		
			delete this.square[checker.row][checker.col];
			this.square[toRow][toCol] = checker;
			
			if (this.canBeKing(checker, toRow, toCol)){
				this.promote(checker);
			}
	    
			checker.row = toRow;
			checker.col = toCol;
			
	        // rep invariant should be satisfied here, before we start firing events
			this.checkRep();
			
			this.dispatchBoardEvent("move", details);
		}
	}
	
	/**
	 * Remove a checker from this board.  Requires checker to be found on this
	 * board.
	 */
	this.remove = function(checker) {
		var details = {checker:checker, row:checker.row, col:checker.col};
			
		delete this.square[checker.row][checker.col];

		this.checkRep();
		
		this.dispatchBoardEvent("remove", details);			
	}
	
	/**
	 * Remove a checker at a given location from this board.  Requires checker to be found on this
	 * board.
	 */
	this.removeAt = function(row, col) {
		if (!this.square[row][col]){
			alert("no checker at " + r + "," + c);
			
		} else {
			var details = {checker:this.square[row][col], row:row, col:col};
					
			delete this.square[row][col];
			
			this.checkRep();
			
			this.dispatchBoardEvent("remove", details);		
		}
	}
	
	
	/**
	 * Remove all checkers from board.
	 */
	this.clear = function() {
        for (var r in this.square) {
            for (var c in this.square[r]) {
                if (this.square[r][c]) {
                	this.removeAt(r, c);
                }
            }
        }
	}
	
	/**
	 * Promote a checker piece to become king piece.
	 */
	this.promote = function(checker) {
		checker.isKing = true;
		this.dispatchBoardEvent("promote", {checker:checker});
	}
	

    ////////////////////////////////////////////////
    // Events listening interface
    //

	this.allHandlers = new Array();
	
	/**
	 * Dispatch a new event to all the event listeners of a given event type
	 */
	this.dispatchBoardEvent = function(type, details){
		var newEvent = new BoardEvent(type, details);

		if (this.allHandlers[type]){
			for (var i in this.allHandlers[type]){
				this.allHandlers[type][i](newEvent);
			}
		}
	}

	/**
	 * Add a new event listener for a given event type
	 * the parameter 'handler' has to be a function with one parameter which is an event object
	 */
	this.addEventListener = function(eventType, handler){
		if (!this.allHandlers[eventType])
			this.allHandlers[eventType] = [];
		this.allHandlers[eventType].push(handler);
	}

   ////////////////////////////////////////////////
   // Rules of Checkers
   //
  
  /**
   * Returns a list of valid moves.
   */
  this.validMovesFor = function(checker, playerDirection) {
    assertTrue(((playerDirection== 1) || (playerDirection== -1)), "Direction must be 1 or -1");

    var validMoves = [];
    /** A checker can move forward if:
     *   1. The space is valid
     *   2. The space isn't occupied
     */
    for (var i = -1; i < 2; i++) {
      if (this.isValidLocation(checker.row + playerDirection, checker.col + i) &&
          this.isEmptyLocation(checker.row + playerDirection, checker.col + i)) {
        validMoves.push({'col': checker.col + i,
                         'row': checker.row + playerDirection,
                         'remove': []});
      }
    }

    /** A checker can move backward if:
     *   1. The space is valid
     *   2. The space isn't occupied
     *   3. The checker is a king
     */
    for (var i = -1; i < 2; i++) {
      if (this.isValidLocation(checker.row - playerDirection, checker.col + i) &&
          this.isEmptyLocation(checker.row - playerDirection, checker.col + i) &&
          (checker.isKing == true)) {
       validMoves.push({'col': checker.col + i,
                        'row': checker.row - playerDirection,
                        'remove': []});
      }
    }

    /** A checker can jump
     */
    var jumps = this.validJumpsFor(checker, playerDirection, [], checker.row, checker.col);
    for (var i=0; i<jumps.length; i++) {
      var move = {
        'col':jumps[i][jumps[i].length - 1].col,
        'row':jumps[i][jumps[i].length - 1].row,
        'remove':[]
      };
      for (var j=0; j<jumps[i].length; j++) {
        move['remove'].push({
          'row':jumps[i][j].killedRow,
          'col':jumps[i][j].killedCol
        });
      }
      validMoves.push(move);
    }
    return validMoves;
  }

  this.validJumpsFor = function(checker, playerDirection, jumpSeq, curRow, curCol) {
    var possibleDestinations = [
      [curRow + 2, curCol + 2],
      [curRow + 2, curCol - 2],
      [curRow - 1, curCol + 2],
      [curRow - 1, curCol - 2]
    ];

    for (var i=0; i<possibleDestinations.length; i++) {
      if (this.isValidJump(checker, curRow, curCol, toRow, toCol, playerDirection)) {
        var toRow = possibleDestinations[i][0];
        var toCol = possibleDestinations[i][1];

        // Add this jump to the list of jumps to return
        var jumped = {
          'killedCol':(curCol + toCol)/2,
          'killedRow':(curRow + toRow)/2,
          'col':toCol,
          'row':toRow}

        var alreadyJumped = false;
        for (j=0; j<jumpSeq.length; j++) {
          if ((jumped.killedCol == jumpSeq[j].killedCol) && (jumped.killedRow == jumpSeq[j].killedRow)) {
            alreadyJumped = true;
          }
        }

        if (! alreadyJumped) {
          // Copy the jumpSeq array to pass in
          var newJumpSeq = [];
          for (var j=0; j<jumpSeq.length; j++) {
            newJumpSeq.push(jumpSeq[j]);
          }

          var futureJumps = this.validJumpsFor(checker, playerDirection, newJumpSeq, toRow, toCol);
          if (futureJumps.length == 0) {
            // There's nowhere else to jump from here. This is the terminal
            return [[jumped]];
          }
          else {
            // There are several possibilities from here. Return each one.
            var ret = [];
            for (j = 0; j<futureJumps.length; j++) {
              var seq = [jumped];
              for (k = 0; k<futureJumps[j].length; k++) {
                seq.push(futureJumps[j][k]);
              }
              ret.push(seq);
            }
          }
        }
      }
    }
    return []; // No valid seqs.
  }

  this.isValidJump = function(checker, fromRow, fromCol, toRow, toCol, playerDirection) {
    // Is the to-location a valid one?
    if (! this.isValidLocation(toRow, toCol)) return false;
    
    // Is the to-location occupied?
    if (! this.isEmptyLocation(toRow, toCol)) return false;

    // Normal players must not jump backward
    if ((((toRow - fromRow) * playerDirection) < 0) && (! checker.isKing)) return false; 

    // Jump must be two spaces horizontally
    if (abs(toRow - fromRow) != 2) return false;
    if (abs(toCol - fromCol) != 2) return false;

    // A piece must jump another
    if (this.isEmptyLocation((toRow+fromRow)/2, (toCol+fromCol)/2)) return false;

    // A piece must not jump its own kind
    if (this.getCheckerAt((toRow+fromRow)/2, (toCol+fromCol)/2).color == checker.color) return false;

    return true; 
  }

    ////////////////////////////////////////////////
    // Utilities
    //
    
	/**
	 * Prepare new board with standard setup
	 */
	this.prepareNewGame = function(){
		this.checkRep();
		
		this.clear();
		
		//red above, black below
		for (var i=0; i<this.boardSize; i++){
			var chkRed = new Checker("red", false);
			var chkBlack = new Checker("black", false);
			
			this.add(chkRed, (1 - i%2), i);
			this.add(chkBlack , (this.boardSize - 1 - i%2), i);
		}
	}
	
	/**
	 * Find a random checker
	 * Return a checker object
	 */
	this.getRandomChecker = function(){
		var allCheckers = this.getAllCheckers();
		if (allCheckers){
			return allCheckers[Math.floor(Math.random() * allCheckers.length)];
		}
	}
	
	/**
	 * Find a random non-king checker
	 * Return a checker object
	 */
	this.getRandomNonKing = function(){
		var allCheckers = this.getAllCheckers();
		var allNonKings = [];
		for (var i in allCheckers){
			if (!allCheckers[i].isKing){
				allNonKings.push(allCheckers[i]);
			}
		}
		
		if (allNonKings){
			return allNonKings[Math.floor(Math.random() * allNonKings.length)];
		}
	}
	
	/**
	 * Find a random empty location
	 * Return {row, col} 
	 */
	this.getRandomEmptyLocation = function(){
		var availLocs = [];
        for (var r = 0; r < this.boardSize; ++r) {
            for (var c = 0; c < this.boardSize; ++c) {
                if (!this.square[r][c]) {
                	availLocs.push({row:r, col:c});
                }
            }
        }

		if (availLocs){
			return availLocs[Math.floor(Math.random() * availLocs.length)];
		}
	}
	
	/**
	 * Check if a piece can be promoted to king at given location
	 */		
	this.canBeKing = function(checker, row, col){
		if (checker.color == "red"){
			return row == this.boardSize - 1;
		} else {
			return row == 0;
		}
	}	;
			
    /**
     * Get a string representation for the board as a multiline matrix.
     */
    this.toString = function() {
    	var result = "";
        for (var r = 0; r < this.boardSize; ++r) {
            for (var c = 0; c < this.boardSize; ++c) {
                var checker = this.square[r][c];
                if (checker) {
                	result += checker.toString().charAt(0) + " ";
                }else {
                	result += "_ ";
                }
            }
            result += "<br/>";
        }
        return result.toString();
    }  
}
