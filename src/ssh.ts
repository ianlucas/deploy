/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { NodeSSH, SSHExecCommandResponse } from "node-ssh";

export interface SSHFunction {
    (command: string, config?: { cwd?: string }): Promise<SSHExecCommandResponse>;
    putFile: (localFile: string, remoteFile: string) => Promise<void>;
}

export async function ssh({
    host,
    password,
    passphrase,
    privateKey,
    username
}: {
    host: string;
    password?: string | undefined;
    passphrase?: string | undefined;
    privateKey?: string | undefined;
    username: string;
}): Promise<SSHFunction> {
    const ssh = new NodeSSH();

    await ssh.connect({
        host,
        username,
        passphrase,
        password,
        privateKey
    });

    const $: SSHFunction = (command, options) => {
        return ssh.execCommand(command, options);
    };

    $.putFile = async (localFile: string, remoteFile: string) => {
        await ssh.putFile(localFile, remoteFile);
    };

    return $;
}
