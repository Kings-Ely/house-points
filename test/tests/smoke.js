import Test from '../framework.js';
Test.battery('smoke');

Test.test(async (api) => {
    let res = await api('ping.php');
    return res === '1' ?  true : res;
})