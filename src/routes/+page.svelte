<script lang="ts">
	import { onMount } from 'svelte';
	import { Chess } from 'chess.js';
	import { supabaseClient } from '$lib/supabase';
	import type { Square, Move } from 'chess.js';

	export let fen: string;
	export let gameId: string;

	let game: Chess;
	let board: (string | null)[][] = [];
	let selectedSquare: string | null = null;
	let currentPlayer: string;
	export let currentTurn: string;
	currentPlayer = currentTurn === 'b' ? 'black' : 'white';

	const files = 'abcdefgh';

	onMount(() => {
		game = new Chess(fen); // Initialize chess game with the FEN passed from server
		updateBoard();
	});
	let legalMoves: string[] = [];

	function getLegalMoves(square: string): string[] {
		try {
			const moves = game.moves({ square: square as Square, verbose: true }) as Move[];
			return moves.map((m) => m.to);
		} catch {
			return [];
		}
	}

	function updateBoard() {
		board = [];
		const fen = game.fen().split(' ')[0]; // FEN contains piece positions
		const rows = fen.split('/');
		for (let r = 0; r < 8; r++) {
			let row = [];
			for (let i = 0; i < rows[r].length; i++) {
				const ch = rows[r][i];
				if (isNaN(+ch)) {
					row.push(unicodeFromPiece(ch));
				} else {
					for (let j = 0; j < +ch; j++) row.push(null);
				}
			}
			board.push(row);
		}
	}

	function unicodeFromPiece(letter: string) {
		const pieces: Record<string, string> = {
			p: '♟',
			r: '♜',
			n: '♞',
			b: '♝',
			q: '♛',
			k: '♚',
			P: '♙',
			R: '♖',
			N: '♘',
			B: '♗',
			Q: '♕',
			K: '♔'
		};
		return pieces[letter] || null;
	}

	function squareFromCoords(row: number, col: number) {
		return files[col] + (8 - row);
	}

	async function makeMove(from: string, to: string) {
		const move = game.move({ from, to });
		if (move) {
			// Check if the move is a pawn promotion
			if (move.promotion && (move.to[1] === '8' || move.to[1] === '1')) {
				// Handle promotion
				const promotion = await promptPawnPromotion();
				game.move({ from, to, promotion });
			}

			const fen = game.fen(); // Updated FEN after the move
			const nextTurn = game.turn(); // Get the next player's turn
			await saveMove(fen, nextTurn); // Update the game state
			updateBoard(); // Update the board view after the move

			// Check for checkmate after the move is made
			if (game.isGameOver()) {
				if (game.isCheckmate()) {
					alert(`${currentPlayer === 'white' ? 'Black' : 'White'} wins by checkmate!`);
				}
			}
		} else {
			selectedSquare = null; // Invalid move, reset selection
		}
	}

	async function promptPawnPromotion(): Promise<string> {
		return new Promise((resolve) => {
			// Show prompt for promotion (Q, R, B, N)
			const promotion = prompt('Promote to (q, r, b, n):', 'q');
			resolve(promotion || 'q'); // Default to Queen if no input
		});
	}

	async function saveMove(fen: string, nextTurn: string) {
		// Save the updated game state (FEN) to the database
		await supabaseClient.from('games').update({ fen }).eq('id', gameId);

		// Update current player based on the next turn
		currentPlayer = nextTurn === 'w' ? 'white' : 'black';
	}

	function handleClick(row: number, col: number) {
		const square = squareFromCoords(row, col) as Square;
		const piece = board[row][col];

		if (selectedSquare && legalMoves.includes(square)) {
			game.move({ from: selectedSquare, to: square });
			updateBoard();
			selectedSquare = null;
			legalMoves = [];
			return;
		}

		if (!piece) return;

		const isWhiteTurn = game.turn() === 'w';
		const isWhitePieceTurn = isWhiteTurn && isWhitePiece(piece);
		const isBlackPieceTurn = !isWhiteTurn && !isWhitePiece(piece);

		if (!isWhitePieceTurn && !isBlackPieceTurn) return;

		selectedSquare = square;
		legalMoves = game.moves({ square, verbose: true }).map((m) => m.to);
	}

	function isWhitePiece(piece: string): boolean {
		return ['♖', '♘', '♗', '♕', '♔', '♙'].includes(piece);
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
	<div class="mb-6 text-center">
		<p class="mb-2 text-3xl font-bold">Chess App</p>
		<p class="text-lg text-gray-700">
			{currentPlayer === 'white' ? "White's Turn" : "Black's Turn"}
		</p>
	</div>

	<div class="grid w-[32rem] grid-cols-8 border-4 border-gray-700">
		{#each board as row, rowIndex}
			{#each row as piece, colIndex}
				{@const square = squareFromCoords(rowIndex, colIndex)}
				<div
					role="button"
					tabindex="0"
					on:click={() => handleClick(rowIndex, colIndex)}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							handleClick(rowIndex, colIndex);
						}
					}}
					class="relative aspect-square text-2xl select-none md:text-3xl lg:text-4xl"
					class:outline={legalMoves.includes(square)}
					class:outline-4={legalMoves.includes(square)}
					class:outline-green-500={legalMoves.includes(square)}
					class:ring-4={selectedSquare === square}
					class:ring-yellow-400={selectedSquare === square}
					class:bg-[#f0d9b5]={(rowIndex + colIndex) % 2 === 0}
					class:bg-[#b58863]={(rowIndex + colIndex) % 2 !== 0}
				>
					{#if piece}
						<span
							class="absolute inset-0 flex items-center justify-center"
							class:text-white={isWhitePiece(piece)}
							class:text-black={!isWhitePiece(piece)}
							style="font-family: 'DejaVu Sans', 'Arial Unicode MS', 'Noto Sans Symbols', sans-serif;"
						>
							{piece}
						</span>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
</div>
