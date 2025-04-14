<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		document.querySelectorAll('.box').forEach((square) => {
			const piece = square.textContent?.trim();
			if (piece) {
				square.innerHTML = `<img src="/images/${piece}.png" alt="${piece}" class="w-full h-full object-contain" />`;
				(square as HTMLElement).style.cursor = 'pointer';
			}
		});
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
	<h1 class="mb-2 text-3xl font-bold">Chess App</h1>
	<p class="mb-4 text-lg" id="tog">White's Turn</p>
	<h2 id="reset-btn" class="mb-6 cursor-pointer text-blue-600 hover:underline">Reset</h2>

	<!-- Chessboard -->
	<div class="grid h-[32rem] w-[32rem] grid-cols-8 border-4 border-gray-700">
		<!-- Row 8 -->
		<div class="box bg-gray-800">Brook</div>
		<div class="box bg-white">Bknight</div>
		<div class="box bg-gray-800">Bbishop</div>
		<div class="box bg-white">Bqueen</div>
		<div class="box bg-gray-800">Bking</div>
		<div class="box bg-white">Bbishop</div>
		<div class="box bg-gray-800">Bknight</div>
		<div class="box bg-white">Brook</div>

		<!-- Row 7 -->
		<div class="box bg-white">Bpawn</div>
		<div class="box bg-gray-800">Bpawn</div>
		<div class="box bg-white">Bpawn</div>
		<div class="box bg-gray-800">Bpawn</div>
		<div class="box bg-white">Bpawn</div>
		<div class="box bg-gray-800">Bpawn</div>
		<div class="box bg-white">Bpawn</div>
		<div class="box bg-gray-800">Bpawn</div>

		<!-- Empty rows (6–3) -->
		{#each Array(4) as _, i}
			{#each Array(8) as _, j}
				<div class="box {(i + j) % 2 === 0 ? 'bg-white' : 'bg-gray-800'}"></div>
			{/each}
		{/each}

		<!-- Row 2 -->
		<div class="box bg-gray-800">Wpawn</div>
		<div class="box bg-white">Wpawn</div>
		<div class="box bg-gray-800">Wpawn</div>
		<div class="box bg-white">Wpawn</div>
		<div class="box bg-gray-800">Wpawn</div>
		<div class="box bg-white">Wpawn</div>
		<div class="box bg-gray-800">Wpawn</div>
		<div class="box bg-white">Wpawn</div>

		<!-- Row 1 -->
		<div class="box bg-white">Wrook</div>
		<div class="box bg-gray-800">Wknight</div>
		<div class="box bg-white">Wbishop</div>
		<div class="box bg-gray-800">Wqueen</div>
		<div class="box bg-white">Wking</div>
		<div class="box bg-gray-800">Wbishop</div>
		<div class="box bg-white">Wknight</div>
		<div class="box bg-gray-800">Wrook</div>
	</div>
</div>
