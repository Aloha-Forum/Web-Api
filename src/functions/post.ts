import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getQuery } from "../utils/validate";
import { Aloha } from "../shared/container";
import { AuthenticationError, ErrorResponse, RequestFormatError, ResourceNotFoundError } from "../shared/ErrorResponse";
import { ulid } from 'ulid';
import { getUidBySession } from "../utils/user";
import { Status } from "../shared/Status";

type PublishPostRequest = { title: string; content: string; topicId: string; }

function createPostModel(uid: string, topicId: string, title: string, content: string) {
    return {
        id: ulid(),
        uid: uid,
        title: title,
        body: content,
        topicId: topicId,
        postAt: new Date().toISOString(),
        popularity: { viewCount: 0, commentCount: 0 }
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
        if (body.title.length > 100 || body.content.length > 5000)
            return ErrorResponse(Status.BAD_REQUEST, "Title or content is too long");
        
        // get the user id from the database based on the access token
        const uid = await getUidBySession(accessToken);
        if (!uid) return ErrorResponse(Status.UNAUTHORIZED);

        // format the post model and insert it into the database
        const post = createPostModel(uid as string, body.topicId, body.title, body.content)
        await Aloha.Post.items.create(post);

        const bodyRes = JSON.stringify({ postId: post.id, postAt: post.postAt });
        return { status: Status.CREATED, body: bodyRes };
    }
    catch (error) {
        return { status: Status.INTERNAL_SERVER_ERROR, body: error.message };
    }
}

async function getPost(id: string): Promise<HttpResponseInit> {
    const query = `SELECT c.topicId, c.postAt, c.uid, c.title, c.body, c.likeCount, c.dislikeCount \
                   FROM c \
                   WHERE c.postId = @postId`;
    const parameters = [{ name: '@postId', value: id }];

	const { resources: [item] } = await Aloha.Post.items.query({ query, parameters }).fetchAll();
	if (!item) return ErrorResponse(Status.NOT_FOUND);

	return { body: JSON.stringify(item) };
}

async function postHandler(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const params = getQuery(request.query, ['id']);
        switch (request.method) {
            case 'GET':
                return await getPost(params.id);
            case 'POST':
                return await publishPost(request)
        }
    }
    catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}

app.http('post', {
    methods: ['GET'],
    route: 'api/post',
    handler: postHandler
});