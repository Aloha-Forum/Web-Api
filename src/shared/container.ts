import { CosmosClient } from "@azure/cosmos";

const cosmosClient = new CosmosClient(process.env.CosmosDB);
const AlohaDB = cosmosClient.database('Aloha');

export const Aloha = Object.freeze({
    User: AlohaDB.container('User'),
    Session: AlohaDB.container('Session'),
    Topic: AlohaDB.container('Topic'),
    Post: AlohaDB.container('Post'),
    Comment: AlohaDB.container('Comment'),
    Vote: AlohaDB.container('Vote')
});