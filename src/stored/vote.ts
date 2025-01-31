import { Vote } from "../functions/vote";
import { Aloha } from "../shared/container";

export async function getUserVote(targetId: string, uid: string) {
    const query = `SELECT c.vote \
                   FROM c \
                   WHERE c.targetId = @targetId AND c.uid = @uid`;
    const parameters = [
        { name: '@targetId', value: targetId },
        { name: '@uid', value: uid }
    ];

    const { resources: items } = await Aloha.Vote.items.query({ query, parameters }).fetchAll();
    return items.length > 0 ? items[0].vote : Vote.CANCEL;
}

export async function getVoteId(targetId: string, uid: string) {
    const query = `SELECT c.id \
                   FROM c \
                   WHERE c.targetId = @targetId AND c.uid = @uid`;
    const parameters = [
        { name: '@targetId', value: targetId },
        { name: '@uid', value: uid }
    ];

    const { resources: items } = await Aloha.Vote.items.query({ query, parameters }).fetchAll();
    return items.length > 0 ? items[0].id : null;
}

export async function getVoteCount(targetId: string, type: Vote) {
    const query = `SELECT * \
                   FROM c \
                   where c.targetId = @targetId AND c.vote = @type`;
    const parameters = [
        { name: '@targetId', value: targetId },
        { name: '@type', value: type }
    ];

    const { resources: items } = await Aloha.Vote.items.query({ query, parameters }).fetchAll();
    return items.length;
}