/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { z } from "zod";
import { cwd } from "./process.js";
import type { $ } from "zx";
import type { SSHFunction } from "./ssh.js";

export async function load() {
    return z
        .object({
            ssh: z.object({
                host: z.string(),
                username: z.string(),
                password: z.string().optional(),
                privateKey: z.string().optional()
            }),
            defaults: z
                .object({
                    folders: z.array(z.string()).optional(),
                    files: z.array(z.string()).optional()
                })
                .optional(),
            merges: z
                .object({
                    env: z.record(z.string().or(z.number())).optional()
                })
                .optional(),
            apps: z
                .array(
                    z.object({
                        name: z.string(),
                        folders: z.array(z.string()).optional(),
                        files: z.array(z.string()).optional(),
                        env: z.record(z.string().or(z.number())).optional()
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
                .optional(),

            afterDeploy: z
                .function(
                    z.tuple([
                        z.object({
                            $: z.custom<SSHFunction>(),
                            name: z.string(),
                            deployPathCwd: z.object({
                                cwd: z.string()
                            })
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
