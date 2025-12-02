export const invoiceSchema = {
    title: 'invoice schema',
    version: 0,
    description: 'Minimal invoice cache for offline views',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string' },
        number: { type: 'string' },
        client: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        dueDate: { type: 'string', format: 'date-time' },
        amount: { type: 'number' },
        status: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'number', 'client', 'date', 'amount', 'status'],
    indexes: ['number', 'client', 'date', 'status'],
};
