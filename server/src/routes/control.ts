import route from "../";
import { close } from "../log";

route('control/kill/:code', async ({ params: { code}}) => {
    if (code !== process.env.KILL_CODE) {
        return { ok: false };
    }
    await close();
    process.kill(process.pid, 'SIGTERM');
    return { ok: true };
});

route('control/get/pid', async () => {
    return { pid: process.pid };
});
