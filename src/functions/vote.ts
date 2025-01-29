import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { ErrorResponse } from "../shared/ErrorResponse";
import { getUidBySession } from "../utils/user";
import { Aloha } from "../shared/container";
import { Status } from "../shared/Status";

enum Vote { CANCEL = -1, DISLIKE = 0, LIKE = 1}

type VoteRequest = { vote: Vote; targetId: string; }

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

async function vote(uid: string, targetId: string, vote: Vote) {
    await Aloha.Vote.items.upsert({ uid, targetId, vote });
}

async function voteHandler(req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const accessToken = req.headers.get('authorization');
        if (!accessToken) return ErrorResponse(Status.BAD_REQUEST);

        const body = await req.json() as VoteRequest;
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
                await vote(uid as string, body.targetId, body.vote);
                break;
            case Vote.CANCEL:
                await cancelVote(uid as string, body.targetId);
                break;
        }
        return { status: Status.CREATED };
    } 
    catch (error) {
        return { status: Status.INTERNAL_SERVER_ERROR, body: error.message };
    }
}

app.http('vote', {
    methods: ['POST'],
    route: 'api/vote',
    handler: voteHandler
});