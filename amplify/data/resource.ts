import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  FeedbackEntry: a
    .model({
      name:    a.string().required(),
      rating:  a.integer().required(),
      comment: a.string().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema, authorizationModes: { defaultAuthorizationMode: 'apiKey' } });
