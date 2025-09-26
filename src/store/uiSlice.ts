import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TabKey = 'interviewee' | 'interviewer';

interface UiState {
  activeTab: TabKey;
  searchQuery: string;
  selectedCandidateId?: string;
  welcomeCandidateId?: string;
}

const initialState: UiState = {
  activeTab: 'interviewee',
  searchQuery: ''
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<TabKey>) {
      state.activeTab = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedCandidate(state, action: PayloadAction<string | undefined>) {
      state.selectedCandidateId = action.payload;
    },
    setWelcomeCandidate(state, action: PayloadAction<string | undefined>) {
      state.welcomeCandidateId = action.payload;
    }
  }
});

export const { setActiveTab, setSearchQuery, setSelectedCandidate, setWelcomeCandidate } =
  uiSlice.actions;

export default uiSlice.reducer;
