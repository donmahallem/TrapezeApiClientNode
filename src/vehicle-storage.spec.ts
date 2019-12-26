/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { IVehicleLocationExtended } from "@donmahallem/trapeze-api-client-types";
import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { NotFoundError } from "./not-found-error";
import { TrapezeApiClient } from "./trapeze-api-client";
import { VehicleDataset } from "./vehicle-dataset";
import { ISuccessStatus, LoadStatus, Status, VehicleStorage } from "./vehicle-storage";

describe("vehicle-storage.ts", () => {
    describe("VehicleStorage", () => {
        let instance: VehicleStorage;
        let sandbox: sinon.SinonSandbox;
        let getVehicleLocationsStub: sinon.SinonStub;
        let instanceDb: VehicleDataset;
        let client: TrapezeApiClient;
        let clock: sinon.SinonFakeTimers;
        const clockNowTimestamp: number = 123456;
        before("create Sandbox", () => {
            sandbox = sinon.createSandbox();
            getVehicleLocationsStub = sandbox.stub();
            clock = sandbox.useFakeTimers({
                now: clockNowTimestamp,
                shouldAdvanceTime: false,
            });
        });
        beforeEach(() => {
            client = {
                getVehicleLocations: getVehicleLocationsStub,
            } as any;
            instance = new VehicleStorage(client);
            instanceDb = (instance as any).mVehicleDatabase;
        });

        afterEach("clear history", () => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
            clock.restore();
        });
        describe("getVehicle(id)", () => {
            let fetchSuccessStub: sinon.SinonStub;
            let dbGetVehicleStub: sinon.SinonStub;
            const testError: Error = new Error("Test Error");
            const testData: ISuccessStatus = {
                lastUpdate: 235236,
                status: Status.SUCCESS,
                timestamp: 993,
            };
            beforeEach(() => {
                fetchSuccessStub = sandbox.stub(instance, "fetchSuccessOrThrow");
                dbGetVehicleStub = sandbox.stub(instanceDb, "getVehicleById");
            });
            describe("fetch throws an error", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.reject(testError));
                });
                it("should pass the error on", () =>
                    instance.getVehicle("any id")
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.deep.equal(testError);
                            expect(dbGetVehicleStub.callCount).to.equal(0, "db should not be called");
                        }));
            });
            describe("an unknown vehicle id is provided", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                    dbGetVehicleStub.returns(undefined);
                });
                it("should throw an NotFoundError", () =>
                    instance.getVehicle("any id")
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any | NotFoundError) => {
                            expect(err).to.instanceOf(NotFoundError);
                            expect(err.statusCode).to.equal(404);
                            expect(dbGetVehicleStub.callCount).to.equal(1);
                            expect(dbGetVehicleStub.args).to.deep.equal([["any id"]]);
                        }));
            });
            describe("an known vehicle id is provided", () => {
                const testValue: any = {
                    foo: "any",
                    test: 1,
                };
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                    dbGetVehicleStub.returns(testValue);
                });
                it("should return the id", () =>
                    instance.getVehicle("testId")
                        .then((vehicle: IVehicleLocationExtended) => {
                            expect(vehicle).to.deep.equal(testValue);
                            expect(dbGetVehicleStub.callCount).to.equal(1);
                            expect(dbGetVehicleStub.args).to.deep.equal([["testId"]]);
                        }),
                );
            });
        });
        describe("getVehicleByTripId(id)", () => {
            let fetchSuccessStub: sinon.SinonStub;
            const testError: Error = new Error("Test Error");
            const testData: ISuccessStatus = {
                lastUpdate: 235236,
                status: Status.SUCCESS,
                timestamp: 993,
            };
            let dbGetVehicleStub: sinon.SinonStub;
            beforeEach(() => {
                fetchSuccessStub = sandbox.stub(instance, "fetchSuccessOrThrow");
                dbGetVehicleStub = sandbox.stub(instanceDb, "getVehicleByTripId");
            });
            describe("fetch throws an error", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.reject(testError));
                });
                it("should pass the error on", () =>
                    instance.getVehicleByTripId("any id")
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any) => {
                            expect(err).to.deep.equal(testError);
                            expect(dbGetVehicleStub.callCount).to.equal(0);
                        }));
            });
            describe("an unknown vehicle id is provided", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                    dbGetVehicleStub.returns(undefined);
                });
                it("should throw an NotFoundError", () =>
                    instance.getVehicleByTripId("any id")
                        .then(() => {
                            throw new Error("should not be called");
                        }, (err: any | NotFoundError) => {
                            expect(err).to.instanceOf(NotFoundError);
                            expect(err.statusCode).to.equal(404);
                            expect(dbGetVehicleStub.callCount).to.equal(1);
                            expect(dbGetVehicleStub.args).to.deep.equal([["any id"]]);
                        }));
            });
            describe("an known vehicle id is provided", () => {
                beforeEach(() => {
                    fetchSuccessStub.returns(Promise.resolve(testData));
                    dbGetVehicleStub.returns(testData);
                });
                it("should return the id", () =>
                    instance.getVehicleByTripId("testId")
                        .then((vehicle: IVehicleLocationExtended) => {
                            expect(vehicle).to.deep.equal(testData);
                            expect(dbGetVehicleStub.callCount).to.equal(1);
                            expect(dbGetVehicleStub.args).to.deep.equal([["testId"]]);
                        }));
            });
        });
        describe("getVehicles(left, right, top, bottom,lastUpdate)", () => {
            it("needs to be implemented");
        });
        describe("status", () => {
            describe("getter", () => {
                [1, 2, 3].forEach((testValue: number): void => {
                    it("should return the private mStatus with value '" + testValue + "'", () => {
                        (instance as any).mStatus = testValue;
                        expect(instance.status).to.equal(testValue);
                    });
                });
            });
        });
        describe("updateRequired()", () => {
            const testValues: Array<{ status: any, result: boolean, updateDelay: number }> = [
                {
                    result: true,
                    status: undefined,
                    updateDelay: 10000,
                },
                {
                    result: true,
                    // tslint:disable-next-line:no-null-keyword
                    status: null,
                    updateDelay: 10000,
                },
                {
                    result: false,
                    status: {
                        timestamp: clockNowTimestamp,
                    },
                    updateDelay: 10000,
                },
                {
                    result: true,
                    status: {
                        timestamp: "asdf",
                    },
                    updateDelay: 10000,
                }];
            [2000, 4000, 10000].forEach((delay: number): void => {
                testValues.push({
                    result: false,
                    status: {
                        timestamp: clockNowTimestamp - delay,
                    },
                    updateDelay: delay,
                });
                testValues.push({
                    result: false,
                    status: {
                        timestamp: clockNowTimestamp - delay + 1,
                    },
                    updateDelay: delay,
                });
                testValues.push({
                    result: true,
                    status: {
                        timestamp: clockNowTimestamp - delay - 1,
                    },
                    updateDelay: delay,
                });
            });
            testValues.forEach((testValue): void => {
                it("should return " + testValue.result + " for " + JSON.stringify(testValue.status)
                    + " and delay: " + testValue.updateDelay, () => {
                        (instance as any).updateDelay = testValue.updateDelay;
                        (instance as any).mStatus = testValue.status;
                        expect(instance.updateRequired()).to.equal(testValue.result);
                    });
            });
        });
        describe("fetch()", () => {
            const statusPrimer: any = {
                test: "status",
            };
            let updateStub: sinon.SinonStub;
            let lockedStub: sinon.SinonStub;
            let dbAddStub: sinon.SinonStub;
            beforeEach(() => {
                updateStub = sandbox.stub(instance, "updateRequired");
                (instance as any).mStatus = statusPrimer;
                lockedStub = sandbox.stub((instance as any).lock, "locked");
                dbAddStub = sandbox.stub(instanceDb, "addLocationResponse");
            });
            describe("no update is required", () => {
                beforeEach(() => {
                    updateStub.returns(false);
                });
                it("should resolve with the current status", () =>
                    instance.fetch()
                        .then((value: LoadStatus) => {
                            expect(value).to.deep.equal(statusPrimer);
                            expect(getVehicleLocationsStub.callCount).to.equal(0);
                        }));
            });
            describe("file is locked", () => {
                let lockPromiseStub: sinon.SinonStub;
                beforeEach(() => {
                    updateStub.returns(true);
                    lockedStub.get(() => true);
                    lockPromiseStub = sandbox.stub((instance as any).lock, "promise");
                    lockPromiseStub.returns(Promise.resolve(1));
                    getVehicleLocationsStub.rejects();
                });
                it("should resolve after file is unlocked", () =>
                    instance.fetch()
                        .then((value: LoadStatus) => {
                            expect(lockPromiseStub.callCount).to.equal(1);
                            expect(getVehicleLocationsStub.callCount).to.equal(0);
                            expect(value).to.deep.equal(statusPrimer);
                        }));
            });
            describe("refresh of data is required", () => {
                let lockedSetterSpy: sinon.SinonSpy;
                const testError = new Error("test error");
                before(() => {
                    lockedSetterSpy = sandbox.spy();
                });
                beforeEach(() => {
                    updateStub.returns(true);
                    lockedStub.get(() => false);
                    lockedStub.set(lockedSetterSpy);
                });
                describe("getVehicleLocation resolves", () => {
                    const testResponse: any = {
                        data: "any",
                        lastUpdate: 2982,
                        test: true,
                    };
                    beforeEach(() => {
                        getVehicleLocationsStub.resolves(testResponse);
                    });
                    it("should resolve after file is unlocked", () =>
                        instance.fetch()
                            .then((value: LoadStatus) => {
                                expect(getVehicleLocationsStub.callCount).to.equal(1);
                                expect(value).to.deep.equal({
                                    lastUpdate: 2982,
                                    status: Status.SUCCESS,
                                    timestamp: clockNowTimestamp,
                                });
                                expect(lockedSetterSpy.callCount).to.equal(2);
                                expect(lockedSetterSpy.args).to.deep.equal([[true], [false]]);
                                expect(dbAddStub.callCount).to.equal(1);
                                expect(dbAddStub.args).to.deep.equal([[testResponse]]);
                            }));
                    it("should report error thrown inside convertResponse", () => {
                        dbAddStub.throws(testError);
                        return instance.fetch()
                            .then((value: LoadStatus) => {
                                expect(getVehicleLocationsStub.callCount).to.equal(1);
                                expect(value).to.deep.equal({
                                    error: testError,
                                    status: Status.ERROR,
                                    timestamp: clockNowTimestamp,
                                });
                                expect(lockedSetterSpy.callCount).to.equal(2);
                                expect(lockedSetterSpy.args).to.deep.equal([[true], [false]]);
                            });
                    });
                });
                describe("getVehicleLocation rejects", () => {
                    beforeEach(() => {
                        getVehicleLocationsStub.rejects(testError);
                    });
                    it("should resolve after file is unlocked", () =>
                        instance.fetch()
                            .then((value: LoadStatus) => {
                                expect(getVehicleLocationsStub.callCount).to.equal(1);
                                expect(value).to.deep.equal({
                                    error: testError,
                                    status: Status.ERROR,
                                    timestamp: clockNowTimestamp,
                                });
                                expect(lockedSetterSpy.callCount).to.equal(2);
                                expect(lockedSetterSpy.args).to.deep.equal([[true], [false]]);
                            }));
                });
            });
        });
        describe("fetchSuccessOrThrow()", () => {
            let fetchStub: sinon.SinonStub;
            const testError: Error = new Error("test error");
            beforeEach(() => {
                fetchStub = sinon.stub(instance, "fetch");
            });
            it("should throw the error from the status retrieved from fetch()", () => {
                fetchStub.returns(Promise.resolve({
                    error: testError,
                    status: Status.ERROR,
                }));
                return instance.fetchSuccessOrThrow()
                    .then(() => {
                        throw new Error("should not have been called");
                    }, (err: any) => {
                        expect(err).to.deep.equal(testError);
                    });
            });
            it("should resolve with the successful state from fetch()", () => {
                const successStatus: any = {
                    error: testError,
                    status: Status.SUCCESS,
                };
                fetchStub.returns(Promise.resolve(successStatus));
                return instance.fetchSuccessOrThrow()
                    .then((value) => {
                        expect(value).to.deep.equal(successStatus);
                    });
            });
            it("should throw error if no value is resolved", () => {
                fetchStub.returns(Promise.resolve());
                return instance.fetchSuccessOrThrow()
                    .then(() => {
                        throw new Error("should not have been called");
                    }, (err: any | Error) => {
                        expect(err).to.be.instanceOf(Error);
                        expect(err.message).to.equal("No status provided");
                    });
            });
        });
    });
});
