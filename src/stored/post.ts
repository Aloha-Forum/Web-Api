import { Aloha } from "../shared/container";

export async function getPostList(topicId: string, page: number, limit: number = 10) {
    const querySpec = {
        query: 'SELECT c.postId, c.uid, c.title, LEFT(c.body, 50) as body, c.lastActivity, c.popularity \
                FROM c \
                WHERE c.topicId = @topicId \
                ORDER BY c.postAt DESC \
                OFFSET @offset \
                LIMIT @limit',
        parameters: [
            { name: '@topicId', value: topicId },
            { name: '@offset', value: page*limit },
            { name: '@limit', value: limit }
        ],
    };

    const { resources: items } = await Aloha.Post.items.query(querySpec).fetchAll();
    return items;
}

export async function getRecommendPost(page: number, limit: number = 10) {
    const querySpec = {
        query: 'SELECT c.postId, c.uid, c.title, LEFT(c.body, 50) as body, c.lastActivity, c.popularity \
                FROM c \
                ORDER BY c.postAt DESC \
                OFFSET @offset \
                LIMIT @limit',
        parameters: [
            { name: '@offset', value: page*limit },
            { name: '@limit', value: limit }
        ],
    };

    const { resources: items } = await Aloha.Post.items.query(querySpec).fetchAll();
    return items;
}

export async function getPostById(postId: string) {
    const query = `SELECT c.topicId, c.postAt, c.uid, c.title, c.body, c.likeCount, c.dislikeCount \
                    FROM c \
                    WHERE c.postId = @postId`;
    const parameters = [{ name: '@postId', value: postId }];

    const { resources: [item] } = await Aloha.Post.items.query({ query, parameters }).fetchAll();
    return item
}