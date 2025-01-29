import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Aloha } from "../shared/container";
import { ErrorResponse } from "../shared/ErrorResponse";
import { Status } from "../shared/Status";
import { ulid } from "ulid";
import { getUidBySession } from "../utils/user";

type CommentRequest = {
    postId: string;
    content: string;
}

function createCommnetModel(uid: string, postId: string, content: string) {
    return {
        id: ulid(),
        uid: uid,
        body: content,
        postId: postId,
        postAt: new Date().toISOString(),
        popularity: { viewCount: 0, commentCount: 0 }
    };
}

async function publishComment(request: HttpRequest): Promise<HttpResponseInit> {
    // check if the request has an access token
    const accessToken = request.headers.get('authorization');
    if (!accessToken) return ErrorResponse(Status.BAD_REQUEST);

    // check if the request body is valid
    const body = await request.json() as CommentRequest;
    if (!body.postId || !body.content) return ErrorResponse(Status.BAD_REQUEST);

    // validate the content length
    if (body.content.length > 200) 
        return ErrorResponse(Status.BAD_REQUEST, "Content is too long");

    // get the user id from the database based on the access token
    const uid = await getUidBySession(accessToken);
    if (!uid) return ErrorResponse(Status.UNAUTHORIZED);

    // format the comment model and insert it into the database
    const comment = createCommnetModel(uid as string, body.postId, body.content)
    await Aloha.Post.items.create(comment);

    const bodyRes = JSON.stringify({ postId: comment.id, postAt: comment.postAt });
    return { status: Status.CREATED, body: bodyRes };
}

async function getComment(req: HttpRequest): Promise<HttpResponseInit> {
    const page = parseInt(req.query.get('page')) || 0;
    
    const query = `SELECT * \
                   FROM c \
                   WHERE c.postId = @postId \
                   ORDER BY c.commentId DESC \
                   OFFSET @offset \
                   LIMIT 10`;
    const parameters = [
        { name: '@postId', value: req.params.postId },
        { name: '@offset', value: page * 10 },
    ]

    const { resources: items } = await Aloha.Topic.items.query({query, parameters}).fetchAll();
    return { body: JSON.stringify(items) };
}

async function commentHandler(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const postId = request.params.postId;
        if (!postId) return ErrorResponse(Status.BAD_REQUEST);

        switch (request.method) {
            case 'GET':
                return await getComment(request);
            case 'POST':
                return await publishComment(request)
        }
    }
    catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}


app.http('comment', {
    methods: ['GET', 'POST'],
    route: 'api/c/{targetId}',
    handler: commentHandler
});