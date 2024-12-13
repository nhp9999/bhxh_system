import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import declarationReducer, {
    fetchDeclarations,
    createDeclaration
} from '../declarationSlice';
import api from '../../../api';

jest.mock('../../../api');
const mockStore = configureMockStore([thunk]);

describe('declarationSlice', () => {
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

    describe('reducers', () => {
        it('should handle initial state', () => {
            expect(declarationReducer(undefined, { type: 'unknown' })).toEqual({
                items: [],
                loading: false,
                error: null,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0
                }
            });
        });

        it('should handle fetchDeclarations.pending', () => {
            const action = { type: fetchDeclarations.pending.type };
            const state = declarationReducer(undefined, action);
            expect(state.loading).toBe(true);
        });

        it('should handle fetchDeclarations.fulfilled', () => {
            const payload = {
                data: [{ id: 1, full_name: 'Test' }],
                pagination: { page: 1, limit: 10, total: 1 }
            };
            const action = { type: fetchDeclarations.fulfilled.type, payload };
            const state = declarationReducer(undefined, action);
            expect(state.items).toEqual(payload.data);
            expect(state.loading).toBe(false);
        });
    });

    describe('async actions', () => {
        it('creates FETCH_DECLARATIONS_SUCCESS when fetching declarations', async () => {
            const mockResponse = {
                data: {
                    data: [{ id: 1, full_name: 'Test' }],
                    pagination: { page: 1, limit: 10, total: 1 }
                }
            };

            api.get.mockResolvedValueOnce(mockResponse);

            await store.dispatch(fetchDeclarations({ page: 1 }));
            const actions = store.getActions();

            expect(actions[0].type).toBe(fetchDeclarations.pending.type);
            expect(actions[1].type).toBe(fetchDeclarations.fulfilled.type);
            expect(actions[1].payload).toEqual(mockResponse.data);
        });
    });
}); 