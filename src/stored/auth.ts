import { Aloha } from "../shared/container";

export async function isSessionExisted(token: String): Promise<boolean> {
    const querySpec = {
        query: 'SELECT VALUE COUNT(1) \
                FROM c \
                WHERE c.sid = @token',
        parameters: [
            { name: '@token', value: token }
        ],
    };

    const { resources: [count] } = await Aloha.Session.items.query(querySpec).fetchAll();
    return count > 0
}
