import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getQuery } from "../utils/validate";
import { Aloha } from "../shared/container";
import { AuthenticationError, ErrorResponse, RequestFormatError, ResourceNotFoundError } from "../shared/ErrorResponse";
import { ulid } from 'ulid';
import { getUidBySession } from "../utils/user";
import { Status } from "../shared/Status";
import { getCommentCount } from "../shared/comment";
import { get } from "http";
import { getVoteCount, Vote } from "./vote";

type PublishPostRequest = { title: string; content: string; topicId: string; }

function createPostModel(uid: string, topicId: string, title: string, content: string) {
    return {
        postId: ulid(),
        uid: uid,
        title: title,
        body: content,
        topicId: topicId,
        postAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
    };
}

async function publishPost(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        // check if the request has an access token
        const accessToken = request.headers.get('authorization');
        if (!accessToken) return ErrorResponse(Status.BAD_REQUEST);

        // check if the request body is valid
        const body = await request.json() as PublishPostRequest;

        if (!body.title || !body.content || !body.topicId) 
            return ErrorResponse(Status.BAD_REQUEST);

        // validate the title and content length
        if (body.title.length < 5 || body.content.length < 20) 
            return ErrorResponse(Status.BAD_REQUEST, "Title or content is too short");

        if (body.title.length > 100 || body.content.length > 5000)
            return ErrorResponse(Status.BAD_REQUEST, "Title or content is too long");
        
        // get the user id from the database based on the access token
        const uid = await getUidBySession(accessToken);
        if (!uid) return ErrorResponse(Status.UNAUTHORIZED);

        // format the post model and insert it into the database
        const post = createPostModel(uid as string, body.topicId, body.title, body.content)
        await Aloha.Post.items.create(post);

        const bodyRes = JSON.stringify({ postId: post.postId, postAt: post.postAt });
        return { status: Status.CREATED, body: bodyRes };
    }
    catch (error) {
        return { status: Status.INTERNAL_SERVER_ERROR, body: error.message };
    }
}

async function getPost(req: HttpRequest): Promise<HttpResponseInit> {
    const id = req.query.get('id');
    if (!id) return ErrorResponse(Status.BAD_REQUEST);

    const query = `SELECT c.topicId, c.postAt, c.uid, c.title, c.body, c.likeCount, c.dislikeCount \
                   FROM c \
                   WHERE c.postId = @postId`;
    const parameters = [{ name: '@postId', value: id }];

	const { resources: [item] } = await Aloha.Post.items.query({ query, parameters }).fetchAll();
	if (!item) return ErrorResponse(Status.NOT_FOUND);

    item.commentCount = await getCommentCount(id);
    item.likeCount = await getVoteCount(id, Vote.LIKE);
    item.dislikeCount = await getVoteCount(id, Vote.DISLIKE);

    const accessToken = req.headers.get('authorization');
    console.log(accessToken)
    if (accessToken != null) {
        const uid = await getUidBySession(accessToken);
        console.log(uid)

        if (uid != null) {
            const voteQuery = `SELECT c.vote \
                               FROM c \
                               WHERE c.targetId = @targetId AND c.uid = @uid`;
            const voteParameters = [
                { name: '@targetId', value: id },
                { name: '@uid', value: uid }
            ];



            const { resources: votes } = 
                await Aloha.Vote.items.query({ query: voteQuery, parameters: voteParameters }).fetchAll();

            console.log(votes.length, votes[0].vote)
            item.vote = votes.length > 0 ? votes[0].vote : Vote.CANCEL;

            if (item.vote == Vote.LIKE)
                item.likeCount -= 1;
            else if (item.vote == Vote.DISLIKE)
                item.dislikeCount -= 1;
        }
    }
    else {
        item.vote = Vote.CANCEL;
    }
	return { body: JSON.stringify(item) };
}

async function postHandler(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        switch (request.method) {
            case 'GET':
                return await getPost(request);
            case 'POST':
                return await publishPost(request)
        }
    }
    catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}

app.http('post', {
    methods: ['GET', 'POST'],
    route: 'api/post',
    handler: postHandler
});