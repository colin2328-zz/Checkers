/* 
 * The rules of checkers.
 * Ted Benson <eob@csail.mit.edu>
 * 
 * This class implements the rules of American checkers. Note that we
 * use the variant that does not require to "eat" another checker if that
 * is a possibility.
 *
 */
var Rules = function(board) {

   /***************************************************************
   * "Public" functions (if such a thing could be enforced)
   * Everything you should need as the user of Rules.
   * 
   * - makeMove(checker, turnDirection, playerDirection, toRow, toCol)
   * - makeRandomMove(checker, playerDirection)
   *
   **************************************************************/

  /**
   * Attempts to make a move. If the move is valid, this will mutate
   * the board object and return a list of jumped pieces that were removed
   * from the board as a result.
   *
   * Input
   *  - checker: the checker object you would like to move
   *  - turnDirection: which direction (+1, -1) represents the current turn
   *  - playerDirection: which direction (+1, -1) represents the color of `checker` (first argument)
   *  - toRow: which row would you like to move checker to
   *  - toCol: which column would you like to move checker to
   *
   * Note about directions:
   *  For rule checking, the Rules object represents both turns and players by directions on the
   *  board, either +1 or -1, not by piece coloring. If the turn is +1 and the checker moved represents
   *  player -1 for exampe, the Rules object will reject this move and return null. Don't worry about
   *  kings being bidirectional -- this object knows how to take this into account.
   *
   * Succes Return: 
   *  { 'from_col': X,
   *    'to_col': XPrime,
   *    'from_row': Y,
   *    'to_row':Z,
   *    'made_king':false,
   *     'removed':[
   *        {'col':X, 'row':Y, 'color':Z, 'isKing':true},
   *        {'col':X, 'row':Y, 'color':Z, 'isKing':false}
   *     ]
   *  }
   *
   * Error Return: (when the move is invalid)
   *  null
   */ 
  this.makeMove = function(checker, turnDirection, playerDirection, toRow, toCol) {
    var ramifications = this.ramificationsOfMove(checker,
                                                 turnDirection,
                                                 playerDirection,
                                                 toRow,
                                                 toCol);

    var wasKingBefore = checker.isKing;

    // Invalid move?
    if (ramifications == null) {
      return null;
    }

    // If valid, remember where we started 
    ramifications['from_col'] = checker.col;
    ramifications['from_row'] = checker.row;
 
    // Then mutate the board
    
    // 1. Move the piece
    board.moveTo(checker, ramifications['to_row'], ramifications['to_col']); 
    ramifications['made_king'] = ((! wasKingBefore) && (checker.isKing));
    //if (ramifications['made_king']) alert("made king: " + ramifications['made_king']);
    
    // 2. Remove dead checkers
    for (var i=0; i<ramifications['remove'].length; i++) {
      //if (ramifications['remove'][i]['isKing']) alert("removed king");
      board.remove(
        board.getCheckerAt(
          ramifications['remove'][i]['row'],
          ramifications['remove'][i]['col']
        )
      );
    }

    return ramifications;
  }

  /**
   * Makes a random move. If no random move can be found for the player,
   * returns null. If a random move can be found, provides a result object
   * in the shape of that from makeMove(..)
   */
  this.makeRandomMove = function(playerColor, playerDirection) {

    // Get all checkers of my color
    var checkers = board.getAllCheckers();
    var myCheckers = [];
    for (var i=0; i<checkers.length; i++) {
      if (checkers[i].color == playerColor) {
        myCheckers.push(checkers[i]);
      }
    }

    // now randomly sort
    myCheckers = this.shuffle(myCheckers);
      
    for (var i=0; i<myCheckers.length; i++) {
      var validMoves = this.validMovesFor(myCheckers[i], playerDirection);
      if (validMoves.length > 0) {
        // Randomize the moves
        validMoves = this.shuffle(validMoves);
        // Make the move!
        var move = validMoves[0];
        return this.makeMove(
          myCheckers[i],
          playerDirection,
          playerDirection,
          move.to_row,
          move.to_col
        );
      }
    }
    // If were still here, no move is possible
    return null;
  }
  
  /***************************************************************
  * "Private" functions (if such a thing could be enforced)
  * You probably don't need to call these
  **************************************************************/

  // Returns null on an invalid move
  this.ramificationsOfMove= function(checker, turnDirection, playerDirection, toRow, toCol) {
    if (playerDirection != turnDirection) {
      return null;
    }
    var validMoves = this.validMovesFor(checker, playerDirection);
    for (var i = 0; i<validMoves.length; i++) {
      if ((validMoves[i].to_col == toCol) && (validMoves[i].to_row == toRow)) {
        return validMoves[i];
      }
    }
    return null;
  }

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
      if (i != 0) {
      if (board.isValidLocation(checker.row + playerDirection, checker.col + i) &&
          board.isEmptyLocation(checker.row + playerDirection, checker.col + i)) {
        validMoves.push({'to_col': checker.col + i,
                         'to_row': checker.row + playerDirection,
                         'remove': []});
      }
     }
    }

    /** A checker can move backward if:
     *   1. The space is valid
     *   2. The space isn't occupied
     *   3. The checker is a king
     */
    for (var i = -1; i < 2; i++) {
     if (i != 0) {
      if (board.isValidLocation(checker.row - playerDirection, checker.col + i) &&
          board.isEmptyLocation(checker.row - playerDirection, checker.col + i) &&
          (checker.isKing == true)) {
       validMoves.push({'to_col': checker.col + i,
                        'to_row': checker.row - playerDirection,
                        'remove': []});
      }
     }
    }

    /** A checker can jump
     */
    var jumps = this.validJumpsFor(checker, playerDirection, [], checker.row, checker.col);
    for (var i=0; i<jumps.length; i++) {
      validMoves.push(this.collapseJumpSequence(jumps[i]));
    }
    return validMoves;
  }

  this.collapseJumpSequence = function(jumpSequence) {
    var move = {
      'to_col':jumpSequence[jumpSequence.length - 1].col,
      'to_row':jumpSequence[jumpSequence.length - 1].row,
      'remove':[]
    };
    
    for (var j=0; j<jumpSequence.length; j++) {
      move['remove'].push({
        'row':jumpSequence[j].killedRow,
        'col':jumpSequence[j].killedCol,
        'color':board.getCheckerAt(jumpSequence[j].killedRow, jumpSequence[j].killedCol).color,
        'isKing':board.getCheckerAt(jumpSequence[j].killedRow, jumpSequence[j].killedCol).isKing
      });
    }
    
    return move;
  }

  this.alreadyJumpedPiece = function(jumpSeq, row, col) {
    var alreadyJumped = false;
    for (j=0; j<jumpSeq.length; j++) {
      if ((col == jumpSeq[j].killedCol) && (row == jumpSeq[j].killedRow)) {
        alreadyJumped = true;
      }
    }
    return alreadyJumped;
  }

  this.copyJumpSequence = function(jumpSeq) {
    var newJumpSeq = [];
    for (var j=0; j<jumpSeq.length; j++) {
      newJumpSeq.push(jumpSeq[j]);
    }
    return newJumpSeq;
  }

  this.validJumpsFor = function(checker, playerDirection, jumpSeq, curRow, curCol) {
    var possibleDestinations = [
      [curRow + 2, curCol + 2],
      [curRow + 2, curCol - 2],
      [curRow - 2, curCol + 2],
      [curRow - 2, curCol - 2]
    ];

    var retSeqs = [];

    for (var i=0; i<possibleDestinations.length; i++) {
      var toRow = possibleDestinations[i][0];
      var toCol = possibleDestinations[i][1];
      if (this.isValidJump(checker, curRow, curCol, toRow, toCol, playerDirection)) {
        // Add this jump to the list of jumps to return
        var jumped = {
          'killedCol':(curCol + toCol)/2,
          'killedRow':(curRow + toRow)/2,
          'col':toCol,
          'row':toRow}

        if (! this.alreadyJumpedPiece(jumpSeq, jumped.killedRow, jumped.killedCol)) {
          // Copy the jumpSeq array to pass in
          var newJumpSeq = this.copyJumpSequence(jumpSeq);
          newJumpSeq.push(jumped);
          var futureJumps = this.validJumpsFor(checker, playerDirection, newJumpSeq, toRow, toCol);
          for (j = 0; j<futureJumps.length; j++) {
            retSeqs.push(futureJumps[j]);
          }
          // This is the terminal leaf
          var lastCopy = this.copyJumpSequence(jumpSeq);
          lastCopy.push(jumped);
          retSeqs.push(lastCopy);
        } // if wasn't jumping existing piece
      } // if is valid jump
    } // for each possibnle destination
    return retSeqs; // No valid seqs.
  }

  this.shuffle = function(array) {
    var tmp, current, top = array.length;

    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }

    return array;
  }

  this.isValidJump = function(checker, fromRow, fromCol, toRow, toCol, playerDirection) {
    // Is the to-location a valid one?
    if (! board.isValidLocation(toRow, toCol)) return false;
    
    // Is the to-location occupied?
    if (! board.isEmptyLocation(toRow, toCol)) return false;

    // Normal players must not jump backward
    if ((((toRow - fromRow) * playerDirection) < 0) && (! checker.isKing)) return false; 

    // Jump must be two spaces horizontally
    if (Math.abs(toRow - fromRow) != 2) return false;
    if (Math.abs(toCol - fromCol) != 2) return false;

    // A piece must jump another
    if (board.isEmptyLocation((toRow+fromRow)/2, (toCol+fromCol)/2)) return false;

    // A piece must not jump its own kind
    if (board.getCheckerAt((toRow+fromRow)/2, (toCol+fromCol)/2).color == checker.color) return false;

    return true; 
  }

  /**
   *  UTIL
   */
  function assertTrue(f, s){
    if (!f) {
    	alert(s);
    }
  }
 

}