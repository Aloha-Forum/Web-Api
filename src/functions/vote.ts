import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { ErrorResponse } from "../shared/ErrorResponse";
import { getUidBySession } from "../utils/user";
import { Aloha } from "../shared/container";
import { Status } from "../shared/Status";

export enum Vote { CANCEL = -1, DISLIKE = 0, LIKE = 1}

type PostVoteRequest = { vote: Vote; targetId: string; }
type GetVoteRequest = { targetId: string}

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


async function cancelVote(uid: string, targetId: string) {
    const query = `SELECT id \
                   FROM c \
                   WHERE c.uid = @uid AND c.targetId = @targetId`;

    const parameters = [
        { name: '@uid', value: uid },
        { name: '@targetId', value: targetId }
    ];
    
    const { resources: items } = await Aloha.Vote.items.query({ query, parameters }).fetchAll();
    if (items.length === 0) 
        return ErrorResponse(Status.NOT_FOUND, "Vote not found");

    await Aloha.Vote.item(items[0].id, targetId).delete();
}

async function addVote(uid: string, targetId: string, vote: Vote) {
    const query = `SELECT c.id 
                   FROM c 
                   WHERE c.uid = @uid AND c.targetId = @targetId`;
    const parameters = [
        { name: '@uid', value: uid },
        { name: '@targetId', value: targetId }
    ];

    const { resources: items } = await Aloha.Vote.items.query({ query, parameters }).fetchAll();
    if (items.length > 0) {
        try {
            await Aloha.Vote.item(items[0].id, targetId).delete();
        }
        catch (error) {
            console.log(error)
        }
    }
    await Aloha.Vote.items.create({ uid, targetId, vote });
}

async function getUserVote(targetId: string, uid: string) {
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

async function voteHandler(req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const accessToken = req.headers.get('authorization');
        if (!accessToken) return ErrorResponse(Status.BAD_REQUEST);

        const uid = getUidBySession(accessToken);
        if (uid == null) return ErrorResponse(Status.UNAUTHORIZED);

        switch (req.method) {
            case 'GET': {
                const body = await req.json() as GetVoteRequest;
                if (!body.targetId) return ErrorResponse(Status.BAD_REQUEST);

                return { body: JSON.stringify({ vote: Vote }) };
            }
            case 'POST': {
                const body = await req.json() as PostVoteRequest;
                if (body.vote == null || !body.targetId) 
                    return ErrorResponse(Status.BAD_REQUEST);
        
                if (Vote[body.vote] === undefined)
                    return ErrorResponse(Status.BAD_REQUEST, "Invalid like value");
        
                const uid = await getUidBySession(accessToken);
                if (uid == null) 
                    return ErrorResponse(Status.UNAUTHORIZED);
                
                switch (body.vote) {
                    case Vote.LIKE:
                    case Vote.DISLIKE:
                        await addVote(uid as string, body.targetId, body.vote);
                        break;
                    case Vote.CANCEL:
                        await cancelVote(uid as string, body.targetId);
                        break;
                }
                return { status: Status.CREATED };
            }
        }
    } 
    catch (error) {
        console.log(error)
        return { status: Status.INTERNAL_SERVER_ERROR, body: error.message };
    }
}

app.http('vote', {
    methods: ['GET', 'POST'],
    route: 'api/vote',
    handler: voteHandler
});