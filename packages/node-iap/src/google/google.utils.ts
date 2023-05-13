import { type RequestBody } from './config.interface';
import { endpoints } from './google.constants';

const replaceInUrl = (url: string, extraReplace: [string, string], { packageName, token }: RequestBody) =>
  url
    .replace(...extraReplace)
    .replace('{packageName}', packageName)
    .replace('{token}', token);

export const buildEndpoint = (requestBody: RequestBody) => {
  return {
    get: replaceInUrl(endpoints.products.get, ['{productId}', requestBody.productId], requestBody),
    acknowledge: replaceInUrl(endpoints.products.acknowledge, ['{productId}', requestBody.productId], requestBody),
    consume: replaceInUrl(endpoints.products.consume, ['{productId}', requestBody.productId], requestBody)
  };
};
