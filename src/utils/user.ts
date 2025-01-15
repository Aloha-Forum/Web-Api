import { Aloha } from "../shared/container";

export async function isAccountExisted(email: string, uid: string) {
    const querySpec = {
        query: 'SELECT VALUE COUNT(1) \
                FROM c \
                WHERE email=@email OR uid=@uid',
        parameters: [
            { name: '@email', value: email},
            { name: '@uid', value: uid}
        ],
    };

    const { resources: [count] } = await Aloha.User.items.query(querySpec).fetchNext();
    return count > 0
}