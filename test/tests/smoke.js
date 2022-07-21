import Test from '../framework.js';
Test.battery('smoke');

Test.test(async (api) => {
    let res = await api('ping');
    if (res.ok !== true) {
        return `ping failed: ${JSON.stringify(res)}`;
    }
    return true;
});

Test.test(async (api) => {
    let res = await api('echo/hello-world');
    if (res.ok !== true) {
        return `echo failed: ${JSON.stringify(res)}`;
    }
    if (res.msg !== 'hello-world') {
        return `echo failed: ${JSON.stringify(res)}`;
    }

    return true;
});

Test.test(async (api) => {
    let res = await api('check');
    if (res.ok !== true) {
        return `echo failed: ${JSON.stringify(res)}`;
    }

    return true;
})
