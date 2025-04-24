<script lang="ts">
	import { onMount } from 'svelte';
	import { Chess } from 'chess.js';
	import { supabaseClient } from '$lib/supabase'; // Fixed import path

	export let fen: string;
	export let gameId: string;
	export let currentTurn: string;
	export const whitePlayerId = ''; // Export as constant if external reference
	export const blackPlayerId = ''; // Export as constant if external reference

	let game: Chess;
	let board: (string | null)[][] = [];
	let selectedSquare: string | null = null;
	let currentPlayer: string;

	const files = 'abcdefgh';

	onMount(() => {
		game = new Chess(fen);
		currentPlayer = currentTurn === 'w' ? 'white' : 'black';
		updateBoard();
	});

	function updateBoard() {
		board = [];
		const fen = game.fen().split(' ')[0];
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
			const fen = game.fen();
			const nextTurn = game.turn() === 'w' ? 'b' : 'w'; // Switch turn
			await saveMove(fen, nextTurn);
			updateBoard(); // Update the board after move
		} else {
			selectedSquare = null;
		}
	}

	async function saveMove(fen: string, nextTurn: string) {
		await supabaseClient.from('games').update({ fen, current_turn: nextTurn }).eq('id', gameId);

		currentPlayer = nextTurn === 'w' ? 'white' : 'black'; // Update current player
	}

	function handleClick(row: number, col: number) {
		const square = squareFromCoords(row, col);
		if (selectedSquare) {
			makeMove(selectedSquare, square);
			selectedSquare = null;
		} else {
			selectedSquare = square;
		}
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
				<div
					role="button"
					tabindex="0"
					class="relative aspect-square text-2xl select-none md:text-3xl lg:text-4xl"
					class:bg-[#f0d9b5]={(rowIndex + colIndex) % 2 === 0}
					class:bg-[#b58863]={(rowIndex + colIndex) % 2 !== 0}
					on:click={() => handleClick(rowIndex, colIndex)}
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							handleClick(rowIndex, colIndex);
						}
					}}
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
