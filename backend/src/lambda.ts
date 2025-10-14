import serverlessExpress from '@vendia/serverless-express';
import app from './server';
import { APIGatewayProxyEvent, Context, Callback, APIGatewayProxyResult } from 'aws-lambda';

const server = serverlessExpress({ app });

export const handler = (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
) => {
  return server(event, context, callback); 
};
