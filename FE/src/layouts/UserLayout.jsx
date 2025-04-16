import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/user/Navbar';

function UserLayout() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Box maxW="1200px" mx="auto" p={5}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default UserLayout;