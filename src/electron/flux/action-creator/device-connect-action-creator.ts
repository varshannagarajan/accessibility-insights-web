// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { TelemetryEventHandler } from 'background/telemetry/telemetry-event-handler';
import { TelemetryEventSource } from 'common/extension-telemetry-events';
import { VALIDATE_PORT } from 'electron/common/electron-telemetry-events';

import { FetchScanResultsType } from '../../platform/android/fetch-scan-results';
import { DeviceActions } from '../action/device-actions';

export class DeviceConnectActionCreator {
    constructor(
        private readonly deviceActions: DeviceActions,
        private readonly fetchScanResults: FetchScanResultsType,
        private readonly telemetryEventHandler: TelemetryEventHandler,
    ) {}

    public validatePort(port: number): void {
        this.telemetryEventHandler.publishTelemetry(VALIDATE_PORT, {
            telemetry: { port, source: TelemetryEventSource.ElectronDeviceConnect },
        });

        this.deviceActions.connecting.invoke({ port });

        this.fetchScanResults(port)
            .then(data => this.deviceActions.connectionSucceeded.invoke({ connectedDevice: `${data.deviceName} - ${data.appIdentifier}` }))
            .catch(() => this.deviceActions.connectionFailed.invoke());
    }

    public resetConnection(): void {
        this.deviceActions.resetConnection.invoke(null);
    }
}
