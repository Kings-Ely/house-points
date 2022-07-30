import Test from '../framework';
import c from 'chalk';


Test.test('Ping server', async (api) => {
    let res = await api('get/server/ping');
    if (res.ok !== true) {
        return `ping failed: ${JSON.stringify(res)}`;
    }
    return true;
});

Test.test('echo from server', async (api) => {
    let res = await api('get/server/echo/hello-world');
    if (res.ok !== true) {
        return `echo failed: ${JSON.stringify(res)}`;
    }
    if (res.msg !== 'hello-world') {
        return `echo failed: ${JSON.stringify(res)}`;
    }

    return true;
});

Test.test('Check SQL status of server', async (api) => {
    let res = await api('get/server/check');
    if (res.ok !== true) {
        return `echo failed: ${JSON.stringify(res)}`;
    }

    return true;
});

Test.test('Check performance of server', async (api) => {
    const n = 10;

    let res = await api(`get/server/performance?iterations=${n}`);
    if (res.ok !== true) {
        return `performance test failed: ${JSON.stringify(res)}`;
    }

    console.log(c.yellow(`PERFORMANCE (${n}): ${res.time.toFixed(3)}ms`));

    if (res.time > 500) {
        return `Server db connection performance test failed: ${JSON.stringify(res)}ms`;
    }

    return true;
});
