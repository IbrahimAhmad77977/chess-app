<script lang="ts">
	let loading = false;

	let selectedOpponent: { id: string; username: string } | null = null;

	onMount(async () => {
		if (gameId) {
			const { data: gameData, error } = await supabaseClient
				.from('games')
				.select('fen')
				.eq('id', gameId)
				.single();

			if (error) {
				console.error('Failed to load game:', error.message);
				return;
			}

			if (gameData?.fen) {
				game = new Chess(gameData.fen);
			} else {
				game = new Chess(); // fallback to default position
			}
		} else {
			game = new Chess(fen); // if gameId not present, use prop
		}

		updateBoard();
		turn = game.turn();
		moveHistory = game.history({ verbose: true });
	});

	export let data;
	// export let users: Array<{ id: string; username: string }>;
	interface Game {
		id: string; // Assuming the 'id' is a string (UUID or INT8)
		player_white: string; // User ID of the player playing white
		player_black: string; // User ID of the player playing black
		fen: string; // FEN string representing the game state
		current_turn: string; // Either 'w' or 'b' for white or black's turn
	}

	const currentUserId = data.currentUserId;

	async function startGame(opponentId: string, opponent: { id: string; username: string }) {
		selectedOpponent = opponent;

		if (!currentUserId) {
			console.error('Current user ID is not defined.');
			return;
		}

		// Step 1: Check if a game already exists between these two players
		const { data: existingGames, error: fetchError } = await supabaseClient
			.from('games')
			.select('id')
			.or(
				`and(white_player_id.eq.${currentUserId},black_player_id.eq.${opponentId}),and(white_player_id.eq.${opponentId},black_player_id.eq.${currentUserId})`
			)
			.limit(1);

		if (fetchError) {
			console.error('Error checking existing games:', fetchError.message);
			return;
		}

		// Step 2: If a game exists, go to that game
		if (existingGames && existingGames.length > 0) {
			goto(`/${existingGames[0].id}`);
			return;
		}

		// Step 3: No existing game — create a new one
		const startingFEN = new Chess().fen();

		const { data, error } = await supabaseClient
			.from('games')
			.insert([
				{
					white_player_id: currentUserId,
					black_player_id: opponentId,
					fen: startingFEN,
					current_turn: 'w'
				}
			])
			.select('id')
			.single();

		if (error) {
			console.error('Error creating game:', error.message);
			return;
		}

		if (data) {
			localStorage.setItem('selectedOpponent', JSON.stringify(opponent));

			goto(`/${data.id}`);
		}
	}

	import { onMount } from 'svelte';
	import { Chess } from 'chess.js';
	import { supabaseClient } from '$lib/supabase';
	import type { Square, Move } from 'chess.js';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

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
			move: new Audio('/sound/Move.mp3'),
			capture: new Audio('/sound/Capture.mp3'),
			select: new Audio('/sound/Select.mp3'),
			game_over: new Audio('/sound/Game_Over.mp3'),
			error: new Audio('/sound/Error.mp3') // <-- add this line
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

	function playSelectSound() {
		if (sounds.select) sounds.select.play();
	}

	function playGameOverSound() {
		if (sounds.game_over) sounds.game_over.play();
	}

	function playErrorSound() {
		if (sounds.error) sounds.error.play();
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
					playGameOverSound();

					statusMessage = `${turn === 'w' ? 'Black' : 'White'} wins by checkmate!`;
				} else if (game.isDraw()) {
					playGameOverSound();

					statusMessage = 'Draw!';
				}
			} else {
				// 🟢 Play sound based on capture or normal move
				if (move.captured) {
					playCaptureSound();
				} else {
					playMoveSound();
				}
			}
		} else {
			selectedSquare = null;
		}
	}
	async function saveMove(fen: string, nextTurn: string) {
		const history = game.history(); // Array of SAN strings
		const lastMove = history[history.length - 1];

		// Insert move into `moves` table
		const { error: moveInsertError } = await supabaseClient.from('games').insert([
			{
				moves: lastMove,
				fen,
				current_turn: nextTurn
			}
		]);

		if (moveInsertError) {
			console.error('Failed to insert move into games table:', moveInsertError.message);
		}
	}

	async function promotePawn(piece: string) {
		if (promotionFrom && promotionTo) {
			const move = game.move({ from: promotionFrom, to: promotionTo, promotion: piece });

			if (move) {
				const fen = game.fen();
				turn = game.turn();
				await saveMove(fen, turn);
				moveHistory = game.history({ verbose: true }); // Update move history after promotion
				updateBoard();

				// 🔊 Play appropriate sound
				if (move.captured) {
					playCaptureSound();
				} else {
					playMoveSound();
				}

				if (game.isGameOver()) {
					if (game.isCheckmate()) {
						playGameOverSound();
						statusMessage = `${turn === 'w' ? 'Black' : 'White'} wins by checkmate!`;
					} else if (game.isDraw()) {
						playGameOverSound();

						statusMessage = 'Draw!';
					}
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

		// 🟡 Deselect if the same square is clicked again
		if (selectedSquare === square) {
			selectedSquare = null;
			legalMoves = [];
			playSelectSound();
			return;
		}

		// ✅ Make move if valid
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

		if (!isWhitePieceTurn && !isBlackPieceTurn) {
			playErrorSound(); // 🔊 Add this line for sound feedback
			statusMessage = 'Not your turn!';
			return;
		}

		selectedSquare = square;
		legalMoves = getLegalMoves(square);
		playSelectSound();
	}

	function isWhitePiece(piece: string): boolean {
		return ['♖', '♘', '♗', '♕', '♔', '♙'].includes(piece);
	}
</script>

<div class="flex min-h-screen flex-row items-center gap-x-[200px] bg-gray-100 pl-10">
	<!-- Title and Turn Display -->
	<div class="mb-6 w-[250px] shrink-0 text-center">
		<p class="mb-2 text-3xl font-bold">Chess App</p>
		<p>
			Currently playing with: {selectedOpponent ? selectedOpponent.username : 'Self'}
		</p>
		<!-- User List -->
		<div class="mt-6 w-[250px] text-center">
			<h2 class="mb-2 text-lg font-bold text-gray-800">Play With:</h2>
			<ul class="space-y-2">
				{#each data.users as user}
					<li>
						<button
							on:click={() => startGame(user.id, user)}
							class="w-full cursor-pointer rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
						>
							{user.username}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<form
			method="POST"
			action="?/logout"
			use:enhance={() => {
				loading = true;

				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			<button
				type="submit"
				class="mt-4 cursor-pointer rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
			>
				{#if loading}
					Logging out...
				{:else}
					Logout
				{/if}
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
					class={`relative aspect-square text-2xl select-none md:text-3xl lg:text-4xl ${legalMoves.includes(square) ? ' border-2 border-green-500' : ''} ${selectedSquare === square ? 'border-2 border-yellow-400' : ''}`}
					class:bg-[#f0d9b5]={(rowIndex + colIndex) % 2 === 0}
					class:bg-[#b58863]={(rowIndex + colIndex) % 2 !== 0}
				>
					{#if piece}
						<span
							class="absolute inset-0 flex cursor-pointer items-center justify-center"
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
