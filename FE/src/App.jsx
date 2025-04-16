import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import DashboardComponent from './components/admin/Dashboard'; // Rename to avoid confusion with route
import AddEvent from './components/admin/AddEvent';
import OngoingEvents from './components/admin/OngoingEvents';
import EventList from './components/user/EventList';
import LandingPage from './components/LandingPage';
import { UserProvider } from './context/UserContext'; // Import UserProvider

function App() {
  return (
    <ChakraProvider>
      <UserProvider> {/* Wrap the app with UserProvider */}
        <Router>
          <Box minH="100vh">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<LandingPage />} /> {/* Add this route */}
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardComponent />} />
                <Route path="add-event" element={<AddEvent />} />
                <Route path="ongoing-events" element={<OngoingEvents />} />
              </Route>

              {/* User Routes */}
              <Route path="/events" element={<UserLayout />}>
                <Route index element={<EventList />} />
              </Route>
            </Routes>
          </Box>
        </Router>
        <ToastContainer />
      </UserProvider>
    </ChakraProvider>
  );
}

export default App;