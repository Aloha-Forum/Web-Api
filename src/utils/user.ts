import { Aloha } from "../shared/container";

export async function getUidBySession(accessToken: string): Promise<String | null> {
    const querySpec = {
        query: 'SELECT uid FROM c WHERE c.sid = @sid',
        parameters: [
            { name: '@sid', value: accessToken }
        ],
    };
    
    const { resources: sessions } = await Aloha.Session.items.query(querySpec).fetchNext();
    return sessions.length > 0 ? sessions[0].uid : null;
}

export async function getUidByEmail(email: string) {
    const querySpec = {
        query: 'SELECT c.uid, c.email FROM c WHERE c.email=@email',
        parameters: [
            { name: '@email', value: email}
        ],
    };

    const { resources: items } = await Aloha.User.items.query(querySpec).fetchNext();
    if (items.length === 0) {
        return 
    }
    return items[0];
}

export async function isUidExisted(uid: string) {
    const querySpec = {
        query: 'SELECT VALUE COUNT(1) \
                FROM c \
                WHERE uid=@uid',
        parameters: [
            { name: '@uid', value: uid}
        ],
    };

    const { resources: [count] } = await Aloha.User.items.query(querySpec).fetchNext();
    return count > 0
}