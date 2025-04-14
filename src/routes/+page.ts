function insertImages() {
	document.querySelectorAll('.box').forEach((element) => {
		const el = element as HTMLElement; // 👈 Cast Element to HTMLElement
		const piece = el.textContent?.trim();
		if (!piece) return;

		let src = '';
		if (piece === 'Bpawn') {
			// Image path corrected to be inside the public folder
			src = `/images/BPawn.png`;  // Example path inside public/images
		} else {
			// Other pieces - make sure the extension and case match your filenames
			src = `/images/${piece}.jpeg`;  // Assuming images are inside /public/images/
		}

		el.innerHTML = `<img src="${src}" alt="${piece}" class="w-full h-full object-contain" />`;
		el.style.cursor = 'pointer';
	});
}

if (typeof window !== 'undefined') {
	window.addEventListener('DOMContentLoaded', insertImages);
}
