import { describe, expect, test } from "bun:test";
import {
	EXPOSURE_METER_SIZE,
	createExposureController,
} from "../src/components/scene/exposure-controller";

function constantLuminance(value: number) {
	return new Float32Array(EXPOSURE_METER_SIZE ** 2).fill(value);
}

describe("exposure controller", () => {
	test("meters HDR radiance into quantized ISO stops", () => {
		const targets: number[] = [];
		const exposure = createExposureController((stops) => targets.push(stops));
		exposure.update({ automatic: true, stops: 0 });

		expect(exposure.updateFromMeter(constantLuminance(0.01), 0)).toBe(true);
		expect(targets).toEqual([]);
		expect(exposure.updateFromMeter(constantLuminance(0.01), 199)).toBe(true);
		expect(targets).toEqual([]);
		expect(exposure.updateFromMeter(constantLuminance(0.01), 200)).toBe(false);
		expect(targets).toEqual([4]);

		exposure.setReducedMotion(true);
		expect(exposure.advance(0)).toBe(true);
		expect(exposure.getDisplayStops()).toBeCloseTo(3.7, 6);
	});

	test("keeps a pending measurement across unchanged renderer updates", () => {
		const targets: number[] = [];
		const exposure = createExposureController((stops) => targets.push(stops));
		exposure.update({ automatic: true, stops: 0 });

		exposure.updateFromMeter(constantLuminance(0.01), 0);
		expect(exposure.update({ automatic: true, stops: 0 })).toBe(false);
		exposure.updateFromMeter(constantLuminance(0.01), 200);

		expect(targets).toEqual([4]);
	});

	test("applies manual exposure immediately", () => {
		const targets: number[] = [];
		const exposure = createExposureController((stops) => targets.push(stops));

		expect(exposure.update({ automatic: false, stops: 3 })).toBe(true);
		expect(targets).toEqual([3]);
		expect(exposure.getDisplayStops()).toBeCloseTo(2.7, 6);
	});
});
