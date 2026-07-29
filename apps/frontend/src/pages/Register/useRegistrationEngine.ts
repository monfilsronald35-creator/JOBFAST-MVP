/**
 * useRegistrationEngine
 * Manages multi-step registration state with useReducer.
 */
import { useCallback, useReducer } from 'react';
import { RegistrationStep } from './registrationMachine';
import API from '../../api/axios';

interface RegistrationState {
  currentStep:  number;
  accountType:  string | null;
  roleType:     string | null;
  category:     string | null;
  profession:   string | null;
  basicInfo:    Record<string, unknown>;
  professional: Record<string, unknown>;
  documents:    Record<string, unknown>;
  preferences:  Record<string, unknown>;
  isSubmitting: boolean;
  error:        string | null;
}

type Action =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET_ACCOUNT_TYPE'; payload: string }
  | { type: 'SET_ROLE';         payload: string }
  | { type: 'SET_CATEGORY';     payload: string }
  | { type: 'SET_PROFESSION';   payload: string }
  | { type: 'SET_BASIC_INFO';   payload: Record<string, unknown> }
  | { type: 'SET_PROFESSIONAL'; payload: Record<string, unknown> }
  | { type: 'SET_DOCUMENTS';    payload: Record<string, unknown> }
  | { type: 'SET_PREFERENCES';  payload: Record<string, unknown> }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_OK' }
  | { type: 'ERROR'; payload: string };

const INITIAL_STATE: RegistrationState = {
  currentStep:  RegistrationStep.SELECT_ACCOUNT,
  accountType:  null,
  roleType:     null,
  category:     null,
  profession:   null,
  basicInfo:    {},
  professional: {},
  documents:    {},
  preferences:  {},
  isSubmitting: false,
  error:        null,
};

function reducer(state: RegistrationState, action: Action): RegistrationState {
  switch (action.type) {
    case 'NEXT':             return { ...state, currentStep: state.currentStep + 1, error: null };
    case 'BACK':             return { ...state, currentStep: Math.max(0, state.currentStep - 1), error: null };
    case 'SET_ACCOUNT_TYPE': return { ...state, accountType:  action.payload, currentStep: RegistrationStep.ROLE };
    case 'SET_ROLE':         return { ...state, roleType:     action.payload, currentStep: RegistrationStep.CATEGORY };
    case 'SET_CATEGORY':     return { ...state, category:     action.payload, currentStep: RegistrationStep.PROFESSION };
    case 'SET_PROFESSION':   return { ...state, profession:   action.payload, currentStep: RegistrationStep.BASIC_INFO };
    case 'SET_BASIC_INFO':   return { ...state, basicInfo:    action.payload, currentStep: RegistrationStep.PROFESSIONAL };
    case 'SET_PROFESSIONAL': return { ...state, professional: action.payload, currentStep: RegistrationStep.DOCUMENTS };
    case 'SET_DOCUMENTS':    return { ...state, documents:    action.payload, currentStep: RegistrationStep.VERIFICATION };
    case 'SET_PREFERENCES':  return { ...state, preferences:  action.payload, currentStep: RegistrationStep.REVIEW };
    case 'SUBMIT_START':     return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_OK':        return { ...state, isSubmitting: false, currentStep: RegistrationStep.COMPLETE };
    case 'ERROR':            return { ...state, isSubmitting: false, error: action.payload };
    default:                 return state;
  }
}

export function useRegistrationEngine() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const goBack = useCallback(() => dispatch({ type: 'BACK' }), []);

  const selectAccountType = useCallback((type: string) => {
    dispatch({ type: 'SET_ACCOUNT_TYPE', payload: type });
  }, []);

  const setRoleAndNext = useCallback((role: string) => {
    dispatch({ type: 'SET_ROLE', payload: role });
  }, []);

  const setCategoryAndNext = useCallback((category: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  }, []);

  const setProfessionAndNext = useCallback((profession: string) => {
    dispatch({ type: 'SET_PROFESSION', payload: profession });
  }, []);

  const submitBasicInfo = useCallback((data: Record<string, unknown>) => {
    dispatch({ type: 'SET_BASIC_INFO', payload: data });
  }, []);

  const submitProfessional = useCallback((data: Record<string, unknown>) => {
    dispatch({ type: 'SET_PROFESSIONAL', payload: data });
  }, []);

  const submitDocuments = useCallback((data: Record<string, unknown>) => {
    dispatch({ type: 'SET_DOCUMENTS', payload: data });
  }, []);

  const submitPreferences = useCallback((data: Record<string, unknown>) => {
    dispatch({ type: 'SET_PREFERENCES', payload: data });
  }, []);

  const submitReview = useCallback(async () => {
    // Persist review data (validation pass) then move to complete
  }, []);

  const completeRegistration = useCallback(async () => {
    dispatch({ type: 'SUBMIT_START' });
    try {
      const payload = {
        accountType: state.accountType,
        role:        state.roleType,
        category:    state.category,
        profession:  state.profession,
        ...state.basicInfo,
        ...state.professional,
        ...state.documents,
        ...state.preferences,
      };
      const res = await API.post('/auth/register', payload);
      dispatch({ type: 'SUBMIT_OK' });
      return res.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message ?? 'Registration failed. Please try again.';
      dispatch({ type: 'ERROR', payload: msg });
      throw err;
    }
  }, [state]);

  return {
    state,
    goBack,
    selectAccountType,
    setRoleAndNext,
    setCategoryAndNext,
    setProfessionAndNext,
    submitBasicInfo,
    submitProfessional,
    submitDocuments,
    submitPreferences,
    submitReview,
    completeRegistration,
  };
}