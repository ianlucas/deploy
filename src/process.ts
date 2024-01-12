/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import arg from "arg";

export const args = arg({
    "--backup": String,
    "--noprocess": Boolean,
    "--debug": Boolean,

    "-b": "--backup",
    "-n": "--noprocess"
});

export const cwd = process.cwd();
