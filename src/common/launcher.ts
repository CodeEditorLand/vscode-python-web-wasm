/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ExtensionContext, Terminal, window } from 'vscode';

import RAL from './ral';
import { ServiceConnection, Requests, ApiService, RAL as SyncRAL} from '@vscode/sync-api-service';

export abstract class Launcher {

	private readonly exitPromise: Promise<number>;
	private exitResolveCallback!: ((value: number) => void);

	private terminal: Terminal | undefined;

	public constructor() {
		this.exitPromise = new Promise((resolve) => {
			this.exitResolveCallback = resolve;
		});
	}

	/**
	 * Run the Python WASM.
	 *
	 * @param context The VS Code extension context
	 * @returns A promise that completes when the WASM is executing.
	 */
	public async run(context: ExtensionContext, program?: string): Promise<void> {
		const connection = await this.createConnection(context);
		const apiService = new ApiService('Python WASM Execution', connection, {
			exitHandler: (rval) => {
				SyncRAL().timer.setTimeout(async () => {
					await this.terminateConnection();
				}, 0);
				this.exitResolveCallback(rval);
			},
			echoName: false
		});
		const name = program !== undefined
			? `Executing ${RAL().path.basename(program)}`
			: 'Executing Python File';
		// See https://github.com/microsoft/vscode/issues/160914
		SyncRAL().timer.setTimeout(() => {
			this.terminal = window.createTerminal({ name: name, pty: apiService.getPty() });
			this.terminal.show();
		}, 250);

		connection.signalReady();
	}

	/**
	 * A promise that resolves then the WASM finished running.
	 *
	 * @returns The promise.
	 */
	public onExit(): Promise<number> {
		return this.exitPromise;
	}

	public terminate(): Promise<void> {
		if (this.terminal !== undefined) {
			this.terminal.sendText(`Execution terminated`, true);
		}
		return this.terminateConnection();
	}

	protected abstract createConnection(context: ExtensionContext): Promise<ServiceConnection<Requests>>;

	protected abstract terminateConnection(): Promise<void>;
}