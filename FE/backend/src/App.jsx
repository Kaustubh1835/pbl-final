import { useState } from 'react';
import { ChakraProvider, Box, Flex } from '@chakra-ui/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import AddEvent from './AddEvent';
import OngoingEvents from './OngoingEvents';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'addEvent':
        return <AddEvent />;
      case 'ongoingEvents':
        return <OngoingEvents />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ChakraProvider>
      <Flex h="100vh">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <Box flex="1" p={5} bg="gray.50" overflowY="auto">
          {renderContent()}
        </Box>
      </Flex>
      <ToastContainer />
    </ChakraProvider>
  );
}

export default App;