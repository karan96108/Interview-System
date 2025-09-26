import { useEffect } from 'react';
import { Layout, Modal, Tabs, Typography } from 'antd';
import dayjs from 'dayjs';
import IntervieweeView from './features/interviewee/IntervieweeView';
import InterviewerView from './features/interviewer/InterviewerView';
import { useAppDispatch, useAppSelector } from './hooks/reduxHooks';
import {
  refreshTimerAnchor,
  resumeInterview,
  setActiveCandidate
} from './store/candidatesSlice';
import { setActiveTab, setWelcomeCandidate } from './store/uiSlice';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const App = () => {
  const dispatch = useAppDispatch();
  const { candidates } = useAppSelector((state) => state.candidates);
  const { activeTab, welcomeCandidateId } = useAppSelector((state) => state.ui);

  useEffect(() => {
    const candidateToResume = candidates.find((candidate) => {
      if (candidate.status === 'completed' || candidate.status === 'collecting') return false;
      if (candidate.timers.remainingSeconds === undefined) return false;
      if (!candidate.timers.lastUpdated) return true;
      const diff = dayjs().diff(dayjs(candidate.timers.lastUpdated), 'second');
      return diff > 5;
    });

    if (candidateToResume?.id !== welcomeCandidateId) {
      dispatch(setWelcomeCandidate(candidateToResume?.id));
    }
  }, [candidates, dispatch, welcomeCandidateId]);

  const welcomeCandidate = candidates.find((candidate) => candidate.id === welcomeCandidateId);

  const handleResume = () => {
    if (!welcomeCandidate) return;
    if (welcomeCandidate.status === 'paused') {
      dispatch(resumeInterview(welcomeCandidate.id));
    } else {
      dispatch(refreshTimerAnchor(welcomeCandidate.id));
    }
    dispatch(setActiveCandidate(welcomeCandidate.id));
    dispatch(setWelcomeCandidate(undefined));
    dispatch(setActiveTab('interviewee'));
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header
        style={{
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 40px'
        }}
      >
        <Title level={3} style={{ color: '#0f172a', margin: 0 }}>
          Crisp — AI Interview Assistant
        </Title>
        <Text style={{ color: '#64748b' }}>Full-stack role • 6 dynamic questions • Local persistence</Text>
      </Header>
      <Content style={{ padding: '24px 40px 60px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => dispatch(setActiveTab(key as 'interviewee' | 'interviewer'))}
          items={[
            {
              key: 'interviewee',
              label: 'Interviewee experience',
              children: <IntervieweeView />
            },
            {
              key: 'interviewer',
              label: 'Interviewer dashboard',
              children: <InterviewerView />
            }
          ]}
        />
      </Content>

      <Modal
        open={!!welcomeCandidate}
        title="Welcome back!"
        onCancel={() => dispatch(setWelcomeCandidate(undefined))}
        onOk={handleResume}
        okText="Resume interview"
        cancelText="Maybe later"
      >
        <Text>
          {welcomeCandidate
            ? `We saved your progress for ${welcomeCandidate.name ?? 'this candidate'}. Continue where you left off?`
            : 'Ready to continue your interview?'}
        </Text>
      </Modal>
    </Layout>
  );
};

export default App;
