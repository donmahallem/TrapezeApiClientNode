/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { VehicleDataset } from "./vehicle-dataset";

describe("vehicle-dataset.ts", () => {
    describe("VehicleDataset", () => {
        let instance: VehicleDataset;
        let sandbox: sinon.SinonSandbox;
        let clock: sinon.SinonFakeTimers;
        const clockNowTimestamp: number = 123456;
        before("create Sandbox", () => {
            sandbox = sinon.createSandbox();
            clock = sandbox.useFakeTimers({
                now: clockNowTimestamp,
                shouldAdvanceTime: false,
            });
        });
        beforeEach(() => {
            instance = new VehicleDataset();
        });

        afterEach("clear history", () => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
            clock.restore();
        });
        describe("isExpired(entry)", () => {
            beforeEach(() => {
                (instance as any).mDataTTL = 100;
            })
            it("should reject if the entry is expired", () => {
                const testObject: any = {
                    lastUpdate: clockNowTimestamp - 101
                };
                expect(instance.isExpired(testObject)).to.eq(true);
            });
            it("should pass if the entry is not expired", () => {
                const testObject: any = {
                    lastUpdate: clockNowTimestamp - 99
                };
                expect(instance.isExpired(testObject)).to.eq(false);
            });
            it("should pass if the entry is equal to expiry", () => {
                const testObject: any = {
                    lastUpdate: clockNowTimestamp - 100
                };
                expect(instance.isExpired(testObject)).to.eq(false);
            });
        });
    });
});
