class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameStatus = 'playing';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        
        this.pieceSymbols = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };
        
        this.initializeGame();
    }
    
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Set up white pieces
        board[7] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'].map(piece => ({ type: piece, color: 'white' }));
        board[6] = Array(8).fill({ type: 'pawn', color: 'white' });
        
        // Set up black pieces
        board[0] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'].map(piece => ({ type: piece, color: 'black' }));
        board[1] = Array(8).fill({ type: 'pawn', color: 'black' });
        
        return board;
    }
    
    initializeGame() {
        this.createBoard();
        this.renderBoard();
        this.updateGameInfo();
        this.attachEventListeners();
    }
    
    createBoard() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                square.addEventListener('click', (e) => this.handleSquareClick(e));
                square.addEventListener('dragover', (e) => this.handleDragOver(e));
                square.addEventListener('drop', (e) => this.handleDrop(e));
                
                chessboard.appendChild(square);
            }
        }
    }
    
    renderBoard() {
        const squares = document.querySelectorAll('.square');
        
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const piece = this.board[row][col];
            
            // Clear previous content
            square.innerHTML = '';
            square.classList.remove('selected', 'possible-move', 'capture-move', 'in-check');
            
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = `piece ${piece.color}`;
                pieceElement.textContent = this.pieceSymbols[piece.color][piece.type];
                pieceElement.draggable = piece.color === this.currentPlayer;
                
                pieceElement.addEventListener('dragstart', (e) => this.handleDragStart(e));
                pieceElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
                
                square.appendChild(pieceElement);
            }
        });
        
        this.highlightCheck();
    }
    
    handleSquareClick(e) {
        const square = e.currentTarget;
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        if (this.selectedSquare) {
            // Try to move piece
            if (this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
                this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            }
            this.clearSelection();
        } else {
            // Select piece
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentPlayer) {
                this.selectSquare(row, col);
            }
        }
    }
    
    selectSquare(row, col) {
        this.selectedSquare = { row, col };
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        square.classList.add('selected');
        this.highlightPossibleMoves(row, col);
    }
    
    clearSelection() {
        this.selectedSquare = null;
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'possible-move', 'capture-move');
        });
    }
    
    highlightPossibleMoves(row, col) {
        const possibleMoves = this.getPossibleMoves(row, col);
        
        possibleMoves.forEach(move => {
            const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (this.board[move.row][move.col]) {
                square.classList.add('capture-move');
            } else {
                square.classList.add('possible-move');
            }
        });
    }
    
    getPossibleMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves.push(...this.getPawnMoves(row, col, piece.color));
                break;
            case 'rook':
                moves.push(...this.getRookMoves(row, col));
                break;
            case 'knight':
                moves.push(...this.getKnightMoves(row, col));
                break;
            case 'bishop':
                moves.push(...this.getBishopMoves(row, col));
                break;
            case 'queen':
                moves.push(...this.getQueenMoves(row, col));
                break;
            case 'king':
                moves.push(...this.getKingMoves(row, col));
                break;
        }
        
        // Filter out moves that would put own king in check
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col, piece.color));
    }
    
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Forward move
        if (this.isInBounds(row + direction, col) && !this.board[row + direction][col]) {
            moves.push({ row: row + direction, col });
            
            // Double move from starting position
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        
        // Captures
        for (const dcol of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dcol;
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }
    
    getRookMoves(row, col) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (const [drow, dcol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * drow;
                const newCol = col + i * dcol;
                
                if (!this.isInBounds(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== this.board[row][col].color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        }
        
        return moves;
    }
    
    getKnightMoves(row, col) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [drow, dcol] of knightMoves) {
            const newRow = row + drow;
            const newCol = col + dcol;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== this.board[row][col].color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }
    
    getBishopMoves(row, col) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (const [drow, dcol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * drow;
                const newCol = col + i * dcol;
                
                if (!this.isInBounds(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== this.board[row][col].color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        }
        
        return moves;
    }
    
    getQueenMoves(row, col) {
        return [...this.getRookMoves(row, col), ...this.getBishopMoves(row, col)];
    }
    
    getKingMoves(row, col) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [drow, dcol] of directions) {
            const newRow = row + drow;
            const newCol = col + dcol;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== this.board[row][col].color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }
    
    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const possibleMoves = this.getPossibleMoves(fromRow, fromCol);
        return possibleMoves.some(move => move.row === toRow && move.col === toCol);
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        
        // Record move in history
        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            capturedPiece: capturedPiece ? { ...capturedPiece } : null
        });
        
        // Handle captured piece
        if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece);
            this.updateCapturedPieces();
        }
        
        // Move piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Check for pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.board[toRow][toCol] = { type: 'queen', color: piece.color };
        }
        
        // Switch turns
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Update game state
        this.checkGameEnd();
        this.renderBoard();
        this.updateGameInfo();
        this.updateUndoButton();
        
        // Add animation
        const targetSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
        const pieceElement = targetSquare.querySelector('.piece');
        if (pieceElement) {
            pieceElement.classList.add('moving');
            setTimeout(() => pieceElement.classList.remove('moving'), 300);
        }
    }
    
    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Simulate the move
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];
        
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = null;
        
        const inCheck = this.isInCheck(color);
        
        // Restore the board
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;
        
        return inCheck;
    }
    
    isInCheck(color) {
        const kingPosition = this.findKing(color);
        if (!kingPosition) return false;
        
        // Check if any opponent piece can attack the king
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color !== color) {
                    const moves = this.getPossibleMovesWithoutCheckValidation(row, col);
                    if (moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    getPossibleMovesWithoutCheckValidation(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        switch (piece.type) {
            case 'pawn':
                return this.getPawnMoves(row, col, piece.color);
            case 'rook':
                return this.getRookMoves(row, col);
            case 'knight':
                return this.getKnightMoves(row, col);
            case 'bishop':
                return this.getBishopMoves(row, col);
            case 'queen':
                return this.getQueenMoves(row, col);
            case 'king':
                return this.getKingMoves(row, col);
            default:
                return [];
        }
    }
    
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }
    
    highlightCheck() {
        if (this.isInCheck(this.currentPlayer)) {
            const kingPosition = this.findKing(this.currentPlayer);
            if (kingPosition) {
                const kingSquare = document.querySelector(`[data-row="${kingPosition.row}"][data-col="${kingPosition.col}"]`);
                kingSquare.classList.add('in-check');
            }
        }
    }
    
    checkGameEnd() {
        const hasValidMoves = this.hasValidMoves(this.currentPlayer);
        const inCheck = this.isInCheck(this.currentPlayer);
        
        if (!hasValidMoves) {
            if (inCheck) {
                this.gameStatus = this.currentPlayer === 'white' ? 'black-wins' : 'white-wins';
            } else {
                this.gameStatus = 'stalemate';
            }
        }
    }
    
    hasValidMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const moves = this.getPossibleMoves(row, col);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    updateGameInfo() {
        const turnElement = document.getElementById('current-turn');
        const statusElement = document.getElementById('game-status');
        
        if (this.gameStatus === 'playing') {
            turnElement.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
            statusElement.textContent = 'Game in Progress';
            statusElement.style.color = '#27ae60';
        } else if (this.gameStatus === 'white-wins') {
            turnElement.textContent = 'Game Over';
            statusElement.textContent = 'White Wins by Checkmate!';
            statusElement.style.color = '#e74c3c';
        } else if (this.gameStatus === 'black-wins') {
            turnElement.textContent = 'Game Over';
            statusElement.textContent = 'Black Wins by Checkmate!';
            statusElement.style.color = '#e74c3c';
        } else if (this.gameStatus === 'stalemate') {
            turnElement.textContent = 'Game Over';
            statusElement.textContent = 'Stalemate - Draw!';
            statusElement.style.color = '#f39c12';
        }
    }
    
    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('captured-white-pieces');
        const blackCaptured = document.getElementById('captured-black-pieces');
        
        whiteCaptured.innerHTML = this.capturedPieces.white
            .map(piece => `<span class="captured-piece">${this.pieceSymbols.white[piece.type]}</span>`)
            .join('');
            
        blackCaptured.innerHTML = this.capturedPieces.black
            .map(piece => `<span class="captured-piece">${this.pieceSymbols.black[piece.type]}</span>`)
            .join('');
    }
    
    updateUndoButton() {
        const undoBtn = document.getElementById('undo-btn');
        undoBtn.disabled = this.moveHistory.length === 0 || this.gameStatus !== 'playing';
    }
    
    undoLastMove() {
        if (this.moveHistory.length === 0 || this.gameStatus !== 'playing') return;
        
        const lastMove = this.moveHistory.pop();
        
        // Restore piece to original position
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        
        // Restore captured piece or clear destination
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece;
        
        // Remove from captured pieces if there was a capture
        if (lastMove.capturedPiece) {
            const capturedArray = this.capturedPieces[lastMove.capturedPiece.color];
            const index = capturedArray.findIndex(piece => 
                piece.type === lastMove.capturedPiece.type
            );
            if (index !== -1) {
                capturedArray.splice(index, 1);
            }
        }
        
        // Switch back to previous player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.gameStatus = 'playing';
        
        this.clearSelection();
        this.renderBoard();
        this.updateGameInfo();
        this.updateCapturedPieces();
        this.updateUndoButton();
    }
    
    newGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameStatus = 'playing';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        
        this.clearSelection();
        this.renderBoard();
        this.updateGameInfo();
        this.updateCapturedPieces();
        this.updateUndoButton();
    }
    
    // Drag and Drop handlers
    handleDragStart(e) {
        const square = e.target.closest('.square');
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        this.selectedSquare = { row, col };
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `${row},${col}`);
        
        this.highlightPossibleMoves(row, col);
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.clearSelection();
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    handleDrop(e) {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        const [fromRow, fromCol] = data.split(',').map(Number);
        
        const square = e.currentTarget;
        const toRow = parseInt(square.dataset.row);
        const toCol = parseInt(square.dataset.col);
        
        if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
            this.makeMove(fromRow, fromCol, toRow, toCol);
        }
        
        this.clearSelection();
    }
    
    attachEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('undo-btn').addEventListener('click', () => this.undoLastMove());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGame();
});