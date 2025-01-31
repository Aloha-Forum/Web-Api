import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Aloha } from "../shared/container";
import { ErrorResponse } from "../shared/ErrorResponse";
import { Status } from "../shared/Status";
import { ulid } from "ulid";
import { getUidBySession } from "../utils/user";
import { getComment } from "../stored/comment";

type CommentRequest = {
    postId: string;
    content: string;
}

function createCommnetModel(uid: string, postId: string, content: string) {
    return {
        commentId: ulid(),
        uid: uid,
        content: content, 
        postId: postId,
        createdAt: new Date().toISOString(),
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
    await Aloha.Comment.items.create(comment);

    const bodyRes = JSON.stringify(comment);
    return { status: Status.CREATED, body: bodyRes };
}

async function commentHandler(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const postId = request.params.postId;
        if (!postId) return ErrorResponse(Status.BAD_REQUEST);

        switch (request.method) {
            case 'GET':
                return await getComment(postId);
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
    route: 'api/comment',
    handler: commentHandler
});