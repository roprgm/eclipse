const UPDATE_INTERVAL_MILLISECONDS = 500;

export function createRenderTimeReporter(
	onRenderTime: (milliseconds: number) => void,
) {
	let samples = 0;
	let total = 0;
	let lastUpdate = Number.NEGATIVE_INFINITY;

	return (milliseconds: number) => {
		samples += 1;
		total += milliseconds;
		const now = performance.now();
		if (now - lastUpdate < UPDATE_INTERVAL_MILLISECONDS) return;

		onRenderTime(total / samples);
		samples = 0;
		total = 0;
		lastUpdate = now;
	};
}
