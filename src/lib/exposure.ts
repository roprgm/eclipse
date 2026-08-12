export const MIN_ISO_STOPS = -1;
export const MAX_ISO_STOPS = 11;

export function isoFromStops(stops: number) {
	return 100 * 2 ** stops;
}
