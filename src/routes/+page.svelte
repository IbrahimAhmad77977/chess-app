<script lang="ts">
	const pieces: (string | null)[][] = [
		['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'], // Black major pieces
		Array(8).fill('♟'), // Black pawns
		...Array(4).fill(Array(8).fill(null)), // Empty rows
		Array(8).fill('♙'), // White pawns
		['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'] // White major pieces
	];

	function isWhitePiece(piece: string): boolean {
		// All white pieces are in the Unicode range U+2654 to U+2659 (♔ to ♙)
		return ['♖', '♘', '♗', '♕', '♔', '♙'].includes(piece);
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
	<!-- Heading -->
	<div class="mb-6 text-center">
		<p class="mb-2 text-3xl font-bold">Chess App</p>
		<p class="text-lg text-gray-700">White's Turn</p>
	</div>

	<!-- Chessboard -->
	<div class="grid w-[32rem] grid-cols-8 border-4 border-gray-700">
		{#each pieces as row, rowIndex}
			{#each row as piece, colIndex}
				<div
					class="relative aspect-square text-2xl select-none md:text-3xl lg:text-4xl"
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
