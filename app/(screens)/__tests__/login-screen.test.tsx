import React from 'react';
import { act, create, ReactTestInstance } from 'react-test-renderer';
import { Keyboard } from 'react-native';
import LoginScreen from '../login-screen';

const mockAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ auth: mockAuth }) }));
jest.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ addToast: jest.fn() }) }));
jest.mock('@/contexts/RouteContext', () => ({ useRouteTo: () => ({ routeTo: jest.fn(), routeReplace: jest.fn(), routeBack: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

// A text input that records when it is asked to take focus (a password field is told apart by its hidden text).
const mockFocused: string[] = [];
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    const React = jest.requireActual('react');
    const MockTextInput = React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({ focus: () => mockFocused.push(props.secureTextEntry ? 'password' : 'username') }));
        return React.createElement('TextInput', props);
    });
    return new Proxy(RN, { get: (target, key) => (key === 'TextInput' ? MockTextInput : target[key as string]) });
});

// Loading the screen compiles a lot on a cold CI machine.
jest.setTimeout(30000);

async function render() {
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<LoginScreen />); });
    const inputs = () => tree.root.findAll((n) => String(n.type) === 'TextInput') as ReactTestInstance[];
    return { tree, inputs };
}

describe('LoginScreen text fields', () => {
    beforeEach(() => { jest.clearAllMocks(); mockFocused.length = 0; });

    it('shows username and password to log in', async () => {
        const { inputs } = await render();
        expect(inputs()).toHaveLength(2);
    });

    it('moves from one field to the next with the keyboard\'s next key', async () => {
        const { inputs } = await render();
        const username = inputs()[0];
        expect(username.props.returnKeyType).toBe('next');

        await act(async () => { username.props.onSubmitEditing(); });

        expect(mockFocused).toEqual(['password']);
    });

    it('closes the keyboard on the last field instead of moving on', async () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
        const { inputs } = await render();
        const password = inputs()[1];
        expect(password.props.returnKeyType).toBe('done');

        await act(async () => { password.props.onSubmitEditing(); });

        expect(dismiss).toHaveBeenCalled();
    });

    it('hides the password while typing', async () => {
        const { inputs } = await render();
        expect(inputs()[0].props.secureTextEntry).toBe(false);
        expect(inputs()[1].props.secureTextEntry).toBe(true);
    });
});
