import { Aloha } from "../shared/container";

export async function getTopics(page: number, limit: number) {
    const querySpec = {
        query: 'SELECT c.topicId, c.name, c.description, c.popularity \
                FROM c \
                ORDER BY c.popularity.viewCount DESC, c.popularity.postCount DESC\
                OFFSET @offset \
                LIMIT @limit',
        parameters: [
            { name: '@offset', value: page*limit },
            { name: '@limit', value: limit }
        ],
    };

    const { resources: items } = await Aloha.Topic.items.query(querySpec).fetchAll();
    return items;
}

export async function getTopicLastActivity(topicId: string) {
    const querySpec = {
        query: 'SELECT TOP 1 c.lastActivity \
                FROM c \
                WHERE c.topicId = @topicId \
                ORDER BY c.postAt DESC',
        parameters: [
            { name: '@topicId', value: topicId }
        ],
    };

    const { resources: [post] } = await Aloha.Post.items.query(querySpec).fetchNext();
    return post ? post.lastActivity : -1;
}

export async function searchTopic(pattern: string) {
    if (pattern == "") return await getTopics(0, 10);

    const querySpec = {
        query: 'SELECT c.topicId, c.name, c.description, c.popularity \
                FROM c \
                WHERE LOWER(c.name) LIKE LOWER(@pattern) \
                ORDER BY c.popularity.viewCount DESC, c.popularity.postCount DESC',
        parameters: [
            { name: '@pattern', value: `%${pattern}%` },
        ],
    };

    const { resources: items } = await Aloha.Topic.items.query(querySpec).fetchAll();
    return items;
}