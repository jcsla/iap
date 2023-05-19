import { type ResponseBody, Environment, errors } from '@jeremybarbet/apple-api-types';
import axios from 'axios';

import { type ErrorResponse } from '../types/common';

import { endpoints } from './apple.constants';
import { type ErrorStatus, handleResponse } from './apple.utils';
import { type Config, type RequestBody, type VerifyResponse } from './config.interface';

export const verify = async ({ transactionReceipt }: RequestBody, config: Config): Promise<VerifyResponse> => {
  const { environment = Environment.PRODUCTION, password, excludeOldTransactions = true } = config;

  try {
    const { data } = await axios.post<ResponseBody>(
      environment === Environment.PRODUCTION ? endpoints.verifyReceipt.production : endpoints.verifyReceipt.sandbox,
      {
        'receipt-data': transactionReceipt,
        'password': password,
        'exclude-old-transactions': excludeOldTransactions,
      },
    );

    return handleResponse(data);
  } catch (error) {
    const status = (error as ErrorResponse)?.response?.status ?? 500;

    return {
      valid: false,
      data: undefined,
      message: errors?.[status as ErrorStatus],
      status,
    };
  }
};
