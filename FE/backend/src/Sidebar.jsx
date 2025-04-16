import { Box, VStack, Button, Icon, Text } from '@chakra-ui/react';
import { FaHome, FaCalendarPlus, FaCalendarAlt } from 'react-icons/fa';

function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome },
    { id: 'addEvent', label: 'Add Event', icon: FaCalendarPlus },
    { id: 'ongoingEvents', label: 'Ongoing Events', icon: FaCalendarAlt },
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
            variant={activeTab === item.id ? 'solid' : 'ghost'}
            bg={activeTab === item.id ? 'white' : 'transparent'}
            color={activeTab === item.id ? 'blue.600' : 'white'}
            justifyContent="flex-start"
            onClick={() => setActiveTab(item.id)}
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

export default Sidebar