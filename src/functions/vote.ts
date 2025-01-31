import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { ErrorResponse } from "../shared/ErrorResponse";
import { getUidBySession } from "../utils/user";
import { Aloha } from "../shared/container";
import { Status } from "../shared/Status";
import { getVoteId } from "../stored/vote";

export enum Vote { CANCEL = -1, DISLIKE = 0, LIKE = 1}

type PostVoteRequest = { vote: Vote; targetId: string; }
type GetVoteRequest = { targetId: string}

async function cancelVote(uid: string, targetId: string) {
    const id = await getVoteId(targetId, uid);
    
    if (id != null)
        await Aloha.Vote.item(id, targetId).delete();
}

async function addVote(uid: string, targetId: string, vote: Vote) {
    cancelVote(uid, targetId);
    await Aloha.Vote.items.create({ uid, targetId, vote });
}

async function voteHandler(req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const accessToken = req.headers.get('authorization');
        if (!accessToken) return ErrorResponse(Status.BAD_REQUEST);

        const uid = getUidBySession(accessToken);
        if (!uid) return ErrorResponse(Status.UNAUTHORIZED);

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
                if (!uid) return ErrorResponse(Status.UNAUTHORIZED);
                
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