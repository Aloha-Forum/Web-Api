import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getRecommendPost } from "../stored/post";
import { getCommentCount } from "../stored/comment";

async function recommnedPosts(request: HttpRequest): Promise<HttpResponseInit> {
    try {            
        const page = parseInt(request.query.get('page')) || 0;
        const limit = 10;

        const items = await getRecommendPost(page, limit);

        for (let item of items)
            item.commentCount = await getCommentCount(item.postId);

        return { body: JSON.stringify(items) }
    }
    catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}

app.http('recommendPosts', {
    methods: ['GET'],
    route: 'api/recommend',
    handler: recommnedPosts
});