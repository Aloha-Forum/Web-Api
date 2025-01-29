import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getQuery } from "../utils/validate";
import { Aloha } from "../shared/container";

async function getPost(id: string): Promise<any> {
	const querySpec = {
		query: 'SELECT c.topicId, c.postAt, c.uid, c.title, c.body, c.likeCount, c.dislikeCount \
				FROM c \
				WHERE c.postId = @postId',
		parameters: [
			{ name: '@postId', value: id }
		],
	};

	const { resources: [item] } = await Aloha.Post.items.query(querySpec).fetchNext();
	if (!item) throw new ResourceNotFoundError();
	
	return JSON.stringify(item);
}

async function post(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const params = getQuery(request.query, ['id']);
        switch (request.method) {
            case 'GET':
                return { body: await getPost(params.id) };
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
    handler: post
});