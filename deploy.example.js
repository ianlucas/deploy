export default {
    ssh: {
        host: "192.168.0.1",
        username: "yo user",
        password: "yo pass"
    },

    apps: [
        {
            name: "my-app",
            folders: ["build", "prisma", "public"],
            files: ["package.json", "package-lock.json"],
            env: {
                MY_ENV_VAR_1: 1,
                MY_ENV_VAR_2: "hello"
            }
        }
    ],

    beforeZip({ name, $ }) {
        $`npm run switch ${name}`;
        $`npm run build`;
    }
};
