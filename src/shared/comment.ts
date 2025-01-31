import { Aloha } from "../shared/container";

export async function getCommentCount(postId: string) {
    const query = `SELECT c.commentId \
                   FROM c \
                   WHERE c.postId = @postId`;
    const parameters = [{ name: '@postId', value: postId }];

    const { resources: items } = await Aloha.Comment.items.query({ query, parameters }).fetchAll();
    return items.length;
}