/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//@ts-check
import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch');

/**
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 */

/** @type BuildOptions */
const sharedBrowserOptions = {
	bundle: true,
	external: ['vscode'],
	target: 'es2020',
	platform: 'browser',
	sourcemap: true,
};

/** @type BuildOptions */
const webOptions = {
	entryPoints: ['src/web/extension.ts'],
	outfile: 'dist/web/extension.js',
	format: 'cjs',
	...sharedBrowserOptions,
};

/** @type BuildOptions */
const sharedDesktopOptions = {
	bundle: true,
	external: ['vscode'],
	target: 'es2020',
	platform: 'node',
	sourcemap: true,
};

/** @type BuildOptions */
const desktopOptions = {
	entryPoints: ['src/desktop/extension.ts'],
	outfile: 'dist/desktop/extension.js',
	format: 'cjs',
	...sharedDesktopOptions,
};

if (watch) {
	await Promise.all([
		(await esbuild.context(webOptions)).watch(),
		(await esbuild.context(desktopOptions)).watch(),
	]);
} else {
	await Promise.all([
		esbuild.build(webOptions),
		esbuild.build(desktopOptions)
	]);
}