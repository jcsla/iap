import {
  type AcknowledgePurchaseOrSubscription,
  type ProductPurchase,
  type SubscriptionPurchase,
} from '@jeremybarbet/google-api-types';
import {JWT} from 'google-auth-library';

import {type ErrorResponse} from '../types/common';

import {type Config, type RequestBody, type StatusResponse, type VerifyResponse} from './config.interface';
import {buildEndpoint} from './google.utils';

const getResource = async <T = SubscriptionPurchase | ProductPurchase>(url: string, client: JWT) => {
  const { data: resource } = await client.request<T>({
    method: 'GET',
    url,
  });

  return resource;
};

export const verify = async (requestBody: RequestBody, config: Config): Promise<VerifyResponse> => {
  // Default to false if undefined
  requestBody.acknowledge = requestBody?.acknowledge ?? false;

  const client = new JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const { get, acknowledge } = buildEndpoint(requestBody);

  try {
    const response = await client.request<SubscriptionPurchase | ProductPurchase>({
      method: requestBody.acknowledge ? 'POST' : 'GET',
      url: requestBody.acknowledge ? acknowledge : get,
    });

    let data = requestBody.acknowledge ? ({} as AcknowledgePurchaseOrSubscription) : response.data;

    if (requestBody.acknowledge && requestBody.fetchResource) {
      data = await getResource(get, client);
    }

    /**
     * https://stackoverflow.com/questions/45688494/google-android-publisher-api-responds-with-410-purchasetokennolongervalid-erro
     */
    if (response.status === 410) {
      return {
        valid: false,
        data,
        message: 'Receipt no longer valid.',
        status: response.status,
      };
    }

    if (response.status > 399) {
      return {
        valid: false,
        data,
        message: 'An error happened.',
        status: response.status,
      };
    }

    return {
      valid: true,
      data,
      message: undefined,
      status: response.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error happened.';
    const status = (error as ErrorResponse)?.response?.status ?? 500;

    let data = requestBody.acknowledge ? ({} as AcknowledgePurchaseOrSubscription) : undefined;

    if (requestBody.acknowledge && requestBody.fetchResource) {
      data = await getResource(get, client);
    }

    return {
      valid: false,
      data,
      message,
      status,
    };
  }
};

export const consume = async (requestBody: RequestBody, config: Config): Promise<StatusResponse> => {
  const client = new JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const { consume } = buildEndpoint(requestBody);

  try {
    const response = await client.request({
      method: 'POST',
      url: consume,
    });
    return response.status;
  } catch (error) {
    return (error as ErrorResponse)?.response?.status ?? 500;
  }
};
