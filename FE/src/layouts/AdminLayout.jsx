import { Box, Flex, IconButton } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FaHome, FaCalendarPlus, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { VStack, Text, Button, Icon } from '@chakra-ui/react';

// Sidebar Component
function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: '', label: 'Dashboard', icon: FaHome },
    { id: 'add-event', label: 'Add Event', icon: FaCalendarPlus },
    { id: 'ongoing-events', label: 'Ongoing Events', icon: FaCalendarAlt },
  ];

  return (
    <Box
      w={isOpen ? '250px' : '0'}
      bg="blue.600"
      p={isOpen ? 5 : 0}
      color="white"
      transition="width 0.3s ease"
      overflow="hidden"
      height="100vh"
      position="fixed"
    >
      <VStack spacing={4} align="stretch">
        {isOpen && (
          <>
            <Text fontSize="xl" fontWeight="bold" mb={6}>
              Event Admin
            </Text>
            {menuItems.map((item) => (
              <Button
                key={item.id}
                leftIcon={<Icon as={item.icon} />}
                variant={location.pathname === `/admin/${item.id}` ? 'solid' : 'ghost'}
                bg={location.pathname === `/admin/${item.id}` ? 'white' : 'transparent'}
                color={location.pathname === `/admin/${item.id}` ? 'blue.600' : 'white'}
                justifyContent="flex-start"
                onClick={() => navigate(`/admin/${item.id}`)}
                _hover={{
                  bg: 'white',
                  color: 'blue.600',
                }}
              >
                {item.label}
              </Button>
            ))}
          </>
        )}
      </VStack>
    </Box>
  );
}

// Updated AdminLayout Component
function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar toggle state

  return (
    <Flex h="100vh">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content */}
      <Box
        flex="1"
        ml={isSidebarOpen ? '250px' : '0'}
        p={5}
        bg="gray.50"
        overflowY="auto"
        transition="margin-left 0.3s ease"
      >
        <IconButton
          icon={<HamburgerIcon />}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Sidebar"
          mb={4}
        />
        <Outlet /> {/* Renders the child route components */}
      </Box>
    </Flex>
  );
}

export default AdminLayout;