export const projectSchema = {
    title: 'project schema',
    version: 0,
    description: 'Minimal project cache for offline views',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'updatedAt'],
    indexes: ['name', 'updatedAt'],
};
