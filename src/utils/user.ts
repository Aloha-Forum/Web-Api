import { Aloha } from "../shared/container";
import { ResourceNotFoundError, UndefinedError } from "../shared/error";

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