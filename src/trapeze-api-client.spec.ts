/*!
 * Source https://github.com/donmahallem/TrapezeApiClientNode
 */

import { TripId, VehicleId } from "@donmahallem/trapeze-api-types";
import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";
import { SettingsBodyTransformMethod, StopMode, TrapezeApiClient } from "./trapeze-api-client";

describe("trapeze-api-client.ts", () => {
    describe("TrapezeApiClient", () => {
        const testUrl: string = "test.url";
        let instance: TrapezeApiClient;
        let sandbox: sinon.SinonSandbox;
        let getStub: sinon.SinonStub;
        let postStub: sinon.SinonStub;
        const testValue: any = {
            randomString: "randomString",
            test: 1,
        };
        before("create Sandbox", () => {
            sandbox = sinon.createSandbox();
            getStub = sandbox.stub();
            postStub = sandbox.stub();
        });
        beforeEach(() => {
            instance = new TrapezeApiClient(testUrl);
            (instance as any).httpClient = {
                get: getStub,
                post: postStub,
            };
        });

        afterEach("clear history", () => {
            sandbox.resetHistory();
        });
        after(() => {
            sandbox.restore();
        });
        describe("constructor(public readonly endpoint: string)", () => {
            it("should set the endpoint url correctly", () => {
                expect(instance.endpoint).to.equal(testUrl);
            });
        });
        describe("getVehicleLocations()", () => {
            it("should query the correct endpoint", () => {
                getStub.resolves(testValue);
                return instance.getVehicleLocations()
                    .then((result) => {
                        expect(result).to.deep.equal(testValue);
                        expect(getStub.callCount).to.equal(1);
                        const callArgs: any[] = getStub.getCall(0).args;
                        expect(callArgs).to.deep.equal([{
                            qs: {
                                colorType: "ROUTE_BASED",
                                lastUpdate: undefined,
                                positionType: "CORRECTED",
                            },
                            url: testUrl + "/internetservice/geoserviceDispatcher/services/vehicleinfo/vehicles",
                        }]);
                    });
            });
            it("should query the correct endpoint with provided parameters", () => {
                getStub.resolves(testValue);
                return instance.getVehicleLocations("RAW", 12345)
                    .then((result) => {
                        expect(result).to.deep.equal(testValue);
                        expect(getStub.callCount).to.equal(1);
                        const callArgs: any[] = getStub.getCall(0).args;
                        expect(callArgs).to.deep.equal([{
                            qs: {
                                colorType: "ROUTE_BASED",
                                lastUpdate: 12345,
                                positionType: "RAW",
                            },
                            url: testUrl + "/internetservice/geoserviceDispatcher/services/vehicleinfo/vehicles",
                        }]);
                    });
            });
        });
        describe("getRouteByRouteId(vehicleId: string)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                ["testDirection1", "testDirection2"].forEach((testDirection: string): void => {
                    it('should query the correct endpoint with id "' + testId + '" and direction "' + testDirection + '"', () => {
                        postStub.resolves(testValue);
                        return instance.getRouteByRouteId(testId as TripId, testDirection)
                            .then((result) => {
                                expect(result).to.deep.equal(testValue);
                                expect(postStub.callCount).to.equal(1);
                                const callArgs: any[] = postStub.getCall(0).args;
                                expect(callArgs).to.deep.equal([{
                                    qs: {
                                        direction: testDirection,
                                        id: testId,
                                    },
                                    url: testUrl + "/internetservice/geoserviceDispatcher/services/pathinfo/route",
                                }]);
                            });
                    });
                });
            });
        });
        describe("getRouteByTripId(vehicleId: string)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getRouteByTripId(testId as TripId)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                qs: {
                                    id: testId,
                                },
                                url: testUrl + "/internetservice/geoserviceDispatcher/services/pathinfo/trip",
                            }]);
                        });
                });
            });
        });
        describe("getStopLocations(top, bottom, left, right)", () => {
            it("should query the correct endpoint with", () => {
                postStub.resolves(testValue);
                return instance.getStopLocations(1, 2, 3, 4)
                    .then((result) => {
                        expect(result).to.deep.equal(testValue);
                        expect(postStub.callCount).to.equal(1);
                        const callArgs: any[] = postStub.getCall(0).args;
                        expect(callArgs).to.deep.equal([{
                            qs: {
                                bottom: 2,
                                left: 3,
                                right: 4,
                                top: 1,
                            },
                            url: testUrl +
                                "/internetservice/geoserviceDispatcher/services/stopinfo/stops",
                        }]);
                    });
            });
            it("should use the default parameters", () => {
                postStub.resolves(testValue);
                return instance.getStopLocations()
                    .then((result) => {
                        expect(result).to.deep.equal(testValue);
                        expect(postStub.callCount).to.equal(1);
                        const callArgs: any[] = postStub.getCall(0).args;
                        expect(callArgs).to.deep.equal([{
                            qs: {
                                bottom: -324000000,
                                left: -648000000,
                                right: 648000000,
                                top: 324000000,
                            },
                            url: testUrl +
                                "/internetservice/geoserviceDispatcher/services/stopinfo/stops",
                        }]);
                    });
            });
        });
        describe("getStopPointLocations(top, bottom, left, right)", () => {
            it("should query the correct endpoint with", () => {
                postStub.resolves(testValue);
                return instance.getStopPointLocations(1, 2, 3, 4)
                    .then((result) => {
                        expect(result).to.deep.equal(testValue);
                        expect(postStub.callCount).to.equal(1);
                        const callArgs: any[] = postStub.getCall(0).args;
                        expect(callArgs).to.deep.equal([{
                            qs: {
                                bottom: 2,
                                left: 3,
                                right: 4,
                                top: 1,
                            },
                            url: testUrl +
                                "/internetservice/geoserviceDispatcher/services/stopinfo/stopPoints",
                        }]);
                    });
            });
            it("should use the default parameters", () => {
                postStub.resolves(testValue);
                return instance.getStopPointLocations()
                    .then((result) => {
                        expect(result).to.deep.equal(testValue);
                        expect(postStub.callCount).to.equal(1);
                        const callArgs: any[] = postStub.getCall(0).args;
                        expect(callArgs).to.deep.equal([{
                            qs: {
                                bottom: -324000000,
                                left: -648000000,
                                right: 648000000,
                                top: 324000000,
                            },
                            url: testUrl +
                                "/internetservice/geoserviceDispatcher/services/stopinfo/stopPoints",
                        }]);
                    });
            });

        });
        describe("getTripPassages(tripId, mode)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                ["arrival", "departure"].forEach((testMode: string): void => {
                    it('should query the correct endpoint with id "' + testId + '" and mode "'
                        + testMode + '"', () => {
                            postStub.resolves(testValue);
                            return instance.getTripPassages(testId as VehicleId,
                                testMode as StopMode)
                                .then((result) => {
                                    expect(result).to.deep.equal(testValue);
                                    expect(postStub.callCount).to.equal(1);
                                    const callArgs: any[] = postStub.getCall(0).args;
                                    expect(callArgs).to.deep.equal([{
                                        form: {
                                            mode: testMode,
                                            tripId: testId,
                                        },
                                        method: "POST",
                                        url: testUrl +
                                            "/internetservice/services/tripInfo/tripPassages",
                                    }]);
                                });
                        });
                });
            });
        });
        describe("getRouteByVehicleId(vehicleId: string)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getRouteByVehicleId(testId as VehicleId)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                qs: {
                                    id: testId,
                                },
                                url: testUrl + "/internetservice/geoserviceDispatcher/services/pathinfo/vehicle",
                            }]);
                        });
                });
            });
        });

        describe("getStopPassages(stopId, mode, startTime, timeFrame)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getStopPassages(testId as VehicleId)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                form: {
                                    mode: "departure",
                                    stop: testId,
                                },
                                url: testUrl + "/internetservice/services/passageInfo/stopPassages/stop",
                            }]);
                        });
                });

                ["arrival", "departure"].forEach((testDepartureMode: string): void => {

                    it('should query the correct endpoint with id "' + testId + '" and  "'
                        + testDepartureMode + '"', () => {
                            postStub.resolves(testValue);
                            return instance.getStopPassages(testId as VehicleId,
                                testDepartureMode as StopMode)
                                .then((result) => {
                                    expect(result).to.deep.equal(testValue);
                                    expect(postStub.callCount).to.equal(1);
                                    const callArgs: any[] = postStub.getCall(0).args;
                                    expect(callArgs).to.deep.equal([{
                                        form: {
                                            mode: testDepartureMode,
                                            stop: testId,
                                        },
                                        url: testUrl + "/internetservice/services/passageInfo/stopPassages/stop",
                                    }]);
                                });
                        });
                    [1234, 5678].forEach((testStartTime: number): void => {
                        [9876, 5432].forEach((testTimeFrame: number): void => {
                            it('should query the correct endpoint with id "' + testId + '" and  "'
                                + testDepartureMode + '"'
                                + ' startTime: "' + testStartTime + '"'
                                + ' timeFrame: "' + testTimeFrame + '"', () => {
                                    postStub.resolves(testValue);
                                    return instance.getStopPassages(testId as VehicleId,
                                        testDepartureMode as StopMode,
                                        testStartTime,
                                        testTimeFrame)
                                        .then((result) => {
                                            expect(result).to.deep.equal(testValue);
                                            expect(postStub.callCount).to.equal(1);
                                            const callArgs: any[] = postStub.getCall(0).args;
                                            expect(callArgs).to.deep.equal([{
                                                form: {
                                                    mode: testDepartureMode,
                                                    startTime: testStartTime,
                                                    stop: testId,
                                                    timeFrame: testTimeFrame,
                                                },
                                                url: testUrl +
                                                    "/internetservice/services/passageInfo/stopPassages/stop",
                                            }]);
                                        });
                                });
                        });
                    });
                });
            });
        });

        describe("getStopPointPassages(stopId, mode, startTime, timeFrame)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getStopPointPassages(testId as VehicleId)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                form: {
                                    mode: "departure",
                                    stop: testId,
                                },
                                url: testUrl + "/internetservice/services/passageInfo/stopPassages/stopPoint",
                            }]);
                        });
                });

                ["arrival", "departure"].forEach((testDepartureMode: string): void => {

                    it('should query the correct endpoint with id "' + testId + '" and  "'
                        + testDepartureMode + '"', () => {
                            postStub.resolves(testValue);
                            return instance.getStopPointPassages(testId as VehicleId,
                                testDepartureMode as StopMode)
                                .then((result) => {
                                    expect(result).to.deep.equal(testValue);
                                    expect(postStub.callCount).to.equal(1);
                                    const callArgs: any[] = postStub.getCall(0).args;
                                    expect(callArgs).to.deep.equal([{
                                        form: {
                                            mode: testDepartureMode,
                                            stop: testId,
                                        },
                                        url: testUrl + "/internetservice/services/passageInfo/stopPassages/stopPoint",
                                    }]);
                                });
                        });
                    [1234, 5678].forEach((testStartTime: number): void => {
                        [9876, 5432].forEach((testTimeFrame: number): void => {
                            it('should query the correct endpoint with id "' + testId + '" and  "'
                                + testDepartureMode + '"'
                                + ' startTime: "' + testStartTime + '"'
                                + ' timeFrame: "' + testTimeFrame + '"', () => {
                                    postStub.resolves(testValue);
                                    return instance.getStopPointPassages(testId as VehicleId,
                                        testDepartureMode as StopMode,
                                        testStartTime,
                                        testTimeFrame)
                                        .then((result) => {
                                            expect(result).to.deep.equal(testValue);
                                            expect(postStub.callCount).to.equal(1);
                                            const callArgs: any[] = postStub.getCall(0).args;
                                            expect(callArgs).to.deep.equal([{
                                                form: {
                                                    mode: testDepartureMode,
                                                    startTime: testStartTime,
                                                    stop: testId,
                                                    timeFrame: testTimeFrame,
                                                },
                                                url: testUrl +
                                                    "/internetservice/services/passageInfo/stopPassages/stopPoint",
                                            }]);
                                        });
                                });
                        });
                    });
                });
            });
        });

        describe("getStopPointInfo(stopPointId, mode)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getStopPointInfo(testId as VehicleId)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                form: {
                                    mode: "departure",
                                    stopPoint: testId,
                                },
                                url: testUrl + "/internetservice/services/stopInfo/stopPoint",
                            }]);
                        });
                });

                ["arrival", "departure"].forEach((testDepartureMode: string): void => {

                    it('should query the correct endpoint with id "' + testId + '" and  "'
                        + testDepartureMode + '"', () => {
                            postStub.resolves(testValue);
                            return instance.getStopPointInfo(testId as VehicleId,
                                testDepartureMode as StopMode)
                                .then((result) => {
                                    expect(result).to.deep.equal(testValue);
                                    expect(postStub.callCount).to.equal(1);
                                    const callArgs: any[] = postStub.getCall(0).args;
                                    expect(callArgs).to.deep.equal([{
                                        form: {
                                            mode: testDepartureMode,
                                            stopPoint: testId,
                                        },
                                        url: testUrl + "/internetservice/services/stopInfo/stopPoint",
                                    }]);
                                });
                        });
                });
            });
        });
        describe("getStopInfo(stopId, mode)", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint with id "' + testId + '"', () => {
                    postStub.resolves(testValue);
                    return instance.getStopInfo(testId as VehicleId)
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(postStub.callCount).to.equal(1);
                            const callArgs: any[] = postStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                form: {
                                    mode: "departure",
                                    stop: testId,
                                },
                                url: testUrl + "/internetservice/services/stopInfo/stop",
                            }]);
                        });
                });

                ["arrival", "departure"].forEach((testDepartureMode: string): void => {

                    it('should query the correct endpoint with id "' + testId + '" and  "'
                        + testDepartureMode + '"', () => {
                            postStub.resolves(testValue);
                            return instance.getStopInfo(testId as VehicleId,
                                testDepartureMode as StopMode)
                                .then((result) => {
                                    expect(result).to.deep.equal(testValue);
                                    expect(postStub.callCount).to.equal(1);
                                    const callArgs: any[] = postStub.getCall(0).args;
                                    expect(callArgs).to.deep.equal([{
                                        form: {
                                            mode: testDepartureMode,
                                            stop: testId,
                                        },
                                        url: testUrl + "/internetservice/services/stopInfo/stop",
                                    }]);
                                });
                        });
                });
            });
        });
        describe("getSettings()", () => {
            ["testId1", "testId2"].forEach((testId: string): void => {
                it('should query the correct endpoint and return "' + testId + '"', () => {
                    getStub.resolves(testValue);
                    return instance.getSettings()
                        .then((result) => {
                            expect(result).to.deep.equal(testValue);
                            expect(getStub.callCount).to.equal(1);
                            const callArgs: any[] = getStub.getCall(0).args;
                            expect(callArgs).to.deep.equal([{
                                transform: SettingsBodyTransformMethod,
                                url: testUrl + "/internetservice/settings",
                            }]);
                        });
                });
            });
        });
    });
    describe("SettingsBodyTransformMethod", () => {
        const testObjects: any[] = [
            { test: true },
            { test: false },
            { test: "any value" }, {
                nested: {
                    value: true,
                },
            },
        ];
        const prefixes: string[] = [
            "",
            "a lot of",
            "javascript_variable = ",
        ];
        const suffixes: string[] = [
            ";",
            "",
        ];
        testObjects.forEach((testObject: any): void => {
            describe("used with testObject: " + JSON.stringify(testObject), () => {
                prefixes.forEach((prefix: string) => {
                    suffixes.forEach((suffix: string) => {
                        it('should pass with prefix "' + prefix + '" and suffix "' + suffix + '"', () => {
                            const testBody: string = prefix + JSON.stringify(testObject) + suffix;
                            expect(SettingsBodyTransformMethod(testBody)).to.deep.equal(testObject);
                        });
                    });
                });
            });
        });
        it("should throw an error if no valid data is provided", () => {
            expect(() => {
                SettingsBodyTransformMethod("{breaks!}");
            }).to.throw("Unexpected token b in JSON at position 1");
        });
        it("should throw an error if no valid data is provided", () => {
            expect(() => {
                SettingsBodyTransformMethod("invalid data");
            }).to.throw("non valid response body");
        });
    });
});
