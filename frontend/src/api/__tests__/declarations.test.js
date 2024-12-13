import api from '../index';
import { fetchDeclarations, createDeclaration } from '../../store/slices/declarationSlice';
import { mockStore } from '../../utils/testUtils';

jest.mock('../index');

describe('Declaration API', () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            declarations: {
                items: [],
                loading: false,
                error: null
            }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchDeclarations', () => {
        it('fetches declarations successfully', async () => {
            const mockResponse = {
                data: {
                    data: [
                        {
                            id: 1,
                            declaration_code: 'DK001',
                            full_name: 'Nguyễn Văn A'
                        }
                    ],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 1
                    }
                }
            };

            api.get.mockResolvedValueOnce(mockResponse);

            await store.dispatch(fetchDeclarations({ page: 1 }));
            const actions = store.getActions();

            expect(actions[0].type).toBe(fetchDeclarations.pending.type);
            expect(actions[1].type).toBe(fetchDeclarations.fulfilled.type);
            expect(actions[1].payload).toEqual(mockResponse.data);
        });

        it('handles fetch error correctly', async () => {
            const error = new Error('Network error');
            api.get.mockRejectedValueOnce(error);

            await store.dispatch(fetchDeclarations({ page: 1 }));
            const actions = store.getActions();

            expect(actions[0].type).toBe(fetchDeclarations.pending.type);
            expect(actions[1].type).toBe(fetchDeclarations.rejected.type);
        });
    });

    describe('createDeclaration', () => {
        it('creates declaration successfully', async () => {
            const mockData = {
                object_type: 'HGD',
                bhxh_code: '1234567890',
                full_name: 'Nguyễn Văn A'
            };

            const mockResponse = {
                data: {
                    id: 1,
                    ...mockData
                }
            };

            api.post.mockResolvedValueOnce(mockResponse);

            await store.dispatch(createDeclaration(mockData));
            const actions = store.getActions();

            expect(actions[0].type).toBe(createDeclaration.pending.type);
            expect(actions[1].type).toBe(createDeclaration.fulfilled.type);
            expect(actions[1].payload).toEqual(mockResponse.data);
        });
    });
}); 