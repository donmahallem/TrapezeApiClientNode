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
            });
            it("should reject if the entry is expired", () => {
                const testObject: any = {
                    lastUpdate: clockNowTimestamp - 101,
                };
                expect(instance.isExpired(testObject)).to.eq(true);
            });
            it("should pass if the entry is not expired", () => {
                const testObject: any = {
                    lastUpdate: clockNowTimestamp - 99,
                };
                expect(instance.isExpired(testObject)).to.eq(false);
            });
            it("should pass if the entry is equal to expiry", () => {
                const testObject: any = {
                    lastUpdate: clockNowTimestamp - 100,
                };
                expect(instance.isExpired(testObject)).to.eq(false);
            });
        });
        describe("getVehiclesInBox(left, right, top, bottom, updatedSince)", () => {
            let expiredStub: sinon.SinonStub;
            const testVehicles: any[] = [1, 2, 3, 4]
                .reduce((acc: Array<[number, number]>, x) => acc.concat([[x, 1], [x, 2], [x, 3], [x, 4]]), [])
                .map((value: [number, number], index: number) =>
                    ({
                        id: "" + value[0] + value[1],
                        lastUpdate: clockNowTimestamp + index,
                        latitude: value[0],
                        longitude: value[1],
                    }));
            beforeEach(() => {
                (instance as any).mDataset = testVehicles;
                expiredStub = sandbox.stub(instance, "isExpired");
            });
            describe("invalid parameter are provided", () => {
                it("should reject if left is not smaller than right", () => {
                    expect(instance.getVehiclesInBox.bind(1, 1, 1, 2)).to.throw("left must be smaller than right");
                });
                it("should reject if bottom is not smaller than top", () => {
                    expect(instance.getVehiclesInBox.bind(1, 2, 2, 2)).to.throw("left must be smaller than right");
                });
            });
            describe("vehicles bounds are provided", () => {
                it("should return no vehicle as no vehicle is inside bounds", () => {
                    expect(instance.getVehiclesInBox(20, 22, 2, 1)).to.deep.eq([]);
                    expect(expiredStub.callCount).to.equal(0, "should not reach the expiry check");
                });
                it("should return few vehicles and non are expired", () => {
                    expiredStub.returns(false);
                    const result = instance.getVehiclesInBox(1, 2, 2, 1);
                    expect(expiredStub.callCount).to.equal(4, "should call the expire check for only the in box items");
                    expect(result).to.deep.equal([
                        {
                            id: "11",
                            lastUpdate: 123456,
                            latitude: 1,
                            longitude: 1,
                        },
                        {
                            id: "12",
                            lastUpdate: 123457,
                            latitude: 1,
                            longitude: 2,
                        },
                        {
                            id: "21",
                            lastUpdate: 123460,
                            latitude: 2,
                            longitude: 1,
                        },
                        {
                            id: "22",
                            lastUpdate: 123461,
                            latitude: 2,
                            longitude: 2,
                        },
                    ]);

                });
                it("should return all non expired", () => {
                    expiredStub.callsFake((vehicle) => {
                        return vehicle.lastUpdate % 2 !== 0;
                    });
                    const result = instance.getVehiclesInBox(1, 2, 2, 1);
                    expect(expiredStub.callCount).to.equal(4, "should call the expire check for only the in box items");
                    expect(result).to.deep.equal([
                        {
                            id: "11",
                            lastUpdate: 123456,
                            latitude: 1,
                            longitude: 1,
                        },
                        {
                            id: "21",
                            lastUpdate: 123460,
                            latitude: 2,
                            longitude: 1,
                        },
                    ]);

                });
            });
        });
        describe("getVehicleById(id)", () => {
            let expiredStub: sinon.SinonStub;
            beforeEach(() => {
                (instance as any).mDataset = [{ id: "1" }, { id: "2" }];
                expiredStub = sandbox.stub(instance, "isExpired");
            });
            it("should return no entry for a unknown id", () => {
                expect(instance.getVehicleById("-1")).to.equal(undefined);
                expect(expiredStub.callCount).to.equal(0, "Should not be called");
            });
            it("should return a entry for a known id that hasn't expired", () => {
                expiredStub.returns(false);
                expect(instance.getVehicleById("1")).to.deep.eq({ id: "1" });
                expect(expiredStub.callCount).to.equal(1, "Should be called once");
            });
            it("should return no entry for a known id that expired", () => {
                expiredStub.returns(true);
                expect(instance.getVehicleById("1")).to.equal(undefined);
                expect(expiredStub.callCount).to.equal(1, "Should be called once");
            });
        });
        describe("getVehicleByTripId(tripId)", () => {
            let expiredStub: sinon.SinonStub;
            beforeEach(() => {
                (instance as any).mDataset = [{ tripId: "1" }, { tripId: "2" }];
                expiredStub = sandbox.stub(instance, "isExpired");
            });
            it("should return no entry for a unknown id", () => {
                expect(instance.getVehicleByTripId("-1")).to.equal(undefined);
                expect(expiredStub.callCount).to.equal(0, "Should not be called");
            });
            it("should return a entry for a known id that hasn't expired", () => {
                expiredStub.returns(false);
                expect(instance.getVehicleByTripId("1")).to.deep.eq({ tripId: "1" });
                expect(expiredStub.callCount).to.equal(1, "Should be called once");
            });
            it("should return no entry for a known id that expired", () => {
                expiredStub.returns(true);
                expect(instance.getVehicleByTripId("1")).to.equal(undefined);
                expect(expiredStub.callCount).to.equal(1, "Should be called once");
            });
        });
    });
});
