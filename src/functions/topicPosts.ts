import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getPostList } from "../stored/post";
import { ErrorResponse } from "../shared/ErrorResponse";
import { Status } from "../shared/Status";
import { getCommentCount } from "../stored/comment";

async function topicPosts(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const topicId = request.params.topicId;
        if (!topicId) return ErrorResponse(Status.BAD_REQUEST);
            
        const page = parseInt(request.query.get('page')) || 0;
        const items = await getPostList(topicId, page);

        for (let item of items)
            item.commentCount = await getCommentCount(item.postId);

        return { body: JSON.stringify(items) }
    }
    catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}

app.http('topicPosts', {
	methods: ['GET'],
	route: 'api/t/{topicId}',
	handler: topicPosts
});