import { useState } from 'react'
import { ConfigProvider, Layout, Tabs, Typography } from 'antd'
import IntervieweeView from './components/Interviewee/IntervieweeView'
import InterviewerView from './components/Interviewer/InterviewerView'
import './App.css'

const { Header, Content } = Layout

const App = () => {
  const [activeTab, setActiveTab] = useState('interviewee')

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }}
    >
      <Layout className="app-layout">
        <Header className="app-header">
          <Typography.Title level={3} style={{ color: 'white', margin: 0 }}>
            Crisp · AI Interview Assistant
          </Typography.Title>
        </Header>
        <Content className="app-content">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'interviewee',
                label: 'Interviewee (chat)',
                children: <IntervieweeView />,
              },
              {
                key: 'interviewer',
                label: 'Interviewer (dashboard)',
                children: <InterviewerView />,
              },
            ]}
          />
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default App
