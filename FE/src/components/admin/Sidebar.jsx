import { Box, VStack, Button, Icon, Text } from '@chakra-ui/react';
import { FaHome, FaCalendarPlus, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: '', label: 'Dashboard', icon: FaHome },
    { id: 'add-event', label: 'Add Event', icon: FaCalendarPlus },
    { id: 'ongoing-events', label: 'Ongoing Events', icon: FaCalendarAlt },
  ];

  return (
    <Box w="250px" bg="blue.600" p={5} color="white">
      <VStack spacing={4} align="stretch">
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
      </VStack>
    </Box>
  );
}

export default Sidebar;