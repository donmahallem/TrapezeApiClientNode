import {
    ITripPassages,
    IVehicleLocationList,
    IVehiclePathInfo,
} from "@donmahallem/trapeze-api-types";
import * as req from "request";
import * as reqp from "request-promise-native";

export class TrapezeApiClient {
    private httpClient: req.RequestAPI<reqp.RequestPromise<any>, reqp.RequestPromiseOptions, req.UrlOptions>;
    public constructor(public readonly endpoint: string) {
        this.httpClient = reqp.defaults({
            headers: {
                "User-Agent": "Request-Promise",
            },
            json: true,
        });
    }

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
    public getRouteByTripId(vehicleId: string): reqp.RequestPromise<IVehiclePathInfo> {
        const options: req.OptionsWithUrl = {
            qs: {
                id: vehicleId,
            },
            url: this.endpoint + "/internetservice/geoserviceDispatcher/services/pathinfo/trip",
        };
        return this.httpClient
            .post(options);
    }
    public getRouteByVehicleId(vehicleId: string): reqp.RequestPromise<IVehiclePathInfo> {
        const options: req.OptionsWithUrl = {
            qs: {
                id: vehicleId,
            },
            url: this.endpoint + "/internetservice/geoserviceDispatcher/services/pathinfo/vehicle",
        };
        return this.httpClient
            .post(options);
    }

    public getStations(top: number = 324000000,
                       bottom: number = -324000000,
                       left: number = -648000000,
                       right: number = 648000000): reqp.RequestPromise<any> {
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

    public getTripPassages(tripId: string, mode: string): reqp.RequestPromise<ITripPassages> {
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

    public getStopPassages(stopId: string): reqp.RequestPromise<any> {
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
    public getStopInfo(stopId: string, mode: string = "departure"): reqp.RequestPromise<any> {
        const options: req.OptionsWithUrl = {
            form: {
                mode,
                stop: stopId,
            },
            url: this.endpoint + "/internetservice/services/stopInfo/stop",
        };
        return this.httpClient.post(options);
    }

    public getStopPointInfo(stopPointId: string, mode: string = "departure"): reqp.RequestPromise<any> {
        const options = {
            form: {
                mode,
                stopPoint: stopPointId,
            },
            url: this.endpoint + "/internetservice/services/stopInfo/stopPoint",
        };
        return reqp(options);
    }

}
