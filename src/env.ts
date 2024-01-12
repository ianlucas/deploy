type EnvRecord = Record<string, string | number>;

export class Env {
    record: EnvRecord;

    constructor(record: EnvRecord) {
        this.record = record;
    }

    toString() {
        return Object.entries(this.record)
            .map(([key, value]) => `${key}=${typeof value === "string" ? `"${value}"` : value}`)
            .join("\n");
    }
}
