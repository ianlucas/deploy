/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { cwd } from "./process.js";
import { $ } from "zx";

export async function load() {
    return z
        .object({
            ssh: z.object({
                host: z.string(),
                username: z.string(),
                password: z.string().optional(),
                privateKey: z.string().optional()
            }),
            apps: z
                .array(
                    z.object({
                        name: z.string(),
                        folders: z.array(z.string()),
                        files: z.array(z.string()),
                        env: z.record(z.string().or(z.number()))
                    })
                )
                .min(1),
            beforeZip: z
                .function(
                    z.tuple([
                        z.object({
                            $: z.custom<typeof $>(),
                            name: z.string()
                        })
                    ]),
                    z.any()
                )
                .optional()
        })
        .parse((await import(`file://${cwd}/deploy.js`)).default);
}

export type DeployConfig = Awaited<ReturnType<typeof load>>;
export type DeployApp = DeployConfig["apps"][number];
