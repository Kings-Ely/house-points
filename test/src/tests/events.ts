import Test from '../framework';
import { generateUser } from "../util";


Test.test('Events | Creating, getting and deleting events', async (api) => {

    // check no events at start
    let res = await api(`get/events`);
    if (res.ok !== true) {
        return `0: ${JSON.stringify(res)}`;
    }
    if (res?.data?.length !== 0) {
        return `1: ${JSON.stringify(res)}`;
    }

    // use:
    // new Date(document.getElementById(???).value).getTime();
    // to get timestamp from form

    // create event
    const now = Math.round(Date.now() / 1000);
    res = await api(`create/events`, {
        name: 'doing something 2022',
        time: now
    });
    if (res.ok !== true || res.status !== 201) {
        return `2: ${JSON.stringify(res)}`;
    }
    // get event
    res = await api(`get/events`);
    if (res?.data?.length !== 1) {
        return `3: ${JSON.stringify(res)}`;
    }

    const { sessionId, userId } = await generateUser(api);

    // same but without admin user

    // this should fail, only admins can create events
    res = await api(`create/events`, {
        session: sessionId,
        name: 'doing something else 2022',
        time: now
    });
    if (res.ok || res.status !== 401) {
        return `4: ${JSON.stringify(res)}`;
    }

    // everyone logged in can see the events though
    res = await api(`get/events`, {
        session: sessionId
    });
    if (res?.data?.length !== 1) {
        return `5: ${JSON.stringify(res)}`;
    }
    if (res.data?.[0]?.name !== 'doing something 2022') {
        return `6: ${JSON.stringify(res)}`;
    }

    const id = res.data?.[0]?.id;

    // deleting shouldn't work without admin user either
    res = await api(`delete/events`, {
        session: sessionId,
        eventId: id
    });
    if (res.ok || res.status !== 401) {
        return `7: ${JSON.stringify(res)}`;
    }

    // check that the event is still there
    res = await api(`get/events`);
    if (res?.data?.length !== 1) {
        return `8: ${JSON.stringify(res)}`;
    }

    // now delete with admin user
    res = await api(`delete/events`, { eventId: id });
    if (res.ok !== true || res.status !== 200) {
        return `9: ${JSON.stringify(res)}`;
    }

    // check that the event is gone
    res = await api(`get/events`);
    if (res?.data?.length !== 0) {
        return `10: ${JSON.stringify(res)}`;
    }

    await api(`delete/users`, { userId });

    return true;
});

Test.test('Events | Updating event name', async (api) => {
    const now = Math.round(Date.now() / 1000);

    const { sessionId, userId } = await generateUser(api);

    // create event
    let res = await api(`create/events`, {
        name: 'doing something 2022',
        time: now
    });
    if (res.ok !== true || res.status !== 201) {
        return `0: ${JSON.stringify(res)}`;
    }

    res = await api(`get/events`);
    if (res?.data?.length !== 1) {
        return `1: ${JSON.stringify(res)}`;
    }
    const { id, name } = res.data?.[0];
    if (name !== 'doing something 2022') {
        return `2: ${JSON.stringify(res)}`;
    }

    // update event name
    res = await api(`update/events/name`, {
        eventId: id,
        name: 'doing something else 2022'
    });
    if (res.ok !== true || res.status !== 200) {
        return `3: ${JSON.stringify(res)}`;
    }

    res = await api(`get/events`);
    if (res?.data?.length !== 1) {
        return `4: ${JSON.stringify(res)}`;
    }
    const { id: id2, name: name2 } = res.data?.[0];
    if (id !== id2) {
        return `Expected event id to be '${id}', got '${id2}'`;
    }
    if (name2 !== 'doing something else 2022') {
        return `Expected event name to be 'doing something else 2022', got '${name2}'`;
    }

    // updating without permission
    res = await api(`update/events/name`, {
        session: sessionId,
        eventId: id,
        name: 'not doing anything'
    });
    if (res.ok || res.status !== 401) {
        return `5: ${JSON.stringify(res)}`;
    }

    res = await api(`get/events`);
    if (res?.data?.length !== 1) {
        return `6: ${JSON.stringify(res)}`;
    }
    const { id: id3, name: name3 } = res.data?.[0];
    if (id !== id3) {
        return `Expected event id to be '${id}', got '${id3}'`;
    }
    if (name3 !== 'doing something else 2022') {
        return `Expected event name to be 'doing something else 2022', got '${name3}'`;
    }

    await api(`delete/users`, { userId: userId });
    await api(`delete/events`, { eventId: id });

    return true;
});


Test.test('Events | Updating event timestamp', async (api) => {
    const now = Math.round(Date.now() / 1000);
    // 1 week ago
    const then = now - 60 * 60 * 24 * 7;

    const { sessionId, userId } = await generateUser(api);

    // create event
    let res = await api(`create/events`, {
        name: 'doing something 2022',
        time: now
    });
    if (res.ok !== true || res.status !== 201) {
        return `0: ${JSON.stringify(res)}`;
    }

    res = await api(`get/events`);
    if (res?.data?.length !== 1) {
        return `1: ${JSON.stringify(res)}`;
    }
    const { id, name, time } = res.data?.[0];
    if (name !== 'doing something 2022') {
        return `2: ${JSON.stringify(res)}`;
    }
    if (time !== now) {
        return `3: now=${now}, ${JSON.stringify(res)}`;
    }

    // update event name
    res = await api(`update/events/time`, {
        eventId: id,
        time: then
    });
    if (res.ok !== true || res.status !== 200) {
        return `4: ${JSON.stringify(res)}`;
    }

    res = await api(`get/events`);
    if (res?.data?.length !== 1) {
        return `5: ${JSON.stringify(res)}`;
    }
    const time2 = res.data?.[0]?.['time'];
    if (time2 !== then) {
        return `Expected event time to be '${then}', got '${time2}'`;
    }

    // updating without permission
    res = await api(`update/events/time`, {
        session: sessionId,
        eventId: id,
        time: now
    });
    if (res.ok || res.status !== 401) {
        return `6: ${JSON.stringify(res)}`;
    }

    res = await api(`get/events`);
    if (res?.data?.length !== 1) {
        return `7: ${JSON.stringify(res)}`;
    }
    const time3 = res.data?.[0]?.['time'];
    if (time3 !== then) {
        return `Expected event time to be '${then}', got '${time3}'`;
    }

    await api(`delete/users`, { userId });
    await api(`delete/events`, { eventId: id });

    return true;
});


Test.test('Events | Events are gotten in order of time', async (api) => {
    const now = Math.round(Date.now() / 1000);
    // 1 week ago
    const then = now - 60 * 60 * 24 * 7;

    // create house points
    await api(`create/events`, {
        name: 'now',
        time: now
    });
    await api(`create/events`, {
        name: 'then',
        time: then
    });

    let res = await api(`get/events`);
    if (res?.data?.length !== 2) {
        return `Expected 2 events, got ${JSON.stringify(res)}`;
    }
    // in order from closest to now to furthest in past
    // so 0th index is most recent
    let [
        { time: time1, id: id1 },
        { time: time2, id: id2 }
    ] = res.data;

    if (time1 !== now) {
        return `Expected event time to be '${now}', got '${time1}'`;
    }
    if (time2 !== then) {
        return `Expected event time to be '${then}', got '${time2}'`;
    }

    await api(`delete/events`, { eventId: id1 });
    await api(`delete/events`, { eventId: id2 });

    // repeat the other way round
    await api(`create/events`, {
        name: 'then',
        time: then
    });
    await api(`create/events`, {
        name: 'now',
        time: now
    });

    res = await api(`get/events`);
    if (res?.data?.length !== 2) {
        return `Expected 2 events, got ${JSON.stringify(res)}`;
    }
    [
        { time: time1, id: id1 },
        { time: time2, id: id2 }
    ] = res.data;

    if (time1 !== now) {
        return `Expected event time to be '${now}', got '${time1}'`;
    }
    if (time2 !== then) {
        return `Expected event time to be '${then}', got '${time2}'`;
    }

    await api(`delete/events`, { eventId: id1 });
    await api(`delete/events`, { eventId: id2 });

    return true;
});

