<script lang="ts">
	// No logic needed for now
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
	<!-- Heading -->
	<div class="mb-6 text-center">
		<p class="mb-2 text-3xl font-bold">Chess App</p>
		<p class="text-lg text-gray-700">White's Turn</p>
	</div>

	<!-- Chessboard -->
	<div class="grid w-[32rem] grid-cols-8 border-4 border-gray-700">
		{#each Array(8) as _, row}
			{#each Array(8) as _, col}
				<div
					class="aspect-square"
					class:bg-[#f0d9b5]={(row + col) % 2 === 0}
					class:bg-[#b58863]={(row + col) % 2 !== 0}
				></div>
			{/each}
		{/each}
	</div>
</div>
