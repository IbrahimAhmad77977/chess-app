<script lang="ts">
	import { goto } from '$app/navigation';

	async function logout() {
		await supabaseClient.auth.signOut();
		goto('/auth'); // Redirect to login page (adjust the path if needed)
	}

	import { onMount } from 'svelte';
	import { Chess } from 'chess.js';
	import { supabaseClient } from '$lib/supabase';
	import type { Square, Move } from 'chess.js';

	let showPromotionModal = false;
	let promotionFrom: string | null = null;
	let promotionTo: string | null = null;
	let sounds: { [key: string]: HTMLAudioElement } = {};
	let moveHistory: Array<{ color: string; from: string; to: string; piece: string; san: string }> =
		[];

	// Preload sounds when the component is mounted
	onMount(() => {
		// Preload sounds so they can be played without delay
		sounds = {
			move: new Audio('/sound/move.mp3'),
			capture: new Audio('/sound/capture.mp3'),
			check: new Audio('/sound/checkmate.mp3'),
			castle: new Audio('/sound/draw.mp3'),
			gameOver: new Audio('/sound/select.mp3')
		};

		// Ensure all sounds are loaded before playing
		Object.values(sounds).forEach((audio) => {
			audio.preload = 'auto';
		});
	});

	function playMoveSound() {
		if (sounds.move) sounds.move.play();
	}

	function playCaptureSound() {
		if (sounds.capture) sounds.capture.play();
	}

	function playGameOverSound() {
		if (sounds.gameOver) sounds.gameOver.play();
	}

	export let fen: string;
	export let gameId: string;
	let turn = '';
	let statusMessage: string | null = null;

	let game: Chess;
	let board: (string | null)[][] = [];
	let selectedSquare: string | null = null;
	let legalMoves: string[] = [];

	const files = 'abcdefgh';

	onMount(() => {
		game = new Chess(fen);
		updateBoard();
		turn = game.turn();
		moveHistory = game.history({ verbose: true }); // Initialize move history on page load
	});

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
		const move = game.move({ from, to, promotion: 'q' }); // Try default first
		if (move) {
			if (move.flags.includes('p') && (to[1] === '8' || to[1] === '1')) {
				// Undo last move and open modal
				game.undo();
				promotionFrom = from;
				promotionTo = to;
				showPromotionModal = true;
				return;
			}

			const fen = game.fen();
			turn = game.turn();
			await saveMove(fen, turn);
			moveHistory = game.history({ verbose: true }); // Update move history after a move
			updateBoard();

			if (game.isGameOver()) {
				if (game.isCheckmate()) {
					statusMessage = `${turn === 'w' ? 'Black' : 'White'} wins by checkmate!`;
					playGameOverSound();
				} else if (game.isDraw()) {
					statusMessage = 'Draw!';
					playGameOverSound();
				}
			} else {
				playMoveSound();
			}
		} else {
			selectedSquare = null;
		}
	}

	async function saveMove(fen: string, nextTurn: string) {
		await supabaseClient.from('games').update({ fen }).eq('id', gameId);
	}

	async function promotePawn(piece: string) {
		if (promotionFrom && promotionTo) {
			game.move({ from: promotionFrom, to: promotionTo, promotion: piece });
			const fen = game.fen();
			turn = game.turn();
			await saveMove(fen, turn);
			moveHistory = game.history({ verbose: true }); // Update move history after promotion
			updateBoard();

			if (game.isGameOver()) {
				if (game.isCheckmate()) {
					statusMessage = `${turn === 'w' ? 'Black' : 'White'} wins by checkmate!`;
					playGameOverSound();
				} else if (game.isDraw()) {
					statusMessage = 'Draw!';
					playGameOverSound();
				}
			}
		}

		showPromotionModal = false;
		promotionFrom = null;
		promotionTo = null;
	}

	function handleClick(row: number, col: number) {
		if (game.isGameOver()) return;
		const square = squareFromCoords(row, col) as Square;
		const piece = board[row][col];

		if (selectedSquare && legalMoves.includes(square)) {
			makeMove(selectedSquare, square);
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
		legalMoves = getLegalMoves(square);
	}

	function isWhitePiece(piece: string): boolean {
		return ['♖', '♘', '♗', '♕', '♔', '♙'].includes(piece);
	}
</script>

<div class="flex min-h-screen flex-row items-center gap-x-[200px] bg-gray-100 pl-10">
	<!-- Title and Turn Display -->
	<div class="mb-6 text-center">
		<p class="mb-2 text-3xl font-bold">Chess App</p>
		<form method="POST" action="?/logout">
			<button type="submit" class="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
				Logout
			</button>
		</form>

		<p class="text-lg text-gray-700">
			{#if game}
				{turn === 'w' ? "White's Turn" : "Black's Turn"}
			{/if}
		</p>
		{#if statusMessage}
			<div class="mt-4 text-xl font-semibold text-red-600">
				{statusMessage}
			</div>
		{/if}
		{#if showPromotionModal}
			<p class="mb-4">Promote pawn to:</p>
			<button on:click={() => promotePawn('q')}>♕</button>
			<button on:click={() => promotePawn('r')}>♖</button>
			<button on:click={() => promotePawn('b')}>♗</button>
			<button on:click={() => promotePawn('n')}>♘</button>
		{/if}
	</div>

	<!-- Chessboard -->
	<div class="mb-6 grid w-[32rem] grid-cols-8 border-4 border-gray-700">
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

	<!-- Move History -->
	<div class="absolute top-4 right-4 w-48 rounded-lg bg-white p-4 shadow-lg">
		<h3 class="mb-2 text-sm font-bold text-gray-700">Move History</h3>
		<div class="space-y-1 text-sm text-gray-800">
			{#each Array(Math.ceil(moveHistory.length / 2)) as _, i}
				<div class="flex justify-between">
					<span class="font-semibold">{i + 1}.</span>
					<span>{moveHistory[i * 2]?.san ?? ''}</span>
					<span>{moveHistory[i * 2 + 1]?.san ?? ''}</span>
				</div>
			{/each}
		</div>
	</div>
</div>
