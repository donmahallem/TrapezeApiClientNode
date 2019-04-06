import {
    IStopInfo,
    IStopLocations,
    IStopPassage,
    ITripPassages,
    IVehicleLocationList,
    IVehiclePathInfo,
    StopId,
    TripId,
    VehicleId,
} from "@donmahallem/trapeze-api-types";
import * as req from "request";
import * as reqp from "request-promise-native";

export class TrapezeApiClient {
    private httpClient: req.RequestAPI<reqp.RequestPromise<any>, reqp.RequestPromiseOptions, req.UrlOptions>;
    /**
     *
     * @param endpoint
     * @since 1.0.0
     */
    public constructor(public readonly endpoint: string) {
        this.httpClient = reqp.defaults({
            headers: {
                "User-Agent": "Request-Promise",
            },
            json: true,
        });
    }

    /**
     * @since 1.0.0
     */
    public getVehicleLocations(): reqp.RequestPromise<IVehicleLocationList> {
        const options: req.OptionsWithUrl = {
            qs: {
                colorType: "ROUTE",
                positionType: "CORRECTED",
            },
            url: this.endpoint + "/internetservice/geoserviceDispatcher/services/vehicleinfo/vehicles",
        };
        return this.httpClient
            .get(options);
    }
    /**
     *
     * @param tripId
     * @since 1.0.0
     */
    public getRouteByTripId(tripId: TripId): reqp.RequestPromise<IVehiclePathInfo> {
        const options: req.OptionsWithUrl = {
            qs: {
                id: tripId,
            },
            url: this.endpoint + "/internetservice/geoserviceDispatcher/services/pathinfo/trip",
        };
        return this.httpClient
            .post(options);
    }
    /**
     *
     * @param vehicleId
     * @since 1.0.0
     */
    public getRouteByVehicleId(vehicleId: VehicleId): reqp.RequestPromise<IVehiclePathInfo> {
        const options: req.OptionsWithUrl = {
            qs: {
                id: vehicleId,
            },
            url: this.endpoint + "/internetservice/geoserviceDispatcher/services/pathinfo/vehicle",
        };
        return this.httpClient
            .post(options);
    }

    /**
     *
     * @param top
     * @param bottom
     * @param left
     * @param right
     * @since 1.3.0
     */
    public getStationLocations(top: number = 324000000,
                               bottom: number = -324000000,
                               left: number = -648000000,
                               right: number = 648000000): reqp.RequestPromise<IStopLocations> {
        const options: req.OptionsWithUrl = {
            qs: {
                bottom,
                left,
                right,
                top,
            },
            url: this.endpoint + "/internetservice/geoserviceDispatcher/services/stopinfo/stops",
        };
        return this.httpClient.post(options);
    }
    /**
     *
     * @param tripId
     * @param mode
     * @since 1.0.0
     */
    public getTripPassages(tripId: TripId, mode: string): reqp.RequestPromise<ITripPassages> {
        const options: req.OptionsWithUrl = {
            form: {
                mode,
                tripId,
            },
            method: "POST",
            url: this.endpoint + "/internetservice/services/tripInfo/tripPassages",
        };
        return this.httpClient
            .post(options);
    }

    /**
     *
     * @param stopId
     * @since 1.0.0
     */
    public getStopPassages(stopId: StopId): reqp.RequestPromise<IStopPassage> {
        const options: req.OptionsWithUrl = {
            form: {
                mode: "departure",
                stop: stopId,
            },
            url: this.endpoint + "/internetservice/services/passageInfo/stopPassages/stop",
        };
        return this.httpClient
            .post(options);
    }

    /**
     *
     * @param stopId
     * @param mode
     * @since 1.0.0
     */
    public getStopInfo(stopId: StopId, mode: string = "departure"): reqp.RequestPromise<IStopInfo> {
        const options: req.OptionsWithUrl = {
            form: {
                mode,
                stop: stopId,
            },
            url: this.endpoint + "/internetservice/services/stopInfo/stop",
        };
        return this.httpClient.post(options);
    }

    /**
     *
     * @param stopPointId
     * @param mode
     * @since 1.0.0
     */
    public getStopPointInfo(stopPointId: string, mode: string = "departure"): reqp.RequestPromise<any> {
        const options: req.OptionsWithUrl = {
            form: {
                mode,
                stopPoint: stopPointId,
            },
            url: this.endpoint + "/internetservice/services/stopInfo/stopPoint",
        };
        return this.httpClient.post(options);
    }

}
