import { RxJsonSchema } from 'rxdb';

export const paymentSchema: RxJsonSchema<any> = {
  title: 'payment schema',
  version: 0,
  description: 'Minimal payment cache for offline views',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string' },
    invoiceId: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    amount: { type: 'number' },
    method: { type: 'string' },
    reference: { type: 'string' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'invoiceId', 'date', 'amount'],
  indexes: ['invoiceId', 'date'],
};
