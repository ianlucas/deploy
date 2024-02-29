/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import arg from "arg";

export const args = arg({
    "--backup": String,
    "--no-pm2": Boolean,
    "--debug": Boolean,
    "--all": Boolean,

    "-a": "--all",
    "-b": "--backup"
});

export const cwd = process.cwd();
